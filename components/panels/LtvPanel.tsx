"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { I } from "@/components/icons";
import type { Ltv, LtvRank } from "@/lib/ltv";
import s from "../home.module.css";
import l from "./ltv.module.css";

// Dashboard → LTV: what a buyer is worth over time (lib/ltv.ts), both eras
// joined by email. docs/design.md: one big chart picked by the tiles above it,
// card borders the colour of the card, nearly square corners, real numbers
// only, readable at a glance. Under it the cohorts as a heat table, then the
// ranks: where the best buyers start, what brings them back, who's worth more,
// and the 25 buyers worth the most.

const C = {
  first: "var(--accent)",
  repeat: "var(--mint)",
  cac: "var(--amber)",
  base: "var(--fg-2)",
};

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const eur2 = (n: number) => `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;
const count = (n: number) => n.toLocaleString("en-US");
const monthName = (m: string, year = true) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: year ? "2-digit" : undefined, timeZone: "UTC" });
const dayName = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
const FLAG = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "");
const COUNTRY = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();
const countryName = (cc: string) => (cc && COUNTRY ? (COUNTRY.of(cc) ?? cc) : cc || "Unknown");

/** Round tick steps for a y axis from 0 to max. */
function ticks(max: number, n = 4, steps = [1, 2, 2.5, 5, 10]): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = steps.map((k) => k * mag).find((k) => k >= raw) ?? raw;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

// ─── the big chart: a line over days, or bars over months / buckets ────────

type Series = { name: string; color: string };
type Ref = { y: number; label: string; color: string };
type Plot =
  | { kind: "line"; xs: number[]; ys: number[]; xLabel: (x: number) => string; color: string; area?: boolean; refs?: Ref[] }
  | { kind: "bars"; labels: string[]; values: number[][]; series: Series[] };

function Chart({ plot, fmt, tip, none }: { plot: Plot; fmt: (n: number) => string; tip: (i: number) => ReactNode; none?: string }) {
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = plot.kind === "line" ? plot.xs.length : plot.labels.length;
  const top = plot.kind === "line" ? Math.max(...plot.ys, ...(plot.refs ?? []).map((r) => r.y), 0) : Math.max(0, ...plot.values.map((v) => v.reduce((a, b) => a + b, 0)));
  // A line starts its axis near its lowest point, so a slow climb reads; bars start at 0.
  let yt: number[];
  if (plot.kind === "line" && top > 0) {
    const low = Math.min(...plot.ys, ...(plot.refs ?? []).map((r) => r.y));
    const lo = Math.max(0, low - (top - low) * 0.6);
    const hi = top + (top - low) * 0.15 || top * 1.1;
    const t = ticks(hi - lo, 4, [1, 2, 5, 10]);
    const step = t[1] - t[0] || 1;
    const from = Math.floor(lo / step) * step;
    yt = [];
    for (let v = from; v < hi + step - 1e-9; v += step) yt.push(Math.round(v * 1e6) / 1e6);
  } else yt = ticks(top * 1.08);
  const yMin = yt[0];
  const yMax = yt[yt.length - 1] || 1;
  const pad = 6;
  const y = (v: number) => h - ((v - yMin) / (yMax - yMin || 1)) * (h - pad);

  // x positions
  const xMax = plot.kind === "line" ? Math.max(...plot.xs, 1) : 0;
  const band = plot.kind === "bars" ? w / Math.max(n, 1) : 0;
  const x = (i: number) => (plot.kind === "line" ? (plot.xs[i] / xMax) * (w - 8) + 4 : band * i + band / 2);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") setHover((c) => Math.min(n - 1, (c ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((c) => Math.max(0, (c ?? n) - 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  };

  const gid = `ltv-area-${plot.kind}`;
  const xLabels: { at: number; text: string }[] = [];
  if (w > 0) {
    let last = -Infinity;
    for (let i = 0; i < n; i++) {
      const at = x(i);
      if (at - last < (plot.kind === "line" ? 52 : 46)) continue;
      xLabels.push({ at, text: plot.kind === "line" ? plot.xLabel(plot.xs[i]) : plot.labels[i] });
      last = at;
    }
  }

  return (
    <div className={s.chart}>
      <div className={s.yAxis}>
        {h > 0 && yt.map((t) => <span key={t} style={{ top: y(t) }}>{fmt(t)}</span>)}
      </div>
      <div
        ref={ref}
        className={s.plot}
        tabIndex={0}
        role="img"
        aria-label="Chart. Use left and right arrows to read each point."
        onPointerMove={pick}
        onPointerLeave={() => setHover(null)}
        onKeyDown={key}
        onBlur={() => setHover(null)}
      >
        {w > 0 && h > 0 && (
          <svg className={s.svg} width={w} height={h}>
            {yt.map((t, i) => <line key={t} className={i === 0 ? s.base : s.grid} x1={0} x2={w} y1={y(t)} y2={y(t)} />)}
            {plot.kind === "line" ? (
              <>
                <defs>
                  <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={plot.color} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={plot.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {(plot.refs ?? []).map((r) => (
                  <g key={r.label}>
                    <line x1={0} x2={w} y1={y(r.y)} y2={y(r.y)} stroke={r.color} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.85} />
                  </g>
                ))}
                {plot.area && (
                  <path
                    d={`M${x(0)},${h} ${plot.ys.map((v, i) => `L${x(i)},${y(v)}`).join(" ")} L${x(n - 1)},${h} Z`}
                    fill={`url(#${gid})`}
                  />
                )}
                <path className={s.line} stroke={plot.color} d={plot.ys.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")} />
                {plot.ys.map((v, i) => (
                  <circle key={i} className={s.dot} cx={x(i)} cy={y(v)} r={hover === i ? 6 : 3.5} fill={plot.color} />
                ))}
                {hover !== null && <line className={s.cross} x1={x(hover)} x2={x(hover)} y1={0} y2={h} />}
              </>
            ) : (
              plot.values.map((segs, i) => {
                const bw = Math.max(4, Math.min(56, band * 0.62));
                let base = 0;
                return (
                  <g key={i} opacity={hover === null || hover === i ? 1 : 0.45}>
                    {segs.map((v, k) => {
                      if (v <= 0) return null;
                      const y0 = y(base);
                      const y1 = y(base + v);
                      base += v;
                      const topSeg = segs.slice(k + 1).every((q) => q <= 0);
                      const hgt = Math.max(1, y0 - y1 - (k > 0 ? 2 : 0));
                      return (
                        <rect
                          key={k}
                          x={x(i) - bw / 2}
                          y={y1}
                          width={bw}
                          height={hgt}
                          rx={topSeg ? 2 : 0}
                          fill={plot.series[k].color}
                        />
                      );
                    })}
                  </g>
                );
              })
            )}
          </svg>
        )}
        {plot.kind === "line" &&
          w > 0 &&
          (plot.refs ?? []).map((r) => (
            <span key={r.label} className={l.refLabel} style={{ top: y(r.y) - 20, color: r.color }}>
              {r.label}
            </span>
          ))}
        {none && <div className={s.none}>{none}</div>}
        {hover !== null && w > 0 && (
          <div className={s.tip} style={x(hover) > w - 250 ? { right: w - x(hover) + 14 } : { left: x(hover) + 14 }}>
            {tip(hover)}
          </div>
        )}
      </div>
      <div className={s.xAxis}>
        {xLabels.map((t) => (
          <span key={t.at} style={{ left: t.at, transform: "translateX(-50%)" }}>
            {t.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function TipRow({ color, name, value }: { color?: string; name: string; value: string }) {
  return (
    <div className={s.tipRow}>
      <span className={s.tipKey} style={{ background: color ?? "transparent" }} />
      <span>{name}</span>
      <b style={{ textAlign: "right" }}>{value}</b>
    </div>
  );
}

// ─── ranks ─────────────────────────────────────────────────────────

/** A bar split in what the first purchase brought and what came after. */
function SplitBars({ rows, max, meta }: { rows: LtvRank[]; max: number; meta: (r: LtvRank) => string }) {
  return (
    <div className={s.hbars}>
      {rows.map((r, i) => (
        <div key={r.name}>
          <div className={s.hname}>
            <span className={l.rankName}>
              <span className={l.rankNo}>{i + 1}</span>
              {r.name}
            </span>
            <span className={s.hmeta}>{meta(r)}</span>
          </div>
          <div className={s.htrack}>
            <span className={l.split} title={`First purchase ${eur2(r.firstAov)} · after ${eur2(r.ltv - r.firstAov)}`}>
              <i style={{ width: `${(r.firstAov / max) * 100}%`, background: C.first }} />
              {r.ltv - r.firstAov > 0.005 && <i style={{ width: `${((r.ltv - r.firstAov) / max) * 100}%`, background: C.repeat }} />}
            </span>
            <span className={s.hval}>{eur2(r.ltv)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SplitLegend() {
  return (
    <div className={l.miniLegend}>
      <span>
        <i style={{ background: C.first }} />
        First purchase
      </span>
      <span>
        <i style={{ background: C.repeat }} />
        Came back for
      </span>
    </div>
  );
}

// ─── the panel ─────────────────────────────────────────────────────

type View = "ltv" | "buyers" | "repeat" | "repeatRev" | "gap" | "cac";

export function LtvPanel() {
  const [data, setData] = useState<Ltv | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [view, setView] = useState<View>("ltv");
  const [entrySort, setEntrySort] = useState<"ltv" | "buyers">("ltv");

  useEffect(() => {
    let gone = false;
    setLoading(true);
    fetch("/api/ltv", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = (await r.json()) as Ltv;
        if (!gone) {
          setData(d);
          setError("");
        }
      })
      .catch((err) => !gone && setError(`Couldn't load the LTV numbers (${String(err)}).`))
      .finally(() => !gone && setLoading(false));
    return () => {
      gone = true;
    };
  }, [reload]);

  const t = data?.totals;
  const lastCurve = data?.curve[data.curve.length - 1];

  const tiles = useMemo(() => {
    if (!data || !t) return [];
    const list: { id: View; label: string; color: string; value: string; note: string }[] = [
      {
        id: "ltv",
        label: "LTV PER BUYER",
        color: C.first,
        value: eur2(t.ltv),
        note: `${eur2(t.firstAov)} first + ${eur2(t.ltv - t.firstAov)} later`,
      },
      { id: "buyers", label: "BUYERS", color: C.first, value: count(t.buyers), note: `${count(t.purchases)} purchases · ${t.avgPurchases.toFixed(2)} each` },
      { id: "repeat", label: "CAME BACK", color: C.repeat, value: pct(t.repeatRate), note: `${count(t.repeatBuyers)} bought again` },
      { id: "repeatRev", label: "REPEAT REVENUE", color: C.repeat, value: eur(t.repeatRevenue), note: `${pct(t.repeatRevenue / (t.revenue || 1))} of ${eur(t.revenue)}` },
      {
        id: "gap",
        label: "DAYS TO 2ND BUY",
        color: C.repeat,
        value: t.medianDaysTo2nd === null ? "—" : `${Math.round(t.medianDaysTo2nd)} d`,
        note: "median, first → second",
      },
    ];
    if (data.cac)
      list.push({
        id: "cac",
        label: "AD COST / NEW BUYER",
        color: C.cac,
        value: eur2(data.cac.perBuyer),
        note: `day one pays ${(data.cac.firstAov / data.cac.perBuyer).toFixed(2)}×`,
      });
    return list;
  }, [data, t]);

  const chart = useMemo((): { title: string; sub: string; plot: Plot; fmt: (n: number) => string; tip: (i: number) => ReactNode; legend: Series[] } | null => {
    if (!data || !t) return null;
    const months = data.months;
    if (view === "ltv" || view === "cac") {
      const c = data.curve;
      const refs: Ref[] = [{ y: t.firstAov, label: `First purchase ${eur2(t.firstAov)}`, color: C.base }];
      if (data.cac) refs.push({ y: data.cac.perBuyer, label: `Ad cost per new buyer ${eur2(data.cac.perBuyer)}`, color: C.cac });
      return {
        title: "What a buyer is worth, day by day",
        sub: `Average money per buyer N days after their first purchase. Each step counts only buyers old enough for it (${count(lastCurve?.buyers ?? 0)} reach day ${lastCurve?.day ?? 0}).`,
        plot: { kind: "line", xs: c.map((p) => p.day), ys: c.map((p) => p.ltv), xLabel: (d) => (d === 0 ? "Day 0" : `${d} d`), color: C.first, area: true, refs },
        fmt: (n) => `€${Math.round(n)}`,
        legend: [{ name: "LTV per buyer", color: C.first }, { name: "First purchase", color: C.base }, ...(data.cac ? [{ name: "Ad cost per new buyer", color: C.cac }] : [])],
        tip: (i) => {
          const p = c[i];
          return (
            <>
              <div className={s.tipHead}>{p.day === 0 ? "Day of the first purchase" : `${p.day} days after the first purchase`}</div>
              <div className={s.tipBig}>{eur2(p.ltv)}</div>
              <div className={s.tipRows}>
                <TipRow color={C.base} name="First purchase" value={eur2(c[0].ltv)} />
                <TipRow color={C.repeat} name="Added since" value={`+${eur2(p.ltv - c[0].ltv)}`} />
                <TipRow name="Came back by now" value={pct(p.repeatRate)} />
                {data.cac && <TipRow color={C.cac} name="Pays back the ad" value={`${(p.ltv / data.cac.perBuyer).toFixed(2)}×`} />}
              </div>
              <div className={s.tipNote}>From {count(p.buyers)} buyers whose first purchase is at least {p.day} days old.</div>
            </>
          );
        },
      };
    }
    if (view === "repeat") {
      const c = data.curve;
      return {
        title: "How many come back, and when",
        sub: "Share of buyers who made a second purchase within N days of the first.",
        plot: { kind: "line", xs: c.map((p) => p.day), ys: c.map((p) => p.repeatRate * 100), xLabel: (d) => (d === 0 ? "Day 0" : `${d} d`), color: C.repeat, area: true },
        fmt: (n) => `${n.toFixed(n < 10 && n > 0 ? 1 : 0)}%`,
        legend: [{ name: "Came back", color: C.repeat }],
        tip: (i) => {
          const p = c[i];
          return (
            <>
              <div className={s.tipHead}>Within {p.day} days</div>
              <div className={s.tipBig}>{pct(p.repeatRate)}</div>
              <div className={s.tipNote}>Of {count(p.buyers)} buyers whose first purchase is at least {p.day} days old.</div>
            </>
          );
        },
      };
    }
    if (view === "buyers") {
      const series = [
        { name: "New buyers", color: C.first },
        { name: "Came back", color: C.repeat },
      ];
      return {
        title: "Buyers each month",
        sub: "New buyers, and earlier buyers who bought again that month.",
        plot: { kind: "bars", labels: months.map((m) => monthName(m.month)), values: months.map((m) => [m.newBuyers, m.returning]), series },
        fmt: (n) => count(Math.round(n)),
        legend: series,
        tip: (i) => {
          const m = months[i];
          return (
            <>
              <div className={s.tipHead}>{monthName(m.month)}</div>
              <div className={s.tipBig}>{count(m.newBuyers + m.returning)} buyers</div>
              <div className={s.tipRows}>
                <TipRow color={C.first} name="New" value={count(m.newBuyers)} />
                <TipRow color={C.repeat} name="Came back" value={count(m.returning)} />
              </div>
            </>
          );
        },
      };
    }
    if (view === "repeatRev") {
      const series = [
        { name: "First purchases", color: C.first },
        { name: "Repeat purchases", color: C.repeat },
      ];
      return {
        title: "Revenue each month: first purchases vs buyers coming back",
        sub: "Euros, gross. A first purchase includes the add-ons and upsells taken with it.",
        plot: { kind: "bars", labels: months.map((m) => monthName(m.month)), values: months.map((m) => [m.firstRevenue, m.repeatRevenue]), series },
        fmt: (n) => (n >= 1000 ? `€${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `€${Math.round(n)}`),
        legend: series,
        tip: (i) => {
          const m = months[i];
          const tot = m.firstRevenue + m.repeatRevenue;
          return (
            <>
              <div className={s.tipHead}>{monthName(m.month)}</div>
              <div className={s.tipBig}>{eur(tot)}</div>
              <div className={s.tipRows}>
                <TipRow color={C.first} name="First purchases" value={eur(m.firstRevenue)} />
                <TipRow color={C.repeat} name="Repeat" value={`${eur(m.repeatRevenue)} · ${tot ? pct(m.repeatRevenue / tot, 0) : "0%"}`} />
              </div>
            </>
          );
        },
      };
    }
    // gap
    const g = data.gaps;
    const series = [{ name: "Buyers", color: C.repeat }];
    return {
      title: "How long until the second purchase",
      sub: `The ${count(t.repeatBuyers)} buyers who came back, by the wait between their first and second purchase.`,
      plot: { kind: "bars", labels: g.map((b) => b.label), values: g.map((b) => [b.buyers]), series },
      fmt: (n) => count(Math.round(n)),
      legend: [],
      tip: (i) => (
        <>
          <div className={s.tipHead}>{g[i].label}</div>
          <div className={s.tipBig}>{count(g[i].buyers)} buyers</div>
          <div className={s.tipRows}>
            <TipRow name="Share of comebacks" value={pct(g[i].buyers / (t.repeatBuyers || 1), 0)} />
            <TipRow name="Their LTV, all purchases" value={eur(g[i].revenue)} />
          </div>
        </>
      ),
    };
  }, [data, t, view, lastCurve]);

  // The cohort table's colour: one hue, light to strong with the money.
  const heat = useMemo(() => {
    const vals = (data?.cohorts ?? []).flatMap((c) => c.cum.filter((v): v is number => v !== null));
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return (v: number) => `color-mix(in oklch, var(--accent) ${Math.round(8 + ((v - lo) / (hi - lo || 1)) * 54)}%, transparent)`;
  }, [data]);
  const cohortCols = useMemo(() => {
    const ages = (data?.cohorts ?? []).map((c) => c.cum.filter((v) => v !== null).length);
    return Math.max(1, ...ages);
  }, [data]);

  const insights = useMemo(() => {
    if (!data || !t) return [];
    const out: { tone: "up" | "down" | "info"; text: ReactNode }[] = [];
    if (lastCurve && lastCurve.day > 0)
      out.push({
        tone: "up",
        text: (
          <>
            A buyer pays <b>{eur2(data.curve[0].ltv)}</b> on day one and is worth <b>{eur2(lastCurve.ltv)}</b> by day {lastCurve.day}: +{pct(lastCurve.ltv / data.curve[0].ltv - 1, 0)} after the first purchase.
          </>
        ),
      });
    const took = data.addOns.find((a) => a.name.startsWith("Took"));
    const only = data.addOns.find((a) => a.name.startsWith("Main"));
    if (took && only)
      out.push({
        tone: "up",
        text: (
          <>
            Buyers who take an add-on or upsell are worth <b>{eur2(took.ltv)}</b>, {pct(took.ltv / only.ltv - 1, 0)} more than main-only buyers ({eur2(only.ltv)}), but they come back less ({pct(took.repeatRate, 0)} vs {pct(only.repeatRate, 0)}).
          </>
        ),
      });
    const big = data.entries.filter((e) => e.buyers >= 20);
    if (big.length > 1) {
      const best = big[0];
      out.push({
        tone: "info",
        text: (
          <>
            Of the products with 20+ buyers, <b>{best.name}</b> brings the most valuable buyers: {eur2(best.ltv)} each, {pct(best.repeatRate, 0)} came back.
          </>
        ),
      });
    }
    if (data.rebought.buyers > 0)
      out.push({
        tone: "down",
        text: (
          <>
            <b>{count(data.rebought.buyers)} buyers</b> paid again for a product they already had ({data.rebought.top.map((x) => `${x.name} ${x.buyers}`).join(", ")}): {eur(data.rebought.revenue)}. Likely a lost download link.
          </>
        ),
      });
    const late = data.gaps.filter((g) => /month/.test(g.label) && !/^1–2/.test(g.label)).reduce((n, g) => n + g.buyers, 0);
    if (t.repeatBuyers)
      out.push({
        tone: "info",
        text: (
          <>
            The second purchase comes late: median <b>{Math.round(t.medianDaysTo2nd ?? 0)} days</b>, and {pct(late / t.repeatBuyers, 0)} of comebacks happen after 2 months.
          </>
        ),
      });
    if (data.cac)
      out.push({
        tone: data.cac.firstAov >= data.cac.perBuyer ? "up" : "down",
        text: (
          <>
            Since {dayName(`${data.cac.since}T12:00:00Z`)}, Meta spent <b>{eur(data.cac.spend)}</b> for {count(data.cac.newBuyers)} new buyers: {eur2(data.cac.perBuyer)} each, against {eur2(data.cac.firstAov)} on their first purchase.
          </>
        ),
      });
    return out;
  }, [data, t, lastCurve]);

  const entries = useMemo(() => {
    const e = [...(data?.entries ?? [])];
    return entrySort === "buyers" ? e.sort((a, b) => b.buyers - a.buyers) : e;
  }, [data, entrySort]);
  const maxOf = (rows: LtvRank[]) => Math.max(1, ...rows.map((r) => r.ltv));

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">LTV</h1>
          <p className="page-sub">
            {loading && !data
              ? "Loading…"
              : error ||
                "What a buyer is worth over time. Every paid order since Nov 2025, ClickFunnels and funnnnels, joined by email. Gross, in euros."}
          </p>
        </div>
        <div className="tabs">
          <button type="button" className={`tab ${s.refresh}`} onClick={() => setReload((n) => n + 1)} disabled={loading}>
            <span className={loading ? s.spin : undefined}>
              <I.refresh size={12} />
            </span>
            Refresh
          </button>
        </div>
      </div>

      {data && t && chart && (
        <div className={loading ? s.stale : undefined}>
          <section className={`${s.card} ${s.perf}`}>
            <div className={`${s.tiles} ${tiles.length > 5 ? l.six : ""}`}>
              {tiles.map((tile) => {
                const on = view === tile.id;
                return (
                  <button
                    key={tile.id}
                    type="button"
                    className={`${s.tile} ${on ? s.tileOn : ""}`}
                    style={{ ["--k" as string]: tile.color }}
                    onClick={() => setView(tile.id)}
                    aria-pressed={on}
                  >
                    <div className={s.tileLabel}>
                      <span className={s.tileKey} style={{ background: tile.color }} />
                      {tile.label}
                    </div>
                    <div className={s.tileValue}>{tile.value}</div>
                    <div className={s.tileNote}>{tile.note}</div>
                  </button>
                );
              })}
            </div>

            <div className={s.chartHead}>
              <div>
                <div className={s.chartTitle}>{chart.title}</div>
                <div className={s.chartSub}>{chart.sub}</div>
              </div>
            </div>
            {chart.legend.length > 1 && (
              <div className={s.legend}>
                {chart.legend.map((k) => (
                  <span key={k.name} className={s.lgKey}>
                    <span className={s.lgSwatch} style={{ borderColor: k.color, background: `color-mix(in oklch, ${k.color} 35%, transparent)` }} />
                    {k.name}
                  </span>
                ))}
              </div>
            )}
            <Chart key={view} plot={chart.plot} fmt={chart.fmt} tip={chart.tip} />
            {!data.cac && data.cacNote && <p className={s.foot}>{data.cacNote}</p>}
          </section>

          {insights.length > 0 && (
            <section className={`${s.card} ${l.block}`}>
              <div className={s.cardHead}>
                <span className={s.title}>
                  <I.sparkles size={15} /> What it says
                </span>
              </div>
              <ul className={s.list}>
                {insights.map((x, i) => (
                  <li key={i} className={s[x.tone]}>
                    <span className={s.mark}>●</span>
                    <span>{x.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${s.card} ${l.block}`}>
            <div className={s.cardHead}>
              <span className={s.title}>Cohorts: worth per buyer, month by month</span>
              <span className={s.sub}>buyers grouped by the month of their first purchase · € per buyer by month M</span>
            </div>
            <div className={s.tableWrap}>
              <table className={`${s.table} ${l.heat}`}>
                <thead>
                  <tr>
                    <th>FIRST BOUGHT</th>
                    <th>BUYERS</th>
                    <th>CAME BACK</th>
                    {Array.from({ length: cohortCols }, (_, k) => (
                      <th key={k}>M{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...data.cohorts].reverse().map((c) => (
                    <tr key={c.month}>
                      <td className={l.cohortName}>{monthName(c.month)}</td>
                      <td>{count(c.buyers)}</td>
                      <td>{pct(c.repeat, 0)}</td>
                      {c.cum.slice(0, cohortCols).map((v, k) =>
                        v === null ? (
                          <td key={k} className={l.cellEmpty} />
                        ) : (
                          <td
                            key={k}
                            className={l.cell}
                            style={{ background: heat(v) }}
                            title={`${monthName(c.month)} buyers, by month ${k}: ${eur2(v)} each${k ? ` (+${eur2(v - (c.cum[0] ?? 0))} since M0)` : ""}`}
                          >
                            {eur(v)}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={s.foot}>
              M0 is the month of the first purchase. A cell is blank where the month hasn&apos;t happened yet. Hover a cell for the exact amount.
            </p>
          </section>

          <div className={l.ranks}>
            <section className={s.card}>
              <div className={s.cardHead}>
                <span className={s.title}>Where the best buyers start</span>
                <div className="tabs">
                  <button type="button" className={`tab ${entrySort === "ltv" ? "active" : ""}`} onClick={() => setEntrySort("ltv")}>
                    By LTV
                  </button>
                  <button type="button" className={`tab ${entrySort === "buyers" ? "active" : ""}`} onClick={() => setEntrySort("buyers")}>
                    By buyers
                  </button>
                </div>
              </div>
              <SplitLegend />
              <SplitBars rows={entries} max={maxOf(entries)} meta={(r) => `${count(r.buyers)} buyers · ${pct(r.repeatRate, 0)} came back`} />
              <p className={s.foot}>The product of the first purchase. 5+ buyers.</p>
            </section>

            <section className={s.card}>
              <div className={s.cardHead}>
                <span className={s.title}>What brings them back</span>
                <span className={s.sub}>{count(t.repeatBuyers)} returning buyers</span>
              </div>
              <div className={s.hbars}>
                {data.comeback.map((r, i) => (
                  <div key={r.name}>
                    <div className={s.hname}>
                      <span className={l.rankName}>
                        <span className={l.rankNo}>{i + 1}</span>
                        {r.name}
                      </span>
                      <span className={s.hmeta}>
                        {eur(r.revenue)} · {pct(r.share, 0)} of comebacks
                      </span>
                    </div>
                    <div className={s.htrack}>
                      <span className={s.hbar} style={{ width: `${(r.buyers / Math.max(1, data.comeback[0]?.buyers ?? 1)) * 100}%`, background: C.repeat }} />
                      <span className={s.hval}>{count(r.buyers)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className={s.foot}>The main product of each later purchase, by buyers.</p>
            </section>

            <section className={s.card}>
              <div className={s.cardHead}>
                <span className={s.title}>First purchase → second</span>
                <span className={s.sub}>the paths repeat buyers take</span>
              </div>
              <ol className={l.paths}>
                {data.paths.map((p) => (
                  <li key={`${p.from}>${p.to}`}>
                    <span className={l.pathFrom}>{p.from}</span>
                    <span className={l.arrow}>→</span>
                    <span className={l.pathTo}>{p.to}</span>
                    <b>{count(p.buyers)}</b>
                    {p.from === p.to && <span className={l.same}>same product</span>}
                  </li>
                ))}
              </ol>
            </section>

            <section className={s.card}>
              <div className={s.cardHead}>
                <span className={s.title}>Who&apos;s worth more</span>
              </div>
              <SplitLegend />
              <div className={l.group}>On the first purchase</div>
              <SplitBars rows={data.addOns} max={maxOf([...data.addOns, ...data.eras])} meta={(r) => `${count(r.buyers)} buyers · ${pct(r.repeatRate, 0)} came back`} />
              <div className={l.group}>Where they bought</div>
              <SplitBars rows={data.eras} max={maxOf([...data.addOns, ...data.eras])} meta={(r) => `${count(r.buyers)} buyers`} />
            </section>

            <section className={s.card}>
              <div className={s.cardHead}>
                <span className={s.title}>Countries</span>
                <span className={s.sub}>
                  {count(data.countryKnown)} of {count(t.buyers)} buyers have one
                </span>
              </div>
              <SplitLegend />
              <div className={s.hbars}>
                {data.countries.map((r, i) => (
                  <div key={r.name}>
                    <div className={s.hname}>
                      <span className={l.rankName}>
                        <span className={l.rankNo}>{i + 1}</span>
                        <span aria-hidden="true">{FLAG(r.name)}</span> {countryName(r.name)}
                      </span>
                      <span className={s.hmeta}>
                        {count(r.buyers)} buyers · {pct(r.repeatRate, 0)} came back
                      </span>
                    </div>
                    <div className={s.htrack}>
                      <span className={l.split}>
                        <i style={{ width: `${(r.firstAov / maxOf(data.countries)) * 100}%`, background: C.first }} />
                        {r.ltv - r.firstAov > 0.005 && <i style={{ width: `${((r.ltv - r.firstAov) / maxOf(data.countries)) * 100}%`, background: C.repeat }} />}
                      </span>
                      <span className={s.hval}>{eur2(r.ltv)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className={s.foot}>5+ buyers. Most ClickFunnels orders carry no country.</p>
            </section>

            <section className={s.card}>
              <div className={s.cardHead}>
                <span className={s.title}>Purchases per buyer</span>
                <span className={s.sub}>{t.avgPurchases.toFixed(2)} on average</span>
              </div>
              <div className={s.hbars}>
                {data.purchasesPerBuyer.map((b) => (
                  <div key={b.label}>
                    <div className={s.hname}>
                      <span>{b.label}</span>
                      <span className={s.hmeta}>
                        {eur(b.revenue)} · {b.buyers ? eur2(b.revenue / b.buyers) : "—"} each
                      </span>
                    </div>
                    <div className={s.htrack}>
                      <span
                        className={s.hbar}
                        style={{ width: `${(b.buyers / Math.max(1, t.buyers)) * 100}%`, background: b.label.startsWith("1 ") ? C.first : C.repeat }}
                      />
                      <span className={s.hval}>{pct(b.buyers / (t.buyers || 1), 1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className={`${s.card} ${l.block}`}>
            <div className={s.cardHead}>
              <span className={s.title}>
                <I.person size={15} /> The 25 buyers worth the most
              </span>
              <span className={s.sub}>everything they paid, both eras</span>
            </div>
            <div className={s.tableWrap}>
              <table className={`${s.table} ${l.top}`}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th className={l.left}>BUYER</th>
                    <th className={l.left}>PRODUCTS</th>
                    <th>PURCHASES</th>
                    <th>FIRST</th>
                    <th>LAST</th>
                    <th>LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top.map((c, i) => (
                    <tr key={c.email}>
                      <td>
                        <span className={`${l.medal} ${i < 3 ? l[`m${i + 1}`] : ""}`}>{i + 1}</span>
                      </td>
                      <td className={l.left}>
                        <div className={l.who}>
                          {FLAG(c.country) && <span aria-hidden="true">{FLAG(c.country)}</span>}
                          <span className={l.whoName}>{c.name || c.email}</span>
                          {c.era === "both" && <span className={l.era}>CF → funnnnels</span>}
                        </div>
                        <div className={l.email}>{c.email}</div>
                      </td>
                      <td className={l.left}>
                        <div className={l.chips}>
                          {c.products.slice(0, 4).map((p) => (
                            <span key={p} className={l.chip}>
                              {p}
                            </span>
                          ))}
                          {c.products.length > 4 && <span className={l.chip}>+{c.products.length - 4}</span>}
                        </div>
                      </td>
                      <td>{c.purchases}</td>
                      <td>{dayName(c.first)}</td>
                      <td>{c.purchases > 1 ? dayName(c.last) : "—"}</td>
                      <td className={l.ltvCell}>{eur2(c.ltv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={s.foot}>
              {count(data.excluded.tests)} ClickFunnels test orders left out. A purchase is an order plus whatever was added within 2 hours. Dollars, pounds and francs at today&apos;s ECB rate.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
