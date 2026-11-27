"use client";

import { useEffect, useMemo, useState } from "react";
import { RangePicker, useRange } from "@/components/RangePicker";
import type { FreePackPerson, FreePackStats } from "@/lib/freePacks";
import e from "./email.module.css";
import f from "./freePacks.module.css";

// Dashboard → Free packs (lib/freePacks.ts). One question: are the free-pack
// ads worth it? (docs/design.md rule 6: the answer first.) Top: the verdict,
// euros of ads per buyer against what the normal ads pay. Then the chain
// spent → sign-ups → checkout → buyers → earned → profit, when they buy after
// signing up, the packs side by side, and last every person.

/** What a buyer costs through the normal ads (Meta → landing), ~€13.7 (profit plan, Nov 2026). */
const TARGET = 14;
const DAY = 86_400_000;

const COLS = { gridTemplateColumns: "92px minmax(0,1.4fr) 110px minmax(0,0.6fr) minmax(0,1.6fr)" };

const eur0 = (n: number) => `${n < 0 ? "−" : ""}€${Math.abs(n) >= 100 ? Math.round(Math.abs(n)).toLocaleString("en-US") : Math.abs(n).toFixed(2).replace(/\.00$/, "")}`;
const pct = (n: number, of: number) => (of ? `${(n / of) * 100 >= 10 || n === 0 ? Math.round((n / of) * 100) : ((n / of) * 100).toFixed(1)}%` : "—");
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type Tone = "good" | "warn" | "bad";
type Sum = { spend: number | null; leads: number; checkout: number; buyers: number; earned: number; young: number; people: FreePackPerson[] };

/** Everything a set of people (all packs, or one) adds up to, in euros. */
function sumUp(people: FreePackPerson[], spend: number | null, rate: number, now: number): Sum {
  const fresh = people.filter((x) => !x.alreadyBuyer);
  return {
    spend,
    leads: fresh.length,
    checkout: fresh.filter((x) => x.checkoutAt).length,
    buyers: fresh.filter((x) => x.boughtAt).length,
    earned: fresh.reduce((n, x) => n + x.revenue.eur / 100 + (x.revenue.usd / 100) * rate, 0),
    // Signed up less than 30 days ago and not bought yet: they can still buy.
    young: fresh.filter((x) => !x.boughtAt && now - Date.parse(x.at) < 30 * DAY).length,
    people: fresh,
  };
}

/** The answer, in one line and a colour. */
function verdict(s: Sum): { tone: Tone; badge: string; line: string; sub: string } {
  const early = s.leads > 0 && s.young / s.leads >= 0.5;
  const youngLine = s.young ? ` ${s.young} of the ${s.leads} signed up less than 30 days ago and can still buy.` : "";
  if (s.spend === null) return { tone: "warn", badge: "No ad spend", line: `${s.buyers} of ${s.leads} people bought`, sub: "Meta isn't connected, so the cost per buyer is unknown." };
  if (s.buyers === 0)
    return early
      ? { tone: "warn", badge: "Too early", line: `${eur0(s.spend)} of ads, no buyer yet`, sub: `Most leads are new.${youngLine}` }
      : { tone: "bad", badge: "Not paying back", line: `${eur0(s.spend)} of ads, no buyer`, sub: `None of the ${s.leads} people bought.${youngLine}` };
  const per = s.spend / s.buyers;
  const tone: Tone = per <= TARGET ? "good" : per <= TARGET * 2 ? "warn" : early ? "warn" : "bad";
  const badge = per <= TARGET ? "Worth it" : tone === "warn" ? (early ? "Too early" : "Close") : "Too expensive";
  const cmp = per <= TARGET ? `cheaper than a buyer from the normal ads (~€${TARGET})` : `a buyer from the normal ads costs ~€${TARGET}`;
  return { tone, badge, line: `${eur0(per)} of ads per buyer`, sub: `${cmp}.${youngLine}` };
}

function Chain({ s }: { s: Sum }) {
  const profit = s.spend === null ? null : s.earned - s.spend;
  const steps: { value: string; label: string; sub?: string; tone?: Tone }[] = [
    { value: s.spend === null ? "—" : eur0(s.spend), label: "spent on ads" },
    { value: String(s.leads), label: "signed up", sub: s.spend !== null && s.leads ? `${eur0(s.spend / s.leads)} each` : undefined },
    { value: String(s.checkout), label: "opened the checkout", sub: pct(s.checkout, s.leads) },
    { value: String(s.buyers), label: "bought", sub: pct(s.buyers, s.leads), tone: s.buyers ? "good" : undefined },
    { value: eur0(s.earned), label: "they spent with us", sub: s.buyers ? `${eur0(s.earned / s.buyers)} per buyer` : undefined },
    { value: profit === null ? "—" : eur0(profit), label: profit !== null && profit < 0 ? "still to earn back" : "profit", tone: profit === null ? undefined : profit >= 0 ? "good" : "bad" },
  ];
  return (
    <div className={f.chain}>
      {steps.map((x, i) => (
        <div key={x.label} className={f.link}>
          <div className={`${f.linkValue} ${x.tone ? f[`t_${x.tone}`] : ""}`}>{x.value}</div>
          <div className={f.linkLabel}>{x.label}</div>
          {x.sub ? <div className={f.linkSub}>{x.sub}</div> : null}
          {i < steps.length - 1 ? <span className={f.arrow} aria-hidden="true">→</span> : null}
        </div>
      ))}
    </div>
  );
}

const BINS: { label: string; max: number }[] = [
  { label: "Same day", max: 1 },
  { label: "2 to 7 days", max: 7 },
  { label: "8 to 30 days", max: 30 },
  { label: "31 to 60 days", max: 60 },
  { label: "After 60 days", max: Infinity },
];

/** How long after signing up the buyers bought, and how many leads can still buy. */
function WhenTheyBuy({ s, now }: { s: Sum; now: number }) {
  const waits = s.people.filter((x) => x.boughtAt).map((x) => (Date.parse(x.boughtAt!) - Date.parse(x.at)) / DAY);
  const counts = BINS.map((b, i) => waits.filter((w) => w < b.max && (i === 0 || w >= BINS[i - 1].max)).length);
  const max = Math.max(1, ...counts);
  const ages = [
    { label: "under 7 days", n: s.people.filter((x) => !x.boughtAt && now - Date.parse(x.at) < 7 * DAY).length },
    { label: "7 to 30 days", n: s.people.filter((x) => !x.boughtAt && now - Date.parse(x.at) >= 7 * DAY && now - Date.parse(x.at) < 30 * DAY).length },
    { label: "over 30 days", n: s.people.filter((x) => !x.boughtAt && now - Date.parse(x.at) >= 30 * DAY).length },
  ];
  const waiting = ages.reduce((n, a) => n + a.n, 0);
  const median = waits.length ? [...waits].sort((a, b) => a - b)[Math.floor(waits.length / 2)] : null;
  return (
    <div className={f.card}>
      <div className={f.cardHead}>
        <h2 className={f.cardTitle}>When they buy</h2>
        <span className={f.cardNote}>
          {median === null ? "no buyer yet" : `${waits.length} buyer${waits.length === 1 ? "" : "s"} · typical wait ${median < 1 ? "under a day" : `${Math.round(median)} days`}`}
        </span>
      </div>
      <div className={f.bins}>
        {BINS.map((b, i) => (
          <div key={b.label} className={f.bin}>
            <span className={f.binLabel}>{b.label}</span>
            <div className={f.binTrack}>
              <div className={f.binFill} style={{ width: `${(counts[i] / max) * 100}%` }} />
            </div>
            <span className={f.binValue}>{counts[i]}</span>
          </div>
        ))}
      </div>
      <div className={f.ageHead}>
        Not bought yet: <b>{waiting}</b> people, by how long ago they signed up
      </div>
      <div className={f.ageBar}>
        {ages.map((a, i) =>
          a.n ? (
            <div key={a.label} className={`${f.ageSeg} ${f[`age${i}`]}`} style={{ flexGrow: a.n }} title={`${a.n} signed up ${a.label} ago`}>
              {a.n}
            </div>
          ) : null,
        )}
      </div>
      <div className={f.ageKeys}>
        {ages.map((a, i) => (
          <span key={a.label}>
            <i className={`${f.key} ${f[`age${i}`]}`} />
            {a.label}
          </span>
        ))}
      </div>
      <p className={f.hint}>On ClickFunnels 1 in 4 free-pack buyers bought a month or more after signing up: give a pack 30–60 days before judging it.</p>
    </div>
  );
}

function Packs({ rows }: { rows: { name: string; s: Sum }[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.s.spend ?? 0, r.s.earned]));
  return (
    <div className={f.card}>
      <div className={f.cardHead}>
        <h2 className={f.cardTitle}>Which pack pays</h2>
        <span className={f.cardNote}>
          <i className={`${f.key} ${f.keySpend}`} />
          ads <i className={`${f.key} ${f.keyEarned}`} />
          earned
        </span>
      </div>
      <div className={f.packRows}>
        {rows.map(({ name, s }) => {
          const v = verdict(s);
          return (
            <div key={name} className={f.packRow}>
              <div className={f.packRowHead}>
                <span className={f.packName}>{name}</span>
                <span className={`${f.badge} ${f[`b_${v.tone}`]}`}>{v.badge}</span>
              </div>
              <div className={f.duo}>
                <div className={f.duoBar}>
                  <div className={f.spendFill} style={{ width: `${((s.spend ?? 0) / max) * 100}%` }} />
                  <span>{s.spend === null ? "—" : eur0(s.spend)}</span>
                </div>
                <div className={f.duoBar}>
                  <div className={f.earnedFill} style={{ width: `${(s.earned / max) * 100}%` }} />
                  <span>{eur0(s.earned)}</span>
                </div>
              </div>
              <div className={f.packFacts}>
                {s.leads} signed up{s.spend !== null && s.leads ? ` (${eur0(s.spend / s.leads)} each)` : ""} · {s.checkout} opened the checkout ·{" "}
                <b>
                  {s.buyers} bought{s.buyers && s.spend !== null ? ` (${eur0(s.spend / s.buyers)} of ads each)` : ""}
                </b>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function status(x: FreePackPerson): { label: string; cls: string } {
  if (x.alreadyBuyer) return { label: "Bought before signing up", cls: f.status_off };
  if (x.boughtAt) {
    const wait = Math.round((Date.parse(x.boughtAt) - Date.parse(x.at)) / DAY);
    const r = x.revenue;
    const amount = [r.usd ? `$${(r.usd / 100).toFixed(0)}` : "", r.eur ? `€${(r.eur / 100).toFixed(0)}` : ""].filter(Boolean).join(" + ");
    return { label: `Bought ${amount} · ${day(x.boughtAt)}, ${wait ? `${wait} days after` : "same day"}${x.boughtAs ? ` · as ${x.boughtAs}` : ""}`, cls: f.status_bought };
  }
  const kit = x.kit;
  const next =
    kit && (kit.state === "waiting" || kit.state === "sending")
      ? `Drum Kit email ${kit.sent + 1}/${kit.of}${kit.nextAt ? ` · ${day(kit.nextAt)}` : ""}`
      : kit?.state === "done"
        ? "Got all Drum Kit emails"
        : kit?.state === "stopped"
          ? "Drum Kit emails stopped"
          : "Not in the Drum Kit emails";
  if (x.checkoutAt) return { label: `Opened checkout ${day(x.checkoutAt)} · then ${next.replace(/^Drum Kit email/, "email")}`, cls: f.status_checkout };
  return { label: next, cls: kit ? "" : f.status_off };
}

type Filter = "all" | "checkout" | "bought";
const SHORT = new Set(["today", "yesterday", "7d", "28d", "this-month", "last-month"]);

export function FreePacksPanel() {
  const [range, setRange] = useRange();
  const [stats, setStats] = useState<FreePackStats | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    setStats(null);
    setError("");
    fetch(`/api/free-packs?range=${range}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setStats(await r.json());
      })
      .catch((err) => setError(`Couldn't load the free packs (${String(err)}).`));
  }, [range]);

  const people = useMemo(() => stats?.people ?? [], [stats]);
  const rate = stats?.usdToEur ?? 0.92;
  const spendOf = (label?: string) => {
    if (!stats?.spend.connected) return null;
    const by = stats.spend.byPack;
    return label ? (by[label]?.spend ?? 0) : Object.values(by).reduce((n, x) => n + x.spend, 0);
  };
  const all = sumUp(people, spendOf(), rate, now);
  const packs = (stats?.packs ?? []).map((p) => ({ name: p.label, s: sumUp(people.filter((x) => x.pack === p.label), spendOf(p.label), rate, now) }));
  const v = verdict(all);
  const shown = people.filter((x) =>
    filter === "bought" ? !x.alreadyBuyer && x.boughtAt : filter === "checkout" ? !x.alreadyBuyer && x.checkoutAt && !x.boughtAt : true,
  );
  const before = people.filter((x) => x.alreadyBuyer).length;

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Free packs</h1>
          <p className="page-sub">{error || (stats ? "Are the free-pack ads worth it? Everyone who signed up in the period, and what they bought after." : "Loading…")}</p>
        </div>
      </div>

      <div className={e.toolbar}>
        <RangePicker value={range} onChange={setRange} />
        {SHORT.has(range) ? <span className={f.rangeHint}>Leads buy weeks later: pick 90 days or more to judge.</span> : null}
      </div>

      {stats && stats.leads === 0 ? (
        <div className={e.empty}>
          <div>No sign-ups in this period yet. They appear here from the first one on.</div>
        </div>
      ) : stats ? (
        <>
          <section className={`${f.hero} ${f[`hero_${v.tone}`]}`}>
            <span className={`${f.badge} ${f[`b_${v.tone}`]}`}>{v.badge}</span>
            <div className={f.heroLine}>{v.line}</div>
            <div className={f.heroSub}>{v.sub}</div>
            <Chain s={all} />
          </section>

          <div className={f.twoCol}>
            <WhenTheyBuy s={all} now={now} />
            <Packs rows={packs} />
          </div>

          <div className={e.toolbar} style={{ justifyContent: "space-between" }}>
            <h2 className={f.sectionTitle} style={{ margin: 0 }}>
              People
              {before ? <span className={f.sectionNote}> · {before} had already bought before signing up: left out of the numbers</span> : null}
            </h2>
            <div className={f.filters}>
              {(
                [
                  ["all", `Everyone ${people.length}`],
                  ["checkout", `Opened checkout, not bought ${all.checkout - all.people.filter((x) => x.checkoutAt && x.boughtAt).length}`],
                  ["bought", `Bought ${all.buyers}`],
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
