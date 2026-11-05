"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import type { Day } from "@/lib/analytics";
import { SPEND_SINCE, type MetaDaily } from "@/lib/metaSpend";
import s from "./home.module.css";

// The home's charts (docs/design.md: real numbers only, nearly square corners,
// borders the colour of the card). The SVG is drawn in pixels from the
// measured width, so lines stay 2 px and markers stay round at every size.
// Hover, or focus and the arrow keys, pick a day with a crosshair; one
// tooltip lists every number of that day. Nothing is only in the tooltip:
// the axis, the figures above the plot and the table view carry the values.

export type Currency = "EUR" | "USD";
const SYMBOL: Record<Currency, string> = { EUR: "€", USD: "$" };

export const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
const longDay = (day: string) => dayLabel(day, { weekday: "short", day: "numeric", month: "short" });

/** €1,284 / €12.9K: the tiles' and axes' compact money. */
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
  return `${neg}${SYMBOL[cur]}${v.toLocaleString("en-US", { maximumFractionDigits: v < 100 ? 2 : 0 })}`;
}
const count = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Euros and dollars together in one currency, at the ECB rate (Analytics.usdToEur). */
export const inCurrency = (eur: number, usd: number, cur: Currency, rate: number) => (cur === "EUR" ? eur + usd * rate : eur / rate + usd);

// ─── the metrics the tiles pick ──────────────────────────────────────────────

export type MetricKind = "money" | "count" | "pct";
export type Metric = { id: string; label: string; sub: string; color: string; kind: MetricKind; of: (d: Day) => number };

export const METRICS: Metric[] = [
  { id: "revenue", label: "Revenue", sub: "in €, upsells included", color: "oklch(0.74 0.19 295)", kind: "money", of: (d) => d.revenue },
  { id: "net", label: "Net revenue", sub: "in €, less Stripe's and PayPal's fees", color: "oklch(0.66 0.16 295)", kind: "money", of: (d) => d.net },
  { id: "sales", label: "Sales", sub: "orders, their upsells not counted", color: "oklch(0.82 0.18 295)", kind: "count", of: (d) => d.orders },
  { id: "visitors", label: "Visitors", sub: "unique, on the landing pages", color: "oklch(0.78 0.13 230)", kind: "count", of: (d) => d.visitors },
  { id: "cvr", label: "Conversion", sub: "orders ÷ visitors", color: "oklch(0.86 0.16 165)", kind: "pct", of: (d) => (d.visitors ? d.orders / d.visitors : 0) },
];

const exact = (v: number, kind: MetricKind) => (kind === "money" ? moneyExact(v) : kind === "pct" ? pct(v) : count(v));

// ─── geometry ────────────────────────────────────────────────────────────────

/** An element's width, kept up to date. */
function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/**
 * A clean axis top above v. Money: 1, 2, 5 × 10ⁿ. Counts under ten: 2, 4, 6,
 * 8, 10 (so half of the axis is a whole number too). Percentages: the money
 * steps of the percent.
 */
export function niceTop(v: number, kind: MetricKind): number {
  if (kind === "pct") return niceTop(v * 100, "money") / 100;
  if (!(v > 0)) return kind === "count" ? 4 : 100;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const steps = kind === "count" && p < 10 ? [2, 4, 6, 8, 10] : [1, 2, 5, 10];
  return (steps.find((st) => n <= st) ?? 10) * p;
}

const r = (n: number) => Math.round(n * 10) / 10;
type Pt = { x: number; y: number };

/** A smooth path through the points that never overshoots them (Fritsch–Carlson). */
function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  if (!n) return "";
  if (n === 1) return `M${r(pts[0].x)},${r(pts[0].y)}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = dx[i] ? (pts[i + 1].y - pts[i].y) / dx[i] : 0;
  }
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
  let d = `M${r(pts[0].x)},${r(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${r(pts[i].x + h)},${r(pts[i].y + t[i] * h)} ${r(pts[i + 1].x - h)},${r(pts[i + 1].y - t[i + 1] * h)} ${r(pts[i + 1].x)},${r(pts[i + 1].y)}`;
  }
  return d;
}

/** A column with a 2 px rounded cap and a square foot on the baseline. */
function column(x: number, top: number, w: number, bottom: number): string {
  const rad = Math.min(2, w / 2, Math.max(0, bottom - top));
  return `M${r(x)},${r(bottom)} V${r(top + rad)} Q${r(x)},${r(top)} ${r(x + rad)},${r(top)} H${r(x + w - rad)} Q${r(x + w)},${r(top)} ${r(x + w)},${r(top + rad)} V${r(bottom)} Z`;
}

/** Which of n slots is picked: by the pointer, or the arrow keys once the plot has focus. */
function useHover(n: number) {
  const [raw, setHover] = useState<number | null>(null);
  const hover = raw !== null && raw < n ? raw : null;
  const onMove = (e: PointerEvent<HTMLElement>, slotAt: (x: number) => number) => {
    const box = e.currentTarget.getBoundingClientRect();
    setHover(Math.max(0, Math.min(n - 1, slotAt(e.clientX - box.left))));
  };
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -1 : 1;
      setHover((h) => Math.max(0, Math.min(n - 1, (h ?? n - 1) + step)));
    } else if (e.key === "Escape") setHover(null);
  };
  return { hover, setHover, onMove, onKey };
}

// ─── the shared pieces ───────────────────────────────────────────────────────

function YAxis({ top, fmt }: { top: number; fmt: (v: number) => string }) {
  return (
    <div className={s.yAxis} aria-hidden>
      {[1, 0.5, 0].map((t) => (
        <span key={t} style={{ top: `${(1 - t) * 100}%` }}>
          {fmt(top * t)}
        </span>
      ))}
    </div>
  );
}

function XAxis({ days, xOf }: { days: string[]; xOf: (i: number) => number }) {
  const n = days.length;
  // About six dates under the axis, always the last day.
  const every = n <= 7 ? 1 : Math.ceil(n / 6);
  return (
    <div className={s.xAxis} aria-hidden>
      {days.map((d, i) =>
        (n - 1 - i) % every === 0 ? (
          <span key={d} style={{ left: xOf(i), transform: i === 0 ? "none" : i === n - 1 ? "translateX(-100%)" : "translateX(-50%)" }}>
            {dayLabel(d, n <= 7 ? { weekday: "short" } : { day: "numeric", month: "short" })}
          </span>
        ) : null,
      )}
    </div>
  );
}

/** Gridlines at the top, the middle and the baseline. */
function Grid({ width, yOf, top }: { width: number; yOf: (v: number) => number; top: number }) {
  return (
    <>
      {[1, 0.5].map((t) => (
        <line key={t} className={s.grid} x1={0} x2={width} y1={yOf(top * t)} y2={yOf(top * t)} />
      ))}
      <line className={s.base} x1={0} x2={width} y1={yOf(0)} y2={yOf(0)} />
    </>
  );
}

/** The tooltip beside the picked day, on whichever side has room. */
function Tip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  return (
    <div className={s.tip} style={x < width / 2 ? { left: x + 14 } : { right: width - x + 14 }}>
      {children}
    </div>
  );
}

// ─── one metric per day, against the period before ───────────────────────────

type TrendProps = {
  days: Day[];
  /** The same number of days before the range; null for "all". */
  previous: Day[] | null;
  metric: Metric;
  /** "7 days" / "28 days", for "the 28 days before". */
  periodName: string;
};

export function TrendChart({ days, previous, metric, periodName }: TrendProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const H = 200;
  const n = days.length;
  const [showPrev, setShowPrev] = useState(true);
  const old = previous && showPrev && previous.length === n ? previous.map(metric.of) : null;
  const cur = days.map(metric.of);
  const top = niceTop(Math.max(...cur, ...(old ?? []), 0), metric.kind);
  const pad = 6;
  const xOf = (i: number) => (n > 1 ? pad + (i * (width - 2 * pad)) / (n - 1) : width / 2);
  const yOf = (v: number) => 0.5 + (1 - v / top) * (H - 1);
  const slotAt = (x: number) => (n > 1 ? Math.round(((x - pad) / (width - 2 * pad)) * (n - 1)) : 0);
  const { hover, setHover, onMove, onKey } = useHover(n);
  const fmt = (v: number) => (metric.kind === "money" ? money(v) : metric.kind === "pct" ? `${(v * 100).toFixed(top < 0.02 ? 1 : 0)}%` : count(v));

  const pts = cur.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
  const line = smoothPath(pts);
  const area = n > 1 ? `${line} L${r(pts[n - 1].x)},${r(yOf(0))} L${r(pts[0].x)},${r(yOf(0))} Z` : "";
  const oldLine = old ? smoothPath(old.map((v, i) => ({ x: xOf(i), y: yOf(v) }))) : "";
  const hd = hover === null ? null : days[hover];
  const none = cur.every((v) => !v) && (!old || old.every((v) => !v));
  const total = cur.reduce((a, b) => a + b, 0);

  return (
    <>
      <div className={s.legend}>
        <span className={s.key}>
          <i className={s.keyLine} style={{ background: metric.color }} /> {metric.label}
        </span>
        {previous && (
          <button type="button" className={`${s.key} ${s.keyBtn} ${showPrev ? "" : s.keyOff}`} aria-pressed={showPrev} onClick={() => setShowPrev((v) => !v)}>
            <i className={s.keyLine} style={{ background: "var(--fg-3)" }} /> the {periodName} before
          </button>
        )}
        <span className={s.hint}>hover or use ← →</span>
      </div>
      <div className={s.chart}>
        <YAxis top={top} fmt={fmt} />
        <div
          ref={ref}
          className={s.plot}
          tabIndex={0}
          role="group"
          aria-label={`${metric.label} per day over the last ${n} days: ${exact(total, metric.kind)} in all`}
          onPointerMove={(e) => onMove(e, slotAt)}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {width > 0 && (
            <svg className={s.svg} width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
              <defs>
                <linearGradient id={`fill-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={metric.color} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <Grid width={width} yOf={yOf} top={top} />
              {area && <path d={area} fill={`url(#fill-${metric.id})`} />}
              {oldLine && <path d={oldLine} className={s.prevLine} />}
              <path d={line} fill="none" stroke={metric.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {n === 1 && <circle cx={pts[0].x} cy={pts[0].y} r={4} fill={metric.color} />}
              {hover !== null && (
                <g>
                  <line className={s.cross} x1={xOf(hover)} x2={xOf(hover)} y1={0} y2={H} />
                  {old && <circle cx={xOf(hover)} cy={yOf(old[hover])} r={3.5} className={s.prevDot} />}
                  <circle cx={xOf(hover)} cy={yOf(cur[hover])} r={4.5} fill={metric.color} className={s.dot} />
                </g>
              )}
            </svg>
          )}
          {none && <div className={s.none}>Nothing to show in this range yet.</div>}
          {hd && hover !== null && (
            <Tip x={xOf(hover)} width={width}>
              <div className={s.tipDay}>{longDay(hd.day)}</div>
              <div className={s.tipValue}>{exact(cur[hover], metric.kind)}</div>
              {old && (
                <div className={s.tipVs}>
                  {exact(old[hover], metric.kind)} the {periodName} before
                </div>
              )}
              <div className={s.tipRows}>
                {METRICS.map((m) => (
                  <div key={m.id} className={`${s.tipRow} ${m.id === metric.id ? s.tipRowOn : ""}`}>
                    <i className={s.tipKey} style={{ background: m.color }} />
                    <b>{exact(m.of(hd), m.kind)}</b>
                    <span>
                      {m.label}
                      {m.id === "sales" && hd.upsells > 0 && ` + ${hd.upsells} upsell${hd.upsells === 1 ? "" : "s"}`}
                    </span>
                  </div>
                ))}
              </div>
            </Tip>
          )}
        </div>
        <XAxis days={days.map((d) => d.day)} xOf={xOf} />
      </div>
    </>
  );
}

// ─── net revenue vs ad spend ─────────────────────────────────────────────────

const SPEND_COLOR = "oklch(0.74 0.17 55)";
const CURRENCIES: Currency[] = ["EUR", "USD"];
// Meta's answer per "since..until", so switching ranges back and forth doesn't ask again.
const spendCache = new Map<string, MetaDaily>();
const FAILED: MetaDaily = { connected: false, reason: "Couldn't load the ad spend." };

type NetProps = {
  days: Day[];
  /** Analytics.usdToEur, the ECB's rate. */
  rate: number;
  /** "7 days" / "28 days" / "period". */
  periodName: string;
};

export function NetVsSpend({ days, rate, periodName }: NetProps) {
  const [cur, setCur] = useState<Currency>("EUR");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [show, setShow] = useState({ net: true, spend: true });
  const n = days.length;
  const since = days[0]?.day;
  const until = days[n - 1]?.day;
  const key = `${since}..${until}`;
  const [got, setGot] = useState<{ key: string; data: MetaDaily } | null>(null);
  const spend: MetaDaily | null = got?.key === key ? got.data : (spendCache.get(key) ?? null);
  useEffect(() => {
    if (!since || !until || spendCache.has(key)) return;
    let gone = false;
    fetch(`/api/analytics/spend?since=${since}&until=${until}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<MetaDaily>) : null))
      .then((m) => {
        if (gone) return;
        const data = m ?? FAILED;
        spendCache.set(key, data);
        setGot({ key, data });
      })
      .catch(() => !gone && setGot({ key, data: FAILED }));
    return () => {
      gone = true;
    };
  }, [key, since, until]);

  const connected = spend?.connected === true;
  const accCur = spend?.connected ? spend.currency : "EUR";
  // Meta bills in the account's currency; shown in the picked one at the ECB rate.
  const spendIn = (v: number) => (accCur === cur ? v : accCur === "USD" ? v * rate : v / rate);
  const spendByDay = new Map<string, number>(spend?.connected ? spend.days.filter((d) => d.day >= SPEND_SINCE).map((d) => [d.day, d.spend]) : []);
  // Before SPEND_SINCE the ads sent buyers to ClickFunnels, whose sales aren't
  // here: those days keep their net revenue on the chart, dimmed, and count
  // for nothing in the figures.
  const counted = days.map((d) => d.day >= SPEND_SINCE);
  const first = counted.indexOf(true);
  const sinceLabel = dayLabel(SPEND_SINCE, { day: "numeric", month: "short" });
  const netV = days.map((d) => inCurrency(d.netEur, d.netUsd, cur, rate));
  const spendV = days.map((d, i) => (connected && counted[i] ? spendIn(spendByDay.get(d.day) ?? 0) : 0));
  const netTotal = netV.reduce((a, v, i) => a + (counted[i] ? v : 0), 0);
  const spendTotal = spendV.reduce((a, b) => a + b, 0);
  const orders = days.reduce((a, d, i) => a + (counted[i] ? d.orders : 0), 0);
  const clicks = spend?.connected ? spend.days.reduce((a, d) => a + (d.day >= SPEND_SINCE ? d.clicks : 0), 0) : 0;
  const profit = netTotal - spendTotal;
  const roas = spendTotal > 0 ? netTotal / spendTotal : null;

  const [ref, width] = useWidth<HTMLDivElement>();
  const H = 260;
  const showSpend = show.spend && connected;
  const top = niceTop(Math.max(...(show.net ? netV : [0]), ...(showSpend ? spendV : [0]), 0), "money");
  const slot = n ? width / n : width;
  const barW = Math.min(24, Math.max(2, slot - 4));
  const xOf = (i: number) => (i + 0.5) * slot;
  const yOf = (v: number) => 0.5 + (1 - v / top) * (H - 1);
  const slotAt = (x: number) => Math.floor(x / slot);
  const { hover, setHover, onMove, onKey } = useHover(n);
  const peak = netV.reduce((best, v, i) => (v > (netV[best] ?? 0) ? i : best), -1);
  const spendPts = showSpend && first >= 0 ? spendV.slice(first).map((v, i) => ({ x: xOf(first + i), y: yOf(v) })) : [];
  const spendLine = smoothPath(spendPts);
  const hd = hover === null ? null : days[hover];
  const none = netV.every((v) => !v) && (!connected || spendV.every((v) => !v));
  const fx = cur === "USD" ? `$1 = €${rate.toFixed(2)} (ECB)` : `€1 = $${(1 / rate).toFixed(2)} (ECB)`;

  return (
    <div className={`${s.card} ${s.big}`}>
      <div className={s.cardHead}>
        <div>
          <div className={s.title}>Net revenue vs ad spend</div>
          <div className={s.sub}>
            since {sinceLabel}, when the ads moved here from ClickFunnels · all funnels, less the processors&apos; fees · every Meta ad in the account · {fx}
          </div>
        </div>
        <div className={s.controls}>
          <div className="tabs" role="group" aria-label="Currency">
            {CURRENCIES.map((c) => (
              <button key={c} type="button" className={`tab ${cur === c ? "active" : ""}`} aria-pressed={cur === c} onClick={() => setCur(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="tabs" role="group" aria-label="View">
            {(["chart", "table"] as const).map((v) => (
              <button key={v} type="button" className={`tab ${view === v ? "active" : ""}`} aria-pressed={view === v} onClick={() => setView(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={s.figs}>
        <Fig label="Net revenue" color="var(--accent)" value={money(netTotal, cur)} sub={`${count(orders)} order${orders === 1 ? "" : "s"} since ${sinceLabel}`} />
        <Fig
          label="Ad spend"
          color={SPEND_COLOR}
          value={connected ? money(spendTotal, cur) : "—"}
          sub={spend === null ? "loading from Meta…" : spend.connected ? `${count(clicks)} link clicks` : spend.reason}
        />
        <Fig label="Profit" value={connected ? money(profit, cur) : "—"} sub="net revenue − ad spend" tone={connected ? (profit >= 0 ? "up" : "down") : undefined} />
        <Fig label="ROAS" value={roas === null ? "—" : `${roas.toFixed(2)}×`} sub="net revenue ÷ ad spend" />
      </div>

      {view === "table" ? (
        <SpendTable
          days={days}
          netV={netV}
          spendV={connected ? spendV : null}
          counted={counted}
          sinceLabel={sinceLabel}
          cur={cur}
          totals={{ net: netTotal, spend: connected ? spendTotal : null, orders }}
        />
      ) : (
        <>
          <div className={s.legend}>
            <button type="button" className={`${s.key} ${s.keyBtn} ${show.net ? "" : s.keyOff}`} aria-pressed={show.net} onClick={() => setShow((v) => ({ ...v, net: !v.net }))}>
              <i className={s.keyRect} style={{ background: "var(--accent)" }} /> Net revenue
            </button>
            <button
              type="button"
              className={`${s.key} ${s.keyBtn} ${showSpend ? "" : s.keyOff}`}
              aria-pressed={showSpend}
              disabled={!connected}
              onClick={() => setShow((v) => ({ ...v, spend: !v.spend }))}
            >
              <i className={s.keyLine} style={{ background: SPEND_COLOR }} /> Ad spend
              {spend === null ? " · loading…" : !spend.connected ? " · not connected" : ""}
            </button>
            <span className={s.hint}>click a key to hide it · hover or use ← →</span>
          </div>
          <div className={s.chart}>
            <YAxis top={top} fmt={(v) => money(v, cur)} />
            <div
              ref={ref}
              className={s.plot}
              tabIndex={0}
              role="group"
              aria-label={`Net revenue ${money(netTotal, cur)}${connected ? ` against ${money(spendTotal, cur)} of ad spend` : ""} since ${sinceLabel}`}
              onPointerMove={(e) => onMove(e, slotAt)}
              onPointerLeave={() => setHover(null)}
              onKeyDown={onKey}
              onBlur={() => setHover(null)}
            >
              {width > 0 && (
                <svg className={s.svg} width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
                  <Grid width={width} yOf={yOf} top={top} />
                  {show.net &&
                    netV.map((v, i) =>
                      v > 0 ? (
                        <path key={days[i].day} d={column(xOf(i) - barW / 2, Math.min(yOf(v), yOf(0) - 2), barW, yOf(0))} className={`${s.bar} ${hover === i ? s.barOn : ""} ${counted[i] ? "" : s.barOut}`} />
                      ) : null,
                    )}
                  {spendLine && <path d={spendLine} className={s.spendLine} />}
                  {spendPts.length > 0 &&
                    spendPts.length <= 31 &&
                    spendPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={SPEND_COLOR} className={s.dot} />)}
                  {show.net && peak >= 0 && hover !== peak && (
                    <text x={xOf(peak)} y={yOf(netV[peak]) - 7} className={s.peakLabel} textAnchor="middle">
                      {money(netV[peak], cur)}
                    </text>
                  )}
                  {hover !== null && (
                    <g>
                      <line className={s.cross} x1={xOf(hover)} x2={xOf(hover)} y1={0} y2={H} />
                      {showSpend && <circle cx={xOf(hover)} cy={yOf(spendV[hover])} r={4.5} fill={SPEND_COLOR} className={s.dot} />}
                    </g>
                  )}
                </svg>
              )}
              {none && <div className={s.none}>No sales or ad spend in this range yet.</div>}
              {hd && hover !== null && (
                <Tip x={xOf(hover)} width={width}>
                  <div className={s.tipDay}>{longDay(hd.day)}</div>
                  <div className={s.tipRows}>
                    <div className={`${s.tipRow} ${s.tipRowOn}`}>
                      <i className={s.tipKey} style={{ background: "var(--accent)" }} />
                      <b>{moneyExact(netV[hover], cur)}</b>
                      <span>
                        net revenue · {hd.orders} order{hd.orders === 1 ? "" : "s"}
                        {hd.upsells > 0 && ` + ${hd.upsells} upsell${hd.upsells === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    {!counted[hover] ? (
                      <div className={s.tipNote}>before {sinceLabel} the ads sold on ClickFunnels: not counted</div>
                    ) : connected ? (
                      <>
                        <div className={`${s.tipRow} ${s.tipRowOn}`}>
                          <i className={s.tipKey} style={{ background: SPEND_COLOR }} />
                          <b>{moneyExact(spendV[hover], cur)}</b>
                          <span>ad spend</span>
                        </div>
                        <div className={s.tipRow}>
                          <i />
                          <b className={netV[hover] - spendV[hover] < 0 ? s.neg : undefined}>{moneyExact(netV[hover] - spendV[hover], cur)}</b>
                          <span>profit</span>
                        </div>
                        <div className={s.tipRow}>
                          <i />
                          <b>{spendV[hover] > 0 ? `${(netV[hover] / spendV[hover]).toFixed(2)}×` : "—"}</b>
                          <span>ROAS</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </Tip>
              )}
            </div>
            <XAxis days={days.map((d) => d.day)} xOf={xOf} />
          </div>
        </>
      )}
    </div>
  );
}

function Fig({ label, value, sub, color, tone }: { label: string; value: string; sub: string; color?: string; tone?: "up" | "down" }) {
  return (
    <div className={s.fig}>
      <div className={s.figLabel}>
        {color && <span className={s.figKey} style={{ background: color }} />}
        {label}
      </div>
      <div className={s.figValue}>
        {tone && <span className={`${s.figMark} ${tone === "up" ? s.figUp : s.figDown}`}>{tone === "up" ? "▲" : "▼"}</span>}
        {value}
      </div>
      <div className={s.figSub}>{sub}</div>
    </div>
  );
}

type TableProps = {
  days: Day[];
  netV: number[];
  /** null while Meta isn't connected. */
  spendV: number[] | null;
  /** Per day: on or after SPEND_SINCE. */
  counted: boolean[];
  sinceLabel: string;
  cur: Currency;
  totals: { net: number; spend: number | null; orders: number };
};

/** The same days as rows, latest first: the chart's table view. */
function SpendTable({ days, netV, spendV, counted, sinceLabel, cur, totals }: TableProps) {
  const rows = days.map((d, i) => ({ d, net: netV[i], spend: spendV && counted[i] ? spendV[i] : null, out: !counted[i] })).reverse();
  const roas = (net: number, spend: number | null) => (spend && spend > 0 ? `${(net / spend).toFixed(2)}×` : "—");
  const profit = (net: number, spend: number | null) => (spend === null ? "—" : moneyExact(net - spend, cur));
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Day</th>
            <th>Orders</th>
            <th>Net revenue</th>
            <th>Ad spend</th>
            <th>Profit</th>
            <th>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ d, net, spend, out }) => (
            <tr key={d.day} className={out ? s.rowOut : undefined} title={out ? `Before ${sinceLabel} the ads sold on ClickFunnels: not counted` : undefined}>
              <td>{longDay(d.day)}</td>
              <td>{d.orders || "—"}</td>
              <td>{net ? moneyExact(net, cur) : "—"}</td>
              <td>{spend === null ? "—" : moneyExact(spend, cur)}</td>
              <td className={spend !== null && net - spend < 0 ? s.neg : undefined}>{out ? "—" : profit(net, spend)}</td>
              <td>{out ? "—" : roas(net, spend)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Since {sinceLabel}</td>
            <td>{count(totals.orders)}</td>
            <td>{moneyExact(totals.net, cur)}</td>
            <td>{totals.spend === null ? "—" : moneyExact(totals.spend, cur)}</td>
            <td className={totals.spend !== null && totals.net - totals.spend < 0 ? s.neg : undefined}>{profit(totals.net, totals.spend)}</td>
            <td>{roas(totals.net, totals.spend)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
