"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FunnelCard } from "@/components/FunnelCard";
import { CURRENCIES, dayLabel, fromEur, money, moneyExact, Performance, SYMBOL, type Currency } from "@/components/HomeCharts";
import { isLeadMagnet, LeadMagnets } from "@/components/LeadMagnets";
import { NewFunnelTile } from "@/components/NewFunnelTile";
import { I } from "@/components/icons";
import type { Analytics } from "@/lib/analytics";
import { RangePicker, useRange } from "@/components/RangePicker";
import { previousName, rangePhrase, type Range } from "@/lib/range";
import type { FunnelStatus, StoredFunnel } from "@/lib/blocks";
import { insights, type Insight } from "@/lib/insights";
import s from "./home.module.css";

// The dashboard's first screen. One filter row (the range and the currency)
// scopes everything under it: the performance card (tiles that sum up the
// range and pick what its one chart draws, components/HomeCharts.tsx), what
// stands out, where the revenue comes from, visit → sale, then the funnels.
// Everything comes from lib/analytics.ts and Meta (docs/design.md: real
// numbers only).

const CURRENCY_KEY = "fv:home-currency";

// ─── Revenue by funnel, visit → sale ─────────────────────────────────────────

function FunnelRevenue({ a, cur }: { a: Analytics; cur: Currency }) {
  const c = (v: number) => money(fromEur(v, cur, a.usdToEur), cur);
  const cx = (v: number) => moneyExact(fromEur(v, cur, a.usdToEur), cur);
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
              {f.total.revenue > 0 && ` · ${c(f.total.net)} net`}
              {f.total.orders > 0 && ` · AOV ${cx(f.total.revenue / f.total.orders)}`}
            </span>
          </div>
          <div className={s.htrack}>
            <span className={s.hbar} style={{ width: `${max ? (f.total.revenue / max) * 100 : 0}%` }} />
            <span className={s.hval}>{c(f.total.revenue)}</span>
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
  const [range, setRange] = useRange();
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

  // Euros or dollars for every number on the page; remembered in this browser.
  const [cur, setCur] = useState<Currency>("EUR");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_KEY);
      if (saved === "EUR" || saved === "USD") setCur(saved);
    } catch {
      // private window: euros
    }
  }, []);
  const pickCurrency = (c: Currency) => {
    setCur(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {
      // not remembered, still switched
    }
  };

  const notes = useMemo(
    () => (data ? insights(data, Date.now(), (n) => moneyExact(fromEur(n, cur, data.usdToEur), cur)) : []),
    [data, cur],
  );

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

      {/* The range and the currency: they scope every number below */}
      <div className={s.filters}>
        <RangePicker value={range} onChange={setRange} />
        <div className="tabs" role="group" aria-label="Currency">
          {CURRENCIES.map((c) => (
            <button key={c} type="button" className={`tab ${cur === c ? "active" : ""}`} aria-pressed={cur === c} onClick={() => pickCurrency(c)}>
              {SYMBOL[c]} {c}
            </button>
          ))}
        </div>
        {data && (
          <span className={s.note}>
            {cur === "USD" ? `€1 = $${(1 / data.usdToEur).toFixed(2)}` : `$1 = €${data.usdToEur.toFixed(2)}`} · ECB rate
          </span>
        )}
        {data?.trackingSince && data.since && data.since < data.trackingSince && (
          <span className={s.note}>Visitors counted since {dayLabel(data.trackingSince, { day: "numeric", month: "short" })}</span>
        )}
        {data && !data.sources.stripe && <span className={s.warn}>Stripe isn&apos;t connected on this server: card sales are missing.</span>}
      </div>

      <div className={!current && shown ? s.stale : undefined}>
        <Performance a={data} cur={cur} periodName={data ? previousName(data.range) : "period"} />

        {data && (
          <div className={s.below}>
            {notes.length > 0 && <Insights list={notes} />}
            <div className={s.card}>
              <div className={s.cardHead}>
                <div className={s.title}>Revenue by funnel</div>
                <div className={s.sub}>{data.range === "all" ? "all time" : rangePhrase(data.range).replace(/^in /, "")}</div>
              </div>
              <FunnelRevenue a={data} cur={cur} />
            </div>
            <div className={s.card}>
              <div className={s.cardHead}>
                <div className={s.title}>From visit to sale</div>
                <div className={s.sub}>all funnels</div>
              </div>
              <Steps a={data} />
            </div>
          </div>
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
