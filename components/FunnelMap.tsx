"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Lanes, previewUrl } from "@/components/FunnelLanes";
import { PriceList, PricesDrawer, type PriceItem } from "@/components/FunnelPrices";
import { I } from "@/components/icons";
import type { Analytics, Metrics, TestStats } from "@/lib/analytics";
import { RangePicker, useRange } from "@/components/RangePicker";
import { rangePhrase } from "@/lib/range";
import type { FunnelMap, MapStep } from "@/lib/funnelMap";
import s from "./funnelMap.module.css";

// A funnel's map, like ClickFunnels' funnel view: where it starts, then each
// page in order with its picture, live link and numbers for the chosen range,
// the A/B test's colours on the steps it runs on, and a + to add a language.
// While a test runs, Lanes shows it as one flow per variant side by side.
// Prices (components/FunnelPrices.tsx): what the order page and each upsell
// charge, changed in a drawer.


type View = "flow" | "lanes";
const VIEW_KEY = "funnel-map-view";

// Languages that can be added with the + (the funnel's own are left out).
// Note: from the Meta ads so far, Spanish and Portuguese markets barely buy.
const ADDABLE: { lang: string; name: string; it: string; note?: string }[] = [
  { lang: "it", name: "Italian", it: "l'italiano" },
  { lang: "de", name: "German", it: "il tedesco" },
  { lang: "nl", name: "Dutch", it: "l'olandese" },
  { lang: "es", name: "Spanish", it: "lo spagnolo", note: "few sales from Spanish-speaking countries so far" },
  { lang: "pt", name: "Portuguese", it: "il portoghese", note: "few sales from Portuguese-speaking countries so far" },
];

const int = (n: number) => n.toLocaleString("en-US");
const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const rate = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(part / whole < 0.1 ? 1 : 0)}%` : "—");
const pct = (part: number, whole: number) => (whole > 0 ? ` (${rate(part, whole)})` : "");

type Stat = { label: string; value: string; tone: "sky" | "amber" | "mint" | "accent" };

function stepStats(step: MapStep, m: Metrics, hasOrderStep: boolean): Stat[] {
  if (step.kind === "landing") {
    return hasOrderStep
      ? [
          { label: "Visitors", value: int(m.visitors), tone: "sky" },
          { label: "Went to order page", value: int(m.orderViews) + pct(m.orderViews, m.visitors), tone: "amber" },
          { label: "Orders / visitor", value: rate(m.ratedOrders, m.visitors), tone: "mint" },
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
      { label: "Net", value: eur(m.net), tone: "accent" },
    ];
  }
  if (step.kind === "upsell" && step.offer) {
    const views = m.upsellViews[step.offer.page] ?? 0;
    const o = m.offers[step.offer.id] ?? { orders: 0, revenue: 0, net: 0 };
    return [
      { label: "Visitors", value: int(views), tone: "sky" },
      { label: "Took it", value: int(o.orders) + pct(o.orders, views), tone: "mint" },
      { label: "Revenue", value: eur(o.revenue), tone: "accent" },
      { label: "Net", value: eur(o.net), tone: "accent" },
    ];
  }
  if (step.kind === "thank-you") {
    return [
      { label: "Visitors", value: int(m.thankYouViews), tone: "sky" },
      { label: "Orders", value: int(m.orders), tone: "mint" },
      { label: "Revenue", value: eur(m.revenue), tone: "accent" },
      { label: "Net", value: eur(m.net), tone: "accent" },
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

/** The A/B test's colours on a step: a row per colour with the numbers that step decides. */
function Variants({ test, scope, step }: { test: TestStats; scope: string; step: MapStep }) {
  const label = (v: string) => test.variants.find((x) => x.variant === v)?.label ?? v;
  const cols =
    step.kind === "landing"
      ? ["Visitors", "Went to order page", "Orders", "Orders / visitor"]
      : ["Visitors", "Checkouts", "Orders", "Revenue"];
  return (
    <div className={s.variants}>
      <div className={s.variantsHead}>
        <span className={s.variantsTitle}>
          <span className={s.dots} aria-hidden>
            {test.variants.map((v) => {
              return <span key={v.variant} style={{ background: v.color.to }} />;
            })}
          </span>
          A/B test · {test.name}
        </span>
        <span className={s.variantsMeta}>
          {test.since ? `since ${test.since} · ` : ""}{scope} ·{" "}
          <Link href="/?nav=analytics" className={s.link}>
            {test.verdict === "winner" && test.leader ? `${label(test.leader)} wins` : test.verdict === "tie" ? "no clear winner" : `${int(test.salesToGo)} sales to a reliable answer`}
          </Link>
        </span>
      </div>
      <div className={s.variantGrid} role="table">
        <div className={`${s.variantRow} ${s.variantHeadRow}`} role="row">
          <span>Variant</span>
          {cols.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        {test.variants.map((v) => {
          const c = v.color;
          const m = v.m;
          const values =
            step.kind === "landing"
              ? [int(m.visitors), int(m.orderViews) + pct(m.orderViews, m.visitors), int(m.orders), rate(m.ratedOrders, m.visitors || m.orderViews)]
              : [int(m.orderViews), int(m.checkouts) + pct(m.checkouts, m.orderViews), int(m.orders) + pct(m.ratedOrders, m.checkouts), eur(m.revenue)];
          return (
            <div key={v.variant} className={s.variantRow} role="row">
              <span className={s.variantName}>
                <span className={s.swatch} style={{ background: `linear-gradient(180deg, ${c.from}, ${c.to})` }} />
                <a href={previewUrl(step.url, v.variant)} target="_blank" rel="noreferrer" className={s.link} title="See this version (not counted as a visit)">
                  {v.label}
                </a>
                {test.leader === v.variant && <span className={s.leading}>leading</span>}
              </span>
              {values.map((val, i) => (
                <span key={i} className={s.num}>
                  {val}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The + next to the languages: pick one, get the request to send to Claude. */
function AddLanguage({ map }: { map: FunnelMap }) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<(typeof ADDABLE)[number] | null>(null);
  const [at, setAt] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const have = new Set(map.langs.map((l) => l.lang));
  const options = ADDABLE.filter((o) => !have.has(o.lang));
  const prompt = pick
    ? `Aggiungi ${pick.it} al funnel ${map.name} (${map.id}): traduci fedelmente pagina di vendita, pagina d'ordine e thank-you come per il francese, con la VSL in ${pick.name.toLowerCase()} (stessa voce ElevenLabs o una nativa della libreria), e mettilo online su m.thegrind.studio/${pick.lang}/${map.id}.`
    : "";
  return (
    <div className={s.addWrap} ref={ref}>
      <button
        type="button"
        className={s.add}
        title="Add a language"
        onClick={(e) => {
          // The strip scrolls sideways, so the menu is placed on the page, under the +.
          const r = e.currentTarget.getBoundingClientRect();
          setAt({ top: r.bottom + 8, left: Math.max(16, Math.min(r.left, window.innerWidth - 356)) });
          setOpen(!open);
          setPick(null);
        }}
      >
        <I.plus size={14} />
      </button>
      {open && (
        <div className={s.pop} style={at} role="dialog" aria-label="Add a language">
          {!pick ? (
            <>
              <div className={s.popTitle}>Add a language</div>
              <p className={s.popText}>The pages are translated by hand (faithfully, like French), so a new language is a request to Claude.</p>
              {options.map((o) => (
                <button key={o.lang} type="button" className={s.popItem} onClick={() => setPick(o)}>
                  <span>
                    {o.name} <code>/{o.lang}/{map.id}</code>
                  </span>
                  {o.note && <span className={s.popNote}>{o.note}</span>}
                </button>
              ))}
            </>
          ) : (
            <>
              <div className={s.popTitle}>Add {pick.name}</div>
              <p className={s.popText}>Send this to Claude Code. It translates the three pages, makes the {pick.name} VSL and puts it live.</p>
              <div className={s.prompt}>{prompt}</div>
              <div className={s.actions}>
                <CopyButton text={prompt} label="Copy request" />
                <button type="button" className={s.btn} onClick={() => setPick(null)}>
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function FunnelMapView({ map, prices = [] }: { map: FunnelMap; prices?: PriceItem[] }) {
  const [range, setRange] = useRange();
  const [lang, setLang] = useState(map.langs[0]?.lang ?? "en");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(Boolean(map.statsSlug));
  const [items, setItems] = useState(prices);
  // The Prices drawer: closed (null), or open on a price's id ("" for the first).
  const [editing, setEditing] = useState<string | null>(null);
  // The lanes need room: they open by themselves on a wide screen, the choice is remembered.
  const [view, setView] = useState<View | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(VIEW_KEY);
    } catch {}
    setView(saved === "flow" || saved === "lanes" ? saved : window.innerWidth >= 760 ? "lanes" : "flow");
  }, []);
  const pickView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

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
  const langMetrics = (l: string) => (map.langs.length > 1 ? stats?.langs?.find((x) => x.lang === l)?.m : stats?.total);
  const metrics = stats ? langMetrics(lang) : undefined;
  // The test on the chosen language's pages, like the rest of the map.
  const wholeTest = data?.tests.find((t) => t.funnel === map.statsSlug) ?? null;
  const test = wholeTest && map.langs.length > 1 ? (wholeTest.byLang?.[lang] ?? wholeTest) : wholeTest;
  const testScope = test !== wholeTest ? `${current.label} pages` : "every language";
  const hasOrderStep = current.steps.some((st) => st.kind === "order");
  const entry = current.steps[0];
  const lanes = test !== null && view === "lanes";

  return (
    <div className={`${s.page} ${lanes ? s.pageLanes : ""}`}>
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
          {test && (
            <div className="tabs" role="tablist" aria-label="View">
              <button type="button" className={`tab ${!lanes ? "active" : ""}`} onClick={() => pickView("flow")}>
                Flow
              </button>
              <button type="button" className={`tab ${lanes ? "active" : ""}`} onClick={() => pickView("lanes")}>
                A/B lanes
              </button>
            </div>
          )}
          {map.statsSlug && !lanes && (
            <RangePicker value={range} onChange={setRange} bare />
          )}
          {items.length > 0 && (
            <button type="button" className="btn ghost" onClick={() => setEditing("")}>
              <I.receipt size={14} /> Prices
            </button>
          )}
          {entry && (
            <a href={previewUrl(entry.url)} target="_blank" rel="noreferrer" className="btn primary" title="Not counted as a visit">
              <I.eye size={14} /> Open funnel
            </a>
          )}
        </div>
      </header>

      {(map.canTranslate || map.langs.length > 1) && (
        <nav className={s.langs} aria-label={map.canTranslate ? "Languages" : "Tabs"}>
          {map.langs.map((l) => {
            const m = langMetrics(l.lang);
            return (
              <button key={l.lang} type="button" className={`${s.lang} ${l.lang === lang ? s.langOn : ""}`} onClick={() => setLang(l.lang)}>
                <span className={s.langName}>{l.label}</span>
                <span className={s.langStats}>
                  {l.summary ?? (m ? `${int(m.visitors)} visitors · ${int(m.orders)} orders · ${eur(m.revenue)}` : loading ? "…" : "no numbers yet")}
                </span>
              </button>
            );
          })}
          {map.canTranslate && <AddLanguage map={map} />}
        </nav>
      )}

      {lanes && test && entry && <Lanes test={test} scope={testScope} steps={current.steps} entryUrl={entry.url} />}

      {!lanes && <main className={s.canvas}>
        {entry && (
          <section className={s.start}>
            <div className={s.startHead}>
              <I.funnel size={15} /> Start of funnel
            </div>
            <div className={s.url}>{entry.url}</div>
            <div className={`${s.actions} ${s.center}`}>
              <a href={previewUrl(entry.url)} target="_blank" rel="noreferrer" className={s.btn} title="Not counted as a visit">
                <I.eye size={13} /> Open page
              </a>
              <CopyButton text={entry.url} />
            </div>
          </section>
        )}

        {current.steps.map((step) => {
          const rows = step.numbers ?? (metrics ? stepStats(step, metrics, hasOrderStep) : []);
          // What this page sells: the checkout's product and order bumps, or the upsell's offer.
          const sells =
            step.kind === "order" || (step.kind === "landing" && !hasOrderStep)
              ? items.filter((i) => i.role !== "upsell")
              : step.offer
                ? items.filter((i) => i.role === "upsell" && i.key === step.offer?.id)
                : [];
          return (
            <div key={step.kind + step.path} className={s.stepWrap}>
              <div className={s.connector} aria-hidden />
              <section className={s.step}>
                <div className={s.card}>
                  <a href={previewUrl(step.url)} target="_blank" rel="noreferrer" className={s.thumb} title="Open the page (not counted as a visit)">
                    {step.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={step.image} alt="" loading="lazy" />
                    ) : (
                      <span className={s.thumbEmpty}>{step.kind === "thank-you" ? <I.check size={22} /> : <I.page size={22} />}</span>
                    )}
                  </a>
                  <div className={s.info}>
                    <div className={s.stepName}>
                      {step.name}
                      {test && (step.kind === "landing" || step.kind === "order") && <span className={s.abTag}>A/B</span>}
                      {step.offer && !step.offer.live && (
                        <span className={s.offTag} title="Buyers go straight to the thank-you page until the upsells are switched on (UPSELLS=on).">
                          Off until tested
                        </span>
                      )}
                    </div>
                    <div className={s.path}>{step.path}</div>
                    <div className={s.actions}>
                      <a href={previewUrl(step.url)} target="_blank" rel="noreferrer" className={s.btn} title="Not counted as a visit">
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
                {(map.statsSlug || (step.numbers && step.numbers.length > 0)) && (
                  <div className={s.stats} style={{ opacity: loading ? 0.5 : 1 }}>
                    {rows.length ? (
                      rows.map((r) => (
                        <div key={r.label} className={`${s.stat} ${s[r.tone]}`}>
                          <span className={s.statLabel}>{r.label}</span>
                          <span className={s.statValue}>{r.value}</span>
                        </div>
                      ))
                    ) : (
                      <div className={s.stat}>
                        <span className={s.statLabel}>{loading ? "Loading…" : "No numbers yet"}</span>
                      </div>
                    )}
                  </div>
                )}
                {sells.length > 0 && <PriceList items={sells} onEdit={setEditing} />}
                {test && (step.kind === "landing" || step.kind === "order") && <Variants test={test} scope={testScope} step={step} />}
              </section>
            </div>
          );
        })}

        {map.numbersFrom && (
          <p className={s.note}>
            {map.numbersFrom.note}{" "}
            <Link href={map.numbersFrom.href} className={s.link}>
              {map.numbersFrom.link}
            </Link>
          </p>
        )}
        {map.statsSlug && (
          <p className={s.note}>
            Numbers {range === "all" ? "for all time" : rangePhrase(range).replace(/^(today|yesterday|this)/, "for $1")}
            {map.langs.length > 1 ? `, ${current.label} pages` : ""}; the A/B test counts since it started. Visitors are counted by
            our own script{data?.trackingSince ? ` since ${data.trackingSince}` : ""}; orders come from Stripe and PayPal.{" "}
            <Link href="/?nav=analytics" className={s.link}>
              All analytics
            </Link>
          </p>
        )}
      </main>}

      {editing !== null && (
        <PricesDrawer funnel={map.id} name={map.name} items={items} focus={editing} onSaved={setItems} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
