import { supabase } from "@/lib/supabase";

// Sequences (dashboard → Automations): when a contact gets a tag, they get
// step 1, then step 2 some hours later, and so on, until the end or until
// they get the exit tag. Starting is done by the database (start_sequences
// trigger, db/email.sql); sending by lib/outbox.ts. A sequence can be for one
// language (db/email-series.sql): then only contacts in that language start it.

export type SequenceStep = { id?: string; delayHours: number; subject: string; body: string };

export type Sequence = {
  id: string;
  name: string;
  triggerTag: string;
  exitTag: string | null;
  lang: string | null; // null: every language
  active: boolean;
  steps: SequenceStep[];
  // How many contacts are in it right now, and have finished it.
  running: number;
  finished: number;
  createdAt: string;
};

type Row = {
  id: string;
  name: string;
  trigger_tag: string;
  exit_tag: string | null;
  lang: string | null;
  active: boolean;
  created_at: string;
  sequence_steps: { id: string; position: number; delay_hours: number; subject: string; body: string }[];
};

export async function listSequences(): Promise<Sequence[]> {
  const db = supabase();
  const [{ data, error }, { data: runs, error: rErr }] = await Promise.all([
    db.from("sequences").select("*, sequence_steps(*)").order("created_at"),
    db.from("sequence_runs").select("sequence_id, status").limit(100_000),
  ]);
  if (error) throw error;
  if (rErr) throw rErr;
  const count = (id: string, s: string[]) => (runs ?? []).filter((r) => r.sequence_id === id && s.includes(r.status)).length;
  return (data as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    triggerTag: r.trigger_tag,
    exitTag: r.exit_tag,
    lang: r.lang,
    active: r.active,
    steps: [...r.sequence_steps].sort((a, b) => a.position - b.position).map((s) => ({ id: s.id, delayHours: s.delay_hours, subject: s.subject, body: s.body })),
    running: count(r.id, ["active"]),
    finished: count(r.id, ["done", "exited"]),
    createdAt: r.created_at,
  }));
}

export const SEQUENCE_LANGS = ["en", "fr", "es", "de", "it"] as const;

export type SequenceInput = { name: string; triggerTag: string; exitTag: string | null; lang: string | null; active: boolean; steps: SequenceStep[] };

export function parseSequence(raw: unknown): SequenceInput | string {
  const b = (raw ?? {}) as Record<string, unknown>;
  const name = String(b.name ?? "").trim().slice(0, 120);
  const triggerTag = String(b.triggerTag ?? "").trim().slice(0, 80);
  const exitTag = String(b.exitTag ?? "").trim().slice(0, 80) || null;
  const lang = (SEQUENCE_LANGS as readonly string[]).includes(String(b.lang)) ? String(b.lang) : null;
  const steps = (Array.isArray(b.steps) ? b.steps : []).slice(0, 60).map((s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
    delayHours: Math.max(0, Math.min(24 * 365, Math.round(Number(s.delayHours) || 0))),
    subject: String(s.subject ?? "").slice(0, 200),
    body: String(s.body ?? "").slice(0, 50_000),
  }));
  if (!name) return "Give it a name.";
  if (!triggerTag) return "Pick the tag that starts it.";
  const active = b.active === true;
  if (active && (!steps.length || steps.some((s) => !s.subject.trim() || !s.body.trim()))) return "Every email needs a subject and a body before you switch it on.";
  return { name, triggerTag, exitTag, lang, active, steps };
}

/** Create (no id) or replace a sequence and its steps. Steps keep their ids, so nobody gets a step twice. */
export async function saveSequence(id: string | null, s: SequenceInput): Promise<string> {
  const db = supabase();
  const row = { name: s.name, trigger_tag: s.triggerTag, exit_tag: s.exitTag, lang: s.lang, active: s.active };
  let seqId = id;
  if (seqId) {
    const { error } = await db.from("sequences").update(row).eq("id", seqId);
    if (error) throw error;
  } else {
    const { data, error } = await db.from("sequences").insert(row).select("id").single();
    if (error) throw error;
    seqId = data.id as string;
  }
  const { data: existing } = await db.from("sequence_steps").select("id").eq("sequence_id", seqId);
  const keep = new Set(s.steps.map((x) => x.id).filter(Boolean));
  const gone = (existing ?? []).map((e) => e.id).filter((x) => !keep.has(x));
  if (gone.length) await db.from("sequence_steps").delete().in("id", gone);
  // Positions are unique per sequence: write them as -1, -2… first, then flip
  // them to 0, 1…, so moving a step never collides with another.
  for (const [i, step] of s.steps.entries()) {
    const fields = { sequence_id: seqId, position: -(i + 1), delay_hours: step.delayHours, subject: step.subject, body: step.body };
    const { error } = step.id && keep.has(step.id) ? await db.from("sequence_steps").update(fields).eq("id", step.id) : await db.from("sequence_steps").insert(fields);
    if (error) throw error;
  }
  const { data: all } = await db.from("sequence_steps").select("id, position").eq("sequence_id", seqId);
  for (const st of all ?? []) await db.from("sequence_steps").update({ position: -st.position - 1 }).eq("id", st.id);
  return seqId;
}

export async function deleteSequence(id: string): Promise<void> {
  const { error } = await supabase().from("sequences").delete().eq("id", id);
  if (error) throw error;
}
