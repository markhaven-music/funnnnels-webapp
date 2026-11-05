import { AB as BUTTON_TEST, COLORS as BUTTON_COLORS } from "@/app/(funnels)/midi-drum-kit/abtest";
import { AB as HEADLINE_TEST, COLORS as HEADLINE_COLORS, LABELS as HEADLINE_LABELS } from "@/app/(funnels)/jazz-midi-pack/abtest";
import type { Step } from "@/lib/beacon";
import { codeFunnels } from "@/lib/funnels";
import { KIT_HOME, SHOP_URL } from "@/lib/liveUrl";
import { SHOP_SLUG } from "@/lib/shop";
import { paypal, paypalConfigured, type PayPalOrder } from "@/lib/paypal";
import { stripe, stripeConfigured } from "@/lib/stripe";
import type Stripe from "stripe";
import { supabase } from "@/lib/supabase";

// Dashboard → Analytics: visitors, checkout starts, orders and revenue per
// funnel, and the results of the running A/B tests (TESTS, below).
//   visitors, checkout starts  page_views (lib/beacon.ts → /api/checkout/view)
//   Stripe orders              Stripe itself: succeeded PaymentIntents with
//                              metadata.funnel (+ .variant, .lang)
//   PayPal orders              paypal_sales, noted at capture
//   processor fees             Stripe: each charge's balance transaction;
//                              PayPal: the capture's paypal_fee (paypal_sales.fee_cents)
// Tables: db/analytics.sql.

// Visitors count from this day on. The bot filter (lib/bots.ts) went live on
// 2026-10-21 at 19:34 UTC; before it, Meta's ad reviewers were counted as
// visitors (41 French landing visits on 10-20, 37 of them from the US, while
// the French ads had no impressions yet). page_views has days, not hours, so
// the first whole day with the filter is where the count starts.
export const VISITS_FROM = "2026-10-22";
const counted = (since: string | null) => (since && since > VISITS_FROM ? since : VISITS_FROM);

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

/** Note a beacon turned away as a bot (lib/bots.ts), for the record only. */
export async function countBotView(v: { funnel: string; page: string; reason: string }) {
  const { error } = await supabase().rpc("count_bot_view", { p_funnel: v.funnel, p_page: v.page, p_reason: v.reason });
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
        offer: typeof meta.u === "string" ? meta.u : "",
        parent: typeof meta.p === "string" ? meta.p : null,
        amount_cents: Math.round(Number(capture.amount.value) * 100),
        fee_cents: paypalFeeCents(order),
        currency,
        // For the customer login (lib/account.ts): the email typed at the
        // checkout, and the PayPal account's.
        email: typeof meta.e === "string" && meta.e ? meta.e.toLowerCase() : null,
        payer_email: order.payer?.email_address?.toLowerCase() ?? null,
      },
      { onConflict: "order_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** PayPal's fee on a captured order, in cents of the sale's currency; null when PayPal doesn't say. */
function paypalFeeCents(order: PayPalOrder): number | null {
  const capture = order.purchase_units[0]?.payments?.captures?.[0];
  const fee = capture?.seller_receivable_breakdown?.paypal_fee;
  if (!capture || !fee || fee.currency_code !== capture.amount.currency_code) return null;
  return Math.round(Number(fee.value) * 100);
}

// ─── reading ───────────────────────────────────────────────────

export type Metrics = {
  visitors: number; // unique visitors of the landing, per day
  orderViews: number; // … of the order page
  checkouts: number; // filled in step 1 (name + email)
  thankYouViews: number; // … of the thank-you page
  upsellViews: Record<string, number>; // … of each upsell page ("upsell-1", "upsell-2")
  orders: number; // the orders themselves, not their upsells
  eur: number; // revenue in euros, upsells included
  usd: number; // revenue in dollars, upsells included
  revenue: number; // both, in euros
  // Stripe's and PayPal's fees, in each currency and both in euros, and the
  // revenue less them (what reaches the bank). Sales whose fee isn't known yet
  // count with none, and are counted in feesUnknown.
  feeEur: number;
  feeUsd: number;
  fees: number;
  net: number;
  feesUnknown: number;
  // Each one-click upsell (funnel.offers id): how many took it, its revenue, and that less the fees.
  offers: Record<string, Offer>;
  // The orders and revenue since visitors were first counted, for the rates
  // (orders / visitors, revenue / visitor): Stripe remembers older sales, the
  // visitor count doesn't go back that far.
  ratedOrders: number;
  ratedEur: number;
  ratedUsd: number;
  ratedRevenue: number;
};

export type Offer = { orders: number; eur: number; usd: number; revenue: number; feeEur: number; feeUsd: number; net: number };

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
  /** The funnel's product name, and where on it the test runs, for the Analytics card. */
  product: string;
  where: string;
  /** m: the orders alone, which the test is judged on; full: the same visitors with their upsells too (the map's lanes).
   * label, color: how the dashboard names and colours the variant. */
  variants: { variant: string; label: string; color: { from: string; to: string }; m: Metrics; full: Metrics; chanceBest: number | null }[];
  leader: string | null;
  verdict: "waiting" | "early" | "winner" | "tie";
  salesToGo: number;
  daysToGo: number | null;
  /** The same test on each language's pages alone (the funnel map's language tabs). */
  byLang?: Record<string, TestStats>;
};

/** One UTC day, all funnels together. */
export type Day = {
  day: string; // "2026-10-21"
  orders: number; // the orders themselves, not their upsells
  upsells: number;
  revenue: number; // in euros, upsells included
  net: number; // the same less Stripe's and PayPal's fees (in dollars: ÷ usdToEur)
  visitors: number; // of the landings
  orderViews: number;
  checkouts: number;
};

export type Analytics = {
  range: Range;
  since: string | null;
  /** The first day any visitor was counted. */
  trackingSince: string | null;
  usdToEur: number;
  funnels: FunnelStats[];
  /** The running A/B tests (TESTS), each since it started, whatever the range. */
  tests: TestStats[];
  /** Day by day over the range (dashboard home), oldest first. */
  days: Day[];
  /** The same number of days just before the range, for the comparisons; null for "all". */
  previous: Day[] | null;
  /** When the last order or upsell was paid (ms), whatever the range. */
  lastSale: number | null;
  sources: { stripe: boolean; paypal: boolean };
  errors: string[];
};

// offer: the upsell's id for a one-click upsell, "" for an order.
// fee: the processor's, in the sale's currency; null when not known.
type Sale = { funnel: string; lang: string; variant: string; offer: string; amount: number; fee: number | null; currency: string; created: number; rated?: boolean };
type ViewRow = { funnel: string; page: Step; lang: string; variant: string; views: number };

const DAY = 86_400_000;
// About 100 sales per variant before the numbers mean much (at ~€25 a sale).
const TARGET_SALES = 100;

/** First UTC day of the range ("2026-10-14"), or null for all time. */
export function sinceDay(range: Range, now = Date.now()): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 28;
  return new Date(now - (days - 1) * DAY).toISOString().slice(0, 10);
}

const empty = (): Metrics => ({
  visitors: 0,
  orderViews: 0,
  checkouts: 0,
  thankYouViews: 0,
  upsellViews: {},
  orders: 0,
  eur: 0,
  usd: 0,
  revenue: 0,
  feeEur: 0,
  feeUsd: 0,
  fees: 0,
  net: 0,
  feesUnknown: 0,
  ratedOrders: 0,
  ratedEur: 0,
  ratedUsd: 0,
  ratedRevenue: 0,
  offers: {},
});

function addView(m: Metrics, page: Step, n: number) {
  if (page === "landing") m.visitors += n;
  else if (page === "order") m.orderViews += n;
  else if (page === "checkout") m.checkouts += n;
  else if (page === "thank-you") m.thankYouViews += n;
  else if (page.startsWith("upsell-")) m.upsellViews[page] = (m.upsellViews[page] ?? 0) + n;
}

const emptyOffer = (): Offer => ({ orders: 0, eur: 0, usd: 0, revenue: 0, feeEur: 0, feeUsd: 0, net: 0 });

function addSale(m: Metrics, s: Sale) {
  const fee = s.fee ?? 0;
  if (s.offer) {
    const o = (m.offers[s.offer] ??= emptyOffer());
    o.orders += 1;
    if (s.currency === "eur") (o.eur += s.amount), (o.feeEur += fee);
    if (s.currency === "usd") (o.usd += s.amount), (o.feeUsd += fee);
  } else m.orders += 1;
  if (s.currency === "eur") (m.eur += s.amount), (m.feeEur += fee);
  if (s.currency === "usd") (m.usd += s.amount), (m.feeUsd += fee);
  if (s.fee === null) m.feesUnknown += 1;
  if (!s.rated) return;
  if (!s.offer) m.ratedOrders += 1;
  if (s.currency === "eur") m.ratedEur += s.amount;
  if (s.currency === "usd") m.ratedUsd += s.amount;
}

async function viewTotals(since: string | null): Promise<ViewRow[]> {
  const { data, error } = await supabase().rpc("page_view_totals", { p_since: counted(since) });
  if (error) throw error;
  return ((data ?? []) as ViewRow[]).map((r) => ({ ...r, views: Number(r.views) }));
}

type DayRow = { day: string; funnel: string; page: Step; views: number };

async function viewDays(since: string | null): Promise<DayRow[]> {
  const { data, error } = await supabase().rpc("page_view_days", { p_since: counted(since) });
  if (error) throw error;
  return ((data ?? []) as DayRow[]).map((r) => ({ ...r, views: Number(r.views) }));
}

const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Every UTC day from `first` to `last` ("2026-10-14"), both included. */
function dayList(first: string, last: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${first}T00:00:00Z`); t <= Date.parse(`${last}T00:00:00Z`); t += DAY) out.push(dayOf(t));
  return out;
}

/** The range day by day, and as many days before it (none for "all"). */
function daily(range: Range, since: string | null, now: number, rows: DayRow[], sales: Sale[], rate: number, trackingSince: string | null) {
  const today = dayOf(now);
  const first = since ?? [trackingSince, ...sales.map((s) => dayOf(s.created))].filter(Boolean).sort()[0] ?? today;
  const days = dayList(first, today);
  const before = since ? dayList(dayOf(Date.parse(`${first}T00:00:00Z`) - days.length * DAY), dayOf(Date.parse(`${first}T00:00:00Z`) - DAY)) : [];
  const by = new Map<string, Day>(
    [...before, ...days].map((day) => [day, { day, orders: 0, upsells: 0, revenue: 0, net: 0, visitors: 0, orderViews: 0, checkouts: 0 }]),
  );
  for (const r of rows) {
    const d = by.get(r.day);
    if (!d) continue;
    if (r.page === "landing") d.visitors += r.views;
    else if (r.page === "order") d.orderViews += r.views;
    else if (r.page === "checkout") d.checkouts += r.views;
  }
  for (const s of sales) {
    const d = by.get(dayOf(s.created));
    if (!d) continue;
    if (s.offer) d.upsells += 1;
    else d.orders += 1;
    const r = s.currency === "usd" ? rate : 1;
    d.revenue += s.amount * r;
    d.net += (s.amount - (s.fee ?? 0)) * r;
  }
  return { days: days.map((d) => by.get(d)!), previous: range === "all" ? null : before.map((d) => by.get(d)!) };
}

async function stripeSales(slug: string): Promise<Sale[]> {
  const out: Sale[] = [];
  let page: string | undefined;
  for (let i = 0; i < 50; i++) {
    const res = await stripe().paymentIntents.search({
      query: `status:'succeeded' AND metadata['funnel']:'${slug}'`,
      limit: 100,
      // The fee is on the charge's balance transaction.
      expand: ["data.latest_charge.balance_transaction"],
      ...(page ? { page } : {}),
    });
    for (const pi of res.data) {
      out.push({
        funnel: slug,
        lang: pi.metadata.lang || "?",
        variant: pi.metadata.variant || "",
        offer: pi.metadata.offer || "",
        amount: pi.amount_received / 100,
        fee: stripeFee(pi),
        currency: pi.currency,
        created: pi.created * 1000,
      });
    }
    if (!res.has_more || !res.next_page) break;
    page = res.next_page;
  }
  return out;
}

/**
 * Stripe's fee on a payment, in the payment's currency. The balance
 * transaction is in the account's currency, so a sale in another one is
 * converted back at the rate Stripe used. Null while Stripe hasn't made it.
 */
function stripeFee(pi: Stripe.PaymentIntent): number | null {
  const charge = pi.latest_charge;
  const bt = charge && typeof charge !== "string" ? charge.balance_transaction : null;
  if (!bt || typeof bt === "string") return null;
  return bt.fee / 100 / (bt.currency === pi.currency ? 1 : bt.exchange_rate || 1);
}

async function paypalSales(): Promise<Sale[]> {
  const { data, error } = await supabase()
    .from("paypal_sales")
    .select("order_id, funnel, lang, variant, offer, amount_cents, fee_cents, currency, created_at")
    .limit(10000);
  if (error) throw error;
  const rows = data ?? [];
  await fillPayPalFees(rows);
  return rows.map((r) => ({
    funnel: r.funnel,
    lang: r.lang,
    variant: r.variant,
    offer: r.offer ?? "",
    amount: r.amount_cents / 100,
    fee: r.fee_cents === null ? null : r.fee_cents / 100,
    currency: r.currency,
    created: Date.parse(r.created_at),
  }));
}

/** Ask PayPal for the fees not noted yet (sales from before fees were noted), a few at a time, and keep them. */
async function fillPayPalFees(rows: { order_id: string; fee_cents: number | null }[]) {
  if (!paypalConfigured()) return;
  const missing = rows.filter((r) => r.fee_cents === null).slice(0, 20);
  await Promise.all(
    missing.map(async (r) => {
      try {
        const fee = paypalFeeCents(await paypal<PayPalOrder>(`/v2/checkout/orders/${r.order_id}`));
        if (fee === null) return;
        const { error } = await supabase().from("paypal_sales").update({ fee_cents: fee }).eq("order_id", r.order_id).is("fee_cents", null);
        if (error) throw error;
        r.fee_cents = fee;
      } catch (err) {
        console.error(`analytics: PayPal fee for ${r.order_id} failed`, err);
      }
    }),
  );
}

/** USD → EUR from the ECB's daily rate (free, cached a day); a rough fixed rate if it's down. */
export async function usdToEur(): Promise<number> {
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
    ...[
      ...codeFunnels().map((f) => ({ slug: f.slug, name: f.product, langs: f.langs ?? null })),
      ...kits.map((k) => ({ slug: k.slug, name: k.name, langs: null })),
      // m.thegrind.studio/midi-drum-kit is still the old Astro page: funnnnels' English one is /en/midi-drum-kit.
    ].map((f) => ({ ...f, url: `${KIT_HOME}${f.slug === "midi-drum-kit" ? "/en" : ""}/${f.slug}` })),
    // The shop's orders, all its products together (lib/shop.ts).
    { slug: SHOP_SLUG, name: "Shop", langs: null, url: SHOP_URL },
  ];

  const hasStripe = stripeConfigured();
  // The day-by-day rows reach back one range more, for the comparison.
  const span = range === "7d" ? 7 : 28;
  const before = since ? dayOf(Date.parse(`${since}T00:00:00Z`) - span * DAY) : null;
  const [views, allViews, dayRows, rate, trackingSince, testStarts, paypal, ...stripeLists] = await Promise.all([
    soft("visitors", viewTotals(since), []),
    range === "all" ? Promise.resolve(null) : soft("visitors (all time)", viewTotals(null), []),
    soft("visitors per day", viewDays(before), []),
    usdToEur(),
    soft("tracking start", firstDay(), null),
    Promise.all(TESTS.map((t) => soft(`test start (${t.funnel})`, firstDay(t.funnel), null))),
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
    tests: TESTS.map((t, i) => testStats(t, allViews ?? views, allSales, rate, testStarts[i], now)),
    ...daily(range, since, now, dayRows, allSales, rate, trackingSince),
    lastSale: allSales.reduce<number | null>((last, s) => (last === null || s.created > last ? s.created : last), null),
    sources: { stripe: hasStripe, paypal: true },
    errors,
  };
}

function withRevenue(m: Metrics, rate: number): Metrics {
  const offers = Object.fromEntries(
    Object.entries(m.offers).map(([id, o]) => {
      const revenue = o.eur + o.usd * rate;
      return [id, { ...o, revenue, net: revenue - (o.feeEur + o.feeUsd * rate) }];
    }),
  );
  const revenue = m.eur + m.usd * rate;
  const fees = m.feeEur + m.feeUsd * rate;
  return { ...m, revenue, fees, net: revenue - fees, ratedRevenue: m.ratedEur + m.ratedUsd * rate, offers };
}

// ─── the A/B tests ─────────────────────────────────────────────

/**
 * The tests the funnels run, each defined in its funnel's abtest.ts: the
 * variant names its pages put in the cookie (and so in page_views and the
 * sales), and how the dashboard names and colours each one. To end a test,
 * take it out of here and of its pages.
 */
type TestDef = {
  funnel: string;
  name: string;
  /** Where on the funnel the test runs, for the Analytics card. */
  where: string;
  variants: readonly string[];
  label: (v: string) => string;
  color: (v: string) => { from: string; to: string };
};
const cap = (v: string) => v[0].toUpperCase() + v.slice(1);
export const TESTS: TestDef[] = [
  {
    funnel: "midi-drum-kit",
    name: "Button colour",
    where: "Landing and order page, every language",
    variants: BUTTON_TEST.variants,
    label: cap,
    color: (v) => BUTTON_COLORS[v as keyof typeof BUTTON_COLORS],
  },
  {
    funnel: "jazz-midi-pack",
    name: "Headline",
    where: "The landing's hero headline; the order page keeps the visitor's variant",
    variants: HEADLINE_TEST.variants,
    label: (v) => HEADLINE_LABELS[v as keyof typeof HEADLINE_LABELS],
    color: (v) => HEADLINE_COLORS[v as keyof typeof HEADLINE_COLORS],
  },
];

/**
 * The first day a visitor was counted: on any funnel, or with an A/B variant
 * on this one (when its test started).
 */
async function firstDay(testFunnel?: string): Promise<string | null> {
  let q = supabase().from("page_views").select("day").gte("day", VISITS_FROM);
  if (testFunnel) q = q.eq("funnel", testFunnel).neq("variant", "");
  const { data, error } = await q.order("day").limit(1).maybeSingle();
  if (error) throw error;
  return data?.day ?? null;
}

/** A test, every language together and, for a funnel sold in several, each one apart (the map's language tabs). */
function testStats(def: TestDef, views: ViewRow[], sales: Sale[], rate: number, since: string | null, now: number): TestStats {
  const from = since ? Date.parse(`${since}T00:00:00Z`) : Infinity;
  const tested = sales.filter((s) => s.created >= from);
  const langs = codeFunnels().find((f) => f.slug === def.funnel)?.langs ?? ["en"];
  const whole = testOn(def, views, tested, rate, since, now);
  if (langs.length < 2) return whole;
  return {
    ...whole,
    byLang: Object.fromEntries(
      langs.map((l) => [
        l,
        testOn(
          def,
          views.filter((v) => v.lang === l),
          tested.filter((s) => s.lang === l),
          rate,
          since,
          now,
        ),
      ]),
    ),
  };
}

/** A test since it started: visitors, checkouts and orders per variant, and how sure the leader is. */
function testOn(def: TestDef, views: ViewRow[], sales: Sale[], rate: number, since: string | null, now: number): TestStats {
  const { funnel } = def;
  const known = new Set<string>(def.variants);
  const by = new Map<string, Metrics>(def.variants.map((v) => [v, empty()]));
  const full = new Map<string, Metrics>(def.variants.map((v) => [v, empty()]));
  for (const v of views) {
    if (v.funnel !== funnel || !known.has(v.variant)) continue;
    addView(by.get(v.variant)!, v.page, v.views);
    addView(full.get(v.variant)!, v.page, v.views);
  }
  for (const s of sales) {
    if (s.funnel !== funnel || !known.has(s.variant)) continue;
    addSale(full.get(s.variant)!, s);
    // The variants are judged on the orders; upsells are another decision.
    if (!s.offer) addSale(by.get(s.variant)!, s);
  }

  const variants = [...by.entries()].map(([variant, m]) => ({
    variant,
    label: def.label(variant),
    color: def.color(variant),
    m: withRevenue(m, rate),
    full: withRevenue(full.get(variant)!, rate),
    chanceBest: null as number | null,
  }));
  // Orders per landing visitor; the order page's visitors when the landing has none.
  const rateOf = (m: Metrics) => {
    const n = m.visitors || m.orderViews;
    return n ? { p: m.orders / n, n } : null;
  };
  const rates = variants.map((v) => rateOf(v.m));
  if (rates.every(Boolean)) {
    for (let i = 0; i < variants.length; i++) {
      // Chance this variant converts better than each other one (normal approximation), the lowest of them.
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
    name: def.name,
    product: codeFunnels().find((f) => f.slug === funnel)?.product ?? funnel,
    where: def.where,
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
