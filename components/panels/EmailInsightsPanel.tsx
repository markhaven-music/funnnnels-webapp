"use client";

import { useEffect, useMemo, useState } from "react";
import { I } from "@/components/icons";
import type { Analytics, Range } from "@/lib/analytics";
import {
  CLICKS_SINCE,
  KIND_LABEL,
  WINDOW_DAYS,
  clickRate,
  clicksCounted,
  emailNotes,
  type EmailInsights,
  type EmailRow,
  type Tally,
} from "@/lib/emailInsights";
import type { EmailKind } from "@/lib/mail";
import s from "../home.module.css";
import e from "./email.module.css";
import x from "./emailInsights.module.css";

// Dashboard → Email → Insights: what the emails bring in. Revenue, orders and
// clicks per broadcast and per automation, and the notes that stand out
// (lib/emailInsights.ts). Real numbers only (docs/design.md): an order counts
// for an email when its buyer clicked it in the 5 days before paying.

const RANGE_LABEL: Record<Range, string> = { "7d": "7D", "28d": "28D", all: "All" };

const eur = (n: number) => (n >= 10_000 ? `€${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : `€${Math.round(n).toLocaleString("en-US")}`);
const pct = (n: number) => `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
const num = (n: number) => n.toLocaleString("en-US");
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const sales = (t: Tally) => `${t.orders}${t.upsells ? ` + ${t.upsells}` : ""}`;

/** All revenue in the range (dashboard home's number), for the share that came from email. */
function useAllRevenue(range: Range, home: Analytics | null): number | null {
  const [loaded, setLoaded] = useState<Partial<Record<Range, number>>>({});
  useEffect(() => {
    if (range === "28d" || loaded[range] !== undefined) return;
    fetch(`/api/analytics?range=${range}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Analytics>) : null))
      .then((a) => a && setLoaded((l) => ({ ...l, [range]: a.days.reduce((n, d) => n + d.revenue, 0) })))
      .catch(() => {});
  }, [range, loaded]);
  if (range === "28d") return home ? home.days.reduce((n, d) => n + d.revenue, 0) : null;
  return loaded[range] ?? null;
}

export function EmailInsightsPanel({ analytics }: { analytics: Analytics | null }) {
  const [range, setRange] = useState<Range>("28d");
  const [loaded, setLoaded] = useState<Partial<Record<Range, EmailInsights>>>({});
  const [failed, setFailed] = useState("");
  useEffect(() => {
    if (loaded[range]) return;
    fetch(`/api/email/insights?range=${range}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = (await r.json()) as EmailInsights;
        setLoaded((l) => ({ ...l, [range]: d }));
        setFailed("");
      })
      .catch((err) => setFailed(String(err.message ?? err)));
  }, [range, loaded]);
  // While another range loads, the last one stays on screen, dimmed.
  const [shown, setShown] = useState<EmailInsights | null>(null);
  const current = loaded[range] ?? null;
  useEffect(() => {
    if (current) setShown(current);
  }, [current]);
  const d = current ?? shown;
  const allRevenue = useAllRevenue(range, analytics);
  const notes = useMemo(() => (d ? emailNotes(d, allRevenue) : []), [d, allRevenue]);

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Email insights</h1>
          <p className="page-sub">
            What your emails bring in. An order counts for an email when the buyer clicked a link in it in the {WINDOW_DAYS} days before paying.
          </p>
        </div>
      </div>

      <div className={s.filters}>
        <div className="tabs">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button key={r} type="button" className={`tab ${range === r ? "active" : ""}`} onClick={() => setRange(r)}>
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
        <span className={s.note}>Clicks counted since {day(CLICKS_SINCE)}</span>
        {failed && <span className={s.warn}>Couldn&apos;t load: {failed}</span>}
      </div>

      <div className={!current && shown ? s.stale : undefined}>
        <Tiles d={d} allRevenue={allRevenue} />
        {d && (
          <>
            <div className={notes.length ? s.row : `${s.row} ${s.rowFull}`}>
              <div className={x.card}>
                <div className={s.cardHead}>
                  <div className={s.title}>Revenue by email</div>
                  <div className={s.sub}>after a click, in €</div>
                </div>
                <ByKind d={d} />
              </div>
              {notes.length > 0 && (
                <div className={`${x.card} ${s.insights}`}>
                  <div className={s.cardHead}>
                    <div className={s.title}>
                      <I.sparkles size={13} /> Insights
                    </div>
                    <div className={s.sub}>from your emails</div>
                  </div>
                  <ul className={s.list}>
                    {notes.map((it) => (
                      <li key={it.text} className={s[it.tone]}>
                        <span className={s.mark} aria-hidden>
                          {it.tone === "up" ? "▲" : it.tone === "down" ? "▼" : "●"}
                        </span>
                        <span>{it.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Table title="Broadcasts and launch emails" rows={d.campaigns} first="SUBJECT" second="SENT ON" empty="No broadcast went out in this range." />
            <Table title="Automations" rows={d.automations} first="NAME" second="STARTS" empty="No automation is on." />

            <p className={x.foot}>
              Revenue in euros, dollar sales at {d.usdToEur.toFixed(2)}. Upsells bought right after an order count with it.
              {d.total.received.revenue > 0 &&
                ` Not counted above: ${eur(d.total.received.revenue)} (${sales(d.total.received)} orders) from people who bought within ${WINDOW_DAYS} days of getting an email without clicking it.`}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Tiles({ d, allRevenue }: { d: EmailInsights | null; allRevenue: number | null }) {
  if (!d) {
    return (
      <div className="stats">
        {["Revenue from email", "Orders from email", "Emails sent", "Click rate"].map((l) => (
          <div key={l} className="stat">
            <div className="stat-label">{l}</div>
            <div className="v">—</div>
            <span className={`delta ${s.flat}`}>loading…</span>
          </div>
        ))}
      </div>
    );
  }
  const t = d.total;
  const tiles = [
    {
      label: "Revenue from email",
      color: "oklch(0.74 0.19 295)",
      value: eur(t.clicked.revenue),
      unit: undefined as string | undefined,
      note: !t.clicked.revenue
        ? "no sale after a click yet"
        : allRevenue && allRevenue > 0
          ? `${pct(Math.min(1, t.clicked.revenue / allRevenue))} of all revenue (${eur(allRevenue)})`
          : "after a click",
    },
    {
      label: "Orders from email",
      color: "oklch(0.82 0.18 295)",
      value: num(t.clicked.orders),
      unit: t.clicked.upsells ? `+ ${t.clicked.upsells} upsell${t.clicked.upsells === 1 ? "" : "s"}` : undefined,
      note: t.received.orders ? `+ ${t.received.orders} after getting one, no click` : `clicked in the ${WINDOW_DAYS} days before`,
    },
    {
      label: "Emails sent",
      color: "oklch(0.78 0.13 230)",
      value: num(t.sent),
      unit: undefined,
      note: t.failed ? `${num(t.failed)} failed` : "broadcasts, sequences, reminders",
    },
    {
      label: "Click rate",
      color: "oklch(0.86 0.16 165)",
      value: t.sent ? (clickRate(t) * 100).toFixed(1) : "—",
      unit: t.sent ? "%" : undefined,
      note: `${num(t.clickers)} click${t.clickers === 1 ? "" : "s"} by readers`,
    },
  ];
  return (
    <div className="stats">
      {tiles.map((k) => (
        <div key={k.label} className="stat">
          <div className="stat-label">
            <span className="lk" style={{ background: k.color }} />
            {k.label}
          </div>
          <div className="v">
            {k.value}
            {k.unit && <small>{k.unit}</small>}
          </div>
          <span className={`delta ${s.flat}`}>{k.note}</span>
        </div>
      ))}
    </div>
  );
}

function ByKind({ d }: { d: EmailInsights }) {
  const sent: Record<EmailKind, number> = { broadcast: 0, sequence: 0, reminder: 0, launch: 0 };
  for (const r of [...d.campaigns, ...d.automations]) sent[r.kind] += r.sent;
  const kinds = (Object.keys(KIND_LABEL) as EmailKind[]).filter((k) => sent[k] > 0 || d.byKind[k].revenue > 0);
  const max = Math.max(...kinds.map((k) => d.byKind[k].revenue), 0);
  if (!kinds.length) return <div className={s.empty}>No email went out in this range.</div>;
  return (
    <div className={s.hbars}>
      {kinds.map((k) => {
        const t = d.byKind[k];
        return (
          <div key={k} className={s.hrow}>
            <div className={s.hname}>
              <span>{KIND_LABEL[k]}</span>
              <span className={s.hmeta}>
                {sales(t)} order{t.orders + t.upsells === 1 ? "" : "s"} · {num(sent[k])} sent
              </span>
            </div>
            <div className={s.htrack}>
              <span className={s.hbar} style={{ width: `${max ? (t.revenue / max) * 100 : 0}%` }} />
              <span className={s.hval}>{eur(t.revenue)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const COLS = { gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1.2fr) 80px 110px 70px 90px 60px" };

function Table({ title, rows, first, second, empty }: { title: string; rows: EmailRow[]; first: string; second: string; empty: string }) {
  return (
    <>
      <div className="section-head">
        <div className="section-title">
          {title}
          <span className="count">{rows.length}</span>
        </div>
      </div>
      <div className={`${e.table} ${x.table}`}>
        <div className={e.head} style={COLS}>
          <span>{first}</span>
          <span>{second}</span>
          <span className={x.num}>SENT</span>
          <span className={x.num}>CLICKED</span>
          <span className={x.num}>ORDERS</span>
          <span className={x.num}>REVENUE</span>
          <span className={x.num} title="Unsubscribed in the 7 days after it">LEFT</span>
        </div>
        {rows.length === 0 && <div className={`${e.row} ${e.dim}`}>{empty}</div>}
        {rows.map((r) => (
          <div key={`${r.kind}:${r.id}`} className={e.row} style={COLS}>
            <span className={`${e.cell} ${e.strong}`} title={r.name}>
              {r.name}
            </span>
            <span className={`${e.cell} ${e.dim}`} title={r.detail ?? undefined}>
              {r.at ? `${day(r.at)} · ${r.detail}` : r.detail}
            </span>
            <span className={`${e.mono} ${x.num}`}>{num(r.sent)}</span>
            <span className={`${e.mono} ${x.num}`}>
              {!clicksCounted(r) ? "—" : r.sent ? `${num(r.clickers)} · ${pct(clickRate(r))}` : num(r.clickers)}
            </span>
            <span className={`${e.mono} ${x.num}`}>{sales(r.clicked)}</span>
            <span className={`${x.num} ${r.clicked.revenue > 0 ? x.money : x.zero}`}>{eur(r.clicked.revenue)}</span>
            <span className={`${e.mono} ${x.num}`}>{r.kind === "reminder" ? "—" : num(r.unsubscribed)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
