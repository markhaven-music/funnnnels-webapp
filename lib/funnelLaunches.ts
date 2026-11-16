import { getFunnel, offeredBumps } from "@/lib/funnels";
import { roughEuros } from "@/lib/geo";
import { usdToEur } from "@/lib/analytics";
import { WINDOW_DAYS } from "@/lib/emailInsights";
import { addDays, dayIn } from "@/lib/tz";
import { supabase } from "@/lib/supabase";
import { FUNNEL_LAUNCHES, type FunnelLaunchDef } from "@/lib/funnelLaunchDefs";

// Dashboard → Launches → a code funnel's launch (TOP HITS, 2026-11-16): the
// emails, the visitors and the sales of the launch, in one place
// ("puoi mettere tutte le stats del lancio neatly in LAUNCHES tab").
// The launch-kit launches (lib/products.ts) have their own detail; these
// are code funnels whose launch is a run of broadcasts and a price window.
//
// Every number comes from the tables the rest of the dashboard reads:
//   emails     broadcasts whose body links to the funnel + email_stats / email_attribution (db/email-insights.sql)
//   visitors   live_events (one row per page a browser opens) and live_visitors (where it came from)
//   sales      orders on the funnel since the launch began

export { FUNNEL_LAUNCHES, type FunnelLaunchDef } from "@/lib/funnelLaunchDefs";

export type LaunchEmailStat = {
  id: string;
  subject: string;
  at: string | null;
  status: string;
  sent: number;
  clickers: number;
  orders: number; // orders credited to a click on it (Email → Insights' rule)
  revenue: number; // € (dollars at today's rate)
};

export type LaunchOrder = {
  id: string;
  at: string;
  country: string | null;
  what: string; // "TOP HITS MIDI Bundle", or the upsell / add-ons
  amount: number;
  currency: string;
  euros: number;
  provider: string;
  credit: string | null; // the email it is credited to, if any
};

export type FunnelLaunchStats = {
  def: FunnelLaunchDef;
  phase: "upcoming" | "live" | "ended";
  usdToEur: number;
  copies: number;
  revenue: number; // € everything bought on the funnel since the start, upsells included
  orders: number; // main orders on the funnel
  upsells: number;
  buyers: number;
  addOns: number; // main orders that took at least one add-on
  /** Browsers per step (live_events), in funnel order. */
  steps: { page: string; label: string; browsers: number }[];
  /** Where the funnel's visitors came from (live_visitors). */
  sources: { source: string; campaign: string; visitors: number }[];
  emails: LaunchEmailStat[];
  emailTotals: { sent: number; clickers: number; scheduled: number };
  days: { day: string; orders: number; upsells: number; revenue: number }[];
  list: LaunchOrder[];
};

const STEPS: [string, string][] = [
  ["landing", "Landing"],
  ["order", "Order page"],
  ["checkout", "Checkout"],
  ["thank-you", "Paid"],
  ["upsell-1", "Upsell 1"],
  ["upsell-2", "Upsell 2"],
];

type OrderRow = {
  id: string;
  funnel: string;
  items: string[];
  amount_cents: number;
  currency: string;
  country: string | null;
  provider: string;
  offer: string | null;
  parent: string | null;
  email: string | null;
  created_at: string;
};

/** Rows of a query past PostgREST's 1,000-row page. */
async function all<T>(make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await make(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

export async function getFunnelLaunch(id: string, now = Date.now()): Promise<FunnelLaunchStats | null> {
  const def = FUNNEL_LAUNCHES.find((l) => l.id === id);
  if (!def) return null;
  const db = supabase();
  const link = `%/${def.funnel}%`;

  const [orders, events, visitors, broadcasts, stats, attr, rate] = await Promise.all([
    all<OrderRow>((a, b) =>
      db
        .from("orders")
        .select("id, funnel, items, amount_cents, currency, country, provider, offer, parent, email, created_at")
        .eq("status", "succeeded")
        .gte("created_at", def.start)
        .order("created_at")
        .range(a, b),
    ),
    all<{ sid: string; page: string }>((a, b) =>
      db.from("live_events").select("sid, page").eq("funnel", def.funnel).gte("at", def.start).range(a, b),
    ),
    all<{ source: string | null; campaign: string | null }>((a, b) =>
      db.from("live_visitors").select("source, campaign").eq("funnel", def.funnel).gte("last_seen", def.start).range(a, b),
    ),
    db.from("broadcasts").select("id, subject, status, sent_at, send_at").ilike("body", link).gte("send_at", addDays(def.start.slice(0, 10), -7)).order("send_at"),
    db.rpc("email_stats", { p_since: def.start }),
    db.rpc("email_attribution", { p_since: def.start, p_days: WINDOW_DAYS }),
    usdToEur(),
  ]);
  for (const r of [broadcasts, stats, attr]) if (r.error) throw r.error;

  const euros = (cents: number, currency: string) => {
    const amount = cents / 100;
    return currency === "usd" ? amount * rate : roughEuros(amount, currency);
  };

  // Copies: as the close job counts them (main orders on either funnel, or the product as an item elsewhere).
  const copies = orders.filter((o) => (def.copyFunnels.includes(o.funnel) && !o.offer) || o.items.includes(def.copyItem)).length;

  const mine = orders.filter((o) => o.funnel === def.funnel);
  const main = mine.filter((o) => !o.offer);

  // Credit: the broadcast whose link the buyer clicked (same address) in the WINDOW_DAYS before paying.
  const subjects = new Map((broadcasts.data ?? []).map((b) => [b.id as string, b.subject as string]));
  const credit = new Map<string, string>();
  const perEmail = new Map<string, { orders: number; revenue: number }>();
  for (const a of (attr.data ?? []) as { order_id: string; amount_cents: number; currency: string; offer: string | null; kind: string | null; ref: string | null; how: string | null }[]) {
    if (a.kind !== "broadcast" || !a.ref || !subjects.has(a.ref)) continue;
    if (!mine.some((o) => o.id === a.order_id)) continue;
    credit.set(a.order_id, `${a.how === "click" ? "clicked" : "got"} “${subjects.get(a.ref)}”`);
    if (a.how !== "click") continue;
    const e = perEmail.get(a.ref) ?? { orders: 0, revenue: 0 };
    if (!a.offer) e.orders += 1;
    e.revenue += euros(a.amount_cents, a.currency);
    perEmail.set(a.ref, e);
  }

  const statOf = new Map(((stats.data ?? []) as { kind: string; ref: string; sent: number; clickers: number }[]).filter((s) => s.kind === "broadcast").map((s) => [s.ref, s]));
  const emails: LaunchEmailStat[] = (broadcasts.data ?? []).map((b) => {
    const s = statOf.get(b.id);
    const e = perEmail.get(b.id);
    return {
      id: b.id,
      subject: b.subject || "Untitled",
      at: b.sent_at ?? b.send_at,
      status: b.status,
      sent: Number(s?.sent ?? 0),
      clickers: Number(s?.clickers ?? 0),
      orders: e?.orders ?? 0,
      revenue: e?.revenue ?? 0,
    };
  });

  const browsers = new Map<string, Set<string>>();
  for (const e of events) {
    if (!browsers.has(e.page)) browsers.set(e.page, new Set());
    browsers.get(e.page)!.add(e.sid);
  }
  const steps = STEPS.map(([page, label]) => ({ page, label, browsers: browsers.get(page)?.size ?? 0 }));

  const bySource = new Map<string, { source: string; campaign: string; visitors: number }>();
  for (const v of visitors) {
    const source = v.source || "Direct";
    const campaign = v.campaign || "";
    const key = `${source}|${campaign}`;
    const row = bySource.get(key) ?? { source, campaign, visitors: 0 };
    row.visitors += 1;
    bySource.set(key, row);
  }

  // Every day of the launch so far, empty ones included.
  const first = dayIn(Date.parse(def.start));
  const last = dayIn(Math.min(now, Date.parse(def.ends) - 1));
  const days: FunnelLaunchStats["days"] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push({ day: d, orders: 0, upsells: 0, revenue: 0 });
  const dayRow = new Map(days.map((d) => [d.day, d]));

  // Names, not ids: the funnel's upsells and add-ons.
  const f = getFunnel(def.funnel);
  const names = new Map<string, string>([...(f?.offers ?? []), ...(f ? offeredBumps(f) : [])].map((x) => [x.id, x.name]));
  const named = (id: string) => names.get(id) ?? id;

  let revenue = 0;
  const list: LaunchOrder[] = [];
  for (const o of mine) {
    const e = euros(o.amount_cents, o.currency);
    revenue += e;
    const d = dayRow.get(dayIn(Date.parse(o.created_at)));
    if (d) {
      d.revenue += e;
      if (o.offer) d.upsells += 1;
      else d.orders += 1;
    }
    const addOns = o.items.filter((i) => i !== "pack");
    list.push({
      id: o.id,
      at: o.created_at,
      country: o.country,
      what: o.offer ? `Upsell: ${named(o.offer)}` : addOns.length ? `${def.name} + ${addOns.map(named).join(", ")}` : def.name,
      amount: o.amount_cents / 100,
      currency: o.currency,
      euros: e,
      provider: o.provider,
      // An upsell rides on its order's credit.
      credit: credit.get(o.id) ?? (o.parent ? credit.get(o.parent) ?? null : null),
    });
  }
  list.reverse();

  const sent = emails.reduce((n, e) => n + e.sent, 0);
  const phase = now < Date.parse(def.start) ? "upcoming" : now < Date.parse(def.ends) ? "live" : "ended";
  return {
    def,
    phase,
    usdToEur: rate,
    copies,
    revenue,
    orders: main.length,
    upsells: mine.length - main.length,
    buyers: new Set(main.map((o) => o.email?.toLowerCase() ?? o.id)).size,
    addOns: main.filter((o) => o.items.some((i) => i !== "pack")).length,
    steps,
    sources: [...bySource.values()].sort((a, b) => b.visitors - a.visitors),
    emails,
    emailTotals: {
      sent,
      clickers: emails.reduce((n, e) => n + e.clickers, 0),
      scheduled: emails.filter((e) => e.status !== "sent").length,
    },
    days,
    list,
  };
}
