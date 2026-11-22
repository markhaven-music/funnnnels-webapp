import { cfOrders, type CfOrder } from "@/lib/cfOrders";
import { CODE_FUNNELS, funnelItems, type FunnelItem } from "@/lib/catalog";
import { eurPer, usdToEur } from "@/lib/analytics";
import { SPEND_SINCE, metaConfigured, spendByDay } from "@/lib/metaSpend";
import { listOrders, type OrderRow } from "@/lib/sales";

// Dashboard → LTV: what a buyer is worth over time, across the whole store.
//
// Every paid order from both eras, joined by email: ClickFunnels' archive
// (cf_orders, 2025-11-26 to 2026-11-02, in euros, what was collected) and
// funnnnels' own orders (orders, every currency, turned into euros at today's
// ECB rate). A ClickFunnels buyer who came back on funnnnels is one buyer
// with two purchases.
//
// A purchase is one visit to a checkout: an order and whatever was added to it
// within 2 hours (the one-click upsells, which funnnnels saves as their own
// orders and ClickFunnels folded into one). A buyer with 2+ purchases is a
// repeat buyer. Money is gross (before Stripe/PayPal fees and refunds).
//
// ClickFunnels' own test orders are left out: its test funnel "Copy of [27]
// MIDI Drum Kit -- 9b364", the catestme/test@test.it addresses, ClickFunnels
// staff and "Test Product".

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const SAME_PURCHASE = 2 * HOUR;

/** Day marks of the LTV curve: what a buyer is worth N days after their first purchase. */
const CURVE_DAYS = [0, 7, 14, 30, 45, 60, 90, 120, 150, 180, 240, 300, 365];
/** Days from the first purchase to the second, grouped. */
const GAPS: { label: string; max: number }[] = [
  { label: "Same day", max: 1 },
  { label: "2–7 days", max: 7 },
  { label: "8–30 days", max: 30 },
  { label: "1–2 months", max: 61 },
  { label: "2–3 months", max: 92 },
  { label: "3–6 months", max: 183 },
  { label: "6+ months", max: Infinity },
];
const COHORT_MONTHS = 12;

// ─── types the panel reads ────────────────────────────────────────────

export type LtvTotals = {
  buyers: number;
  purchases: number;
  revenue: number; // euros
  ltv: number; // revenue ÷ buyers
  firstAov: number; // what the first purchase brings, on average
  repeatBuyers: number;
  repeatRate: number; // 0..1
  repeatRevenue: number; // euros from 2nd+ purchases
  medianDaysTo2nd: number | null;
  avgPurchases: number;
};

export type LtvCurvePoint = { day: number; ltv: number; buyers: number; repeatRate: number };
export type LtvMonth = { month: string; newBuyers: number; returning: number; firstRevenue: number; repeatRevenue: number };
export type LtvBucket = { label: string; buyers: number; revenue: number };
export type LtvCohort = { month: string; buyers: number; firstAov: number; repeat: number; cum: (number | null)[] };
export type LtvRank = { name: string; buyers: number; ltv: number; firstAov: number; repeatRate: number; revenue: number };
export type LtvNext = { name: string; buyers: number; revenue: number; share: number };
export type LtvPath = { from: string; to: string; buyers: number };
export type LtvCustomer = {
  email: string;
  name: string;
  country: string;
  first: string; // ISO
  last: string;
  purchases: number;
  ltv: number;
  products: string[];
  era: "cf" | "funnnnels" | "both";
};
export type LtvRebought = { buyers: number; purchases: number; revenue: number; top: { name: string; buyers: number }[] };
export type LtvCac = { since: string; spend: number; newBuyers: number; perBuyer: number; firstAov: number };

export type Ltv = {
  asOf: string;
  excluded: { tests: number; noEmail: number };
  totals: LtvTotals;
  curve: LtvCurvePoint[];
  months: LtvMonth[];
  purchasesPerBuyer: LtvBucket[];
  gaps: LtvBucket[];
  cohorts: LtvCohort[];
  entries: LtvRank[];
  countries: LtvRank[];
  countryKnown: number;
  addOns: LtvRank[];
  eras: LtvRank[];
  comeback: LtvNext[];
  paths: LtvPath[];
  rebought: LtvRebought;
  top: LtvCustomer[];
  cac: LtvCac | null;
  cacNote: string | null;
};

// ─── product names, the same across both eras ────────────────────────

// Most specific first: "MIDI Drum Kit Expansions" is the Expansions, not the kit.
const NAMES: [RegExp, string][] = [
  [/pro\s*max/i, "MIDI Drum Kit PRO MAX"],
  [/expansion/i, "Expansions"],
  [/\bwav\b/i, "MIDI Drum Kit WAV"],
  [/record\s*samples/i, "Jazz Record Samples"],
  [/vol\.?\s*2/i, "Jazz MIDI Pack Vol. 2"],
  [/all\s*access/i, "All Access"],
  [/bible|^chords$/i, "Chord Progressions Bible"],
  [/drunk|swing\s*grooves/i, "Drunk Swing Grooves"],
  [/famous\s*beats/i, "Famous Beats Bundle"],
  [/top\s*hits/i, "TOP HITS MIDI Bundle"],
  [/drum\s*kit|dopabounce™?\s*$/i, "MIDI Drum Kit"],
  [/jazz/i, "Jazz MIDI Pack"],
  [/essential/i, "Essential Drum Patterns"],
  [/hitmaker/i, "Hitmaker MIDI Bundle"],
  [/hustle/i, "HUSTLE MIDI Bundle"],
  [/emotional\s*keys/i, "Emotional Keys"],
  [/mystery|vocaspace/i, "Mystery Hooks"],
  [/rolls/i, "Rolls"],
];

export function productName(raw: string): string {
  const s = raw.replace(/\s*\((?:old|upgrade|\d+(?:\.\d+)?|[^)]*packs?[^)]*)\)\s*/gi, " ").replace(/["“”\\]/g, "").trim();
  for (const [re, name] of NAMES) if (re.test(s)) return name;
  return s || "Other";
}

// ─── orders from both eras, as one shape ─────────────────────────────

type Sale = {
  email: string;
  name: string;
  country: string;
  at: number;
  eur: number;
  products: string[]; // product names, main first
  entry: string; // the product the funnel sells (the main)
  addOn: boolean; // more than the main in this order
  era: "cf" | "funnnnels";
};

const CF_TEST = (o: CfOrder) =>
  o.funnel.includes("9b364") ||
  /^(catestme|catesme|test@)/i.test(o.email) ||
  /@clickfunnels\.com$/i.test(o.email) ||
  o.items.some((i) => /test product/i.test(i.name));

function cfEntry(o: CfOrder): string {
  const f = o.funnel;
  if (/rolls/i.test(f)) return "Rolls (free pack)";
  if (f && !/^source:|^\[27\]|^copy of/i.test(f)) return productName(f);
  if (/drum kit/i.test(f)) return o.items.some((i) => /pro max/i.test(i.name)) && o.items.length === 1 ? "MIDI Drum Kit PRO MAX" : "MIDI Drum Kit";
  // No funnel: a one-off order (an email offer). Its most expensive item.
  const top = [...o.items].sort((a, b) => b.cents - a.cents)[0];
  return top ? productName(top.name) : "Other";
}

function fromCf(o: CfOrder): Sale {
  const items = [...o.items].sort((a, b) => b.cents - a.cents);
  const names = [...new Set(items.map((i) => productName(i.name)))];
  let entry = cfEntry(o);
  const bare = entry.replace(/ \(free pack\)$/, "");
  // An order of the funnel without its main product (a later upsell order): what it holds.
  if (bare === entry && names.length && !names.includes(entry)) entry = names[0];
  const products = names.includes(bare) ? [bare, ...names.filter((p) => p !== bare)] : names;
  return {
    email: o.email.trim().toLowerCase(),
    name: o.name.trim(),
    country: o.country.toUpperCase(),
    at: Date.parse(o.at),
    eur: o.collected / 100,
    products,
    entry,
    addOn: o.items.length > 1,
    era: "cf",
  };
}

function fromOrder(o: OrderRow, items: Map<string, FunnelItem>, rate: (c: string) => number): Sale {
  const funnelName = CODE_FUNNELS.find((f) => f.slug === o.funnel)?.name ?? o.funnel;
  const named = (key: string) => {
    if (o.funnel === "shop") return productName(key.replace(/-/g, " "));
    if (key === "pack") return productName(funnelName);
    return productName(items.get(`${o.funnel}/${key}`)?.name ?? key.replace(/-/g, " "));
  };
  const products = [...new Set(o.items.map(named))];
  const entry = o.funnel === "shop" ? "Shop" : productName(funnelName);
  return {
    email: (o.email ?? "").trim().toLowerCase(),
    name: (o.name ?? "").trim(),
    country: (o.country ?? "").toUpperCase(),
    at: Date.parse(o.createdAt),
    eur: (o.amountCents / 100) * rate(o.currency),
    products,
    entry,
    addOn: o.items.length > 1,
    era: "funnnnels",
  };
}

// ─── buyers and their purchases ──────────────────────────────────────

type Purchase = { at: number; eur: number; products: string[]; entry: string; addOn: boolean; orders: number };
type Buyer = {
  email: string;
  name: string;
  country: string;
  purchases: Purchase[];
  total: number;
  eras: Set<"cf" | "funnnnels">;
};

function buyersOf(sales: Sale[]): Buyer[] {
  const by = new Map<string, Sale[]>();
  for (const s of sales) by.set(s.email, [...(by.get(s.email) ?? []), s]);
  const out: Buyer[] = [];
  for (const [email, list] of by) {
    list.sort((a, b) => a.at - b.at);
    const purchases: Purchase[] = [];
    for (const s of list) {
      const cur = purchases[purchases.length - 1];
      if (cur && s.at - cur.at <= SAME_PURCHASE) {
        cur.eur += s.eur;
        cur.orders += 1;
        cur.addOn = true;
        for (const p of s.products) if (!cur.products.includes(p)) cur.products.push(p);
      } else {
        purchases.push({ at: s.at, eur: s.eur, products: [...s.products], entry: s.entry, addOn: s.addOn, orders: 1 });
      }
    }
    const named = [...list].reverse().find((s) => s.name) ?? list[0];
    const country = [...list].reverse().find((s) => s.country)?.country ?? "";
    out.push({
      email,
      name: named.name,
      country,
      purchases,
      total: purchases.reduce((n, p) => n + p.eur, 0),
      eras: new Set(list.map((s) => s.era)),
    });
  }
  return out;
}

// ─── the numbers ─────────────────────────────────────────────────────

const monthOf = (t: number) => new Date(t).toISOString().slice(0, 7);
const monthsBetween = (a: string, b: string) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
const r2 = (n: number) => Math.round(n * 100) / 100;

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function rank(groups: Map<string, Buyer[]>, min = 1): LtvRank[] {
  return [...groups]
    .filter(([, bs]) => bs.length >= min)
    .map(([name, bs]) => {
      const revenue = bs.reduce((n, b) => n + b.total, 0);
      return {
        name,
        buyers: bs.length,
        revenue: r2(revenue),
        ltv: r2(revenue / bs.length),
        firstAov: r2(bs.reduce((n, b) => n + b.purchases[0].eur, 0) / bs.length),
        repeatRate: bs.filter((b) => b.purchases.length > 1).length / bs.length,
      };
    })
    .sort((a, b) => b.ltv - a.ltv);
}

function groupBy(buyers: Buyer[], key: (b: Buyer) => string | null): Map<string, Buyer[]> {
  const m = new Map<string, Buyer[]>();
  for (const b of buyers) {
    const k = key(b);
    if (k) m.set(k, [...(m.get(k) ?? []), b]);
  }
  return m;
}

export async function getLtv(): Promise<Ltv> {
  const now = Date.now();
  const [cf, orders, items, usd, fx] = await Promise.all([
    cfOrders(),
    listOrders(20_000),
    funnelItems().catch((): FunnelItem[] => []),
    usdToEur(),
    eurPer(),
  ]);
  const itemMap = new Map(items.map((i) => [`${i.funnel}/${i.key}`, i]));
  const rate = (c: string) => (c === "usd" ? usd : c === "gbp" ? fx.gbp : c === "chf" ? fx.chf : 1);

  let tests = 0;
  let noEmail = 0;
  const sales: Sale[] = [];
  for (const o of cf) {
    if (o.status !== "paid" && o.status !== "partially-refunded") continue;
    if (CF_TEST(o)) {
      tests++;
      continue;
    }
    if (!o.email.trim()) {
      noEmail++;
      continue;
    }
    if (o.collected <= 0) continue;
    sales.push(fromCf(o));
  }
  for (const o of orders) {
    if (!o.email?.trim()) {
      noEmail++;
      continue;
    }
    sales.push(fromOrder(o, itemMap, rate));
  }

  const buyers = buyersOf(sales);
  const nB = buyers.length || 1;
  const revenue = buyers.reduce((n, b) => n + b.total, 0);
  const repeaters = buyers.filter((b) => b.purchases.length > 1);
  const repeatRevenue = buyers.reduce((n, b) => n + b.purchases.slice(1).reduce((m, p) => m + p.eur, 0), 0);
  const firstRevenue = revenue - repeatRevenue;
  const daysTo2nd = repeaters.map((b) => (b.purchases[1].at - b.purchases[0].at) / DAY);

  const totals: LtvTotals = {
    buyers: buyers.length,
    purchases: buyers.reduce((n, b) => n + b.purchases.length, 0),
    revenue: r2(revenue),
    ltv: r2(revenue / nB),
    firstAov: r2(firstRevenue / nB),
    repeatBuyers: repeaters.length,
    repeatRate: repeaters.length / nB,
    repeatRevenue: r2(repeatRevenue),
    medianDaysTo2nd: median(daysTo2nd),
    avgPurchases: buyers.reduce((n, b) => n + b.purchases.length, 0) / nB,
  };

  // The curve, chain-ladder style: day 0 is every buyer's first purchase; each
  // step adds what buyers old enough for it paid between the last mark and this
  // one (and the share who came back in it, of those who hadn't yet). Buyers too
  // young for a mark only count up to the marks they've lived through, so the
  // curve never dips because the crowd behind it changed.
  const curve: LtvCurvePoint[] = [{ day: 0, ltv: r2(firstRevenue / nB), buyers: buyers.length, repeatRate: 0 }];
  let cum = firstRevenue / nB;
  let stayed = 1;
  for (let i = 1; i < CURVE_DAYS.length; i++) {
    const lo = CURVE_DAYS[i - 1] * DAY;
    const hi = CURVE_DAYS[i] * DAY;
    const old = buyers.filter((b) => now - b.purchases[0].at >= hi);
    if (old.length < 20) break;
    const paid = old.reduce((n, b) => n + b.purchases.filter((p) => p.at - b.purchases[0].at > lo && p.at - b.purchases[0].at <= hi).reduce((m, p) => m + p.eur, 0), 0);
    cum += paid / old.length;
    const waiting = old.filter((b) => !(b.purchases.length > 1 && b.purchases[1].at - b.purchases[0].at <= lo));
    const came = waiting.filter((b) => b.purchases.length > 1 && b.purchases[1].at - b.purchases[0].at <= hi).length;
    if (waiting.length) stayed *= 1 - came / waiting.length;
    curve.push({ day: CURVE_DAYS[i], ltv: r2(cum), buyers: old.length, repeatRate: 1 - stayed });
  }

  // Month by month: new buyers and returning ones, first-purchase money and repeat money.
  const monthMap = new Map<string, LtvMonth>();
  const monthRow = (m: string) => {
    let row = monthMap.get(m);
    if (!row) monthMap.set(m, (row = { month: m, newBuyers: 0, returning: 0, firstRevenue: 0, repeatRevenue: 0 }));
    return row;
  };
  for (const b of buyers) {
    const seen = new Set<string>();
    b.purchases.forEach((p, i) => {
      const row = monthRow(monthOf(p.at));
      if (i === 0) {
        row.newBuyers++;
        row.firstRevenue += p.eur;
      } else {
        row.repeatRevenue += p.eur;
        if (!seen.has(row.month) && monthOf(b.purchases[0].at) !== row.month) row.returning++;
      }
      seen.add(row.month);
    });
  }
  const firstMonth = buyers.length ? monthOf(Math.min(...buyers.map((b) => b.purchases[0].at))) : monthOf(now);
  const months: LtvMonth[] = [];
  for (let m = firstMonth; m <= monthOf(now); m = monthOf(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 1))) {
    const row = monthRow(m);
    months.push({ ...row, firstRevenue: r2(row.firstRevenue), repeatRevenue: r2(row.repeatRevenue) });
  }

  const bucket = (label: string, bs: Buyer[]): LtvBucket => ({ label, buyers: bs.length, revenue: r2(bs.reduce((n, b) => n + b.total, 0)) });
  const purchasesPerBuyer = [1, 2, 3, 4].map((n) => bucket(n === 1 ? "1 purchase" : `${n} purchases`, buyers.filter((b) => b.purchases.length === n)));
  purchasesPerBuyer.push(bucket("5+ purchases", buyers.filter((b) => b.purchases.length >= 5)));

  const gaps: LtvBucket[] = GAPS.map((g, i) => {
    const lo = i ? GAPS[i - 1].max : -1;
    return bucket(g.label, repeaters.filter((b) => {
      const d = (b.purchases[1].at - b.purchases[0].at) / DAY;
      return d > lo && d <= g.max;
    }));
  });

  // Cohorts: buyers by the month of their first purchase, what they've paid by month M.
  const nowMonth = monthOf(now);
  const cohorts: LtvCohort[] = [...groupBy(buyers, (b) => monthOf(b.purchases[0].at))]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bs]) => {
      const age = monthsBetween(month, nowMonth);
      const cum: (number | null)[] = [];
      for (let k = 0; k < COHORT_MONTHS; k++) {
        if (k > age) {
          cum.push(null);
          continue;
        }
        const sum = bs.reduce((n, b) => n + b.purchases.filter((p) => monthsBetween(month, monthOf(p.at)) <= k).reduce((m, p) => m + p.eur, 0), 0);
        cum.push(r2(sum / bs.length));
      }
      return {
        month,
        buyers: bs.length,
        firstAov: r2(bs.reduce((n, b) => n + b.purchases[0].eur, 0) / bs.length),
        repeat: bs.filter((b) => b.purchases.length > 1).length / bs.length,
        cum,
      };
    });

  // Ranks.
  const entries = rank(groupBy(buyers, (b) => b.purchases[0].entry), 5);
  const countries = rank(groupBy(buyers, (b) => b.country || null), 5);
  const addOns = rank(groupBy(buyers, (b) => (b.purchases[0].addOn ? "Took an add-on or upsell" : "Main product only")));
  const eras = rank(
    groupBy(buyers, (b) => (b.eras.size > 1 ? "Both: ClickFunnels, then funnnnels" : b.eras.has("cf") ? "ClickFunnels only" : "funnnnels only")),
  );

  // What brings them back: the products in a later purchase.
  const later = new Map<string, { buyers: Set<string>; revenue: number }>();
  const pathMap = new Map<string, number>();
  for (const b of repeaters) {
    for (const p of b.purchases.slice(1)) {
      const name = p.products[0] ?? p.entry;
      const row = later.get(name) ?? { buyers: new Set<string>(), revenue: 0 };
      row.buyers.add(b.email);
      row.revenue += p.eur;
      later.set(name, row);
    }
    const key = `${b.purchases[0].entry}→${b.purchases[1].products[0] ?? b.purchases[1].entry}`;
    pathMap.set(key, (pathMap.get(key) ?? 0) + 1);
  }
  const comeback: LtvNext[] = [...later]
    .map(([name, v]) => ({ name, buyers: v.buyers.size, revenue: r2(v.revenue), share: v.buyers.size / (repeaters.length || 1) }))
    .sort((a, b) => b.buyers - a.buyers || b.revenue - a.revenue)
    .slice(0, 10);
  const paths: LtvPath[] = [...pathMap]
    .map(([k, n]) => {
      const [from, to] = k.split("→");
      return { from, to, buyers: n };
    })
    .sort((a, b) => b.buyers - a.buyers)
    .slice(0, 8);

  // Bought something they already had: a lost download link, most likely.
  const again = new Map<string, Set<string>>();
  let rePurchases = 0;
  let reRevenue = 0;
  const reBuyers = new Set<string>();
  for (const b of repeaters) {
    const owned = new Set(b.purchases[0].products);
    for (const p of b.purchases.slice(1)) {
      const dup = p.products.filter((x) => owned.has(x));
      if (dup.length) {
        rePurchases++;
        reRevenue += p.eur;
        reBuyers.add(b.email);
        for (const x of dup) again.set(x, (again.get(x) ?? new Set()).add(b.email));
      }
      for (const x of p.products) owned.add(x);
    }
  }
  const rebought: LtvRebought = {
    buyers: reBuyers.size,
    purchases: rePurchases,
    revenue: r2(reRevenue),
    top: [...again].map(([name, set]) => ({ name, buyers: set.size })).sort((a, b) => b.buyers - a.buyers).slice(0, 4),
  };

  const top: LtvCustomer[] = [...buyers]
    .sort((a, b) => b.total - a.total || b.purchases.length - a.purchases.length)
    .slice(0, 25)
    .map((b) => ({
      email: b.email,
      name: b.name,
      country: b.country,
      first: new Date(b.purchases[0].at).toISOString(),
      last: new Date(b.purchases[b.purchases.length - 1].at).toISOString(),
      purchases: b.purchases.length,
      ltv: r2(b.total),
      products: [...new Set(b.purchases.flatMap((p) => p.products))],
      era: b.eras.size > 1 ? "both" : b.eras.has("cf") ? "cf" : "funnnnels",
    }));

  // What a new buyer costs in Meta ads since the ads sent people to funnnnels.
  let cac: LtvCac | null = null;
  let cacNote: string | null = null;
  if (!metaConfigured()) cacNote = "Meta isn't connected here, so the ad cost per buyer is missing.";
  else {
    try {
      const today = new Date(now).toISOString().slice(0, 10);
      const meta = await spendByDay(SPEND_SINCE, today);
      if (!meta.connected) cacNote = meta.reason;
      else {
        const k = meta.currency.toLowerCase() === "usd" ? usd : 1;
        const spend = meta.days.reduce((n, d) => n + d.spend, 0) * k;
        const since = Date.parse(`${SPEND_SINCE}T00:00:00Z`);
        const fresh = buyers.filter((b) => b.purchases[0].at >= since);
        if (fresh.length && spend > 0) {
          cac = {
            since: SPEND_SINCE,
            spend: r2(spend),
            newBuyers: fresh.length,
            perBuyer: r2(spend / fresh.length),
            firstAov: r2(fresh.reduce((n, b) => n + b.purchases[0].eur, 0) / fresh.length),
          };
        }
      }
    } catch (err) {
      cacNote = `Couldn't read the Meta ad spend (${(err as Error).message}).`;
    }
  }

  return {
    asOf: new Date(now).toISOString(),
    excluded: { tests, noEmail },
    totals,
    curve,
    months,
    purchasesPerBuyer,
    gaps,
    cohorts,
    entries,
    countries,
    countryKnown: buyers.filter((b) => b.country).length,
    addOns,
    eras,
    comeback,
    paths,
    rebought,
    top,
    cac,
    cacNote,
  };
}
