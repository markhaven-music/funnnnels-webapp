import { AB as BUTTON_TEST } from "@/app/(funnels)/midi-drum-kit/abtest";
import type { Step } from "@/lib/beacon";
import { codeFunnels } from "@/lib/funnels";
import { KIT_HOME } from "@/lib/liveUrl";
import type { PayPalOrder } from "@/lib/paypal";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// Dashboard → Analytics: visitors, checkout starts, orders and revenue per
// funnel, and the results of the running A/B test.
//   visitors, checkout starts  page_views (lib/beacon.ts → /api/checkout/view)
//   Stripe orders              Stripe itself: succeeded PaymentIntents with
//                              metadata.funnel (+ .variant, .lang)
//   PayPal orders              paypal_sales, noted at capture
// Tables: db/analytics.sql.

export type Range = "7d" | "28d" | "all";
export const RANGES: Range[] = ["7d", "28d", "all"];

// ─── recording ─────────────────────────────────────────────────

export async function countPageView(v: { funnel: string; page: Step; lang: string; variant: string; country: string }) {
  const { error } = await supabase().rpc("count_page_view", {
    p_funnel: v.funnel,
    p_page: v.page,
    p_lang: v.lang,
    p_variant: v.variant,
    p_country: v.country,
  });
  if (error) throw error;
}

/** Note a captured PayPal order (safe to call twice for the same order). */
export async function recordPayPalSale(order: PayPalOrder, lang: string) {
  const unit = order.purchase_units[0];
  const capture = unit?.payments?.captures?.[0];
  if (!unit || capture?.status !== "COMPLETED") return;
  const meta = (() => {
    try {
      return JSON.parse(unit.custom_id ?? "{}");
    } catch {
      return {};
    }
  })();
  const currency = capture.amount.currency_code.toLowerCase();
  if (typeof meta.f !== "string" || (currency !== "eur" && currency !== "usd")) return;
  const { error } = await supabase()
    .from("paypal_sales")
    .upsert(
      {
        order_id: order.id,
        funnel: meta.f,
        lang,
        variant: typeof meta.v === "string" ? meta.v : "",
        country: typeof meta.c === "string" ? meta.c : "",
        amount_cents: Math.round(Number(capture.amount.value) * 100),
        currency,
      },
      { onConflict: "order_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

// ─── reading ───────────────────────────────────────────────────

export type Metrics = {
  visitors: number; // unique visitors of the landing, per day
  orderViews: number; // … of the order page
  checkouts: number; // filled in step 1 (name + email)
  thankYouViews: number; // … of the thank-you page
  orders: number;
  eur: number; // revenue in euros
  usd: number; // revenue in dollars
  revenue: number; // both, in euros
  // The orders and revenue since visitors were first counted, for the rates
  // (orders / visitors, revenue / visitor): Stripe remembers older sales, the
  // visitor count doesn't go back that far.
  ratedOrders: number;
  ratedEur: number;
  ratedUsd: number;
  ratedRevenue: number;
};

export type FunnelStats = {
  slug: string;
  name: string;
  url: string;
  total: Metrics;
  /** Per language, for funnels sold in several. "?" = orders from before the language was recorded. */
  langs: { lang: string; m: Metrics }[] | null;
};

export type TestStats = {
  funnel: string;
  name: string;
  /** First day a visitor was counted with a variant. */
  since: string | null;
  days: number;
  target: number; // sales per variant for a reliable answer
  variants: { variant: string; m: Metrics; chanceBest: number | null }[];
  leader: string | null;
  verdict: "waiting" | "early" | "winner" | "tie";
  salesToGo: number;
  daysToGo: number | null;
};

export type Analytics = {
  range: Range;
  since: string | null;
  /** The first day any visitor was counted. */
  trackingSince: string | null;
  usdToEur: number;
  funnels: FunnelStats[];
  test: TestStats | null;
  sources: { stripe: boolean; paypal: boolean };
  errors: string[];
};

type Sale = { funnel: string; lang: string; variant: string; amount: number; currency: string; created: number; rated?: boolean };
type ViewRow = { funnel: string; page: Step; lang: string; variant: string; views: number };

const DAY = 86_400_000;
// About 100 sales per variant before the numbers mean much (at ~€25 a sale).
const TARGET_SALES = 100;

/** First UTC day of the range ("2026-10-14"), or null for all time. */
function sinceDay(range: Range, now = Date.now()): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 28;
  return new Date(now - (days - 1) * DAY).toISOString().slice(0, 10);
}

const empty = (): Metrics => ({
  visitors: 0,
  orderViews: 0,
  checkouts: 0,
  thankYouViews: 0,
  orders: 0,
  eur: 0,
  usd: 0,
  revenue: 0,
  ratedOrders: 0,
  ratedEur: 0,
  ratedUsd: 0,
  ratedRevenue: 0,
});

function addView(m: Metrics, page: Step, n: number) {
  if (page === "landing") m.visitors += n;
  else if (page === "order") m.orderViews += n;
  else if (page === "checkout") m.checkouts += n;
  else if (page === "thank-you") m.thankYouViews += n;
}

function addSale(m: Metrics, s: Sale) {
  m.orders += 1;
  if (s.currency === "eur") m.eur += s.amount;
  if (s.currency === "usd") m.usd += s.amount;
  if (!s.rated) return;
  m.ratedOrders += 1;
  if (s.currency === "eur") m.ratedEur += s.amount;
  if (s.currency === "usd") m.ratedUsd += s.amount;
}

async function viewTotals(since: string | null): Promise<ViewRow[]> {
  const { data, error } = await supabase().rpc("page_view_totals", { p_since: since });
  if (error) throw error;
  return ((data ?? []) as ViewRow[]).map((r) => ({ ...r, views: Number(r.views) }));
}

async function stripeSales(slug: string): Promise<Sale[]> {
  const out: Sale[] = [];
  let page: string | undefined;
  for (let i = 0; i < 50; i++) {
    const res = await stripe().paymentIntents.search({
      query: `status:'succeeded' AND metadata['funnel']:'${slug}'`,
      limit: 100,
      ...(page ? { page } : {}),
    });
    for (const pi of res.data) {
      out.push({
        funnel: slug,
        lang: pi.metadata.lang || "?",
        variant: pi.metadata.variant || "",
        amount: pi.amount_received / 100,
        currency: pi.currency,
        created: pi.created * 1000,
      });
    }
    if (!res.has_more || !res.next_page) break;
    page = res.next_page;
  }
  return out;
}

async function paypalSales(): Promise<Sale[]> {
  const { data, error } = await supabase().from("paypal_sales").select("funnel, lang, variant, amount_cents, currency, created_at").limit(10000);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    funnel: r.funnel,
    lang: r.lang,
    variant: r.variant,
    amount: r.amount_cents / 100,
    currency: r.currency,
    created: Date.parse(r.created_at),
  }));
}

/** USD → EUR from the ECB's daily rate (free, cached a day); a rough fixed rate if it's down. */
async function usdToEur(): Promise<number> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", { next: { revalidate: 86400 } });
    const rate = (await res.json())?.rates?.EUR;
    if (typeof rate === "number" && rate > 0) return rate;
  } catch {
    // fall through
  }
  return 0.9;
}

async function kitFunnels(): Promise<{ slug: string; name: string }[]> {
  const { data, error } = await supabase().from("products").select("slug, name").order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function getAnalytics(range: Range): Promise<Analytics> {
  const now = Date.now();
  const since = sinceDay(range, now);
  const sinceMs = since ? Date.parse(`${since}T00:00:00Z`) : 0;
  const errors: string[] = [];
  const soft = async <T,>(what: string, p: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await p;
    } catch (err) {
      console.error(`analytics: ${what} failed`, err);
      errors.push(`${what}: ${(err as Error).message ?? err}`);
      return fallback;
    }
  };

  const kits = await soft("products", kitFunnels(), []);
  const list = [
    ...codeFunnels().map((f) => ({ slug: f.slug, name: f.product, langs: f.langs ?? null })),
    ...kits.map((k) => ({ slug: k.slug, name: k.name, langs: null })),
  ].map((f) => ({ ...f, url: `${KIT_HOME}/${f.slug}` }));

  const hasStripe = stripeConfigured();
  const [views, allViews, rate, trackingSince, testStart, paypal, ...stripeLists] = await Promise.all([
    soft("visitors", viewTotals(since), []),
    range === "all" ? Promise.resolve(null) : soft("visitors (all time)", viewTotals(null), []),
    usdToEur(),
    soft("tracking start", firstDay(), null),
    soft("test start", firstDay("midi-drum-kit"), null),
    soft("PayPal orders", paypalSales(), []),
    ...list.map((f) => (hasStripe ? soft(`Stripe orders (${f.slug})`, stripeSales(f.slug), []) : Promise.resolve([] as Sale[]))),
  ]);
  const allSales = [...paypal, ...stripeLists.flat()];
  const ratedFrom = trackingSince ? Date.parse(`${trackingSince}T00:00:00Z`) : Infinity;
  for (const s of allSales) s.rated = s.created >= ratedFrom;
  const sales = allSales.filter((s) => s.created >= sinceMs);

  const funnels: FunnelStats[] = list.map((f) => {
    const total = empty();
    const byLang = new Map<string, Metrics>((f.langs ?? []).map((l) => [l, empty()]));
    const lang = (l: string) => {
      if (!byLang.has(l)) byLang.set(l, empty());
      return byLang.get(l)!;
    };
    for (const v of views) {
      if (v.funnel !== f.slug) continue;
      addView(total, v.page, v.views);
      if (f.langs) addView(lang(v.lang), v.page, v.views);
    }
    for (const s of sales) {
      if (s.funnel !== f.slug) continue;
      addSale(total, s);
      if (f.langs) addSale(lang(s.lang), s);
    }
    const langs = f.langs
      ? [...byLang.entries()]
          .filter(([l, m]) => f.langs!.includes(l) || m.orders + m.visitors > 0)
          .map(([l, m]) => ({ lang: l, m: withRevenue(m, rate) }))
      : null;
    return { slug: f.slug, name: f.name, url: f.url, total: withRevenue(total, rate), langs };
  });

  return {
    range,
    since,
    trackingSince,
    usdToEur: rate,
    funnels,
    test: buttonTest(allViews ?? views, allSales, rate, testStart, now),
    sources: { stripe: hasStripe, paypal: true },
    errors,
  };
}

function withRevenue(m: Metrics, rate: number): Metrics {
  return { ...m, revenue: m.eur + m.usd * rate, ratedRevenue: m.ratedEur + m.ratedUsd * rate };
}

// ─── the A/B test ──────────────────────────────────────────────

/**
 * The first day a visitor was counted: on any funnel, or with an A/B variant
 * on this one (the MIDI Drum Kit button-colour test, app/(funnels)/midi-drum-kit/abtest.ts).
 */
async function firstDay(testFunnel?: string): Promise<string | null> {
  let q = supabase().from("page_views").select("day");
  if (testFunnel) q = q.eq("funnel", testFunnel).neq("variant", "");
  const { data, error } = await q.order("day").limit(1).maybeSingle();
  if (error) throw error;
  return data?.day ?? null;
}

/** The button-colour test, all time: visitors, checkouts and orders per colour, and how sure the leader is. */
function buttonTest(views: ViewRow[], sales: Sale[], rate: number, since: string | null, now: number): TestStats {
  const funnel = "midi-drum-kit";
  const known = new Set<string>(BUTTON_TEST.variants);
  const by = new Map<string, Metrics>(BUTTON_TEST.variants.map((v) => [v, empty()]));
  for (const v of views) if (v.funnel === funnel && known.has(v.variant)) addView(by.get(v.variant)!, v.page, v.views);
  for (const s of sales) {
    if (s.funnel !== funnel || !known.has(s.variant)) continue;
    addSale(by.get(s.variant)!, s);
  }

  const variants = [...by.entries()].map(([variant, m]) => ({ variant, m: withRevenue(m, rate), chanceBest: null as number | null }));
  // Orders per landing visitor; the order page's visitors when the landing has none.
  const rateOf = (m: Metrics) => {
    const n = m.visitors || m.orderViews;
    return n ? { p: m.orders / n, n } : null;
  };
  const rates = variants.map((v) => rateOf(v.m));
  if (rates.every(Boolean)) {
    for (let i = 0; i < variants.length; i++) {
      // Chance this colour converts better than each other one (normal approximation), the lowest of them.
      let chance = 1;
      for (let j = 0; j < variants.length; j++) {
        if (i === j) continue;
        const a = rates[i]!;
        const b = rates[j]!;
        const se = Math.sqrt((a.p * (1 - a.p)) / a.n + (b.p * (1 - b.p)) / b.n);
        chance = Math.min(chance, se > 0 ? phi((a.p - b.p) / se) : a.p > b.p ? 1 : 0.5);
      }
      variants[i].chanceBest = chance;
    }
  }

  const minOrders = Math.min(...variants.map((v) => v.m.orders));
  const salesToGo = variants.reduce((n, v) => n + Math.max(0, TARGET_SALES - v.m.orders), 0);
  const totalOrders = variants.reduce((n, v) => n + v.m.orders, 0);
  const totalVisitors = variants.reduce((n, v) => n + v.m.visitors + v.m.orderViews, 0);
  const leaderEntry = rates.every(Boolean)
    ? variants.reduce((best, v, i) => (rates[i]!.p > rateOf(best.m)!.p ? v : best), variants[0])
    : null;
  const leader = leaderEntry && leaderEntry.m.orders > 0 ? leaderEntry.variant : null;
  const confident = leaderEntry?.chanceBest != null && leaderEntry.chanceBest >= 0.95;
  const days = since ? Math.max(1, Math.floor((now - Date.parse(`${since}T00:00:00Z`)) / DAY) + 1) : 0;

  return {
    funnel,
    name: "Button colour",
    since,
    days,
    target: TARGET_SALES,
    variants,
    leader,
    verdict: totalVisitors === 0 ? "waiting" : minOrders < TARGET_SALES ? "early" : confident ? "winner" : "tie",
    salesToGo,
    // At the pace so far.
    daysToGo: totalOrders > 0 && days > 0 ? salesToGo / (totalOrders / days) : null,
  };
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26). */
function phi(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
