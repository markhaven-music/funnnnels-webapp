"use client";

import { useEffect, useState } from "react";
import type { FreePackRow, FreePackStats, Rate } from "@/lib/freePacks";
import e from "./email.module.css";

// Dashboard → Free packs (lib/freePacks.ts): leads from the free lead magnets,
// per pack and per ad, and how many of them start a checkout and buy.

const COLS = { gridTemplateColumns: "minmax(0,2fr) 70px 80px 110px 100px 100px 100px 120px" };
const PERIODS = [30, 90, 365];

const pct = (r: Rate) => (r.of ? `${((r.hit / r.of) * 100).toFixed(1)}%` : "—");
const euros = (c: number, cur: "eur" | "usd") => (cur === "eur" ? "€" : "$") + (c / 100).toFixed(0);
const revenue = (r: FreePackRow["revenue"]) => [r.eur ? euros(r.eur, "eur") : "", r.usd ? euros(r.usd, "usd") : ""].filter(Boolean).join(" + ") || "—";

function RateCell({ r }: { r: Rate }) {
  return (
    <span title={r.of ? `${r.hit} of ${r.of} leads old enough` : "No lead is old enough yet"}>
      <span className={e.strong}>{pct(r)}</span> <span className={e.mono}>{r.of ? `${r.hit}/${r.of}` : ""}</span>
    </span>
  );
}

function Table({ rows, first }: { rows: FreePackRow[]; first: string }) {
  return (
    <div className={e.table} style={{ marginBottom: 18 }}>
      <div className={e.head} style={COLS}>
        <span>{first}</span>
        <span>LEADS</span>
        <span title="Had bought before opting in: left out of the rates">BUYERS</span>
        <span>CHECKOUT</span>
        <span>BUY 1 DAY</span>
        <span>BUY 7 DAYS</span>
        <span>BUY 30 DAYS</span>
        <span>REVENUE</span>
      </div>
      {rows.map((r) => (
        <div key={r.key} className={e.row} style={COLS}>
          <span className={e.cell} title={r.label}>
            <span className={e.strong}>{r.label}</span>
          </span>
          <span className={e.strong}>{r.leads}</span>
          <span className={e.dim}>{r.alreadyBuyers}</span>
          <RateCell r={r.checkout} />
          <RateCell r={r.bought[1]} />
          <RateCell r={r.bought[7]} />
          <RateCell r={r.bought[30]} />
          <span title={`${r.boughtSoFar} bought so far`}>
            <span className={e.strong}>{revenue(r.revenue)}</span> <span className={e.mono}>{r.boughtSoFar ? `${r.boughtSoFar} buyers` : ""}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function FreePacksPanel() {
  const [days, setDays] = useState(90);
  const [stats, setStats] = useState<FreePackStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setStats(null);
    setError("");
    fetch(`/api/free-packs?days=${days}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setStats(await r.json());
      })
      .catch((err) => setError(`Couldn't load the free packs (${String(err)}).`));
  }, [days]);

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Free packs</h1>
          <p className="page-sub">
            {error ||
              (stats
                ? `${stats.leads} leads from the free packs in the last ${days} days. Rates leave out people who had already bought, and count only leads old enough for the window. Cost per lead: Meta Ads Manager.`
                : "Loading…")}
          </p>
        </div>
      </div>

      <div className={e.toolbar}>
        <select className={e.select} value={days} onChange={(ev) => setDays(Number(ev.target.value))}>
          {PERIODS.map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
      </div>

      {stats && stats.leads === 0 ? (
        <div className={e.empty}>
          <div>No opt-ins in this period yet. They appear here from the first one on.</div>
        </div>
      ) : stats ? (
        <>
          <Table rows={stats.packs} first="PACK" />
          <Table rows={stats.ads} first="PACK · AD" />
        </>
      ) : null}
    </main>
  );
}
