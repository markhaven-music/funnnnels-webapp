"use client";

import { useEffect, useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Analytics, Day } from "@/lib/analytics";
import { SPEND_SINCE, type MetaDaily } from "@/lib/metaSpend";
import s from "./home.module.css";

// The home's one chart, WooCommerce style (docs/design.md: real numbers
// only, nearly square corners, borders the colour of the card, readable).
//
// Tiles on top sum up the range, each against the period before; the one
// picked is what the chart draws. Profit (the default) draws net revenue and
// what the Meta ads cost as two lines with the gap between them filled:
// green where the revenue beat the ads (profit), red where it didn't (loss).
// Every other tile draws its metric against the period before. By day, by
// week or as a running total; the same numbers as a table.
//
// Ad spend, profit and ROAS count from SPEND_SINCE: before it the ads sent
// buyers to ClickFunnels, whose sales aren't here. Money is in the currency
// picked above (DashboardHome), at the ECB rate of Analytics.usdToEur.
//
// The SVG is drawn in pixels from the measured plot, so lines stay 2.5 px
// and dots round at any size. Hover, or focus and ← →, pick a day; one
// tooltip lists every number of it. Nothing lives only in the tooltip: the
// tiles, the legend's totals, the axis and the table carry the values.

export type Currency = "EUR" | "USD";
export const CURRENCIES: Currency[] = ["EUR", "USD"];
export const SYMBOL: Record<Currency, string> = { EUR: "€", USD: "$" };

export const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
const shortDay = (d: string) => dayLabel(d, { day: "numeric", month: "short" });
const longDay = (d: string) => dayLabel(d, { weekday: "short", day: "numeric", month: "short" });
/** "Thu 5 Nov", "2 – 5 Nov", "9 Oct – 5 Nov". */
function span(from: string, to: string) {
  if (from === to) return longDay(from);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  return `${sameMonth ? dayLabel(from, { day: "numeric" }) : shortDay(from)} – ${shortDay(to)}`;
}

/** €1,284 / €12.9K / −€16: tiles and axes. */
export function money(n: number, cur: Currency = "EUR") {
  const neg = n < 0 ? "−" : "";
  const v = Math.abs(n);
  if (v >= 10_000) return `${neg}${SYMBOL[cur]}${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${neg}${SYMBOL[cur]}${Math.round(v).toLocaleString("en-US")}`;
}
/** €4.50 / €1,284: one day's money, to the cent under a hundred. */
export function moneyExact(n: number, cur: Currency = "EUR") {
  const neg = n < 0 ? "−" : "";
  const v = Math.abs(n);
  const cents = v < 100 && Math.round(v * 100) % 100 !== 0;
  return `${neg}${SYMBOL[cur]}${v.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;
}
/** A sum in euros (Analytics' revenue and net) in the picked currency, at the ECB rate. */
export const fromEur = (v: number, cur: Currency, rate: number) => (cur === "EUR" ? v : v / rate);

const count = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const SINCE_LABEL = shortDay(SPEND_SINCE);

// ─── what the Meta ads cost, day by day (/api/analytics/spend) ────────────────

// Meta's answer per "since..until", so switching back and forth doesn't ask
// again; kept 2 minutes, so a page left open doesn't show this morning's spend.
const spendCache = new Map<string, { at: number; data: MetaDaily }>();
const SPEND_TTL = 2 * 60_000;
const FAILED: MetaDaily = { connected: false, reason: "Couldn't load the ad spend." };

function useAdSpend(since: string | undefined, until: string | undefined): MetaDaily | null {
  const key = `${since}..${until}`;
  const [got, setGot] = useState<{ key: string; data: MetaDaily } | null>(null);
  useEffect(() => {
    if (!since || !until) return;
    const hit = spendCache.get(key);
    if (hit && Date.now() - hit.at < SPEND_TTL) return;
    let gone = false;
    fetch(`/api/analytics/spend?since=${since}&until=${until}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<MetaDaily>) : null))
      .then((m) => {
        if (gone) return;
        const data = m ?? FAILED;
        spendCache.set(key, { at: Date.now(), data });
        setGot({ key, data });
      })
      .catch(() => !gone && setGot({ key, data: FAILED }));
    return () => {
      gone = true;
    };
  }, [key, since, until]);
  return got?.key === key ? got.data : (spendCache.get(key)?.data ?? null);
}

// ─── rows: a day, a week, or the running total up to a day ───────────────────

type Row = {
  from: string;
  to: string;
  revenue: number; // money in the picked currency
  net: number;
  orders: number;
  upsells: number;
  visitors: number;
  ratedOrders: number; // orders on days when visitors were counted, for the conversion
  spend: number | null; // null before SPEND_SINCE, or while Meta isn't there
  adNet: number; // the net revenue of the days whose spend counts: profit and ROAS
  adOrders: number;
  clicks: number;
};

type DaySpend = Map<string, { spend: number; clicks: number }>;

function toRows(days: Day[], spend: DaySpend | null, k: number, trackingSince: string | null): Row[] {
  return days.map((d) => {
    const m = spend && d.day >= SPEND_SINCE ? (spend.get(d.day) ?? { spend: 0, clicks: 0 }) : null;
    return {
      from: d.day,
      to: d.day,
      revenue: d.revenue * k,
      net: d.net * k,
      orders: d.orders,
      upsells: d.upsells,
      visitors: d.visitors,
      ratedOrders: trackingSince && d.day >= trackingSince ? d.orders : 0,
      spend: m ? m.spend * k : null,
      adNet: m ? d.net * k : 0,
      adOrders: m ? d.orders : 0,
      clicks: m ? m.clicks : 0,
    };
  });
}

function merge(rows: Row[]): Row {
  const out: Row = { from: rows[0]?.from ?? "", to: rows[rows.length - 1]?.to ?? "", revenue: 0, net: 0, orders: 0, upsells: 0, visitors: 0, ratedOrders: 0, spend: null, adNet: 0, adOrders: 0, clicks: 0 };
  for (const r of rows) {
    out.revenue += r.revenue;
    out.net += r.net;
    out.orders += r.orders;
    out.upsells += r.upsells;
    out.visitors += r.visitors;
    out.ratedOrders += r.ratedOrders;
    if (r.spend !== null) out.spend = (out.spend ?? 0) + r.spend;
    out.adNet += r.adNet;
    out.adOrders += r.adOrders;
    out.clicks += r.clicks;
  }
  return out;
}

type Interval = "day" | "week" | "total";
const INTERVALS: { id: Interval; label: string }[] = [
  { id: "day", label: "By day" },
  { id: "week", label: "By week" },
  { id: "total", label: "Running total" },
];
/** Weeks need two of them to say anything. */
const WEEK_MIN = 14;

/** Weeks are counted back from the last day, so the latest one is whole. */
function bucket(rows: Row[], interval: Interval): Row[] {
  if (interval === "day") return rows;
  if (interval === "total") return rows.map((_, i) => merge(rows.slice(0, i + 1)));
  const out: Row[] = [];
  for (let end = rows.length; end > 0; end -= 7) out.unshift(merge(rows.slice(Math.max(0, end - 7), end)));
  return out;
}

// ─── the metrics: one tile each ──────────────────────────────────────────────

type Kind = "money" | "count" | "pct" | "ratio";
type MetricId = "profit" | "net" | "spend" | "roas" | "revenue" | "sales" | "aov" | "visitors" | "cvr";
type Metric = {
  id: MetricId;
  label: string;
  color: string;
  kind: Kind;
  /** Counts from SPEND_SINCE only. */
  ads?: boolean;
  /** Is up good? null: neither (what the ads cost). */
  upGood: boolean | null;
  of: (r: Row) => number | null;
  note: (r: Row, cur: Currency) => string;
};

// Checked for colour-blind separation (dataviz skill's validator): violet and
// orange ΔE 28, green and red ΔE 13 under deuteranopia, all ≥ 3:1 on the card.
const NET = "oklch(0.76 0.2 295)";
const SPEND = "oklch(0.77 0.18 55)";
const PROFIT = "oklch(0.85 0.17 162)";
const LOSS = "oklch(0.72 0.2 18)";
const PREV = "oklch(0.62 0.015 270)";

const profitOf = (r: Row) => (r.spend === null ? null : r.adNet - r.spend);
const roasOf = (r: Row) => (r.spend ? r.adNet / r.spend : null);
const cvrOf = (r: Row) => (r.visitors ? r.ratedOrders / r.visitors : null);
/** Average order value: the revenue (upsells included) per order. */
const aovOf = (r: Row) => (r.orders ? r.revenue / r.orders : null);

const METRICS: Metric[] = [
  { id: "profit", label: "Profit", color: PROFIT, kind: "money", ads: true, upGood: true, of: profitOf, note: (r, cur) => `${money(r.adNet, cur)} net − ${money(r.spend ?? 0, cur)} ad spend` },
  {
    id: "net",
    label: "Net revenue",
    color: NET,
    kind: "money",
    upGood: true,
    of: (r) => r.net,
    note: (r, cur) => (r.revenue > r.net ? `${money(r.revenue - r.net, cur)} Stripe + PayPal fees` : "less the processors' fees"),
  },
  { id: "spend", label: "Ad spend", color: SPEND, kind: "money", ads: true, upGood: null, of: (r) => r.spend, note: (r) => `${count(r.clicks)} link clicks` },
  { id: "roas", label: "ROAS", color: "oklch(0.86 0.15 95)", kind: "ratio", ads: true, upGood: true, of: roasOf, note: (r, cur) => `${money(r.adNet, cur)} net ÷ ${money(r.spend ?? 0, cur)} ad spend` },
  { id: "revenue", label: "Revenue", color: "oklch(0.86 0.1 305)", kind: "money", upGood: true, of: (r) => r.revenue, note: () => "upsells included" },
  {
    id: "sales",
    label: "Sales",
    color: "oklch(0.78 0.17 345)",
    kind: "count",
    upGood: true,
    of: (r) => r.orders,
    note: (r) => (r.upsells ? `+ ${r.upsells} upsell${r.upsells === 1 ? "" : "s"}` : "orders, upsells apart"),
  },
  { id: "aov", label: "AOV", color: "oklch(0.82 0.12 140)", kind: "money", upGood: true, of: aovOf, note: () => "revenue ÷ orders, upsells included" },
  { id: "visitors", label: "Visitors", color: "oklch(0.8 0.14 235)", kind: "count", upGood: true, of: (r) => r.visitors, note: () => "unique, on the landings" },
  { id: "cvr", label: "Conversion", color: "oklch(0.84 0.13 195)", kind: "pct", upGood: true, of: cvrOf, note: () => "orders ÷ visitors" },
];

function fmt(v: number | null, kind: Kind, cur: Currency, exact = false) {
  if (v === null) return "—";
  if (kind === "money") return exact ? moneyExact(v, cur) : money(v, cur);
  if (kind === "pct") return pct(v);
  if (kind === "ratio") return `${v.toFixed(2)}×`;
  return count(v);
}

type Delta = { text: string; up: boolean; tone: "good" | "bad" | "flat" };

/** Against the period before: % for money and counts, points for conversion, the difference for profit and ROAS. */
function delta(m: Metric, now: number | null, before: number | null, cur: Currency): Delta | null {
  if (now === null || before === null) return null;
  let text: string;
  if (m.id === "profit") text = money(Math.abs(now - before), cur);
  else if (m.kind === "pct") text = `${Math.abs((now - before) * 100).toFixed(1)} pts`;
  else if (m.kind === "ratio") text = `${Math.abs(now - before).toFixed(2)}×`;
  else if (before <= 0) return null;
  else text = `${Math.abs((now / before - 1) * 100).toFixed(0)}%`;
  const up = now >= before;
  return { text, up, tone: m.upGood === null ? "flat" : up === m.upGood ? "good" : "bad" };
}

// ─── geometry ────────────────────────────────────────────────────────────────

/** An element's size, kept up to date; a callback ref, so a plot shown again after the table is measured again. */
function useSize() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size] as const;
}

/** Clean axis ticks from 0 past max: steps of 1, 2, 2.5, 5 × 10ⁿ (whole ones for counts), about five of them. */
function ticks(max: number, kind: Kind): number[] {
  const scale = kind === "pct" ? 100 : 1;
  let v = max * scale;
  if (!(v > 0)) v = kind === "count" ? 4 : kind === "money" ? 100 : 2;
  const raw = (v * 1.06) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const steps = kind === "count" ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  let step = (steps.find((st) => raw <= st * p) ?? 10) * p;
  if (kind === "count") step = Math.max(1, Math.round(step));
  const top = Math.ceil((v * 1.06) / step) * step;
  const out: number[] = [];
  for (let i = 0; i * step <= top + step / 1000; i++) out.push((i * step) / scale);
  return out;
}

function tickLabel(t: number, kind: Kind, cur: Currency) {
  if (kind === "money") return money(t, cur);
  if (kind === "pct") return `${+(t * 100).toFixed(1)}%`;
  if (kind === "ratio") return `${+t.toFixed(2)}×`;
  return count(t);
}

type Pt = { x: number; y: number };
const r1 = (n: number) => Math.round(n * 10) / 10;
const SAMPLES = 14;

/**
 * Points along a smooth curve through (xs, ys) that never overshoots them
 * (monotone cubic, Fritsch–Carlson), SAMPLES per gap. Sampled rather than
 * drawn as Béziers so two curves on the same xs can be filled between.
 */
function curve(xs: number[], ys: number[]): Pt[] {
  const n = xs.length;
  if (n < 2) return xs.map((x, i) => ({ x, y: ys[i] }));
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) m[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1);
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      t[i] = (3 / h) * a * m[i];
      t[i + 1] = (3 / h) * b * m[i];
    }
  }
  const out: Pt[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    for (let j = 0; j < SAMPLES; j++) {
      const u = j / SAMPLES;
      const u2 = u * u;
      const u3 = u2 * u;
      out.push({
        x: xs[i] + u * dx,
        y: (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * dx * t[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * dx * t[i + 1],
      });
    }
  }
  out.push({ x: xs[n - 1], y: ys[n - 1] });
  return out;
}

const pathOf = (pts: Pt[]) => (pts.length ? `M${pts.map((p) => `${r1(p.x)},${r1(p.y)}`).join(" L")}` : "");

/** The runs of values that aren't null, with where each starts. */
function runs(vals: (number | null)[]): { start: number; values: number[] }[] {
  const out: { start: number; values: number[] }[] = [];
  vals.forEach((v, i) => {
    if (v === null) return;
    const last = out[out.length - 1];
    if (last && last.start + last.values.length === i) last.values.push(v);
    else out.push({ start: i, values: [v] });
  });
  return out;
}

/**
 * The areas between two curves sampled on the same xs, split where they
 * cross: profit where a (net revenue) is above b (ad spend), loss below.
 */
function bands(a: Pt[], b: Pt[]): { d: string; profit: boolean }[] {
  const out: { d: string; profit: boolean }[] = [];
  let top: Pt[] = [];
  let bot: Pt[] = [];
  let sign = 0;
  const close = () => {
    if (top.length > 1 && sign !== 0) out.push({ profit: sign > 0, d: `${pathOf(top)} L${[...bot].reverse().map((p) => `${r1(p.x)},${r1(p.y)}`).join(" L")} Z` });
  };
  for (let i = 0; i < a.length; i++) {
    const d = b[i].y - a[i].y; // pixels: > 0 when the revenue is drawn above the spend
    if (sign === 0 && Math.abs(d) > 0.01) sign = Math.sign(d);
    top.push(a[i]);
    bot.push(b[i]);
    if (i === a.length - 1) break;
    const d1 = b[i + 1].y - a[i + 1].y;
    if (sign !== 0 && Math.abs(d1) > 0.01 && Math.sign(d1) !== sign) {
      const t = d / (d - d1);
      const p = { x: a[i].x + t * (a[i + 1].x - a[i].x), y: a[i].y + t * (a[i + 1].y - a[i].y) };
      top.push(p);
      bot.push(p);
      close();
      top = [p];
      bot = [p];
      sign = Math.sign(d1);
    }
  }
  close();
  return out;
}

// ─── the card ────────────────────────────────────────────────────────────────

type Props = {
  /** null while it loads. */
  a: Analytics | null;
  cur: Currency;
  /** "7 days" / "28 days" / "period". */
  periodName: string;
};

export function Performance({ a, cur, periodName }: Props) {
  const [picked, setPicked] = useState<MetricId>("profit");
  const [interval, setIv] = useState<Interval>("day");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<number | null>(null);
  const [plotRef, size] = useSize();
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const days = a?.days ?? [];
  const before = a?.previous ?? [];
  const spend = useAdSpend((before[0] ?? days[0])?.day, days[days.length - 1]?.day);

  if (!a) {
    return (
      <div className={`${s.card} ${s.perf}`}>
        <div className={s.tiles}>
          {METRICS.map((m) => (
            <div key={m.id} className={s.tile}>
              <div className={s.tileLabel}>
                <span className={s.tileKey} style={{ background: m.color }} />
                {m.label}
              </div>
              <div className={s.tileValue}>—</div>
              <div className={s.tileDelta}>loading…</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rate = a.usdToEur;
  const k = cur === "EUR" ? 1 : 1 / rate;
  // Meta bills in the account's currency: into euros first, then like the rest.
  const spendMap: DaySpend | null = spend?.connected
    ? new Map(spend.days.map((d) => [d.day, { spend: spend.currency === "USD" ? d.spend * rate : d.spend, clicks: d.clicks }]))
    : null;
  // The whole card counts from SPEND_SINCE ("only count the days from Nov 2"):
  // before it the ads sold on ClickFunnels, and tiles over different days
  // didn't add up (net revenue − ad spend ≠ profit). The period before is as
  // many days right before that.
  const allDays = [...toRows(before, spendMap, k, a.trackingSince), ...toRows(days, spendMap, k, a.trackingSince)];
  const rangeStartsEarly = (days[0]?.day ?? SPEND_SINCE) < SPEND_SINCE;
  const firstIn = allDays.findIndex((r) => r.from >= SPEND_SINCE);
  const rangeStart = Math.max(before.length, firstIn < 0 ? before.length : firstIn);
  const rangeRows = allDays.slice(rangeStart);
  const prevRows = a.previous && rangeStart - rangeRows.length >= 0 ? allDays.slice(rangeStart - rangeRows.length, rangeStart) : [];
  const total = merge(rangeRows);
  const prevTotal = prevRows.length ? merge(prevRows) : null;
  const spendState = spend === null ? "loading" : spend.connected ? "ok" : "off";

  const m = METRICS.find((x) => x.id === picked)!;
  const profitView = m.id === "profit";

  // What the chart draws: the range, or for the ads' metrics the part of it
  // from SPEND_SINCE; and as many days right before it.
  const domain = rangeRows;
  const prevDomain = prevRows.length ? prevRows : null;
  const iv: Interval = interval === "week" && domain.length < WEEK_MIN ? "day" : interval;
  const rows = bucket(domain, iv);
  const prevBuckets = prevDomain ? bucket(prevDomain, iv) : null;
  const n = rows.length;

  // The series.
  const netS = rows.map((r) => r.net);
  const spendS = rows.map((r) => r.spend);
  const hasSpend = spendS.some((v) => v !== null);
  const curS = rows.map(m.of);
  const prevS = prevBuckets?.map(m.of) ?? null;
  const hasPrev = !profitView && !!prevS && prevS.some((v) => v !== null);
  const show = {
    net: profitView && !hidden.net,
    spend: profitView && hasSpend && !hidden.spend,
    cur: !profitView,
    prev: hasPrev && !hidden.prev,
  };
  const visible = [...(show.net ? netS : []), ...(show.spend ? spendS : []), ...(show.cur ? curS : []), ...(show.prev && prevS ? prevS : [])].filter(
    (v): v is number => v !== null,
  );
  const kind: Kind = profitView ? "money" : m.kind;
  const tks = ticks(Math.max(0, ...visible), kind);
  const top = tks[tks.length - 1] || 1;

  // Pixels.
  const W = size.w;
  const H = size.h;
  const padX = 14;
  const padTop = 10;
  const base = H - 0.5;
  const xOf = (i: number) => (n > 1 ? padX + (i * (W - 2 * padX)) / (n - 1) : W / 2);
  const yOf = (v: number) => base - (v / top) * (base - padTop);
  const lineOf = (vals: (number | null)[]) =>
    runs(vals).map((run) =>
      curve(
        run.values.map((_, j) => xOf(run.start + j)),
        run.values.map(yOf),
      ),
    );
  const netLines = show.net ? lineOf(netS) : [];
  const spendLines = show.spend ? lineOf(spendS) : [];
  const curLines = show.cur ? lineOf(curS) : [];
  const prevLines = show.prev && prevS ? lineOf(prevS) : [];
  const fills = show.net && show.spend && spendS.every((v) => v !== null) && n > 1 ? bands(netLines[0] ?? [], spendLines[0] ?? []) : [];
  const dots = n <= 40;
  const hv = hover !== null && hover < n ? hover : null;
  const hr = hv === null ? null : rows[hv];
  const empty = !visible.some((v) => v !== 0);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    setHover(n > 1 ? Math.max(0, Math.min(n - 1, Math.round(((x - padX) / (W - 2 * padX)) * (n - 1)))) : 0);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -1 : 1;
      setHover((h) => Math.max(0, Math.min(n - 1, (h ?? n - 1) + step)));
    } else if (e.key === "Escape") setHover(null);
  };
  const toggle = (key: string) => setHidden((h) => ({ ...h, [key]: !h[key] }));

  // The x axis: about eight dates, always the last.
  const every = n <= 8 ? 1 : Math.ceil(n / 8);
  const xLabel = (r: Row) =>
    iv === "week" ? shortDay(r.from) : iv === "day" && n <= 7 ? dayLabel(r.to, { weekday: "short", day: "numeric" }) : shortDay(r.to);
  const domainTotal = domain.length ? merge(domain) : null;
  const prevDomainTotal = prevDomain ? merge(prevDomain) : null;

  const title = profitView ? "Profit: net revenue against ad spend" : m.label;
  const what = profitView
    ? "Green where the net revenue beat the ad spend, red where it didn't."
    : hasPrev
      ? "Against the days just before."
      : m.note(total, cur);

  return (
    <div className={`${s.card} ${s.perf}`}>
      {/* The tiles: the range at a glance; click one to chart it. */}
      {rangeStartsEarly && rangeRows.length > 0 && (
        <div className={s.since}>
          {span(rangeRows[0].from, rangeRows[rangeRows.length - 1].to)} · counted from {SINCE_LABEL}, when the ads moved here from ClickFunnels
        </div>
      )}
      <div className={s.tiles} role="group" aria-label="Pick what the chart shows">
        {METRICS.map((x) => {
          const now = x.of(total);
          const d = prevTotal ? delta(x, now, x.of(prevTotal), cur) : null;
          const on = x.id === picked;
          const waiting = x.ads && spendState !== "ok";
          return (
            <button
              key={x.id}
              type="button"
              className={`${s.tile} ${on ? s.tileOn : ""}`}
              style={{ ["--k" as string]: x.color }}
              aria-pressed={on}
              onClick={() => {
                setPicked(x.id);
                setHover(null);
              }}
            >
              <div className={s.tileLabel}>
                <span className={s.tileKey} style={{ background: x.color }} />
                {x.label}
              </div>
              <div className={s.tileValue}>
                {waiting ? "—" : fmt(now, x.kind, cur)}
                {x.id === "profit" && !waiting && now !== null && (
                  <span className={`${s.badge} ${now >= 0 ? s.badgeProfit : s.badgeLoss}`}>{now >= 0 ? "profit" : "loss"}</span>
                )}
              </div>
              {waiting ? (
                <div className={s.tileDelta}>{spendState === "loading" ? "loading from Meta…" : "Meta isn't connected"}</div>
              ) : d ? (
                <div className={`${s.tileDelta} ${s[d.tone]}`}>
                  {d.up ? "▲" : "▼"} {d.text} <span className={s.vs}>vs previous {periodName}</span>
                </div>
              ) : (
                <div className={s.tileDelta}>{a.range === "all" ? "all time" : "nothing to compare yet"}</div>
              )}
              <div className={s.tileNote}>{waiting ? (spend && !spend.connected ? spend.reason : " ") : x.note(total, cur)}</div>
            </button>
          );
        })}
      </div>

      {/* The chart's head: what it shows, by day / week / running total, chart or table. */}
      <div className={s.chartHead}>
        <div>
          <div className={s.chartTitle}>{title}</div>
          <div className={s.chartSub}>
            {what}

          </div>
        </div>
        <div className={s.controls}>
          <div className="tabs" role="group" aria-label="Interval">
            {INTERVALS.map((x) => {
              const off = x.id === "week" && domain.length < WEEK_MIN;
              return (
                <button
                  key={x.id}
                  type="button"
                  className={`tab ${iv === x.id ? "active" : ""}`}
                  aria-pressed={iv === x.id}
                  disabled={off}
                  title={off ? "Needs two weeks of days" : undefined}
                  onClick={() => {
                    setIv(x.id);
                    setHover(null);
                  }}
                >
                  {x.label}
                </button>
              );
            })}
          </div>
          <div className="tabs" role="group" aria-label="View">
            {(["chart", "table"] as const).map((v) => (
              <button key={v} type="button" className={`tab ${view === v ? "active" : ""}`} aria-pressed={view === v} onClick={() => setView(v)}>
                {v === "chart" ? "Chart" : "Table"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "table" ? (
        <Table rows={rangeRows} interval={interval === "week" && rangeRows.length < WEEK_MIN ? "day" : interval} picked={picked} cur={cur} rate={rate} early={rangeStartsEarly} />
      ) : (
        <>
          {/* The legend: one key per series with its total; a key that's a button hides its line. */}
          <div className={s.legend}>
            {profitView ? (
              <>
                <LegendKey color={NET} name="Net revenue" total={domainTotal ? money(domainTotal.net, cur) : "—"} off={!show.net} onClick={() => toggle("net")} />
                <LegendKey
                  color={SPEND}
                  name="Ad spend"
                  total={spendState === "ok" && domainTotal ? money(domainTotal.spend ?? 0, cur) : spendState === "loading" ? "loading…" : "not connected"}
                  off={!show.spend}
                  onClick={spendState === "ok" ? () => toggle("spend") : undefined}
                />
                {fills.length > 0 && (
                  <span className={s.lgBands}>
                    <span className={s.lgBand}>
                      <i style={{ background: PROFIT }} /> profit
                    </span>
                    <span className={s.lgBand}>
                      <i style={{ background: LOSS }} /> loss
                    </span>
                  </span>
                )}
              </>
            ) : (
              <>
                <LegendKey
                  color={m.color}
                  name={domain.length ? span(domain[0].from, domain[domain.length - 1].to) : m.label}
                  total={domainTotal ? fmt(m.of(domainTotal), m.kind, cur) : "—"}
                />
                {hasPrev && prevDomain && prevDomainTotal && (
                  <LegendKey
                    color={PREV}
                    name={span(prevDomain[0].from, prevDomain[prevDomain.length - 1].to)}
                    total={fmt(m.of(prevDomainTotal), m.kind, cur)}
                    off={!show.prev}
                    onClick={() => toggle("prev")}
                  />
                )}
              </>
            )}
            <span className={s.hint}>hover or ← → for a day&apos;s numbers</span>
          </div>

          <div className={s.chart}>
            <div className={s.yAxis} aria-hidden>
              {H > 0 &&
                tks.map((t) => (
                  <span key={t} style={{ top: yOf(t) }}>
                    {tickLabel(t, kind, cur)}
                  </span>
                ))}
            </div>
            <div
              ref={plotRef}
              className={s.plot}
              tabIndex={0}
              role="group"
              aria-label={`${title}, ${iv === "total" ? "running total" : `by ${iv}`}. Use the arrow keys for each ${iv === "week" ? "week" : "day"}.`}
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
              onKeyDown={onKey}
              onBlur={() => setHover(null)}
            >
              {W > 0 && H > 0 && (
                <svg className={s.svg} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                  <defs>
                    <linearGradient id={`${gid}area`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.color} stopOpacity="0.34" />
                      <stop offset="100%" stopColor={m.color} stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  {tks.map((t) => (
                    <line key={t} className={t === 0 ? s.base : s.grid} x1={0} x2={W} y1={Math.round(yOf(t)) + 0.5} y2={Math.round(yOf(t)) + 0.5} />
                  ))}
                  {fills.map((f, i) => (
                    <path key={i} d={f.d} fill={f.profit ? PROFIT : LOSS} fillOpacity={0.3} />
                  ))}
                  {curLines.map((pts, i) => (
                    <path key={`a${i}`} d={`${pathOf(pts)} L${r1(pts[pts.length - 1].x)},${base} L${r1(pts[0].x)},${base} Z`} fill={`url(#${gid}area)`} />
                  ))}
                  {prevLines.map((pts, i) => (
                    <path key={`p${i}`} d={pathOf(pts)} className={s.prevLine} />
                  ))}
                  {spendLines.map((pts, i) => (
                    <path key={`s${i}`} d={pathOf(pts)} stroke={SPEND} className={s.line} />
                  ))}
                  {netLines.map((pts, i) => (
                    <path key={`n${i}`} d={pathOf(pts)} stroke={NET} className={s.line} />
                  ))}
                  {curLines.map((pts, i) => (
                    <path key={`c${i}`} d={pathOf(pts)} stroke={m.color} className={s.line} />
                  ))}
                  {dots &&
                    [
                      ...(show.spend ? spendS.map((v, i) => ({ v, i, c: SPEND, k: "s" })) : []),
                      ...(show.net ? netS.map((v, i) => ({ v, i, c: NET, k: "n" })) : []),
                      ...(show.cur ? curS.map((v, i) => ({ v, i, c: m.color, k: "c" })) : []),
                    ].map((p) => (p.v === null ? null : <circle key={`${p.k}${p.i}`} cx={xOf(p.i)} cy={yOf(p.v)} r={3.5} fill={p.c} className={s.dot} />))}
                  {hv !== null && (
                    <g>
                      <line className={s.cross} x1={Math.round(xOf(hv)) + 0.5} x2={Math.round(xOf(hv)) + 0.5} y1={0} y2={H} />
                      {show.prev && prevS && prevS[hv] !== null && <circle cx={xOf(hv)} cy={yOf(prevS[hv]!)} r={4.5} fill={PREV} className={s.dot} />}
                      {show.spend && spendS[hv] !== null && <circle cx={xOf(hv)} cy={yOf(spendS[hv]!)} r={6} fill={SPEND} className={s.dot} />}
                      {show.net && <circle cx={xOf(hv)} cy={yOf(netS[hv])} r={6} fill={NET} className={s.dot} />}
                      {show.cur && curS[hv] !== null && <circle cx={xOf(hv)} cy={yOf(curS[hv]!)} r={6} fill={m.color} className={s.dot} />}
                    </g>
                  )}
                </svg>
              )}
              {n === 0 ? (
                <div className={s.none}>Ad spend counts from {SINCE_LABEL}: nothing in this range yet.</div>
              ) : (
                empty && <div className={s.none}>{m.ads && spend && !spend.connected ? spend.reason : "Nothing to show in this range yet."}</div>
              )}
              {hr && hv !== null && (
                <div className={s.tip} style={xOf(hv) < W / 2 ? { left: xOf(hv) + 18 } : { right: W - xOf(hv) + 18 }}>
                  <div className={s.tipHead}>{iv === "total" ? `${span(hr.from, hr.to)} · running total` : span(hr.from, hr.to)}</div>
                  <TipBig m={m} r={hr} cur={cur} />
                  {!profitView && hasPrev && prevS && prevBuckets?.[hv] && (
                    <div className={s.tipVs}>
                      {fmt(prevS[hv], m.kind, cur, true)} on {span(prevBuckets[hv].from, prevBuckets[hv].to)}
                    </div>
                  )}
                  <Details r={hr} cur={cur} />
                </div>
              )}
            </div>
            <div className={s.xAxis} aria-hidden>
              {W > 0 &&
                rows.map((r, i) =>
                  (n - 1 - i) % every === 0 ? (
                    <span
                      key={r.from + r.to}
                      style={{ left: xOf(i), transform: n === 1 ? "translateX(-50%)" : i === 0 ? "none" : i === n - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
                    >
                      {xLabel(r)}
                    </span>
                  ) : null,
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LegendKey({ color, name, total, off, onClick }: { color: string; name: string; total: string; off?: boolean; onClick?: () => void }) {
  const inner = (
    <>
      <i className={s.lgSwatch} style={{ background: off ? "transparent" : color, borderColor: color }} />
      <span className={s.lgName}>{name}</span>
      <b className={s.lgTotal}>{total}</b>
    </>
  );
  return onClick ? (
    <button type="button" className={`${s.lgKey} ${s.lgBtn} ${off ? s.lgOff : ""}`} aria-pressed={!off} onClick={onClick}>
      {inner}
    </button>
  ) : (
    <span className={s.lgKey}>{inner}</span>
  );
}

/** The tooltip's lead: the picked metric, big; profit says profit or loss. */
function TipBig({ m, r, cur }: { m: Metric; r: Row; cur: Currency }) {
  const v = m.of(r);
  if (m.id === "profit") {
    if (v === null) return <div className={s.tipBig}>—</div>;
    return (
      <div className={s.tipBig}>
        {moneyExact(v, cur)}
        <span className={`${s.badge} ${v >= 0 ? s.badgeProfit : s.badgeLoss}`}>{v >= 0 ? "profit" : "loss"}</span>
      </div>
    );
  }
  return <div className={s.tipBig}>{fmt(v, m.kind, cur, true)}</div>;
}

/** Every number of a day (or week): the tooltip's rows. */
function Details({ r, cur }: { r: Row; cur: Currency }) {
  const profit = profitOf(r);
  const roas = roasOf(r);
  const cvr = cvrOf(r);
  return (
    <div className={s.tipRows}>
      <TipRow color={NET} value={moneyExact(r.net, cur)} label="net revenue" />
      {r.spend !== null && <TipRow color={SPEND} value={moneyExact(r.spend, cur)} label="ad spend" />}
      {profit !== null && <TipRow mark={profit >= 0 ? "pos" : "neg"} value={moneyExact(profit, cur)} label={profit >= 0 ? "profit" : "loss"} />}
      {roas !== null && <TipRow value={`${roas.toFixed(2)}×`} label="ROAS" />}
      <span className={s.tipRule} />
      <TipRow value={moneyExact(r.revenue, cur)} label={r.revenue > r.net ? `revenue · ${moneyExact(r.revenue - r.net, cur)} fees` : "revenue"} />
      <TipRow value={count(r.orders)} label={`order${r.orders === 1 ? "" : "s"}${r.upsells ? ` + ${r.upsells} upsell${r.upsells === 1 ? "" : "s"}` : ""}`} />
      <TipRow value={count(r.visitors)} label="visitors" />
      {r.orders > 0 && <TipRow value={moneyExact(r.revenue / r.orders, cur)} label="per order (AOV)" />}
      {cvr !== null && <TipRow value={pct(cvr)} label="conversion" />}
      {r.spend !== null && r.adOrders > 0 && <TipRow value={moneyExact(r.spend / r.adOrders, cur)} label="ad cost per order" />}
      {r.spend !== null && <TipRow value={count(r.clicks)} label="link clicks" />}
      {r.spend === null && r.from < SPEND_SINCE && <div className={s.tipNote}>Ads sold on ClickFunnels before {SINCE_LABEL}: no ad spend here.</div>}
    </div>
  );
}

function TipRow({ color, mark, value, label }: { color?: string; mark?: "pos" | "neg"; value: string; label: string }) {
  return (
    <div className={s.tipRow}>
      {mark ? <span className={`${s.tipMark} ${s[mark]}`}>{mark === "pos" ? "▲" : "▼"}</span> : <i className={s.tipKey} style={{ background: color ?? "transparent" }} />}
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

// ─── the table view ──────────────────────────────────────────────────────────

const COLS: { id: MetricId; label: string }[] = [
  { id: "sales", label: "Orders" },
  { id: "revenue", label: "Revenue" },
  { id: "aov", label: "AOV" },
  { id: "net", label: "Net revenue" },
  { id: "spend", label: "Ad spend" },
  { id: "profit", label: "Profit" },
  { id: "roas", label: "ROAS" },
  { id: "visitors", label: "Visitors" },
  { id: "cvr", label: "Conversion" },
];

type TableProps = { rows: Row[]; interval: Interval; picked: MetricId; cur: Currency; rate: number; early: boolean };

/** The range as rows (latest first), in the chart's interval: every number the chart and tooltip show. */
function Table({ rows: days, interval, picked, cur, rate, early }: TableProps) {
  const rows = [...bucket(days, interval)].reverse();
  const total = merge(days);
  const cell = (r: Row, id: MetricId) => {
    const m = METRICS.find((x) => x.id === id)!;
    const v = m.of(r);
    const cls = [id === picked ? s.colOn : "", id === "profit" && v !== null ? (v < 0 ? s.neg : s.pos) : ""].filter(Boolean).join(" ");
    return (
      <td key={id} className={cls || undefined}>
        {v === null || (v === 0 && m.kind === "money" && id !== "profit") ? "—" : fmt(v, m.kind, cur, true)}
      </td>
    );
  };
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>{interval === "week" ? "Week" : interval === "total" ? "Up to" : "Day"}</th>
            {COLS.map((c) => (
              <th key={c.id} className={c.id === picked ? s.colOn : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.from + r.to} className={r.spend === null && r.to < SPEND_SINCE ? s.rowOut : undefined}>
              <td>{interval === "total" ? longDay(r.to) : span(r.from, r.to)}</td>
              {COLS.map((c) => cell(r, c.id))}
            </tr>
          ))}
        </tbody>
        {interval !== "total" && (
          <tfoot>
            <tr>
              <td>Total</td>
              {COLS.map((c) => cell(total, c.id))}
            </tr>
          </tfoot>
        )}
      </table>
      <p className={s.foot}>
        {early && `Ad spend, profit and ROAS count from ${SINCE_LABEL}, when the ads moved here from ClickFunnels. `}
        {cur === "USD" ? `Dollars at the ECB rate: €1 = $${(1 / rate).toFixed(2)}.` : `Dollar sales in euros at the ECB rate: $1 = €${rate.toFixed(2)}.`}
      </p>
    </div>
  );
}
