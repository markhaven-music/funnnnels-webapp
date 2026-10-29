import { sinceDay, usdToEur, type Range } from "@/lib/analytics";
import { WINDOW_DAYS, type EmailInsights, type EmailRow, type Tally } from "@/lib/emailInsights";
import type { EmailKind } from "@/lib/mail";
import { supabase } from "@/lib/supabase";

// The numbers behind dashboard → Email → Insights (shape and notes in
// lib/emailInsights.ts): per email, how many got it, clicked, left, and the
// orders credited to it. The sums are done by the database
// (db/email-insights.sql): email_stats and email_attribution.

type Attribution = {
  order_id: string;
  amount_cents: number;
  currency: "eur" | "usd";
  offer: string | null;
  created_at: string;
  kind: EmailKind | null;
  ref: string | null;
  how: "click" | "received" | null;
};
type Stat = { kind: EmailKind; ref: string; sent: number; failed: number; clickers: number; clicks: number; unsubscribed: number };
type Counts = Pick<EmailRow, "sent" | "failed" | "clickers" | "unsubscribed" | "clicked" | "received">;

const tally = (): Tally => ({ orders: 0, upsells: 0, eur: 0, usd: 0, revenue: 0 });
const counts = (): Counts => ({ sent: 0, failed: 0, clickers: 0, unsubscribed: 0, clicked: tally(), received: tally() });

function addSale(t: Tally, a: Attribution, rate: number) {
  const amount = a.amount_cents / 100;
  if (a.offer) t.upsells += 1;
  else t.orders += 1;
  if (a.currency === "usd") t.usd += amount;
  else t.eur += amount;
  t.revenue += a.currency === "usd" ? amount * rate : amount;
}

function merge(into: Counts, c: Counts) {
  into.sent += c.sent;
  into.failed += c.failed;
  into.clickers += c.clickers;
  into.unsubscribed += c.unsubscribed;
  for (const k of ["clicked", "received"] as const)
    for (const f of ["orders", "upsells", "eur", "usd", "revenue"] as const) into[k][f] += c[k][f];
}

const SANDBOX = /sandbox/i;
const RECENT_MS = 7 * 86_400_000;

export async function getEmailInsights(range: Range): Promise<EmailInsights> {
  const db = supabase();
  const day = sinceDay(range);
  const since = day ? `${day}T00:00:00Z` : null;
  const [attr, stats, rate, broadcasts, launchEmails, sequences] = await Promise.all([
    db.rpc("email_attribution", { p_since: since, p_days: WINDOW_DAYS }),
    db.rpc("email_stats", { p_since: since }),
    usdToEur(),
    db.from("broadcasts").select("id, subject, audience_tag, exclude_tag, status, sent_at, send_at, error, updated_at").order("created_at", { ascending: false }).limit(500),
    db.from("launch_emails").select("id, step, subject, audience_tag, status, sent_at, send_at"),
    db.from("sequences").select("id, name, trigger_tag, active, created_at, sequence_steps(id)").order("created_at"),
  ]);
  for (const r of [attr, stats, broadcasts, launchEmails, sequences]) if (r.error) throw r.error;

  // Everything per email (kind:ref), then rolled up.
  const per = new Map<string, Counts>();
  const at = (kind: string, ref: string) => {
    const key = `${kind}:${ref}`;
    if (!per.has(key)) per.set(key, counts());
    return per.get(key)!;
  };
  const total = counts();
  const byKind: Record<EmailKind, Tally> = { broadcast: tally(), launch: tally(), sequence: tally(), reminder: tally() };
  for (const s of (stats.data ?? []) as Stat[]) {
    const c = at(s.kind, s.ref);
    c.sent = Number(s.sent);
    c.failed = Number(s.failed);
    c.clickers = Number(s.clickers);
    c.unsubscribed = Number(s.unsubscribed);
  }
  for (const a of (attr.data ?? []) as Attribution[]) {
    if (!a.how || !a.kind || !a.ref) continue;
    addSale(at(a.kind, a.ref)[a.how === "click" ? "clicked" : "received"], a, rate);
    if (a.how === "click") addSale(byKind[a.kind], a, rate);
  }
  for (const c of per.values()) merge(total, c);

  // One-off emails: the broadcasts and launch emails that went out (or sold) in the range.
  const campaigns: EmailRow[] = [];
  for (const b of broadcasts.data ?? []) {
    const c = per.get(`broadcast:${b.id}`);
    if (!c) continue;
    const to = b.audience_tag ? `tagged ${b.audience_tag}` : "everyone";
    campaigns.push({ kind: "broadcast", id: b.id, name: b.subject || "Untitled", detail: b.exclude_tag ? `${to}, not ${b.exclude_tag}` : to, at: b.sent_at ?? b.send_at, ...c });
  }
  for (const e of launchEmails.data ?? []) {
    const c = per.get(`launch:${e.id}`);
    if (!c) continue;
    campaigns.push({ kind: "launch", id: e.id, name: e.subject, detail: `launch · tagged ${e.audience_tag}`, at: e.sent_at ?? e.send_at, ...c });
  }
  campaigns.sort((x, y) => (y.at ?? "").localeCompare(x.at ?? ""));

  // Automations: each sequence (its steps together), then the reminder (every product together).
  const automations: EmailRow[] = [];
  for (const s of sequences.data ?? []) {
    const c = counts();
    for (const step of (s.sequence_steps ?? []) as { id: string }[]) {
      const sc = per.get(`sequence:${step.id}`);
      if (sc) merge(c, sc);
    }
    if (!s.active && !c.sent && !c.clicked.orders && !c.received.orders) continue;
    automations.push({ kind: "sequence", id: s.id, name: s.name, detail: `when tagged ${s.trigger_tag}`, at: null, ...c });
  }
  const reminder = counts();
  for (const [key, c] of per) if (key.startsWith("reminder:")) merge(reminder, c);
  automations.push({ kind: "reminder", id: "reminder", name: "Abandoned-checkout reminder", detail: "After an unpaid checkout (MIDI Drum Kit: 3 emails)", at: null, ...reminder });

  // A broadcast SES held back lately: it went back to draft with a note.
  const held = (broadcasts.data ?? []).find((b) => b.status === "draft" && SANDBOX.test(b.error ?? "") && Date.now() - Date.parse(b.updated_at) < RECENT_MS);

  return {
    range,
    since: day,
    usdToEur: rate,
    total,
    byKind,
    campaigns,
    automations,
    blocked: held
      ? `“${held.subject || "Untitled"}” didn't go out: Amazon SES still only delivers to verified addresses. Send the appeal (docs/ses-appeal.md), then schedule it again.`
      : null,
  };
}
