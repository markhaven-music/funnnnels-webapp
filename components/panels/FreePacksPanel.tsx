"use client";

import { useEffect, useMemo, useState } from "react";
import type { FreePackPerson, FreePackRow, FreePackStats } from "@/lib/freePacks";
import e from "./email.module.css";
import f from "./freePacks.module.css";

// Dashboard → Free packs (lib/freePacks.ts): who downloaded a free pack and
// who went on to buy. Read at a glance: the totals, one card per pack
// (sign-ups → opened the Drum Kit checkout → bought), then every person and
// where they stand (bought, opened the checkout, which Drum Kit email is next).

const PERIODS = [7, 30, 90];
const COLS = { gridTemplateColumns: "96px minmax(0,1.6fr) 120px minmax(0,1fr) minmax(0,1.5fr)" };

const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "");
const money = (r: { eur: number; usd: number }) =>
  [r.usd ? `$${(r.usd / 100).toFixed(0)}` : "", r.eur ? `€${(r.eur / 100).toFixed(0)}` : ""].filter(Boolean).join(" + ") || "$0";
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Step({ label, n, of, bought }: { label: string; n: number; of: number; bought?: boolean }) {
  return (
    <div className={f.step}>
      <div className={f.stepTop}>
        <span className={f.stepLabel}>{label}</span>
        <span className={f.stepValue}>
          {n}
          <span className={f.stepPct}>{pct(n, of)}</span>
        </span>
      </div>
      <div className={f.track}>
        <div className={`${f.fill} ${bought ? f.fillBought : ""}`} style={{ width: of ? `${Math.max(n ? 3 : 0, (n / of) * 100)}%` : 0 }} />
      </div>
    </div>
  );
}

function PackCard({ p, people }: { p: FreePackRow; people: FreePackPerson[] }) {
  const fresh = p.leads - p.alreadyBuyers;
  const mine = people.filter((x) => x.pack === p.label && !x.alreadyBuyer);
  const inKit = mine.filter((x) => x.kit && (x.kit.state === "waiting" || x.kit.state === "sending")).length;
  const first = mine.length ? mine[mine.length - 1].at : null;
  return (
    <div className={f.pack}>
      <div className={f.packHead}>
        <span className={f.packName}>{p.label}</span>
        {first ? <span className={f.packMeta}>since {day(first)}</span> : null}
      </div>
      <div>
        <div className={f.big}>{fresh}</div>
        <div className={f.bigLabel}>new sign-ups</div>
      </div>
      <div className={f.steps}>
        <Step label="Opened the Drum Kit checkout" n={p.checkout.hit} of={fresh} />
        <Step label={`Bought · ${money(p.revenue)}`} n={p.boughtSoFar} of={fresh} bought />
      </div>
      <div className={f.packFoot}>
        {inKit ? `${inKit} still getting the Drum Kit emails.` : "No one left in the Drum Kit emails."}
        {p.alreadyBuyers ? ` ${p.alreadyBuyers} had already bought before: not counted.` : ""}
      </div>
    </div>
  );
}

function status(x: FreePackPerson): { label: string; cls: string } {
  if (x.alreadyBuyer) return { label: "Bought before signing up", cls: f.status_off };
  if (x.boughtAt) return { label: `Bought ${money(x.revenue)} · ${day(x.boughtAt)}`, cls: f.status_bought };
  const kit = x.kit;
  const next =
    kit && (kit.state === "waiting" || kit.state === "sending")
      ? `Drum Kit email ${kit.sent + 1} of ${kit.of}${kit.nextAt ? ` on ${day(kit.nextAt)}` : ""}`
      : kit?.state === "done"
        ? "Got all Drum Kit emails"
        : kit?.state === "stopped"
          ? "Drum Kit emails stopped"
          : "Not in the Drum Kit emails";
  if (x.checkoutAt) return { label: `Opened checkout ${day(x.checkoutAt)} · ${next}`, cls: f.status_checkout };
  return { label: next, cls: kit ? "" : f.status_off };
}

type Filter = "all" | "checkout" | "bought";

export function FreePacksPanel() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<FreePackStats | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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

  const people = useMemo(() => stats?.people ?? [], [stats]);
  const fresh = people.filter((x) => !x.alreadyBuyer);
  const shown = useMemo(
    () =>
      people.filter((x) =>
        filter === "bought" ? !x.alreadyBuyer && x.boughtAt : filter === "checkout" ? !x.alreadyBuyer && x.checkoutAt && !x.boughtAt : true,
      ),
    [people, filter],
  );
  const total = {
    signups: fresh.length,
    checkout: fresh.filter((x) => x.checkoutAt).length,
    bought: fresh.filter((x) => x.boughtAt).length,
    revenue: fresh.reduce((r, x) => ({ eur: r.eur + x.revenue.eur, usd: r.usd + x.revenue.usd }), { eur: 0, usd: 0 }),
  };

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Free packs</h1>
          <p className="page-sub">{error || (stats ? "Who downloaded a free pack, and who went on to buy. Cost per sign-up is in Meta Ads Manager." : "Loading…")}</p>
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
          <div>No sign-ups in this period yet. They appear here from the first one on.</div>
        </div>
      ) : stats ? (
        <>
          <div className={e.stats}>
            <div className={e.stat}>
              <div className={e.statLabel}>SIGN-UPS</div>
              <div className={e.statValue}>{total.signups}</div>
              <div className={e.statSub}>new people, last {days} days</div>
            </div>
            <div className={e.stat}>
              <div className={e.statLabel}>OPENED THE CHECKOUT</div>
              <div className={e.statValue}>{total.checkout}</div>
              <div className={e.statSub}>{pct(total.checkout, total.signups) || "—"} of sign-ups</div>
            </div>
            <div className={e.stat}>
              <div className={e.statLabel}>BOUGHT</div>
              <div className={e.statValue}>{total.bought}</div>
              <div className={e.statSub}>{pct(total.bought, total.signups) || "—"} of sign-ups</div>
            </div>
            <div className={e.stat}>
              <div className={e.statLabel}>REVENUE</div>
              <div className={e.statValue}>{money(total.revenue)}</div>
              <div className={e.statSub}>everything they bought after signing up</div>
            </div>
          </div>

          <div className={f.packs}>
            {stats.packs.map((p) => (
              <PackCard key={p.key} p={p} people={people} />
            ))}
          </div>

          <div className={e.toolbar} style={{ justifyContent: "space-between" }}>
            <h2 className={f.sectionTitle} style={{ margin: 0 }}>
              People
            </h2>
            <div className={f.filters}>
              {(
                [
                  ["all", `All ${people.length}`],
                  ["checkout", `Opened checkout ${total.checkout - fresh.filter((x) => x.checkoutAt && x.boughtAt).length}`],
                  ["bought", `Bought ${total.bought}`],
                ] as [Filter, string][]
              ).map(([k, label]) => (
                <button key={k} type="button" className={`${f.filter} ${filter === k ? f.filterOn : ""}`} onClick={() => setFilter(k)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={e.table}>
            <div className={e.head} style={COLS}>
              <span>SIGNED UP</span>
              <span>EMAIL</span>
              <span>PACK</span>
              <span className={f.hideNarrow}>AD</span>
              <span>WHERE THEY ARE</span>
            </div>
            {shown.length === 0 ? (
              <div className={e.row}>
                <span className={e.dim}>No one here yet.</span>
              </div>
            ) : (
              shown.map((x) => {
                const s = status(x);
                return (
                  <div key={`${x.pack}|${x.email}`} className={e.row} style={COLS}>
                    <span className={e.mono}>{when(x.at)}</span>
                    <span className={`${e.cell} ${e.strong}`} title={x.email}>
                      {x.email}
                    </span>
                    <span className={e.cell}>{x.pack}</span>
                    <span className={`${e.cell} ${e.dim} ${f.hideNarrow}`}>{x.ad ?? "no ad"}</span>
                    <span className={`${f.status} ${s.cls}`} title={s.label}>
                      {s.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
