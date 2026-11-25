"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENCY_KEY, FunnelRevenue, Steps } from "@/components/DashboardHome";
import { CURRENCIES, fromEur, money, moneyExact, Performance, SYMBOL, type Currency } from "@/components/HomeCharts";
import type { Analytics } from "@/lib/analytics";
import { BF_FROM_MS, BF_UNTIL_MS, italyTime } from "@/lib/bfEra";
import type { FunnelSpend } from "@/lib/funnelSpend";
import s from "../home.module.css";

// Dashboard → Black Friday ("metti una dashboard a parte solo per i dati della Black Friday ed
// escludi i dati Black Friday da quelli dell'altra dashboard", 2026-11-24): the home's cards over the
// Black Friday window only (lib/bfEra.ts), from the minute the front-ends went to €9.99 / $9.99 to
// the end of the sale. Dashboard leaves the same window out, so the two never count anything twice.
// The comparison in the tiles is the same number of days right before, at full price.

export function BlackFridayPanel() {
  const [a, setA] = useState<Analytics | null>(null);
  const [spend, setSpend] = useState<FunnelSpend | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetch("/api/analytics?range=7d&era=bf", { cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<Analytics>) : null)),
      fetch("/api/analytics/funnel-spend?range=7d&era=bf", { cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<FunnelSpend>) : null)),
    ])
      .then(([x, sp]) => {
        if (x) setA(x);
        if (sp) setSpend(sp);
        setLoadedAt(Date.now());
      })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, []);
  useEffect(load, [load]);

  // The same currency as the home's, remembered in this browser.
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

  const now = Date.now();
  const state = now < BF_FROM_MS ? "Not started" : now < BF_UNTIL_MS ? "Running" : "Over";
  const days = a?.days.length ?? 0;
  const periodName = `${days === 1 ? "day" : `${days} days`} at full price`;

  return (
    <main className="main home">
      <div className="page-head">
        <div>
          <h1 className="page-title">Black Friday</h1>
          <p className="page-sub">
            Only what the Black Friday ads brought: their spend, and the visitors and orders at €9.99 / $9.99 they sent. What the ads that were already running brought stays on Dashboard.
          </p>
        </div>
      </div>

      <div className={s.bfWindow}>
        <div className={s.bfFact}>
          <div className={s.bfFactLabel}>From (Italy)</div>
          <div className={s.bfFactValue}>{italyTime(BF_FROM_MS)}</div>
        </div>
        <div className={s.bfFact}>
          <div className={s.bfFactLabel}>Until (Italy)</div>
          <div className={s.bfFactValue}>{italyTime(BF_UNTIL_MS)}</div>
        </div>
        <div className={s.bfFact}>
          <div className={s.bfFactLabel}>Sale</div>
          <div className={s.bfFactValue} style={{ color: state === "Running" ? "var(--mint)" : undefined }}>{state}</div>
        </div>
        <div className={s.bfFact}>
          <div className={s.bfFactLabel}>Tiles compared with</div>
          <div className={s.bfFactValue}>{days ? `the ${days === 1 ? "day" : `${days} days`} before, at full price` : "…"}</div>
        </div>
      </div>

      <div className={s.filters}>
        <div className="tabs" role="group" aria-label="Currency">
          {CURRENCIES.map((c) => (
            <button key={c} type="button" className={`tab ${cur === c ? "active" : ""}`} aria-pressed={cur === c} onClick={() => pickCurrency(c)}>
              {SYMBOL[c]} {c}
            </button>
          ))}
        </div>
        {a && (
          <span className={s.note}>
            {cur === "USD" ? `€1 = $${(1 / a.usdToEur).toFixed(2)}` : `$1 = €${a.usdToEur.toFixed(2)}`} · ECB rate
          </span>
        )}
        {a && !a.sources.stripe && <span className={s.warn}>Stripe isn&apos;t connected on this server: card sales are missing.</span>}
      </div>

      <Performance a={a} cur={cur} periodName={periodName} onRefresh={load} refreshing={refreshing} updatedAt={loadedAt} />

      {a && (
        <div className={s.below}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.title}>Revenue by funnel</div>
              <div className={s.sub}>Black Friday</div>
            </div>
            <FunnelRevenue a={a} cur={cur} />
          </div>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.title}>Ads by funnel</div>
              <div className={s.sub}>Meta, Black Friday hours</div>
            </div>
            <AdsByFunnel a={a} spend={spend} cur={cur} />
          </div>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.title}>From visit to sale</div>
              <div className={s.sub}>all funnels</div>
            </div>
            <Steps a={a} />
          </div>
        </div>
      )}
    </main>
  );
}

/** Each funnel's Meta spend in the window (lib/funnelSpend.ts), its revenue and ROAS (revenue ÷ spend). */
function AdsByFunnel({ a, spend, cur }: { a: Analytics; spend: FunnelSpend | null; cur: Currency }) {
  if (!spend) return <div className={s.empty}>Loading the ad spend…</div>;
  if (!spend.connected) return <div className={s.empty}>Ad spend isn&apos;t loading: {spend.reason}</div>;
  const c = (v: number) => moneyExact(fromEur(v, cur, a.usdToEur), cur);
  const names = new Map(a.funnels.map((f) => [f.slug, f.name]));
  // Meta bills in the account's currency (EUR); revenue is in euros already.
  const k = spend.currency === "USD" ? a.usdToEur : 1;
  const rows = Object.entries(spend.byFunnel)
    .map(([slug, f]) => ({ slug, name: names.get(slug) ?? slug, spend: f.spend * k, revenue: f.revenue, orders: f.orders }))
    .filter((r) => r.spend > 0 || r.orders > 0)
    .sort((x, y) => y.spend - x.spend);
  const other = (spend.leadMagnets + spend.unplaced) * k;
  if (!rows.length && !other) return <div className={s.empty}>No ad spend or orders yet.</div>;
  const max = Math.max(...rows.map((r) => r.spend), 0);
  return (
    <div className={s.hbars}>
      {rows.map((r) => (
        <div key={r.slug} className={s.hrow}>
          <div className={s.hname}>
            <span>{r.name}</span>
            <span className={s.hmeta}>
              {r.orders} order{r.orders === 1 ? "" : "s"} · {c(r.revenue)} revenue
              {r.spend > 0 && ` · ROAS ${(r.revenue / r.spend).toFixed(2)}×`}
              {r.orders > 0 && r.spend > 0 && ` · ${c(r.spend / r.orders)} per order`}
            </span>
          </div>
          <div className={s.htrack}>
            <span className={s.hbar} style={{ width: `${max ? (r.spend / max) * 100 : 0}%` }} />
            <span className={s.hval}>{money(fromEur(r.spend, cur, a.usdToEur), cur)}</span>
          </div>
        </div>
      ))}
      {other > 0 && (
        <div className={s.hmeta}>
          {c(other)} more on ads not tied to a funnel (free packs, or no recorded click).
        </div>
      )}
    </div>
  );
}
