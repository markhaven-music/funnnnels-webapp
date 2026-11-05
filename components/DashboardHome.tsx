"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FunnelCard } from "@/components/FunnelCard";
import { isLeadMagnet, LeadMagnets } from "@/components/LeadMagnets";
import { NewFunnelTile } from "@/components/NewFunnelTile";
import { I } from "@/components/icons";
import type { Analytics, Day, Range } from "@/lib/analytics";
import type { FunnelStatus, StoredFunnel } from "@/lib/blocks";
import { insights, type Insight } from "@/lib/insights";
import s from "./home.module.css";

// The dashboard's first screen: the range's sales, visitors and conversion,
// sales per day, where they come from, what stands out, then the funnels.
// Everything comes from lib/analytics.ts (docs/design.md: real numbers only).

const RANGE_LABEL: Record<Range, string> = { "7d": "7D", "28d": "28D", all: "All" };
const RANGE_NAME: Record<Range, string> = { "7d": "7 days", "28d": "28 days", all: "period" };

const sum = (days: Day[], k: keyof Omit<Day, "day">) => days.reduce((n, d) => n + d[k], 0);
const eur = (n: number) => (n >= 10_000 ? `€${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : `€${Math.round(n).toLocaleString("en-US")}`);
const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const pts = points.length > 1 ? points : [points[0] ?? 0, points[0] ?? 0];
  const w = 200;
  const h = 32;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const step = w / (pts.length - 1);
  const coords = pts.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathD =
    "M " +
    coords
      .map((c, i) => {
        if (i === 0) return c;
        const [px, py] = coords[i - 1].split(",").map(Number);
        const [cx, cy] = c.split(",").map(Number);
        const mx = (px + cx) / 2;
        return `C ${mx},${py} ${mx},${cy} ${cx},${cy}`;
      })
      .join(" ");

  const fillD =
    pathD + ` L ${w},${h} L 0,${h} Z`;

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.replace(/[^a-z]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#g-${color.replace(/[^a-z]/g, "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── KPI tiles ────────────────────────────────────────────────────────────────

type Kpi = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  // Against the period before: a signed change, or null when there's nothing to compare with.
  change: { text: string; up: boolean } | null;
  color: string;
  spark: number[];
};

/** Percent change, or null when the earlier period had nothing. */
function changeOf(now: number, before: number | null): Kpi["change"] {
  if (before === null || before <= 0) return null;
  const c = now / before - 1;
  return { text: `${Math.abs(c * 100).toFixed(0)}%`, up: c >= 0 };
}

function buildKpis(a: Analytics): Kpi[] {
  const { days, previous, trackingSince } = a;
  // Conversion only over days when visitors were counted.
  const tracked = (ds: Day[]) => ds.filter((d) => trackingSince && d.day >= trackingSince);
  const cvr = (ds: Day[]) => {
    const v = sum(tracked(ds), "visitors");
    return v > 0 ? sum(tracked(ds), "orders") / v : null;
  };
  const now = cvr(days);
  const before = previous ? cvr(previous) : null;
  const orders = sum(days, "orders");
  const upsells = sum(days, "upsells");
  return [
    {
      id: "revenue",
      label: "Revenue",
      value: eur(sum(days, "revenue")),
      change: changeOf(sum(days, "revenue"), previous && sum(previous, "revenue")),
      color: "oklch(0.74 0.19 295)",
      spark: days.map((d) => d.revenue),
    },
    {
      id: "net",
      label: "Net revenue",
      value: eur(sum(days, "net")),
      unit: sum(days, "revenue") > 0 ? `${eur(sum(days, "revenue") - sum(days, "net"))} fees` : undefined,
      change: changeOf(sum(days, "net"), previous && sum(previous, "net")),
      color: "oklch(0.66 0.16 295)",
      spark: days.map((d) => d.net),
    },
    {
      id: "sales",
      label: "Sales",
      value: orders.toLocaleString("en-US"),
      unit: upsells ? `+ ${upsells} upsell${upsells === 1 ? "" : "s"}` : undefined,
      change: changeOf(orders, previous && sum(previous, "orders")),
      color: "oklch(0.82 0.18 295)",
      spark: days.map((d) => d.orders),
    },
    {
      id: "visitors",
      label: "Visitors",
      value: sum(days, "visitors").toLocaleString("en-US"),
      change: changeOf(sum(days, "visitors"), previous && sum(previous, "visitors")),
      color: "oklch(0.78 0.13 230)",
      spark: days.map((d) => d.visitors),
    },
    {
      id: "cvr",
      label: "Conversion",
      value: now === null ? "—" : (now * 100).toFixed(1),
      unit: now === null ? undefined : "%",
      change:
        now !== null && before !== null && before > 0
          ? { text: `${Math.abs((now - before) * 100).toFixed(1)} pts`, up: now >= before }
          : null,
      color: "oklch(0.86 0.16 165)",
      spark: days.map((d) => (d.visitors ? d.orders / d.visitors : 0)),
    },
  ];
}

function StatCard({ k, range }: { k: Kpi; range: Range }) {
  return (
    <div className="stat">
      <div className="stat-label">
        <span className="lk" style={{ background: k.color }} />
        {k.label}
      </div>
      <div className="v">
        {k.value}
        {k.unit && <small>{k.unit}</small>}
      </div>
      {k.change ? (
        <span className={`delta ${k.change.up ? "up" : "down"}`}>
          {k.change.up ? "▲" : "▼"} {k.change.text} <span className={s.vs}>vs previous {RANGE_NAME[range]}</span>
        </span>
      ) : (
        <span className={`delta ${s.flat}`}>{range === "all" ? "all time" : "nothing to compare yet"}</span>
      )}
      <Sparkline points={k.spark} color={k.color} />
    </div>
  );
}

// ─── Sales per day ───────────────────────────────────────────────────────────

/** A clean axis top above v: 1, 2 or 5 × a power of ten. */
function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function SalesChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = niceMax(Math.max(...days.map((d) => d.revenue), 0));
  const peak = days.reduce((best, d, i) => (d.revenue > (days[best]?.revenue ?? 0) ? i : best), -1);
  const n = days.length;
  // About five dates under the axis, always the last day.
  const every = n <= 7 ? 1 : Math.ceil(n / 5);
  const short = n <= 7;
  const hd = hover === null ? null : days[hover];

  return (
    <div className={s.chart}>
      <div className={s.yAxis} aria-hidden>
        {[1, 0.5, 0].map((t) => (
          <span key={t} style={{ top: `${(1 - t) * 100}%` }}>
            {eur(top * t)}
          </span>
        ))}
      </div>
      <div className={s.plot} onMouseLeave={() => setHover(null)}>
        {[1, 0.5, 0].map((t) => (
          <span key={t} className={s.gridline} style={{ top: `${(1 - t) * 100}%` }} />
        ))}
        <div className={s.cols}>
          {days.map((d, i) => (
            <button
              key={d.day}
              type="button"
              className={`${s.col} ${hover === i ? s.colOn : ""}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${dayLabel(d.day, { weekday: "short", day: "numeric", month: "short" })}: ${eur(d.revenue)}, ${d.orders} order${d.orders === 1 ? "" : "s"}`}
            >
              {i === peak && d.revenue > 0 && <span className={s.peak}>{eur(d.revenue)}</span>}
              <span className={s.bar} style={{ height: `${(d.revenue / top) * 100}%` }} />
            </button>
          ))}
        </div>
        {peak < 0 && <div className={s.none}>No sales in this range yet.</div>}
        {hd && (
          <div
            className={s.tip}
            style={hover! < n / 2 ? { left: `${((hover! + 0.5) / n) * 100}%` } : { right: `${((n - hover! - 0.5) / n) * 100}%` }}
          >
            <div className={s.tipDay}>{dayLabel(hd.day, { weekday: "short", day: "numeric", month: "short" })}</div>
            <div className={s.tipValue}>{eur(hd.revenue)}</div>
            <div className={s.tipRow}><b>{hd.orders}</b> order{hd.orders === 1 ? "" : "s"}{hd.upsells ? <> · <b>{hd.upsells}</b> upsell{hd.upsells === 1 ? "" : "s"}</> : null}</div>
            <div className={s.tipRow}><b>{hd.visitors}</b> visitor{hd.visitors === 1 ? "" : "s"}</div>
          </div>
        )}
      </div>
      <div className={s.xAxis} aria-hidden>
        {days.map((d, i) =>
          (n - 1 - i) % every === 0 ? (
            <span key={d.day} style={{ left: `${((i + 0.5) / n) * 100}%` }}>
              {dayLabel(d.day, short ? { weekday: "short" } : { day: "numeric", month: "short" })}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

// ─── Revenue by funnel, visit → sale ─────────────────────────────────────────

function FunnelRevenue({ a }: { a: Analytics }) {
  const rows = a.funnels.filter((f) => f.total.revenue > 0 || f.total.visitors > 0).sort((x, y) => y.total.revenue - x.total.revenue);
  const max = Math.max(...rows.map((f) => f.total.revenue), 0);
  if (!rows.length) return <div className={s.empty}>No visitors or sales in this range yet.</div>;
  return (
    <div className={s.hbars}>
      {rows.map((f) => (
        <div key={f.slug} className={s.hrow}>
          <div className={s.hname}>
            <span>{f.name}</span>
            <span className={s.hmeta}>
              {f.total.orders} order{f.total.orders === 1 ? "" : "s"} · {f.total.visitors.toLocaleString("en-US")} visitors
              {f.total.revenue > 0 && ` · ${eur(f.total.net)} net`}
            </span>
          </div>
          <div className={s.htrack}>
            <span className={s.hbar} style={{ width: `${max ? (f.total.revenue / max) * 100 : 0}%` }} />
            <span className={s.hval}>{eur(f.total.revenue)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Steps({ a }: { a: Analytics }) {
  const t = a.funnels.reduce(
    (n, f) => ({ v: n.v + f.total.visitors, o: n.o + f.total.orderViews, c: n.c + f.total.checkouts, p: n.p + f.total.ratedOrders }),
    { v: 0, o: 0, c: 0, p: 0 },
  );
  if (!t.v) return <div className={s.empty}>No visitors counted in this range yet.</div>;
  const steps = [
    { label: "Landing visitors", n: t.v },
    { label: "Order page", n: t.o },
    { label: "Checkout started", n: t.c },
    { label: "Paid", n: t.p },
  ];
  return (
    <div className={s.hbars}>
      {steps.map((step, i) => (
        <div key={step.label} className={s.hrow}>
          <div className={s.hname}>
            <span>{step.label}</span>
            {i > 0 && (
              <span className={s.hmeta}>
                {steps[i - 1].n ? `${((step.n / steps[i - 1].n) * 100).toFixed(0)}% of the step before` : "—"}
              </span>
            )}
          </div>
          <div className={s.htrack}>
            <span className={`${s.hbar} ${s.hbarSteps}`} style={{ width: `${(step.n / t.v) * 100}%` }} />
            <span className={s.hval}>{step.n.toLocaleString("en-US")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Insights({ list }: { list: Insight[] }) {
  return (
    <div className={`${s.card} ${s.insights}`}>
      <div className={s.cardHead}>
        <div className={s.title}>
          <I.sparkles size={13} /> Insights
        </div>
        <div className={s.sub}>from your numbers</div>
      </div>
      <ul className={s.list}>
        {list.map((it) => (
          <li key={it.text} className={s[it.tone]}>
            <span className={s.mark} aria-hidden>{it.tone === "up" ? "▲" : it.tone === "down" ? "▼" : "●"}</span>
            <span>{it.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Main component ───────────────────────────────────────────────────────────

type TabKey = "all" | FunnelStatus;
const TABS: TabKey[] = ["all", "live", "test", "draft"];

type Props = {
  funnels: StoredFunnel[];
  /** The last 28 days, loaded by Dashboard (null while it loads). */
  analytics: Analytics | null;
};

export function DashboardHome({ funnels: all, analytics }: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  // The lead magnets (free packs) have their own section under the funnels that sell.
  const funnels = useMemo(() => all.filter((f) => !isLeadMagnet(f)), [all]);
  const magnets = useMemo(() => all.filter(isLeadMagnet), [all]);
  const [range, setRange] = useState<Range>("28d");
  const [loaded, setLoaded] = useState<Partial<Record<Range, Analytics>>>({});
  const current = range === "28d" ? analytics : (loaded[range] ?? null);
  // While another range loads, the last one stays on screen, dimmed.
  const [shown, setShown] = useState<Analytics | null>(analytics);
  useEffect(() => {
    if (current) setShown(current);
  }, [current]);
  useEffect(() => {
    if (range === "28d" || loaded[range]) return;
    fetch(`/api/analytics?range=${range}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Analytics>) : null))
      .then((a) => a && setLoaded((l) => ({ ...l, [range]: a })))
      .catch(() => {});
  }, [range, loaded]);
  const data = current ?? shown;

  const kpis = useMemo(() => (data ? buildKpis(data) : null), [data]);
  const notes = useMemo(() => (data ? insights(data) : []), [data]);

  const filtered = useMemo(() => {
    if (tab === "all") return funnels;
    return funnels.filter((f) => f.status === tab);
  }, [tab, funnels]);
  const shownMagnets = tab === "all" ? magnets : magnets.filter((f) => f.status === tab);

  const counts = useMemo(() => {
    const c = { live: 0, draft: 0, test: 0 };
    for (const f of funnels) c[f.status] += 1;
    return c;
  }, [funnels]);

  return (
    <main className="main home">
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">{greeting()}.</h1>
          <p className="page-sub">
            {funnels.length > 0 ? (
              <>
                <span className="mono">{funnels.length} funnel{funnels.length === 1 ? "" : "s"}</span>
                {counts.live > 0 && (
                  <> · <span className="mono" style={{ color: "var(--mint)" }}>{counts.live} live</span></>
                )}
                {counts.draft > 0 && (
                  <> · <span className="mono">{counts.draft} draft</span></>
                )}
              </>
            ) : (
              "Build your first funnel by describing it in plain English."
            )}
          </p>
        </div>
        <div className="cta-group">
          <Link href="/funnels/new" className="btn primary">
            <I.sparkles size={14} /> New with AI
          </Link>
        </div>
      </div>

      {/* Range: scopes every number below */}
      <div className={s.filters}>
        <div className="tabs">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button key={r} type="button" className={`tab ${range === r ? "active" : ""}`} onClick={() => setRange(r)}>
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
        {data && !data.sources.stripe && <span className={s.warn}>Stripe isn&apos;t connected on this server: card sales are missing.</span>}
        {data?.trackingSince && data.since && data.since < data.trackingSince && (
          <span className={s.note}>Visitors counted since {dayLabel(data.trackingSince, { day: "numeric", month: "short" })}</span>
        )}
      </div>

      <div className={!current && shown ? s.stale : undefined}>
        {/* KPI tiles */}
        <div className={`stats ${s.kpis}`}>
          {kpis
            ? kpis.map((k) => <StatCard key={k.id} k={k} range={data!.range} />)
            : ["Revenue", "Net revenue", "Sales", "Visitors", "Conversion"].map((l) => (
                <div key={l} className="stat">
                  <div className="stat-label">{l}</div>
                  <div className="v">—</div>
                  <span className={`delta ${s.flat}`}>loading…</span>
                </div>
              ))}
        </div>

        {data && (
          <>
            <div className={notes.length ? s.row : `${s.row} ${s.rowFull}`}>
              <div className={s.card}>
                <div className={s.cardHead}>
                  <div className={s.title}>Sales per day</div>
                  <div className={s.sub}>revenue in €, upsells included</div>
                </div>
                <SalesChart days={data.days} />
              </div>
              {notes.length > 0 && <Insights list={notes} />}
            </div>

            <div className={`${s.row} ${s.rowHalf}`}>
              <div className={s.card}>
                <div className={s.cardHead}>
                  <div className={s.title}>Revenue by funnel</div>
                  <div className={s.sub}>{data.range === "all" ? "all time" : `last ${RANGE_NAME[data.range]}`}</div>
                </div>
                <FunnelRevenue a={data} />
              </div>
              <div className={s.card}>
                <div className={s.cardHead}>
                  <div className={s.title}>From visit to sale</div>
                  <div className={s.sub}>all funnels</div>
                </div>
                <Steps a={data} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Funnels section */}
      <div className="section-head">
        <div className="section-title">
          Your funnels
          <span className="count">{filtered.length} of {funnels.length}</span>
        </div>
        {funnels.length > 0 && (
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={funnels.length === 0 ? "funnels funnels--empty" : "funnels"}>
        <NewFunnelTile prominent={funnels.length === 0} />
        {filtered.map((f) => (
          <FunnelCard key={f.id} f={f} />
        ))}
      </div>
      <LeadMagnets funnels={shownMagnets} />
    </main>
  );
}
