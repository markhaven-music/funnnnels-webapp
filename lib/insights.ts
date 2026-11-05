import type { Analytics, Day, Metrics } from "@/lib/analytics";

// Dashboard home → Insights: what stands out in the numbers of the range,
// worded like a note from an analyst. Plain rules over lib/analytics.ts, no
// model and no API key. Each rule speaks only past a minimum of data, so an
// empty list means nothing stands out yet.

export type Insight = {
  tone: "up" | "down" | "info";
  text: string;
};

const MAX = 4;
const DAY = 86_400_000;

const eur = (n: number) => `€${n >= 100 ? Math.round(n).toLocaleString("en-US") : n.toFixed(2).replace(/\.00$/, "")}`;
const pct = (n: number) => `${n >= 0.1 ? Math.round(n * 100) : (n * 100).toFixed(1)}%`;
const sum = (days: Day[], k: keyof Omit<Day, "day">) => days.reduce((n, d) => n + d[k], 0);
const langName = (l: string) => ({ en: "English", fr: "French", es: "Spanish", de: "German", it: "Italian", nl: "Dutch" })[l] ?? l;
const lastDays = (a: Analytics) => (a.range === "7d" ? "the last 7 days" : a.range === "28d" ? "the last 28 days" : "the whole period");

/** Orders per landing visitor, counting only the orders made since visitors were counted. */
const cvr = (m: Metrics) => (m.visitors ? m.ratedOrders / m.visitors : 0);

export function insights(a: Analytics, now = Date.now()): Insight[] {
  const out: (Insight & { rank: number })[] = [];
  const say = (rank: number, tone: Insight["tone"], text: string) => out.push({ rank, tone, text });
  const hasSales = a.sources.stripe; // without Stripe, card sales are missing and "no sale" would be wrong
  const days = a.days;
  const orders = sum(days, "orders");
  const revenue = sum(days, "revenue");

  // Revenue against the period before.
  if (a.previous) {
    const before = sum(a.previous, "revenue");
    const prevOrders = sum(a.previous, "orders");
    if (before > 0 && orders + prevOrders >= 6) {
      const change = revenue / before - 1;
      if (Math.abs(change) >= 0.2)
        say(change < 0 ? 1 : 3, change < 0 ? "down" : "up", `Revenue is ${change < 0 ? "down" : "up"} ${pct(Math.abs(change))} on the ${days.length} days before: ${eur(revenue)} against ${eur(before)}.`);
    }
  }

  // A quiet spell after a steady pace.
  if (hasSales && a.lastSale) {
    const quiet = Math.floor((now - a.lastSale) / DAY);
    const perDay = orders / days.length;
    if (quiet >= 2 && perDay >= 0.7)
      say(0, "down", `No sale for ${quiet} days, after ${perDay.toFixed(1)} a day over ${lastDays(a)}: check the checkout and the ads.`);
  }

  // A funnel with traffic and no buyer.
  if (hasSales)
    for (const f of a.funnels) {
      const m = f.total;
      if (m.visitors >= 40 && m.ratedOrders === 0) {
        const toOrder = m.orderViews / m.visitors;
        say(1, "down", `${f.name}: ${m.visitors} visitors and no sale yet. ${pct(toOrder)} of them open the order page${toOrder < 0.1 ? ", so the landing is where they leave" : ", so look at the checkout"}.`);
      }
    }

  // The step where most visitors leave, all funnels together.
  const all = a.funnels.reduce(
    (t, f) => ({ visitors: t.visitors + f.total.visitors, orderViews: t.orderViews + f.total.orderViews, checkouts: t.checkouts + f.total.checkouts, orders: t.orders + f.total.ratedOrders }),
    { visitors: 0, orderViews: 0, checkouts: 0, orders: 0 },
  );
  if (hasSales && all.visitors >= 100 && all.orders > 0) {
    const steps = [
      { name: "the landing", rate: all.orderViews / all.visitors, next: "go on to the order page" },
      { name: "the order page", rate: all.checkouts / Math.max(1, all.orderViews), next: "start the checkout" },
      { name: "the payment", rate: all.orders / Math.max(1, all.checkouts), next: "pay" },
    ];
    const leak = steps.reduce((w, s) => (s.rate < w.rate ? s : w));
    say(2, "info", `Most visitors leave at ${leak.name}: ${pct(leak.rate)} ${leak.next}.`);
  }

  // Funnels against each other, per visitor.
  const ranked = a.funnels.filter((f) => f.total.visitors >= 30 && f.total.ratedOrders > 0).map((f) => ({ f, per: f.total.ratedRevenue / f.total.visitors }));
  if (ranked.length >= 2) {
    ranked.sort((x, y) => y.per - x.per);
    const [best, worst] = [ranked[0], ranked[ranked.length - 1]];
    if (best.per >= worst.per * 1.5)
      say(4, "info", `${best.f.name} earns ${eur(best.per)} per visitor, ${worst.f.name} ${eur(worst.per)}.`);
  }

  // Languages of a funnel sold in several.
  for (const f of a.funnels) {
    const langs = (f.langs ?? []).filter((l) => l.lang !== "?" && l.m.visitors >= 30);
    if (langs.length < 2 || !langs.some((l) => l.m.ratedOrders > 0)) continue;
    langs.sort((x, y) => cvr(y.m) - cvr(x.m));
    const [best, worst] = [langs[0], langs[langs.length - 1]];
    if (cvr(best.m) >= cvr(worst.m) * 1.5 && best.m.ratedOrders >= 2)
      say(5, "info", `${f.name} sells best in ${langName(best.lang)}: ${pct(cvr(best.m))} of visitors buy, against ${pct(cvr(worst.m))} in ${langName(worst.lang)}.`);
  }

  // Upsells taken.
  const upsells = sum(days, "upsells");
  if (orders >= 5 && upsells > 0) {
    const extra = a.funnels.reduce((n, f) => n + Object.values(f.total.offers).reduce((m, o) => m + o.revenue, 0), 0);
    say(6, "up", `${upsells} upsell${upsells === 1 ? "" : "s"} on ${orders} orders${extra > 0 ? `: ${eur(extra)} on top` : ""}.`);
  }

  // What the processors keep.
  const net = sum(days, "net");
  if (revenue > 0 && orders >= 5)
    say(7, "info", `Stripe and PayPal kept ${eur(revenue - net)} in fees, ${pct((revenue - net) / revenue)} of revenue: ${eur(net)} net.`);

  // Each A/B test, once it has an answer.
  for (const t of a.tests) {
    if (t.verdict !== "winner" || !t.leader) continue;
    const lead = t.variants.find((v) => v.variant === t.leader);
    say(2, "up", `${lead?.label ?? t.leader} wins the ${t.product} ${t.name.toLowerCase()} test${lead?.chanceBest ? ` (${pct(lead.chanceBest)} sure)` : ""}: make it the only one.`);
  }

  return out
    .sort((x, y) => x.rank - y.rank)
    .slice(0, MAX)
    .map(({ tone, text }) => ({ tone, text }));
}
