"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { I } from "@/components/icons";
import type { Analytics, Metrics, Range } from "@/lib/analytics";
import type { FunnelMap, MapStep } from "@/lib/funnelMap";
import s from "./funnelMap.module.css";

// A funnel's map, like ClickFunnels' funnel view: where it starts, then each
// page in order with its picture, live link and numbers for the chosen range.

const RANGES: { id: Range; label: string; note: string }[] = [
  { id: "7d", label: "7D", note: "the last 7 days" },
  { id: "28d", label: "28D", note: "the last 28 days" },
  { id: "all", label: "ALL", note: "all time" },
];

const int = (n: number) => n.toLocaleString("en-US");
const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const pct = (part: number, whole: number) => (whole > 0 ? ` (${((part / whole) * 100).toFixed(part / whole < 0.1 ? 1 : 0)}%)` : "");

type Stat = { label: string; value: string; tone?: "sky" | "amber" | "mint" | "accent" };

function stepStats(step: MapStep, m: Metrics, hasOrderStep: boolean): Stat[] {
  if (step.kind === "landing") {
    return hasOrderStep
      ? [
          { label: "Visitors", value: int(m.visitors), tone: "sky" },
          { label: "Went to order page", value: int(m.orderViews) + pct(m.orderViews, m.visitors), tone: "amber" },
        ]
      : [
          { label: "Visitors", value: int(m.visitors), tone: "sky" },
          { label: "Checkouts", value: int(m.checkouts) + pct(m.checkouts, m.visitors), tone: "amber" },
          { label: "Orders", value: int(m.orders), tone: "mint" },
        ];
  }
  if (step.kind === "order") {
    return [
      { label: "Visitors", value: int(m.orderViews), tone: "sky" },
      { label: "Checkouts", value: int(m.checkouts) + pct(m.checkouts, m.orderViews), tone: "amber" },
      { label: "Orders", value: int(m.orders) + pct(m.ratedOrders, m.checkouts), tone: "mint" },
      { label: "Revenue", value: eur(m.revenue), tone: "accent" },
    ];
  }
  if (step.kind === "thank-you") {
    return [
      { label: "Visitors", value: int(m.thankYouViews), tone: "sky" },
      { label: "Orders", value: int(m.orders), tone: "mint" },
      { label: "Revenue", value: eur(m.revenue), tone: "accent" },
    ];
  }
  return [];
}

function CopyButton({ text, label = "Copy URL" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={s.btn}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        });
      }}
    >
      {done ? <I.check size={13} /> : <I.copy size={13} />} {done ? "Copied" : label}
    </button>
  );
}

export function FunnelMapView({ map }: { map: FunnelMap }) {
  const [range, setRange] = useState<Range>("28d");
  const [lang, setLang] = useState(map.langs[0]?.lang ?? "en");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(Boolean(map.statsSlug));

  useEffect(() => {
    if (!map.statsSlug) return;
    let live = true;
    setLoading(true);
    fetch(`/api/analytics?range=${range}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Analytics>) : null))
      .then((a) => live && setData(a))
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [range, map.statsSlug]);

  const current = map.langs.find((l) => l.lang === lang) ?? map.langs[0];
  const stats = data?.funnels.find((f) => f.slug === map.statsSlug);
  const metrics = stats ? (map.langs.length > 1 ? stats.langs?.find((l) => l.lang === lang)?.m : stats.total) : undefined;
  const hasOrderStep = current.steps.some((st) => st.kind === "order");
  const entry = current.steps[0];

  return (
    <div className={s.page}>
      <header className={s.bar}>
        <Link href="/" className={s.back} title="Back to the dashboard">
          <I.arrowLeft size={16} />
        </Link>
        <div className={s.title}>
          <span className={s.name}>{map.name}</span>
          <span className={`status ${map.status}`}>
            {map.status === "live" && <span className="dotpulse" />}
            {map.status}
          </span>
        </div>
        <div className={s.barRight}>
          {map.langs.length > 1 && (
            <div className="tabs" role="tablist" aria-label="Language">
              {map.langs.map((l) => (
                <button key={l.lang} type="button" className={`tab ${l.lang === lang ? "active" : ""}`} onClick={() => setLang(l.lang)}>
                  {l.label}
                </button>
              ))}
            </div>
          )}
          {map.statsSlug && (
            <div className="tabs" role="tablist" aria-label="Range">
              {RANGES.map((r) => (
                <button key={r.id} type="button" className={`tab ${r.id === range ? "active" : ""}`} onClick={() => setRange(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {entry && (
            <a href={entry.url} target="_blank" rel="noreferrer" className="btn primary">
              <I.eye size={14} /> Open funnel
            </a>
          )}
        </div>
      </header>

      <main className={s.canvas}>
        {entry && (
          <section className={s.start}>
            <div className={s.startHead}>
              <I.funnel size={15} /> Start of funnel
            </div>
            <div className={s.url}>{entry.url}</div>
            <div className={s.actions}>
              <a href={entry.url} target="_blank" rel="noreferrer" className={s.btn}>
                <I.eye size={13} /> Open page
              </a>
              <CopyButton text={entry.url} />
            </div>
          </section>
        )}

        {current.steps.map((step) => {
          const rows = metrics ? stepStats(step, metrics, hasOrderStep) : [];
          return (
            <div key={step.kind + step.path} className={s.stepWrap}>
              <div className={s.connector} aria-hidden />
              <section className={s.step}>
                <div className={s.card}>
                  <a href={step.url} target="_blank" rel="noreferrer" className={s.thumb} title="Open the page">
                    {step.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={step.image} alt="" loading="lazy" />
                    ) : (
                      <span className={s.thumbEmpty}>
                        {step.kind === "thank-you" ? <I.check size={22} /> : <I.page size={22} />}
                      </span>
                    )}
                  </a>
                  <div className={s.info}>
                    <div className={s.stepName}>{step.name}</div>
                    <div className={s.path}>{step.path}</div>
                    <div className={s.actions}>
                      <a href={step.url} target="_blank" rel="noreferrer" className={s.btn}>
                        <I.eye size={13} /> Open page
                      </a>
                      <CopyButton text={step.url} />
                      {step.editUrl && (
                        <Link href={step.editUrl} className={s.btn}>
                          <I.brand size={13} /> Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                {map.statsSlug && (
                  <div className={s.stats} style={{ opacity: loading ? 0.5 : 1 }}>
                    {rows.length
                      ? rows.map((r) => (
                          <div key={r.label} className={`${s.stat} ${r.tone ? s[r.tone] : ""}`}>
                            <span className={s.statLabel}>{r.label}</span>
                            <span className={s.statValue}>{r.value}</span>
                          </div>
                        ))
                      : <div className={s.stat}><span className={s.statLabel}>{loading ? "Loading…" : "No numbers yet"}</span></div>}
                  </div>
                )}
              </section>
            </div>
          );
        })}

        {map.statsSlug && (
          <p className={s.note}>
            <I.analytics size={12} /> Numbers for {RANGES.find((r) => r.id === range)?.note}
            {map.langs.length > 1 ? `, ${current.label} pages` : ""}. Visitors are counted by our own script
            {data?.trackingSince ? ` since ${data.trackingSince}` : ""}; orders come from Stripe and PayPal.{" "}
            <Link href="/?nav=analytics" className={s.link}>
              All analytics
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
