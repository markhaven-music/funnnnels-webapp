import type { Range } from "@/lib/analytics";
import type { Insight } from "@/lib/insights";
import type { EmailKind } from "@/lib/mail";

// Dashboard → Email → Insights: what the emails bring in. The numbers come
// from lib/emailStats.ts (db/email-insights.sql); this file holds their shape
// and the notes worded from them, plain rules like lib/insights.ts.
//
// An order counts for an email when its buyer clicked a link in it in the
// WINDOW_DAYS before paying; the last email clicked wins. Bought in those
// days after getting one, without a click: "received", shown apart.

export const WINDOW_DAYS = 5;
/** When the links in emails started going through the click counter (lib/mail.ts clickUrl). */
export const CLICKS_SINCE = "2026-10-21T21:00:00Z";

export type Tally = {
  orders: number; // the orders themselves, not their upsells
  upsells: number;
  eur: number;
  usd: number;
  revenue: number; // both, in euros
};

/** One email (a broadcast, a launch email) or one automation (a sequence, the reminder). */
export type EmailRow = {
  kind: EmailKind;
  id: string; // broadcast / launch email / sequence id; "reminder" for the reminder
  name: string; // the subject, or the sequence's name
  detail: string | null; // who it went to, or what starts it
  at: string | null; // when it went out (one-off emails)
  sent: number;
  failed: number;
  clickers: number; // people who clicked a link in it
  unsubscribed: number; // people who left after it
  clicked: Tally;
  received: Tally;
};

export type EmailInsights = {
  range: Range;
  since: string | null;
  usdToEur: number;
  total: { sent: number; failed: number; clickers: number; unsubscribed: number; clicked: Tally; received: Tally };
  /** Revenue after a click, per kind of email. */
  byKind: Record<EmailKind, Tally>;
  /** Broadcasts and launch emails that went out in the range, newest first. */
  campaigns: EmailRow[];
  /** Sequences, and the abandoned-checkout reminder. */
  automations: EmailRow[];
  /** A broadcast held back lately, and why (SES's sandbox). */
  blocked: string | null;
};

export const KIND_LABEL: Record<EmailKind, string> = {
  broadcast: "Broadcasts",
  sequence: "Sequences",
  reminder: "Abandoned-checkout reminder",
  launch: "Launch emails",
};

export const clickRate = (r: { sent: number; clickers: number }) => (r.sent ? r.clickers / r.sent : 0);
/** Were this email's links counted? Not for the ones sent before the click counter. */
export const clicksCounted = (r: EmailRow) => !r.at || r.at >= CLICKS_SINCE;

const DAY = 86_400_000;
const MAX = 5;

const eur = (n: number) => `€${n >= 100 ? Math.round(n).toLocaleString("en-US") : n.toFixed(2).replace(/\.00$/, "")}`;
const pct = (n: number) => `${n >= 0.1 ? Math.round(n * 100) : (n * 100).toFixed(1)}%`;
const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const sales = (t: Tally) => `${count(t.orders, "order")}${t.upsells ? ` + ${count(t.upsells, "upsell")}` : ""}`;

/** What stands out, worded like a note from an analyst. allRevenue: every sale in the range, in €, when known. */
export function emailNotes(d: EmailInsights, allRevenue: number | null, now = Date.now()): Insight[] {
  const out: (Insight & { rank: number })[] = [];
  const say = (rank: number, tone: Insight["tone"], text: string) => out.push({ rank, tone, text });
  const when = d.range === "7d" ? "in the last 7 days" : d.range === "28d" ? "in the last 28 days" : "so far";
  const t = d.total;

  if (d.blocked) say(0, "down", d.blocked);

  // What email brought in, and its share of everything.
  if (t.clicked.revenue > 0) {
    const share = allRevenue && allRevenue > 0 ? `, ${pct(Math.min(1, t.clicked.revenue / allRevenue))} of all revenue` : "";
    say(1, "up", `Email brought in ${eur(t.clicked.revenue)} ${when}${share}: ${sales(t.clicked)} from people who clicked an email in the ${WINDOW_DAYS} days before buying.`);
  }

  // The one-off email that made the most.
  const paid = d.campaigns.filter((c) => c.clicked.revenue > 0 && c.sent > 0);
  if (paid.length) {
    const best = paid.reduce((b, c) => (c.clicked.revenue > b.clicked.revenue ? c : b));
    say(2, "up", `“${best.name}” made the most: ${eur(best.clicked.revenue)} from ${count(best.sent, "email")} sent, ${eur((best.clicked.revenue / best.sent) * 1000)} per 1,000.`);
  }

  // The reminder.
  const rem = d.byKind.reminder;
  if (rem.revenue > 0) say(3, "up", `The abandoned-checkout reminder won back ${eur(rem.revenue)} (${sales(rem)}).`);

  // A while without a broadcast, after one that sold.
  const last = d.campaigns.find((c) => c.kind === "broadcast" && c.at);
  if (last?.at && last.clicked.revenue > 0) {
    const days = Math.floor((now - Date.parse(last.at)) / DAY);
    if (days >= 7) say(3, "info", `No broadcast for ${days} days; the last one made ${eur(last.clicked.revenue)}.`);
  }

  // From click to sale, on the latest email people clicked.
  const clicked = d.campaigns.find((c) => c.clickers >= 20);
  if (clicked) say(4, "info", `${count(clicked.clickers, "person", "people")} clicked “${clicked.name}”; ${clicked.clicked.orders} bought (${pct(clicked.clicked.orders / clicked.clickers)}).`);

  // Click rates side by side.
  const big = d.campaigns.filter((c) => c.sent >= 100 && clicksCounted(c));
  if (big.length >= 2) {
    const sorted = [...big].sort((x, y) => clickRate(y) - clickRate(x));
    const [best, worst] = [sorted[0], sorted[sorted.length - 1]];
    if (clickRate(best) > 0 && clickRate(best) >= clickRate(worst) * 1.5)
      say(5, "info", `“${best.name}” got ${pct(clickRate(best))} of its readers to click, “${worst.name}” ${pct(clickRate(worst))}.`);
  }

  // An email that cost subscribers.
  const lost = d.campaigns
    .filter((c) => c.sent >= 100 && c.unsubscribed / c.sent >= 0.01)
    .sort((x, y) => y.unsubscribed / y.sent - x.unsubscribed / x.sent)[0];
  if (lost) say(5, "down", `“${lost.name}” lost ${count(lost.unsubscribed, "subscriber")}, ${pct(lost.unsubscribed / lost.sent)} of the people it reached.`);

  // Bought after getting one, without a click.
  if (t.received.revenue > 0)
    say(6, "info", `Another ${eur(t.received.revenue)} (${sales(t.received)}) came from people who bought within ${WINDOW_DAYS} days of getting an email but didn't click it: not counted above.`);

  return out
    .sort((x, y) => x.rank - y.rank)
    .slice(0, MAX)
    .map(({ tone, text }) => ({ tone, text }));
}
