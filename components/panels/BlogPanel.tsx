"use client";

import { useEffect, useMemo, useState } from "react";
import { RangePicker, useRange } from "@/components/RangePicker";
import { rangePhrase } from "@/lib/range";
import type { BlogPostStats, BlogStats, Money } from "@/lib/blogStats";
import e from "./email.module.css";
import b from "./blog.module.css";

// Dashboard → Blog (lib/blogStats.ts): is the blog bringing people in, and are
// they buying. The totals, one chart (the tile picked says what it draws, a
// post picked narrows it to that post), then every post with its own numbers.

type Metric = "visitors" | "search" | "clicks";
const METRIC: Record<Metric, { label: string; unit: string }> = {
  visitors: { label: "READERS", unit: "readers" },
  search: { label: "FROM SEARCH", unit: "readers from search" },
  clicks: { label: "WENT TO THE PACK", unit: "went to the pack" },
};

const COLS = { gridTemplateColumns: "minmax(0,2.4fr) 70px 70px 96px 60px 96px 110px" };

const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "—");
const money = (r: Money) =>
  [r.usd ? `$${(r.usd / 100).toFixed(0)}` : "", r.eur ? `€${(r.eur / 100).toFixed(0)}` : ""].filter(Boolean).join(" + ") || "—";
const dayLabel = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const SOURCE: Record<string, string> = { direct: "Direct / unknown", site: "Another page of the site" };
const sourceLabel = (s: string) => SOURCE[s] ?? (s.includes(".") ? s : s.charAt(0).toUpperCase() + s.slice(1));

const sum = (a: number[]) => a.reduce((n, x) => n + x, 0);

/** The days as bars. Past ~120 days they are grouped by week so each bar stays wide enough to see. */
function Chart({ days, values, unit }: { days: string[]; values: number[]; unit: string }) {
  const step = days.length > 120 ? 7 : 1;
  const bars: { label: string; value: number }[] = [];
  for (let i = 0; i < days.length; i += step) {
    const last = Math.min(i + step, days.length) - 1;
    bars.push({ label: step === 1 ? dayLabel(days[i]) : `${dayLabel(days[i])} – ${dayLabel(days[last])}`, value: sum(values.slice(i, i + step)) });
  }
  const max = Math.max(1, ...bars.map((x) => x.value));
  const ticks = [max, Math.round(max / 2)].filter((t, i, a) => t > 0 && a.indexOf(t) === i);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover !== null && bars[hover] ? bars[hover] : null;
  return (
    <div className={b.chart}>
      <div className={b.chartTop}>
        <span className={b.chartTotal}>
          {sum(values)} <span>{unit}</span>
        </span>
        <span className={b.chartHover}>{shown ? `${shown.label} · ${shown.value}` : step === 7 ? "by week" : "by day"}</span>
      </div>
      <div className={b.plot}>
        {ticks.map((t) => (
          <span key={t} className={b.tick} style={{ bottom: `${(t / max) * 100}%` }}>
            {t}
          </span>
        ))}
        <div className={b.bars} onMouseLeave={() => setHover(null)}>
          {bars.map((x, i) => (
            <div key={i} className={b.barSlot} onMouseEnter={() => setHover(i)} title={`${x.label}: ${x.value}`}>
              <div className={`${b.bar} ${hover === i ? b.barOn : ""}`} style={{ height: `${(x.value / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className={b.axis}>
        <span>{dayLabel(days[0])}</span>
        <span>{dayLabel(days[days.length - 1])}</span>
      </div>
    </div>
  );
}

/** A post's readers per day, small, in its row. */
function Spark({ values }: { values: number[] }) {
  const step = Math.max(1, Math.ceil(values.length / 28));
  const pts: number[] = [];
  for (let i = 0; i < values.length; i += step) pts.push(sum(values.slice(i, i + step)));
  const max = Math.max(1, ...pts);
  return (
    <span className={b.spark} aria-hidden>
      {pts.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(v ? 12 : 4, (v / max) * 100)}%`, opacity: v ? 1 : 0.35 }} />
      ))}
    </span>
  );
}

export function BlogPanel() {
  const [range, setRange] = useRange();
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<Metric>("visitors");
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    setStats(null);
    setError("");
    fetch(`/api/blog?range=${range}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setStats(await r.json());
      })
      .catch((err) => setError(`Couldn't load the blog's numbers (${String(err)}).`));
  }, [range]);

  const posts = useMemo(() => stats?.posts ?? [], [stats]);
  const one = posts.find((p) => p.slug === picked) ?? null;
  const scope: BlogPostStats[] = one ? [one] : posts;
  const total = {
    visitors: sum(scope.map((p) => p.visitors)),
    search: sum(scope.map((p) => p.search)),
    clicks: sum(scope.map((p) => p.clicks)),
    orders: sum(scope.map((p) => p.orders)),
    revenue: scope.reduce((r, p) => ({ eur: r.eur + p.revenue.eur, usd: r.usd + p.revenue.usd }), { eur: 0, usd: 0 }),
  };
  const series = useMemo(() => (stats ? stats.days.map((_, i) => sum(scope.map((p) => p.series[metric][i] ?? 0))) : []), [stats, scope, metric]);
  const sources = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of scope) for (const s of p.sources) m.set(s.source, (m.get(s.source) ?? 0) + s.visitors);
    return [...m].map(([source, visitors]) => ({ source, visitors })).sort((a, c) => c.visitors - a.visitors);
  }, [scope]);
  const sales = (stats?.sales ?? []).filter((s) => !one || s.slug === one.slug);
  const titleOf = (slug: string) => posts.find((p) => p.slug === slug)?.title ?? slug;
  const quiet = stats && total.visitors === 0 && total.clicks === 0 && total.orders === 0;

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Blog</h1>
          <p className="page-sub">
            {error ||
              (stats
                ? "Who reads each post, where they came from, who went on to the Jazz MIDI Pack, and what they bought."
                : "Loading…")}
          </p>
        </div>
        <a className="btn" href="https://m.thegrind.studio/blog" target="_blank" rel="noreferrer">
          Open the blog
        </a>
      </div>

      <div className={e.toolbar}>
        <RangePicker value={range} onChange={setRange} />
        {one ? (
          <button type="button" className={b.scope} onClick={() => setPicked(null)}>
            {one.title} <span aria-hidden>×</span>
            <span className={b.scopeHint}>show all posts</span>
          </button>
        ) : null}
      </div>

      {stats ? (
        <>
          <div className={e.stats}>
            {(Object.keys(METRIC) as Metric[]).map((m) => (
              <button key={m} type="button" className={`${e.stat} ${b.tile} ${metric === m ? b.tileOn : ""}`} onClick={() => setMetric(m)} aria-pressed={metric === m}>
                <div className={e.statLabel}>{METRIC[m].label}</div>
                <div className={e.statValue}>{total[m]}</div>
                <div className={e.statSub}>
                  {m === "visitors"
                    ? `people ${rangePhrase(range)}`
                    : m === "search"
                      ? `${pct(total.search, total.visitors)} of readers`
                      : `${pct(total.clicks, total.visitors)} of readers`}
                </div>
              </button>
            ))}
            <div className={e.stat}>
              <div className={e.statLabel}>SALES</div>
              <div className={e.statValue}>{total.orders}</div>
              <div className={e.statSub}>{total.clicks ? `${pct(total.orders, total.clicks)} of those who went to the pack` : "orders by readers"}</div>
            </div>
            <div className={e.stat}>
              <div className={e.statLabel}>REVENUE</div>
              <div className={e.statValue}>{money(total.revenue)}</div>
              <div className={e.statSub}>everything those readers bought</div>
            </div>
          </div>

          <Chart days={stats.days} values={series} unit={`${METRIC[metric].unit}${one ? "" : ", all posts"}`} />

          {quiet ? (
            <p className={b.quiet}>
              No readers {rangePhrase(range)} yet. A new post takes days to weeks to show up in search: the numbers appear here from the first reader on.
            </p>
          ) : null}

          <h2 className={b.title}>Posts</h2>
          <div className={e.table}>
            <div className={`${e.head} ${b.cols}`} style={COLS}>
              <span>POST</span>
              <span className={b.num}>READERS</span>
              <span className={b.num}>SEARCH</span>
              <span className={b.num}>TO THE PACK</span>
              <span className={b.num}>SALES</span>
              <span className={b.num}>REVENUE</span>
              <span className={b.hideNarrow}>READERS / DAY</span>
            </div>
            {posts.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={`${e.rowButton} ${b.cols} ${b.post} ${picked === p.slug ? b.postOn : ""}`}
                style={COLS}
                onClick={() => setPicked(picked === p.slug ? null : p.slug)}
                aria-pressed={picked === p.slug}
              >
                <span className={b.postName}>
                  <span className={e.strong}>{p.title}</span>
                  <span className={b.postMeta}>
                    {p.url.replace("https://", "")}
                    {p.published ? ` · published ${dayLabel(p.published)}` : ""}
                  </span>
                </span>
                <span className={b.num}>{p.visitors}</span>
                <span className={b.num}>{p.search}</span>
                <span className={b.num}>
                  {p.clicks}
                  {p.visitors ? <span className={b.sub}>{pct(p.clicks, p.visitors)}</span> : null}
                </span>
                <span className={`${b.num} ${p.orders ? b.sold : ""}`}>{p.orders}</span>
                <span className={`${b.num} ${p.orders ? b.sold : ""}`}>{money(p.revenue)}</span>
                <span className={b.hideNarrow}>
                  <Spark values={p.series.visitors} />
                </span>
              </button>
            ))}
          </div>
          <p className={b.hint}>Click a post to see only its chart, sources and sales.</p>

          <div className={b.two}>
            <div>
              <h2 className={b.title}>Where readers came from{one ? `: ${one.title}` : ""}</h2>
              <div className={e.table}>
                {sources.length === 0 ? (
                  <div className={e.row}>
                    <span className={e.dim}>No readers {rangePhrase(range)}.</span>
                  </div>
                ) : (
                  sources.slice(0, 12).map((s) => (
                    <div key={s.source} className={`${e.row} ${b.source}`}>
                      <span className={e.cell}>{sourceLabel(s.source)}</span>
                      <span className={b.sourceBar}>
                        <i style={{ width: `${Math.max(2, (s.visitors / sources[0].visitors) * 100)}%` }} />
                      </span>
                      <span className={b.num}>
                        {s.visitors}
                        <span className={b.sub}>{pct(s.visitors, total.visitors)}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h2 className={b.title}>Sales from the blog{one ? `: ${one.title}` : ""}</h2>
              <div className={e.table}>
                {sales.length === 0 ? (
                  <div className={e.row}>
                    <span className={e.dim}>No sales from a post {rangePhrase(range)}.</span>
                  </div>
                ) : (
                  sales.slice(0, 50).map((s) => (
                    <div key={s.orderId} className={`${e.row} ${b.sale}`}>
                      <span className={e.mono}>{when(s.at)}</span>
                      <span className={b.postName}>
                        <span className={e.strong}>{s.product || "Order"}</span>
                        <span className={b.postMeta}>
                          via {titleOf(s.slug)}
                          {s.days ? ` · ${s.days} day${s.days === 1 ? "" : "s"} after reading` : " · same day"}
                        </span>
                      </span>
                      <span className={`${b.num} ${b.sold}`}>
                        {s.currency === "eur" ? "€" : "$"}
                        {(s.cents / 100).toFixed(0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <p className={b.foot}>
            Readers: one per browser per day, bots left out. Sales: neo&apos;s orders by people who reached the pack from a post, credited to the last post they came through, however long before. Days are UTC days.
          </p>
        </>
      ) : null}
    </main>
  );
}
