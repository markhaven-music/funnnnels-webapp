import { supabase } from "@/lib/supabase";

// Broadcasts: one email to a tag (or every subscribed contact), now or at a
// time. Written in the dashboard (Broadcasts panel), sent by lib/outbox.ts.

export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";

export type Broadcast = {
  id: string;
  subject: string;
  preheader: string;
  body: string;
  audienceTag: string | null;
  excludeTag: string | null;
  sendAt: string | null;
  status: BroadcastStatus;
  sentCount: number;
  failedCount: number;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  subject: string;
  preheader: string;
  body: string;
  audience_tag: string | null;
  exclude_tag: string | null;
  send_at: string | null;
  status: BroadcastStatus;
  sent_count: number;
  failed_count: number;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

const fromRow = (r: Row): Broadcast => ({
  id: r.id,
  subject: r.subject,
  preheader: r.preheader,
  body: r.body,
  audienceTag: r.audience_tag,
  excludeTag: r.exclude_tag,
  sendAt: r.send_at,
  status: r.status,
  sentCount: r.sent_count,
  failedCount: r.failed_count,
  error: r.error,
  sentAt: r.sent_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await supabase().from("broadcasts").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function getBroadcast(id: string): Promise<Broadcast | null> {
  const { data, error } = await supabase().from("broadcasts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : null;
}

export async function createBroadcast(copyOf?: Broadcast | null): Promise<Broadcast> {
  const { data, error } = await supabase()
    .from("broadcasts")
    .insert(copyOf ? { subject: copyOf.subject, preheader: copyOf.preheader, body: copyOf.body, audience_tag: copyOf.audienceTag, exclude_tag: copyOf.excludeTag } : {})
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export type BroadcastPatch = Partial<Pick<Broadcast, "subject" | "preheader" | "body" | "audienceTag" | "excludeTag" | "sendAt" | "status">>;

/** Edit a draft or a scheduled one; once it's sending only "cancelled" is allowed (stops what's left). */
export async function updateBroadcast(id: string, p: BroadcastPatch): Promise<Broadcast | { error: string }> {
  const b = await getBroadcast(id);
  if (!b) return { error: "Not found." };
  const locked = b.status === "sending" || b.status === "sent" || b.status === "cancelled";
  if (locked && !(b.status === "sending" && p.status === "cancelled" && Object.keys(p).length === 1)) {
    return { error: b.status === "sending" ? "It's sending: you can only cancel what's left." : "Sent or cancelled emails can't change. Duplicate it instead." };
  }
  if (p.status === "scheduled") {
    const subject = p.subject ?? b.subject;
    const body = p.body ?? b.body;
    if (!subject.trim() || !body.trim()) return { error: "Write a subject and a body first." };
  }
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (p.subject !== undefined) update.subject = p.subject.slice(0, 200);
  if (p.preheader !== undefined) update.preheader = p.preheader.slice(0, 200);
  if (p.body !== undefined) update.body = p.body.slice(0, 50_000);
  if (p.audienceTag !== undefined) update.audience_tag = p.audienceTag?.trim() || null;
  if (p.excludeTag !== undefined) update.exclude_tag = p.excludeTag?.trim() || null;
  if (p.sendAt !== undefined) update.send_at = p.sendAt;
  if (p.status !== undefined) {
    update.status = p.status;
    if (p.status === "scheduled") {
      update.error = null;
      if (!(p.sendAt ?? b.sendAt)) update.send_at = new Date().toISOString();
    }
  }
  const { data, error } = await supabase().from("broadcasts").update(update).eq("id", id).select("*").single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function deleteBroadcast(id: string): Promise<{ error?: string }> {
  const b = await getBroadcast(id);
  if (!b) return { error: "Not found." };
  if (b.status === "sending" || b.status === "sent") return { error: "Sent emails stay in the list." };
  const { error } = await supabase().from("broadcasts").delete().eq("id", id);
  if (error) throw error;
  return {};
}
