"use client";

import { useEffect, useState } from "react";
import type { FunnelLaunchStats } from "@/lib/funnelLaunches";
import c from "./launches.module.css";

// Dashboard → Launches → a code funnel's launch (lib/funnelLaunches.ts):
// one hero number, the tiles, then emails → visitors → sales.

const eur = (n: number) => `€${n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(2).replace(/\.00$/, "")}`;
const pct = (part: number, of: number) => (!of ? "—" : !part ? "0%" : `${((part / of) * 100).toFixed(part / of >= 0.1 ? 0 : 1)}%`);
const SIGN: Record<string, string> = { eur: "€", usd: "$", gbp: "£", chf: "CHF " };

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
const dayLabel = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

function left(ms: number) {
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3600_000);
  return h >= 48 ? `${Math.floor(h / 24)} days left` : `${h} h left`;
}

export function FunnelLaunchDetail({ id }: { id: string }) {
  const [d, setD] = useState<FunnelLaunchStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetch(`/api/launches/funnel/${id}`)
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error ?? `Request failed (${r.status})`);
          if (live) {
            setD(j);
            setError(null);
          }
        })
        .catch((e) => live && setError((e as Error).message));
    load();
    // A launch moves by the minute: read it again every minute while open.
    const t = setInterval(load, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [id]);

  if (error) return <p className={c.error}>{error}</p>;
  if (!d) return <p className="page-sub">Loading the launch…</p>;

  const landing = d.steps.find((s) => s.page === "landing")?.browsers ?? 0;
  const maxDay = Math.max(1, ...d.days.map((x) => x.revenue));
  const maxStep = Math.max(1, ...d.steps.map((s) => s.browsers));
  const sentOut = d.emails.filter((e) => e.status === "sent");
  const emailVisitors = d.sources.filter((s) => s.source === "Email").reduce((n, s) => n + s.visitors, 0);
  const allVisitors = d.sources.reduce((n, s) => n + s.visitors, 0);

  return (
    <>
      <div className={c.panel}>
        <div className={c.panelHead}>
          <div>
            <p className={c.h2}>{d.def.name} launch</p>
            <p className={c.sub}>
              {d.def.priceNote} · /{d.def.funnel}
            </p>
          </div>
          <span className={`${c.chip} ${d.phase === "live" ? c.chip_open : ""}`}>
            {d.phase === "live" ? `LIVE · ${left(Date.parse(d.def.ends) - Date.now())}` : d.phase.toUpperCase()}
          </span>
        </div>
        <div className={c.hero}>
          <span className={c.heroValue}>{eur(d.revenue)}</span>
          <span className={c.sub}>
            revenue on the funnel since {when(d.def.start)}, upsells included (dollars at {d.usdToEur.toFixed(3)})
          </span>
        </div>
        {d.def.cap && (
          <div className={c.capRow}>
            <span className={c.mono}>
              {d.copies} / {d.def.cap} copies at the launch price
            </span>
            <span className={c.barTrack}>
              <span className={c.barFill} style={{ display: "block", width: `${Math.min(100, (d.copies / d.def.cap) * 100)}%` }} />
            </span>
          </div>
        )}
      </div>

      <div className={c.stats}>
        <Stat label="ORDERS" value={d.orders} sub={`${d.buyers} buyer${d.buyers === 1 ? "" : "s"}`} />
        <Stat label="UPSELLS" value={d.upsells} sub={d.orders ? `${pct(d.upsells, d.orders)} of orders` : undefined} />
        <Stat label="ADD-ONS" value={d.addOns} sub={d.orders ? `${pct(d.addOns, d.orders)} of orders` : undefined} />
        <Stat label="PER BUYER" value={d.buyers ? eur(d.revenue / d.buyers) : "—"} />
        <Stat label="EMAILS SENT" value={d.emailTotals.sent.toLocaleString("en-US")} sub={`${sentOut.length} out, ${d.emailTotals.scheduled} to go`} />
        <Stat label="EMAIL CLICKERS" value={d.emailTotals.clickers} sub={`${pct(d.emailTotals.clickers, d.emailTotals.sent)} of sent`} />
        <Stat label="VISITORS → BUYERS" value={pct(d.orders, landing)} sub={`${d.orders} of ${landing} on the landing`} />
      </div>

      <div className={c.panel}>
        <p className={c.h2}>Sales per day</p>
        <div className={c.bars} style={{ marginTop: 10 }}>
          {d.days.map((x) => (
            <div key={x.day} className={c.barRow}>
              <span className={c.mono}>{dayLabel(x.day)}</span>
              <span className={c.barTrack}>
                <span className={c.barFill} style={{ display: "block", width: `${(x.revenue / maxDay) * 100}%` }} />
              </span>
              <span className={c.mono}>
                {x.revenue ? `${eur(x.revenue)} · ${x.orders}${x.upsells ? ` + ${x.upsells} up` : ""}` : "—"}
              </span>
            </div>
          ))}
        </div>
        <p className={c.note} style={{ marginTop: 10 }}>
          Days in Polish time, card and PayPal together.
        </p>
      </div>

      <div className={c.panel}>
        <p className={c.h2}>The funnel, step by step</p>
        <p className={c.sub}>Browsers that opened each page since the launch began, and the share of the step before.</p>
        <div className={c.bars} style={{ marginTop: 12 }}>
          {d.steps.map((s, i) => (
            <div key={s.page} className={c.barRow}>
              <span className={c.mono}>{s.label}</span>
              <span className={c.barTrack}>
                <span className={c.barFill} style={{ display: "block", width: `${(s.browsers / maxStep) * 100}%` }} />
              </span>
              <span className={c.mono}>
                {s.browsers}
                {i > 0 && d.steps[i - 1].browsers ? ` · ${pct(s.browsers, d.steps[i - 1].browsers)}` : ""}
              </span>
            </div>
          ))}
        </div>
        {allVisitors > 0 && (
          <p className={c.note} style={{ marginTop: 12 }}>
            Where they came from:{" "}
            {d.sources
              .slice(0, 5)
              .map((s) => `${s.source}${s.campaign ? ` (${s.campaign})` : ""} ${s.visitors}`)
              .join(" · ")}
            {emailVisitors ? `. ${pct(emailVisitors, allVisitors)} from email.` : ""}
          </p>
        )}
      </div>

      <div className={c.panel}>
        <p className={c.h2}>Launch emails</p>
        <p className={c.sub}>Every broadcast that links to the funnel. Orders: buyers who clicked it, same address, in the 5 days before paying.</p>
        <div className={c.table} style={{ marginTop: 12 }}>
          <div className={`${c.tr} ${c.th}`}>
            <span>Sent</span>
            <span>Subject</span>
            <span className={c.num}>Sent to</span>
            <span className={c.num}>Clicked</span>
            <span className={c.num}>Orders</span>
          </div>
          {d.emails.map((e) => (
            <div key={e.id} className={`${c.tr} ${e.status === "sent" ? "" : c.trLater}`}>
              <span className={c.mono}>{e.at ? when(e.at) : "—"}</span>
              <span className={c.subject}>{e.subject}</span>
              <span className={`${c.num} ${c.mono}`}>{e.status === "sent" ? e.sent.toLocaleString("en-US") : e.status}</span>
              <span className={`${c.num} ${c.mono}`}>{e.status === "sent" ? `${e.clickers} · ${pct(e.clickers, e.sent)}` : ""}</span>
              <span className={`${c.num} ${c.mono}`}>{e.status === "sent" ? (e.orders ? `${e.orders} · ${eur(e.revenue)}` : "0") : ""}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={c.panel}>
        <p className={c.h2}>Orders</p>
        {d.list.length === 0 ? (
          <p className={c.sub}>No orders yet.</p>
        ) : (
          <div className={c.table} style={{ marginTop: 12 }}>
            {d.list.map((o) => (
              <div key={o.id} className={`${c.tr} ${c.trOrder}`}>
                <span className={c.mono}>{when(o.at)}</span>
                <span className={c.subject}>
                  {o.what}
                  <span className={c.mono}>
                    {" "}
                    · {o.provider}
                    {o.country ? ` · ${o.country}` : ""}
                    {o.credit ? ` · ${o.credit}` : ""}
                  </span>
                </span>
                <span className={`${c.num} ${c.mono}`}>
                  {SIGN[o.currency] ?? ""}
                  {o.amount}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className={c.note} style={{ marginTop: 10 }}>
          An order with no email next to it paid with an address that never clicked a launch email (PayPal often pays with another one), or came in another way.
        </p>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={c.stat}>
      <div className={c.statLabel}>{label}</div>
      <div className={c.statValue}>{value}</div>
      {sub && <div className={c.statSub}>{sub}</div>}
    </div>
  );
}
