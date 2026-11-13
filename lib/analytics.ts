import { AB as BUTTON_TEST, COLORS as BUTTON_COLORS } from "@/app/(funnels)/midi-drum-kit/abtest";
import { PAY as PAY_TEST, PAY_COLORS, PAY_LABELS } from "@/app/(funnels)/midi-drum-kit/payTest";
import { ORDER_STACK } from "@/app/(funnels)/midi-drum-kit/stackSwitch";
import { LP } from "@/app/(funnels)/midi-drum-kit/landingTest";
import { AB as HEADLINE_TEST, COLORS as HEADLINE_COLORS, LABELS as HEADLINE_LABELS } from "@/app/(funnels)/jazz-midi-pack/abtest";
import { ASTRO_FUNNEL, type Step } from "@/lib/beacon";
import { codeFunnels, funnelLabel } from "@/lib/funnels";
import { KIT_HOME, SHOP_URL } from "@/lib/liveUrl";
import { SHOP_SLUG } from "@/lib/shop";
import { paypal, paypalConfigured, type PayPalOrder } from "@/lib/paypal";
import { stripe, stripeConfigured } from "@/lib/stripe";
import type Stripe from "stripe";
import { rangeDays, rangeLength, type Range } from "@/lib/range";
import { addDays, dayIn, startOfDay } from "@/lib/tz";
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

export type { Range } from "@/lib/range";

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

/** Checkouts started and the orders in a window, the free-pack sign-ups left out (they land on the order page without meaning to buy). */
export type CheckoutPaid = {
  from: string;
  until: string | null;
  starts: number;
  orders: number;
  /** The same on phones alone (checkout_starts.device; before 11-08 matched from the Live session at the same time). */
  phone: { starts: number; orders: number; unknown: number };
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
  variants: {
    variant: string;
    label: string;
    color: { from: string; to: string };
    m: Metrics;
    full: Metrics;
    chanceBest: number | null;
    /** How many who started the checkout paid, in the window this variant was the only one shown (TestDef.windows). */
    paid?: CheckoutPaid;
    /** A picture of what this variant's visitors saw (TestDef.shots), for the Analytics card. */
    shot?: string;
    /** The page this variant's visitors see now, shown live in the card in place of the picture (TestDef.live). */
    live?: string;
  }[];
  /** The test in one plain sentence, for the Analytics card. */
  question?: string;
  leader: string | null;
  verdict: "waiting" | "early" | "winner" | "tie";
  salesToGo: number;
  daysToGo: number | null;
  /** The same test on each language's pages alone (the funnel map's language tabs). */
  byLang?: Record<string, TestStats>;
  /** A test that's over, kept for later comparisons: its last day and the variant that was kept (the user's call, whatever the numbers said). */
  ended?: { day: string; kept: string };
  /** Shown on the funnel map (its lanes): the tests that split the visitors. A test judged by
   * its days (TestDef.windows, e.g. the order page's step 2) is read in Analytics alone. */
  map?: boolean;
};

/** An order page's 5-minute bonus: the Drum Kit's (app/(funnels)/midi-drum-kit/bonusTest.ts), Jazz's (app/(funnels)/jazz-midi-pack/fiveMinBonus.ts). */
export type Step2Side = { from: string; to: string | null; people: number; paid: number };
export type BonusStats = {
  funnel: string;
  /** The funnel's name and the add-on given free. */
  name: string;
  item: string;
  /** Since everyone has the bonus (ISO; Jazz: its first clock, null before any). */
  since: string | null;
  /** Clocks started (a browser reaching the order page for the first time, owner and test devices left out), counted since `clocksSince`. */
  clocksSince: string | null;
  clocks: number;
  clocksPhone: number;
  /** Orders paid since clocks are counted (upsells apart), so they sit against the same visitors: within the 5 minutes (free add-on), after, PayPal (doesn't record it). */
  orders: number;
  within: number;
  after: number;
  paypal: number;
  /** Orders between `since` and `clocksSince` (Drum Kit, 11-08 evening): bonus on, visitors not counted yet, so left out. */
  earlier: number;
  /** Step 2 (the payment form) → paid, per person (email), before the bonus vs since: see step2Paid. */
  step2: { before: Step2Side; after: Step2Side };
  /** Card orders whose clock start is known: how long after it they paid. */
  timing: { label: string; n: number; within: boolean }[];
  timed: number;
  medianSec: number | null;
};

/** Before/after the "Checking availability…" popup on every funnel landing (lib/availability.ts), all funnels together. */
export type AvailabilitySide = {
  /** The minutes counted (ISO; to = null: now) and how many hours that is. */
  from: string;
  to: string | null;
  hours: number;
  /** Browsers that opened a landing (first landing in the window). */
  landings: number;
  /** Of them, those that opened an order page after it. */
  orderViews: number;
  /** Orders paid in the window (upsells apart). */
  orders: number;
};
export type AvailabilityStats = {
  /** When the popup went live (ISO). */
  since: string;
  before: AvailabilitySide;
  after: AvailabilitySide;
  /** Chance the landing → order rate is really higher after than before (normal approximation); null without visits on both sides. */
  chanceClickUp: number | null;
  /** The same for orders per landing visitor. */
  chanceOrderUp: number | null;
  /** Visitors needed on each side to see the landing → order click move 5 points. */
  needed: number;
  /** Each funnel's landing → order, before and after (by the landing first opened; orders not split). */
  funnels: { slug: string; name: string; before: { landings: number; orderViews: number }; after: { landings: number; orderViews: number } }[];
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
  /** The same day per funnel (slug), for the home chart's "By funnel" lines; funnels with nothing that day left out. */
  byFunnel: Record<string, FunnelDay>;
};

export type FunnelDay = { orders: number; upsells: number; revenue: number; net: number; visitors: number };

export type Analytics = {
  range: Range;
  since: string | null;
  /** The range's last day, included ("2026-11-06" for yesterday). */
  until: string;
  /** The first day any visitor was counted. */
  trackingSince: string | null;
  usdToEur: number;
  funnels: FunnelStats[];
  /** The running A/B tests (TESTS), each since it started, whatever the range. */
  tests: TestStats[];
  /** The order pages' 5-minute bonuses (Drum Kit, Jazz), each since everyone has it (bonusStats), whatever the range. */
  bonuses: BonusStats[];
  /** Before/after the availability popup (availabilityStats), whatever the range. */
  availability: AvailabilityStats | null;
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
// bonus: the Drum Kit's 5-minute bonus was given (card orders: metadata.bonus); bonusStart: when the
// buyer's 5 minutes started (ms, card orders since 2026-11-09: metadata.bonus_start); paypal: a PayPal order.
type Sale = {
  funnel: string;
  lang: string;
  variant: string;
  offer: string;
  amount: number;
  fee: number | null;
  currency: string;
  created: number;
  rated?: boolean;
  bonus?: boolean;
  bonusStart?: number | null;
  paypal?: boolean;
};
type ViewRow = { funnel: string; page: Step; lang: string; variant: string; views: number };

const DAY = 86_400_000;
// About 100 sales per variant before the numbers mean much (at ~€25 a sale).
const TARGET_SALES = 100;

/** First day of the range (Warsaw) ("2026-10-14"), or null for all time. */
export function sinceDay(range: Range, now = Date.now()): string | null {
  return rangeDays(range, now).first;
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

async function viewTotalsSince(since: string | null): Promise<ViewRow[]> {
  const { data, error } = await supabase().rpc("page_view_totals", { p_since: counted(since) });
  if (error) throw error;
  return ((data ?? []) as ViewRow[]).map((r) => ({ ...r, views: Number(r.views) }));
}

/** Views from `since` up to `until` (the first day not counted; null = today included). */
async function viewTotals(since: string | null, until: string | null = null): Promise<ViewRow[]> {
  if (!until) return viewTotalsSince(since);
  // page_view_totals only takes a start: the range is what came since its
  // first day, less what came from the day after its last.
  const [from, after] = await Promise.all([viewTotalsSince(since), viewTotalsSince(until)]);
  const key = (r: ViewRow) => `${r.funnel}|${r.page}|${r.lang}|${r.variant}`;
  const later = new Map(after.map((r) => [key(r), r.views]));
  return from.map((r) => ({ ...r, views: r.views - (later.get(key(r)) ?? 0) })).filter((r) => r.views > 0);
}

type DayRow = { day: string; funnel: string; page: Step; views: number };

async function viewDays(since: string | null): Promise<DayRow[]> {
  const { data, error } = await supabase().rpc("page_view_days", { p_since: counted(since) });
  if (error) throw error;
  return ((data ?? []) as DayRow[]).map((r) => ({ ...r, views: Number(r.views) }));
}

/** The Warsaw day of an instant (lib/tz.ts). */
const dayOf = (ms: number) => dayIn(ms);

/** Every day from `first` to `last` ("2026-10-14"), both included. */
function dayList(first: string, last: string): string[] {
  const out: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The range day by day, and as many days before it (none for "all"). */
function daily(range: Range, since: string | null, last: string, rows: DayRow[], sales: Sale[], rate: number, trackingSince: string | null) {
  const first = since ?? [trackingSince, ...sales.map((s) => dayOf(s.created))].filter(Boolean).sort()[0] ?? last;
  const days = dayList(first, last);
  const before = since ? dayList(addDays(first, -days.length), addDays(first, -1)) : [];
  const by = new Map<string, Day>(
    [...before, ...days].map((day) => [day, { day, orders: 0, upsells: 0, revenue: 0, net: 0, visitors: 0, orderViews: 0, checkouts: 0, byFunnel: {} }]),
  );
  const of = (d: Day, funnel: string) => (d.byFunnel[funnel] ??= { orders: 0, upsells: 0, revenue: 0, net: 0, visitors: 0 });
  for (const r of rows) {
    const d = by.get(r.day);
    if (!d) continue;
    if (r.page === "landing") {
      d.visitors += r.views;
      of(d, r.funnel).visitors += r.views;
    }
    else if (r.page === "order") d.orderViews += r.views;
    else if (r.page === "checkout") d.checkouts += r.views;
  }
  for (const s of sales) {
    const d = by.get(dayOf(s.created));
    if (!d) continue;
    const f = of(d, s.funnel);
    if (s.offer) {
      d.upsells += 1;
      f.upsells += 1;
    } else {
      d.orders += 1;
      f.orders += 1;
    }
    const r = s.currency === "usd" ? rate : 1;
    d.revenue += s.amount * r;
    d.net += (s.amount - (s.fee ?? 0)) * r;
    f.revenue += s.amount * r;
    f.net += (s.amount - (s.fee ?? 0)) * r;
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
        bonus: !!pi.metadata.bonus,
        bonusStart: Number(pi.metadata.bonus_start) || null,
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
    paypal: true,
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

/**
 * opts.since: start the range later than its own first day (YYYY-MM-DD), for
 * numbers that must cover the same days as something else: the funnel cards'
 * ad spend, counted only from SPEND_SINCE (lib/funnelSpend.ts).
 */
export async function getAnalytics(range: Range, opts: { since?: string } = {}): Promise<Analytics> {
  const now = Date.now();
  const { first: rangeFirst, last } = rangeDays(range, now);
  const since = opts.since && (!rangeFirst || opts.since > rangeFirst) ? opts.since : rangeFirst;
  const sinceMs = since ? startOfDay(since) : 0;
  // The first day after the range, when it ends before today (Yesterday, Last month…).
  const after = last < dayOf(now) ? addDays(last, 1) : null;
  const untilMs = after ? startOfDay(after) : Infinity;
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
      ...codeFunnels().map((f) => ({ slug: f.slug, name: funnelLabel(f), langs: f.langs ?? null })),
      ...kits.map((k) => ({ slug: k.slug, name: k.name, langs: null })),
      // m.thegrind.studio/midi-drum-kit is still the old Astro page: funnnnels' English one is /en/midi-drum-kit.
    ].map((f) => ({ ...f, url: `${KIT_HOME}${f.slug === "midi-drum-kit" ? "/en" : ""}/${f.slug}` })),
    // The shop's orders, all its products together (lib/shop.ts).
    { slug: SHOP_SLUG, name: "Shop", langs: null, url: SHOP_URL },
  ];

  const hasStripe = stripeConfigured();
  // The day-by-day rows reach back one range more, for the comparison.
  const span = rangeLength(range, now) ?? 0;
  const before = since ? addDays(since, -span) : null;
  const [views, allViews, dayRows, rate, trackingSince, testStarts, paypal, ...stripeLists] = await Promise.all([
    soft("visitors", viewTotals(since, after), []),
    range === "all" ? Promise.resolve(null) : soft("visitors (all time)", viewTotals(null), []),
    soft("visitors per day", viewDays(before), []),
    usdToEur(),
    soft("tracking start", firstDay(), null),
    Promise.all(TESTS.map((t) => soft(`test start (${t.funnel})`, firstDay(t.funnel, t.variants), null))),
    soft("PayPal orders", paypalSales(), []),
    ...list.map((f) => (hasStripe ? soft(`Stripe orders (${f.slug})`, stripeSales(f.slug), []) : Promise.resolve([] as Sale[]))),
  ]);
  const allSales = [...paypal, ...stripeLists.flat()];
  // The visits per day since the first test that runs on days rather than letters (TestDef.windows).
  const firstWindow = TESTS.flatMap((t) => Object.values(t.windows ?? {}).map((w) => w.days[0])).sort()[0];
  const windowDays = firstWindow ? await soft("visitors per day (tests)", viewDays(firstWindow), []) : [];
  const ratedFrom = trackingSince ? startOfDay(trackingSince) : Infinity;
  for (const s of allSales) s.rated = s.created >= ratedFrom;
  const sales = allSales.filter((s) => s.created >= sinceMs && s.created < untilMs);

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
    until: last,
    trackingSince,
    usdToEur: rate,
    funnels,
    tests: await Promise.all(
      TESTS.map(async (t, i) => {
        // An ended test stops at its last minute and is off the funnel map.
        const end = t.ended ? Date.parse(t.ended.at) : null;
        const stats: TestStats = t.windows
          ? { ...windowTest(t, windowDays, allSales, rate, now), ...(t.ended ? { ended: { day: t.ended.at.slice(0, 10), kept: t.ended.kept } } : {}) }
          : end !== null
            ? { ...testStats(t, allViews ?? views, allSales.filter((s) => s.created <= end), rate, testStarts[i], Math.min(now, end)), ended: { day: t.ended!.at.slice(0, 10), kept: t.ended!.kept } }
            : { ...testStats(t, allViews ?? views, allSales, rate, testStarts[i], now), map: true };
        if (!t.windows) return stats;
        const paid = await soft(`checkouts paid (${t.name})`, Promise.all(stats.variants.map((v) => (t.windows![v.variant] ? checkoutPaid(t.funnel, t.windows![v.variant]) : null))), null);
        return paid ? { ...stats, variants: stats.variants.map((v, j) => ({ ...v, paid: paid[j] ?? undefined })) } : stats;
      }),
    ),
    bonuses: (await Promise.all(BONUS_FUNNELS.map((b) => soft(`5-minute bonus (${b.name})`, bonusStats(allSales, b), null)))).filter((b): b is BonusStats => !!b),
    availability: await soft("availability popup", availabilityStats(now), null),
    ...daily(range, since, last, dayRows, allSales, rate, trackingSince),
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
  /** When each variant was the only one shown, to compare the checkouts that paid (ISO times; until null = still now). */
  windows?: Record<string, { from: string; until: string | null; days: [string, string | null] }>;
  /** Over, and kept as an archive: nothing after `at` counts, the card says which variant was kept, the map has no lanes for it. */
  ended?: { at: string; kept: string };
  /** What the test asks, in one plain sentence, and a picture per variant (public/funnels/dashboard/tests), for the Analytics card. */
  question?: string;
  shots?: Record<string, string>;
  /**
   * The variants still shown to visitors: their page itself, in a small frame on the card, so the card always shows
   * the page as it is now ("le thumbnails degli ab test in analytics dovrebbero updatarsi da sole", 2026-11-12).
   * A URL with ?preview=1 (not counted). A variant without one keeps its picture: what visitors saw then.
   */
  live?: Record<string, string>;
};
const cap = (v: string) => v[0].toUpperCase() + v.slice(1);
/** The variants' pictures (tools/test_shots.sh). */
const SHOTS = "/funnels/dashboard/tests";
/** The UTC day before a UTC midnight ("2026-11-14T00:00:00Z" → "2026-11-13"). */
const dayBefore = (iso: string) => new Date(Date.parse(iso) - 86_400_000).toISOString().slice(0, 10);
export const TESTS: TestDef[] = [
  {
    funnel: "midi-drum-kit",
    // The button colour, on the landing and order page since 10-20. Out of this
    // list 11-06 → 11-09 by mistake (never asked): the colours kept showing, but
    // orders and order-page visits carried step 2's letter instead, so the
    // colour of those buyers is lost. Back 11-09 ("voglio vedere i risultati come
    // prima"): the variant field is the colour again everywhere; step 2 is
    // judged by its days, so it needs no letter.
    name: "Button colour",
    question: "Which colour of the buy button sells more: green, yellow or orange?",
    shots: { green: `${SHOTS}/button-green.webp`, yellow: `${SHOTS}/button-yellow.webp`, orange: `${SHOTS}/button-orange.webp` },
    where: "Landing and order page, every language · orders paid 11-06 → 11-09 have no colour (not counted)",
    variants: BUTTON_TEST.variants,
    // 2026-11-12 ("l'arancione sta vincendo", and it made the most money): over, orange on every
    // button; the letter the visits and orders carry is the landing test's from then on.
    ended: { at: LP.from, kept: "orange" },
    label: cap,
    color: (v) => BUTTON_COLORS[v as keyof typeof BUTTON_COLORS],
  },
  {
    funnel: "midi-drum-kit",
    // Since 11-06 evening, beside the button-colour test: the old step 2 against the new one.
    // Split 50/50 for ~1 hour on 11-06 evening, then everyone on B (payTest.ts
    // live): kept here so A's numbers stay beside B's for the comparison.
    name: "Step 2: as it was vs new",
    question: "Does the new payment step (pay bar, $297 → $27) get more people who start the checkout to pay?",
    // Ended 2026-11-12 ("metti a posto il resto"): since 11-10 20:15 everyone has B's step with the pay
    // bar docked (C without its bonus) and no column counts it any more; the Order summary card took over.
    ended: { at: "2026-11-10T19:15:00Z", kept: "b" },
    shots: { a: `${SHOTS}/step2-a.webp`, b: `${SHOTS}/step2-b.webp`, c: `${SHOTS}/step2-c.webp` },
    where: `Order page, step 2 (payment), every language · each column counts the days everyone had that step: A 11-02 → 11-05, B 11-08 alone (card payments failed until 11-07 17:35), C 11-09 → 11-10; orders go to the step they were paid on · C also has the landing's “Checking availability…” popup (since 11-08 20:15), A and B don't · D (no bonus, from 11-10 20:15) has no column: the order page got its “what you get” box ${ORDER_STACK.from.slice(0, 10)} 00:00 UTC, before D had a whole day (see the Order summary card)`,
    // The popup is named in C and D ("D ha anche check availability come variabile", 2026-11-10):
    // D against C is the bonus alone, D against A is the new step 2 and the popup together.
    // C: the same step as B with the phone's pay bar docked to the bottom edge
    // (11-08 17:29, "contiamolo come test C"); no letter of its own, only days.
    // D (below) left out on 2026-11-10: the "what you get" box went live that night ("Stanotte"),
    // ~5 hours after D, so D never had a whole day of visits; a column without visitors would
    // also leave every other column without its "chance best".
    variants: [...PAY_TEST.variants, "c"],
    // 11-08 evening: C also gives everyone the 5-minute Expansions bonus (bonusTest.ts,
    // "metti a tutti il bonus e diventa semplicemente C"); its own A/B test is gone.
    // 11-10 evening: D is C without the bonus ("direi di toglierlo", "ok quindi torniamo a B":
    // with it nobody paid for an add-on, 0 of 6 against 6 of 9 on A); the docked pay bar stays,
    // the Expansions are the paid add-on again.
    label: (v) =>
      v === "c" ? "C · Pay bar docked at the bottom + 5-minute bonus + availability popup" : v === "d" ? "D · Pay bar docked at the bottom + availability popup, no bonus" : PAY_LABELS[v as keyof typeof PAY_LABELS],
    color: (v) =>
      v === "c" ? { from: "#fbbf24", to: "#f59e0b" } : v === "d" ? { from: "#a78bfa", to: "#8b5cf6" } : PAY_COLORS[v as keyof typeof PAY_COLORS],
    // The split ran too short to say anything, so each step is judged on when
    // everyone had it: the old one from 11-02 (funnnnels' order page) until the
    // first test on 11-06 16:00, the new one since 11-06 19:20 (everyone on B).
    // The card's other rows (visitors, orders, revenue…) count whole UTC days,
    // as the visits are kept per day: 11-06, when both ran, is left out.
    windows: {
      a: { from: "2026-11-02T00:00:00+01:00", until: "2026-11-06T16:00:00+01:00", days: ["2026-11-02", "2026-11-05"] },
      // B's days take 11-08 whole (C went live at 17:29 that day); its checkouts stop at the minute.
      // Only 11-08 since 2026-11-10 ("dovremmo togliere le visite di quando la carta non funzionava"):
      // every card payment failed from 11-06 17:21 to 11-07 17:35, and the visits are kept per UTC
      // day, so 11-07 goes whole (its three orders with it: two by PayPal, one card at 17:37).
      b: { from: "2026-11-08T01:00:00+01:00", until: "2026-11-08T17:29:00+01:00", days: ["2026-11-08", "2026-11-08"] },
      c: { from: "2026-11-08T17:29:00+01:00", until: "2026-11-10T20:15:00+01:00", days: ["2026-11-09", "2026-11-10"] },
    },
  },
  {
    funnel: "midi-drum-kit",
    // 2026-11-10, "Sì e poi tracciamola in analytics in maniera chiara": the order page's left
    // column gets the Jazz order page's "what you get" box (midi-drum-kit/stackSwitch.ts), live that
    // night ("Stanotte"). Judged by its days like step 2: Before is the last two days of the same
    // page (step 2's C; its 5-minute bonus ended 11-10 20:15), After is since the box. The box was due
    // 11-11 00:00 UTC but only reached visitors at 11-11 21:21 UTC (its deploy had failed): 11-11 is in
    // neither column, After starts 11-12 (ORDER_STACK.live / firstDay).
    // 2026-11-12 ("rendiamola come jazz, aggiungi i bonus"): the box lists 6 bonuses, not 3, from
    // ORDER_STACK.sixBonuses on, before After's first whole day: After is the box with 6 bonuses.
    // 2026-11-12 ("ok vai partire l'AB test da ora"): the order page was rebuilt as the Jazz MIDI
    // Pack's (16acc3f, live 11-11 23:27 UTC = 11-12 00:27 Italy): its header, the summary with six
    // bonuses and their covers on the left, the checkout sticky on the right. The test starts there:
    // New counts orders from that minute and visits from 11-12, its first whole UTC day. The
    // in-between page (the bordered box, 3 then 6 bonuses, 11-11 21:21 → 23:27 UTC) is in neither.
    name: "Order page: old vs Jazz-style",
    question: "Does the order page rebuilt like the Jazz MIDI Pack's get more people to pay than the old one?",
    shots: { before: `${SHOTS}/order-old.webp`, after: `${SHOTS}/order-new.webp` },
    live: { after: "https://m.thegrind.studio/midi-drum-kit/order?preview=1" },
    where: `Order page, every language · Old = the product picture and 12 claims (hidden on phones), 3 bonuses, 11-09 → ${dayBefore(ORDER_STACK.from)} (step 2's C; 5-minute bonus until 11-10 20:15) · New = the Jazz order page's layout: wordmark and “Secure checkout” bar, the kit's box, tick list, 6 bonuses with their covers and values (Drunk Swing Grooves, the MYSTERY Hooks Pack and a PDF guide added, in the download too), total value against today's price, the checkout sticky on a computer and first on a phone, ${ORDER_STACK.firstDay} → today (live since 11-12 00:27 Italy) · 11-11 is in neither column: that day the page changed three times`,
    variants: ["before", "after"],
    label: (v) => (v === "before" ? "Old · Picture + 12 claims, 3 bonuses" : "New · Jazz-style page, 6 bonuses"),
    color: (v) => (v === "before" ? { from: "#94a3b8", to: "#64748b" } : { from: "#34d399", to: "#059669" }),
    windows: {
      before: { from: "2026-11-08T17:29:00+01:00", until: ORDER_STACK.from, days: ["2026-11-09", dayBefore(ORDER_STACK.from)] },
      after: { from: ORDER_STACK.jazzStyle, until: null, days: [ORDER_STACK.firstDay, null] },
    },
  },
  {
    funnel: "midi-drum-kit",
    // 2026-11-12, "voglio fare un AB pulito tra vecchio funnel e nuovo senza cambiare URL": the old
    // landing against a new one (midi-drum-kit/landingTest.ts, landingNew.ts), 50/50 at the same
    // address, English and Italian, the same order page after both. Counted by letter, to the sale.
    // Same day, ~45 minutes in: the new page got the player earlier with all 11 folders, the folders as
    // a short list and the bonuses rebuilt like the Jazz page's ("put the player earlier in the page",
    // "i want them to audition the bonuses, just like MIDI Jazz Pack"); the test goes on, its first
    // minutes are of the first version. Each later change of the new page is in `where`, with its time.
    name: "Landing: old vs new",
    question: "Does the new landing (new box pictures, Jazz-size headlines, a player with the kit's real MIDI files) sell more than the old one?",
    shots: { "lp-old": `${SHOTS}/landing-old.webp`, "lp-new": `${SHOTS}/landing-new-4.webp` },
    live: { "lp-new": "https://m.thegrind.studio/en/midi-drum-kit?lp=new&preview=1" },
    where: "Landing, English and Italian (French, Spanish and German keep the old page, not counted) · half the visitors on each page at the same address, each kept on theirs · the same Jazz-style order page after both · New = the boxes redone (kit and 11 folders), headlines the size of the Jazz page's, a player right after the hero with every file of the kit's 11 folders (a single part plays over a simple beat), the ten folder panels as one short list, the bonuses like the Jazz page's with files, clips and pads to play; since 11-12 ~17:00 Italy also one page background with dark cards, one accent (the button's orange: highlighted words, player, video) and the bonus boxes redone in the Jazz bonuses' style; since 11-12 ~18:30 Italy the hero, the buttons, a comparison chart, the summary before the checkout, the reviews, a license card, the last section and the footer are built like the Jazz page's, and the player shows every file as a small picture with a choice of beat and tempo; since 11-12 ~19:00 Italy the comparison chart has the kit's column first, the folders are cards with their moving examples again, the folder tree, the questions (13 of them) and the guarantee are rebuilt, the license card comes right after the folders, every button is the same key with no card logos under it, and a “No bounce vs bounce” switch lets the visitor hear what bounce is; since 11-12 ~19:15 Italy the order page after both pages is drawn with the Jazz order page's own styles (the same checkout in both steps, the same font sizes and column widths, no card logos); since 11-12 ~20:45 Italy every buyer downloads the kit with 10,296 MIDI files (the 1,040 patterns plus their key versions and combinations) and the new landing and the order page say 10,296, while the old landing still says 1050; since 11-12 ~21:45 Italy the new landing in English plays a new video (the cold-traffic VSL that opens on “no bounce vs bounce”: 3:37 first, from ~23:00 Italy a 6:24 version in the Jazz video's style; the same hour the page's switch got the same two beats: a plain beat with a syncopated second kick against Complete Beat 13); since 11-12 ~23:30 Italy both landings' page title says 10,296 (it said 1050) and the order page has no “Secure Payments” block; since 11-12 20:38 Italy there is no split: every English and Italian visitor gets the new page, judged against the old page's 7 days before the test; since 11-12 ~22:15 Italy the new page's hero has its own words in the Jazz hero's shape (no “Used in Billboard Charts”), Wistia's player with its progress bar in place of the still, and a lighter orange; since 11-12 ~23:30 Italy the player has a metronome and lets the visitor mute or change each drum's sound, the bonuses show 6 Famous Beats, 6 grooves (a Heavy Drunk one first), 8 Beat Starters, 6 hooks and 24 pads, the old landing and the Italian pages keep theirs · until 11-12 ~16:20 Italy the new page had the player after “What's inside” with 155 files and the old folder and bonus panels",
    variants: LP.variants,
    label: (v) => (v === "lp-old" ? "Old · its last 7 days before the test" : "New · built like the Jazz page, with the player · from 11-13, its first whole day with everyone"),
    // 2026-11-12 19:38 UTC, "lets not do A/B at the same time, we have data for previous pages": the split ended
    // after ~6 hours (LP.live), everyone gets the new page. Judged by days like step 2: Old = the old page's last 7
    // whole UTC days alone (11-05 → 11-11; the order page was the old one then, the Jazz-style one came 11-12 00:27
    // Italy), New = from 11-13 00:00 UTC, its first whole day, orders and visits alike. The whole of 11-12 (6 hours
    // of split, then ~4 hours of the new page alone) is in neither column: until 2026-11-13 New's orders started at
    // LP.liveFrom while its visits started 11-13 ("aggiusta allora"), so the 11-12 21:08 order had no visits beside it.
    windows: {
      "lp-old": { from: "2026-11-05T00:00:00Z", until: "2026-11-12T00:00:00Z", days: ["2026-11-05", "2026-11-11"] },
      "lp-new": { from: "2026-11-13T00:00:00Z", until: null, days: ["2026-11-13", null] },
    },
    color: (v) => (v === "lp-old" ? { from: "#94a3b8", to: "#64748b" } : { from: "#c084fc", to: "#22d3ee" }),
  },
  {
    funnel: "jazz-midi-pack",
    name: "Headline",
    question: "Which hero headline on the Jazz landing sells more?",
    where: "The landing's hero headline; the order page kept the visitor's variant",
    variants: HEADLINE_TEST.variants,
    // "D vince chiudi ma tieni i test in archivio per eventuali confronti" (2026-11-10):
    // the pages show D to everyone and send no letter any more.
    ended: { at: "2026-11-10T23:59:59Z", kept: "d" },
    label: (v) => HEADLINE_LABELS[v as keyof typeof HEADLINE_LABELS],
    color: (v) => HEADLINE_COLORS[v as keyof typeof HEADLINE_COLORS],
  },
];

/**
 * The first day a visitor was counted: on any funnel, or with an A/B variant
 * on this one (when its test started).
 */
async function firstDay(testFunnel?: string, variants?: readonly string[]): Promise<string | null> {
  let q = supabase().from("page_views").select("day").gte("day", VISITS_FROM);
  if (testFunnel) q = variants?.length ? q.eq("funnel", testFunnel).in("variant", [...variants]) : q.eq("funnel", testFunnel).neq("variant", "");
  const { data, error } = await q.order("day").limit(1).maybeSingle();
  if (error) throw error;
  return data?.day ?? null;
}

/** A test, every language together and, for a funnel sold in several, each one apart (the map's language tabs). */
function testStats(def: TestDef, views: ViewRow[], sales: Sale[], rate: number, since: string | null, now: number): TestStats {
  const from = since ? startOfDay(since) : Infinity;
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
    shot: def.shots?.[variant],
    live: def.ended ? undefined : def.live?.[variant],
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
  const days = since ? Math.max(1, Math.floor((now - startOfDay(since)) / DAY) + 1) : 0;

  return {
    funnel,
    name: def.name,
    product: codeFunnels().find((f) => f.slug === funnel)?.product ?? funnel,
    where: def.where,
    question: def.question,
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

/**
 * A test judged on when each variant was the only one shown (TestDef.windows):
 * every visit of those days and every order paid while it ran counts for it, whatever letter it carries.
 */
function windowTest(def: TestDef, days: DayRow[], sales: Sale[], rate: number, now: number): TestStats {
  const today = dayOf(now);
  const inDays = (day: string, d: [string, string | null]) => day >= d[0] && day <= (d[1] ?? today);
  const views: ViewRow[] = [];
  const tagged: Sale[] = [];
  for (const [variant, w] of Object.entries(def.windows!)) {
    for (const r of days) if (r.funnel === def.funnel && inDays(r.day, w.days)) views.push({ funnel: r.funnel, page: r.page, lang: "", variant, views: r.views });
    // Orders by the minute they were paid (2026-11-08: the 20:45 order was paid on C,
    // whose days only start 11-09); the visits by day, as they are kept.
    const [from, until] = [Date.parse(w.from), w.until ? Date.parse(w.until) : Infinity];
    for (const s of sales) if (s.funnel === def.funnel && s.created >= from && s.created < until) tagged.push({ ...s, variant });
  }
  const first = Object.values(def.windows!).map((w) => w.days[0]).sort()[0];
  return testOn(def, views, tagged, rate, first, now);
}

/**
 * Who started the checkout in the window (one per email) and how many of them
 * paid after it (card or PayPal, upsells apart), leaving out the emails that
 * took a free pack before: since 11-05 the free packs send their sign-ups to the
 * order page with their name filled in, so they count as checkouts.
 */
async function checkoutPaid(funnel: string, w: { from: string; until: string | null }): Promise<CheckoutPaid> {
  const db = supabase();
  const until = w.until ?? new Date().toISOString();
  const [fromAt, untilAt] = [Date.parse(w.from), Date.parse(until)];
  // A buyer belongs to the step they paid on (2026-11-08, "dobbiamo attribuirlo a C non B
  // mi sembra ovvio": checkout started at 17:17 on B, paid at 20:45 on C). So the starts
  // of the two weeks before count too, for whoever paid in this window, and a start of this
  // window paid in a later one leaves it. A start never paid stays where it started.
  const lookback = new Date(fromAt - 14 * 86_400_000).toISOString();
  const [starts, cards, pp] = await Promise.all([
    db.from("checkout_starts").select("email, started_at, device").eq("funnel", funnel).eq("own", false).gte("started_at", lookback).lt("started_at", until).limit(5000),
    db.from("orders").select("email, created_at").eq("funnel", funnel).eq("status", "succeeded").is("offer", null).gte("created_at", lookback).limit(5000),
    db.from("paypal_sales").select("email, payer_email, created_at").eq("funnel", funnel).is("offer", null).gte("created_at", lookback).limit(5000),
  ]);
  for (const r of [starts, cards, pp]) if (r.error) throw r.error;
  const low = (e: string | null | undefined) => (e ?? "").trim().toLowerCase();
  const startRows = (starts.data ?? []) as { email: string; started_at: string; device: string | null }[];
  const orderRows = [
    ...((cards.data ?? []) as { email: string | null; created_at: string }[]).map((r) => ({ e: low(r.email), at: Date.parse(r.created_at) })),
    ...((pp.data ?? []) as { email: string | null; payer_email: string | null; created_at: string }[]).map((r) => ({
      e: low(r.email || r.payer_email),
      at: Date.parse(r.created_at),
    })),
  ];
  const emails = [...new Set(startRows.map((r) => low(r.email)).filter(Boolean))];
  const optedAt = new Map<string, number>();
  for (let i = 0; i < emails.length; i += 300) {
    const { data, error } = await db.from("optins").select("email, created_at").in("email", emails.slice(i, i + 300)).lt("created_at", until);
    if (error) throw error;
    for (const o of (data ?? []) as { email: string; created_at: string }[]) {
      const t = Date.parse(o.created_at);
      const k = low(o.email);
      optedAt.set(k, Math.min(optedAt.get(k) ?? Infinity, t));
    }
  }
  const free = (e: string, at: number) => (optedAt.get(e) ?? Infinity) <= at;
  // Each email's last checkout start before the window ends (free-pack sign-ups left out) and its first payment after it.
  const startedAt = new Map<string, number>();
  for (const r of startRows) {
    const e = low(r.email);
    const at = Date.parse(r.started_at);
    if (!e || free(e, at)) continue;
    startedAt.set(e, Math.max(startedAt.get(e) ?? 0, at));
  }
  const paidAt = new Map<string, number>();
  for (const r of orderRows) {
    const st = startedAt.get(r.e);
    if (st === undefined || r.at < st) continue;
    paidAt.set(r.e, Math.min(paidAt.get(r.e) ?? Infinity, r.at));
  }
  const inWindow = (t: number) => t >= fromAt && t < untilAt;
  const started = new Set(
    [...startedAt].filter(([e, st]) => {
      const paid = paidAt.get(e);
      return paid !== undefined ? inWindow(paid) : inWindow(st);
    }).map(([e]) => e),
  );
  const paid = new Set([...started].filter((e) => paidAt.has(e)));
  const deviceOf = new Map(startRows.map((r) => [low(r.email), r.device]));
  const phones = [...started].filter((e) => deviceOf.get(e) === "mobile");
  return {
    from: w.from,
    until: w.until,
    starts: started.size,
    orders: paid.size,
    phone: { starts: phones.length, orders: phones.filter((e) => paid.has(e)).length, unknown: [...started].filter((e) => !deviceOf.get(e)).length },
  };
}

// The order pages with a 5-minute bonus. Everyone on the Drum Kit's has had it since
// 11-08 19:50 (6bf35cf); Jazz's (the Record Samples free, 11-09) counts from its first clock.
// start: when the bonus began, for the step-2 before/after (Jazz: 6af… bbad0d5 went live 05:33).
// STEP2_FROM: the "before" side starts when card payments worked again on today's step 2
// (6b8f6bc, 11-07 17:35; from 11-06 17:21 every card payment failed).
const STEP2_FROM = "2026-11-07T17:35:00+01:00";
const BONUS_FUNNELS: { funnel: string; name: string; item: string; since: string | null; start: string }[] = [
  { funnel: "midi-drum-kit", name: "MIDI Drum Kit", item: "Expansions", since: "2026-11-08T19:50:00+01:00", start: "2026-11-08T19:50:00+01:00" },
  { funnel: "jazz-midi-pack", name: "Jazz MIDI Pack", item: "Jazz Record Samples", since: null, start: "2026-11-09T05:33:00+01:00" },
];

/**
 * Step 2 → paid, before the bonus vs since ("mi interessa sapere before and after del checkout
 * cioè step 2"): each person (email) once, from their first step-2 start (checkout_starts:
 * step 1 filled in, owner/test left out) in the window; paid = an order of the main product
 * (card or PayPal, upsells apart) by the same email after it. Free-pack opt-ins left out
 * (they land on the order page and almost never buy).
 */
async function step2Paid(funnel: string, start: string): Promise<{ before: Step2Side; after: Step2Side }> {
  const db = supabase();
  const { data: starts, error } = await db.from("checkout_starts").select("email, started_at").eq("funnel", funnel).eq("own", false).gte("started_at", STEP2_FROM).limit(5000);
  if (error) throw error;
  const first = new Map<string, number>();
  for (const r of (starts ?? []) as { email: string; started_at: string }[]) {
    const e = r.email.toLowerCase().trim();
    const at = Date.parse(r.started_at);
    if (!first.has(e) || at < first.get(e)!) first.set(e, at);
  }
  const emails = [...first.keys()];
  const free = new Set<string>();
  const paidAt = new Map<string, number[]>();
  for (let i = 0; i < emails.length; i += 300) {
    const chunk = emails.slice(i, i + 300);
    const [o, p] = await Promise.all([
      db.from("optins").select("email, created_at").in("email", chunk),
      db.from("orders").select("email, created_at").eq("funnel", funnel).eq("status", "succeeded").is("parent", null).is("offer", null).in("email", chunk),
    ]);
    if (o.error) throw o.error;
    if (p.error) throw p.error;
    for (const r of (o.data ?? []) as { email: string; created_at: string }[]) {
      const e = r.email.toLowerCase().trim();
      if (Date.parse(r.created_at) < (first.get(e) ?? 0) + 3_600_000) free.add(e);
    }
    for (const r of (p.data ?? []) as { email: string; created_at: string }[]) {
      const e = r.email.toLowerCase().trim();
      (paidAt.get(e) ?? paidAt.set(e, []).get(e)!).push(Date.parse(r.created_at));
    }
  }
  const cut = Date.parse(start);
  const side = (after: boolean): Step2Side => {
    const people = emails.filter((e) => !free.has(e) && (first.get(e)! >= cut) === after);
    return {
      from: after ? start : STEP2_FROM,
      to: after ? null : start,
      people: people.length,
      paid: people.filter((e) => (paidAt.get(e) ?? []).some((t) => t >= first.get(e)! - 600_000)).length,
    };
  };
  return { before: side(false), after: side(true) };
}
const BONUS_BUCKETS: { label: string; upTo: number; within: boolean }[] = [
  { label: "Under 1 min", upTo: 60, within: true },
  { label: "1–2 min", upTo: 120, within: true },
  { label: "2–3 min", upTo: 180, within: true },
  { label: "3–4 min", upTo: 240, within: true },
  { label: "4–5 min", upTo: 330, within: true }, // the 30 s grace for a click on time (BONUS.graceMs)
  { label: "5–30 min", upTo: 1800, within: false },
  { label: "30 min – 24 h", upTo: 86_400, within: false },
  { label: "Later", upTo: Infinity, within: false },
];

/**
 * How many pay within an order page's 5-minute bonus: every order since everyone
 * has it, split by whether it got the free add-on, against the clocks started
 * (bonus_clocks, the Drum Kit's from 2026-11-09, by funnel) and, for card orders
 * that say when their clock started, how long they took.
 */
async function bonusStats(sales: Sale[], cfg: (typeof BONUS_FUNNELS)[number]): Promise<BonusStats> {
  const db = supabase();
  const clocks = () => db.from("bonus_clocks").select("id", { count: "exact", head: true }).eq("own", false).eq("funnel", cfg.funnel);
  const [step2, first, all, phone] = await Promise.all([
    step2Paid(cfg.funnel, cfg.start),
    db.from("bonus_clocks").select("started_at").eq("own", false).eq("funnel", cfg.funnel).order("started_at").limit(1).maybeSingle(),
    clocks(),
    clocks().eq("device", "mobile"),
  ]);
  for (const r of [first, all, phone]) if (r.error) throw r.error;
  const clocksSince = (first.data as { started_at: string } | null)?.started_at ?? null;
  const since = cfg.since ?? clocksSince;
  const from = since ? Date.parse(since) : Infinity;
  const orders = sales.filter((s) => s.funnel === cfg.funnel && !s.offer && s.created >= from);
  const counted = clocksSince ? orders.filter((s) => s.created >= Date.parse(clocksSince)) : [];
  const timed = orders.filter((s) => s.bonusStart && s.created >= s.bonusStart).map((s) => (s.created - s.bonusStart!) / 1000);
  const timing = BONUS_BUCKETS.map((b, i) => ({
    label: b.label,
    within: b.within,
    n: timed.filter((sec) => sec < b.upTo && (i === 0 || sec >= BONUS_BUCKETS[i - 1].upTo)).length,
  }));
  const sorted = [...timed].sort((a, b) => a - b);
  return {
    funnel: cfg.funnel,
    name: cfg.name,
    item: cfg.item,
    since,
    clocksSince,
    clocks: all.count ?? 0,
    clocksPhone: phone.count ?? 0,
    orders: counted.length,
    within: counted.filter((s) => s.bonus).length,
    after: counted.filter((s) => !s.paypal && !s.bonus).length,
    paypal: counted.filter((s) => s.paypal).length,
    earlier: orders.length - counted.length,
    step2,
    timing,
    timed: timed.length,
    medianSec: sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null,
  };
}

// The "Checking availability…" popup went live on every funnel landing on 11-08 at 20:15
// (55a5834, "è possibile misurare se c'è una CR lift dopo che abbiamo inserito il checking
// availability popup"). Counted from the live tracking (live_events: each page a browser
// opens, to the minute, owner and bots never in it), so the cut is the minute itself:
// before = from its first visit (11-02) to 20:15, after = since. live_events keeps 30 days
// (db/live.sql), so the "before" side thins out from 12-02: read the card before then.
// The 5-minute bonus started the same evening on the Drum Kit order page: it moves the
// orders, not the click from the landing to the order page.
const AVAILABILITY_SINCE = "2026-11-08T20:15:00+01:00";

async function availabilityStats(now: number): Promise<AvailabilityStats> {
  const db = supabase();
  const since = Date.parse(AVAILABILITY_SINCE);
  type E = { sid: string; at: string; host: string; funnel: string; page: string };
  const events: E[] = [];
  for (let at = 0; at < 100_000; at += 1000) {
    const { data, error } = await db.from("live_events").select("sid, at, host, funnel, page").in("page", ["landing", "order"]).order("id").range(at, at + 999);
    if (error) throw error;
    events.push(...((data ?? []) as E[]));
    if (!data || data.length < 1000) break;
  }
  // Dev servers write here too: production never counts their visits (lib/live.ts OFF_HOST).
  const off = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/;
  const shown = (host: string) => process.env.NODE_ENV !== "production" || !off.test(host);
  // Each browser: its first landing (time, funnel) and whether it opened an order page after it.
  const first = new Map<string, { at: number; funnel: string; order: boolean }>();
  const orders = new Map<string, number[]>();
  for (const e of events) {
    if (!shown(e.host) || e.funnel === SHOP_SLUG) continue;
    const t = Date.parse(e.at);
    if (e.page === "order") (orders.get(e.sid) ?? orders.set(e.sid, []).get(e.sid)!).push(t);
    else if (!first.has(e.sid) || t < first.get(e.sid)!.at) first.set(e.sid, { at: t, funnel: e.funnel, order: false });
  }
  for (const [sid, v] of first) v.order = (orders.get(sid) ?? []).some((t) => t >= v.at);

  const names = new Map<string, string>(codeFunnels().map((f) => [f.slug, funnelLabel(f)]));
  names.set(ASTRO_FUNNEL, "Drum Kit (old page)");
  const blank = () => ({ landings: 0, orderViews: 0 });
  const per = new Map<string, { before: ReturnType<typeof blank>; after: ReturnType<typeof blank> }>();
  const totals = { before: { ...blank(), orders: 0 }, after: { ...blank(), orders: 0 } };
  let firstAt = Infinity;
  for (const v of first.values()) {
    firstAt = Math.min(firstAt, v.at);
    const side = v.at >= since ? "after" : "before";
    const f = per.get(v.funnel) ?? per.set(v.funnel, { before: blank(), after: blank() }).get(v.funnel)!;
    for (const t of [f[side], totals[side]]) {
      t.landings += 1;
      if (v.order) t.orderViews += 1;
    }
  }
  // Orders by the minute they were paid (upsells apart), from the first visit tracked: from the
  // orders table (every card and PayPal order, saved on payment), not Stripe's search, which lags.
  if (Number.isFinite(firstAt)) {
    const { data, error } = await db.from("orders").select("created_at, funnel, offer").eq("status", "succeeded").is("parent", null).gte("created_at", new Date(firstAt).toISOString()).limit(5000);
    if (error) throw error;
    for (const o of (data ?? []) as { created_at: string; funnel: string; offer: string | null }[]) {
      if (o.offer || o.funnel === SHOP_SLUG) continue;
      totals[Date.parse(o.created_at) >= since ? "after" : "before"].orders += 1;
    }
  }
  const iso = (ms: number) => new Date(ms).toISOString();
  const before = { from: Number.isFinite(firstAt) ? iso(firstAt) : AVAILABILITY_SINCE, to: AVAILABILITY_SINCE, hours: Math.max(0, (since - firstAt) / 3_600_000), ...totals.before };
  const after = { from: AVAILABILITY_SINCE, to: null, hours: Math.max(0, (now - since) / 3_600_000), ...totals.after };
  // Chance the after rate is above the before one (normal approximation).
  const up = (a: number, n: number, b: number, m: number) => {
    if (!n || !m) return null;
    const [p, q] = [a / n, b / m];
    const se = Math.sqrt((p * (1 - p)) / n + (q * (1 - q)) / m);
    return se > 0 ? phi((p - q) / se) : null;
  };
  // Visitors per side to see the click go from the before rate to 5 points more, at 95% / 80% power.
  const p1 = before.landings ? before.orderViews / before.landings : 0.2;
  const p2 = p1 + 0.05;
  const needed = Math.ceil((2.8 ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) / 0.05 ** 2);
  return {
    since: AVAILABILITY_SINCE,
    before,
    after,
    chanceClickUp: up(after.orderViews, after.landings, before.orderViews, before.landings),
    chanceOrderUp: up(after.orders, after.landings, before.orders, before.landings),
    needed,
    funnels: [...per.entries()]
      .map(([slug, v]) => ({ slug, name: names.get(slug) ?? slug, ...v }))
      .sort((a, b) => b.before.landings + b.after.landings - (a.before.landings + a.after.landings)),
  };
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26). */
function phi(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
