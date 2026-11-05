"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { FunnelCard } from "@/components/FunnelCard";
import { dayLabel, METRICS, money, NetVsSpend, TrendChart, type Metric } from "@/components/HomeCharts";
import { isLeadMagnet, LeadMagnets } from "@/components/LeadMagnets";
import { NewFunnelTile } from "@/components/NewFunnelTile";
import { I } from "@/components/icons";
import type { Analytics, Day, Range } from "@/lib/analytics";
import type { FunnelStatus, StoredFunnel } from "@/lib/blocks";
import { insights, type Insight } from "@/lib/insights";
import s from "./home.module.css";

// The dashboard's first screen: the range's revenue, net revenue, sales,
// visitors and conversion as tiles (click one and the chart under them shows
// it day by day against the period before), net revenue against what the
// Meta ads cost, where the revenue comes from, what stands out, then the
// funnels. Everything comes from lib/analytics.ts (docs/design.md: real
// numbers only); the ad spend from lib/metaSpend.ts.

const RANGE_LABEL: Record<Range, string> = { "7d": "7D", "28d": "28D", all: "All" };
const RANGE_NAME: Record<Range, string> = { "7d": "7 days", "28d": "28 days", all: "period" };

const sum = (days: Day[], k: keyof Omit<Day, "day">) => days.reduce((n, d) => n + d[k], 0);

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

  const fillD = pathD + ` L ${w},${h} L 0,${h} Z`;
  const id = `g-${color.replace(/[^a-z0-9]/g, "")}`;

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${id})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── KPI tiles ────────────────────────────────────────────────────────────────

type Kpi = {
  metric: Metric;
  value: string;
  unit?: string;
  // Against the period before: a signed change, or null when there's nothing to compare with.
  change: { text: string; up: boolean } | null;
  spark: number[];
};

/** Percent change, or null when the earlier period had nothing. */
function changeOf(now: number, before: number | null): Kpi["change"] {
  if (before === null || before <= 0) return null;
  const c = now / before - 1;
  return { text: `${Math.abs(c * 100).toFixed(0)}%`, up: c >= 0 };
}

const metric = (id: string) => METRICS.find((m) => m.id === id)!;

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
      metric: metric("revenue"),
      value: money(sum(days, "revenue")),
      change: changeOf(sum(days, "revenue"), previous && sum(previous, "revenue")),
      spark: days.map((d) => d.revenue),
    },
    {
      metric: metric("net"),
      value: money(sum(days, "net")),
      unit: sum(days, "revenue") > 0 ? `${money(sum(days, "revenue") - sum(days, "net"))} fees` : undefined,
      change: changeOf(sum(days, "net"), previous && sum(previous, "net")),
      spark: days.map((d) => d.net),
    },
    {
      metric: metric("sales"),
      value: orders.toLocaleString("en-US"),
      unit: upsells ? `+ ${upsells} upsell${upsells === 1 ? "" : "s"}` : undefined,
      change: changeOf(orders, previous && sum(previous, "orders")),
      spark: days.map((d) => d.orders),
    },
    {
      metric: metric("visitors"),
      value: sum(days, "visitors").toLocaleString("en-US"),
      change: changeOf(sum(days, "visitors"), previous && sum(previous, "visitors")),
      spark: days.map((d) => d.visitors),
    },
    {
      metric: metric("cvr"),
      value: now === null ? "—" : (now * 100).toFixed(1),
      unit: now === null ? undefined : "%",
      change:
        now !== null && before !== null && before > 0
          ? { text: `${Math.abs((now - before) * 100).toFixed(1)} pts`, up: now >= before }
          : null,
      spark: days.map((d) => (d.visitors ? d.orders / d.visitors : 0)),
    },
  ];
}

function StatCard({ k, range, on, onPick }: { k: Kpi; range: Range; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      className={`stat ${s.kpi} ${on ? s.kpiOn : ""}`}
      style={{ "--k": k.metric.color } as CSSProperties}
      aria-pressed={on}
      onClick={onPick}
      title={`Show ${k.metric.label.toLowerCase()} per day`}
    >
      <div className="stat-label">
        <span className="lk" style={{ background: k.metric.color }} />
        {k.metric.label}
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
      <Sparkline points={k.spark} color={k.metric.color} />
    </button>
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
              {f.total.revenue > 0 && ` · ${money(f.total.net)} net`}
            </span>
          </div>
          <div className={s.htrack}>
            <span className={s.hbar} style={{ width: `${max ? (f.total.revenue / max) * 100 : 0}%` }} />
            <span className={s.hval}>{money(f.total.revenue)}</span>
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

  // The tile picked for the chart under them.
  const [picked, setPicked] = useState("revenue");
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
        {/* KPI tiles: click one to chart it */}
        <div className={`stats ${s.kpis}`}>
          {kpis
            ? kpis.map((k) => <StatCard key={k.metric.id} k={k} range={data!.range} on={picked === k.metric.id} onPick={() => setPicked(k.metric.id)} />)
            : METRICS.map((m) => (
                <div key={m.id} className="stat">
                  <div className="stat-label">{m.label}</div>
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
                  <div className={s.title}>{metric(picked).label} per day</div>
                  <div className={s.sub}>{metric(picked).sub}</div>
                </div>
                <TrendChart days={data.days} previous={data.previous} metric={metric(picked)} periodName={RANGE_NAME[data.range]} />
              </div>
              {notes.length > 0 && <Insights list={notes} />}
            </div>

            <NetVsSpend days={data.days} rate={data.usdToEur} periodName={RANGE_NAME[data.range]} />

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
