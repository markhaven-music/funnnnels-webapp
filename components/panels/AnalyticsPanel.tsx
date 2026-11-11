"use client";

import { Fragment, useEffect, useState } from "react";
import { I } from "@/components/icons";
import type { Analytics, AvailabilityStats, BonusStats, Metrics, TestStats } from "@/lib/analytics";
import { RangePicker, useRange } from "@/components/RangePicker";
import s from "./analytics.module.css";

// Dashboard → Analytics. Numbers from /api/analytics (lib/analytics.ts):
// visitors and checkout starts from our own beacon, orders from Stripe and
// PayPal, and the running A/B tests (lib/analytics.ts TESTS).


const LANG_NAMES: Record<string, string> = { en: "English", fr: "French", es: "Spanish", de: "German", it: "Italian", "?": "Language not recorded" };

const int = (n: number) => n.toLocaleString("en-US");
const eur = (n: number, cents = false) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n);
const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(part / whole < 0.1 ? 1 : 0)}%` : "—");
const perVisitor = (m: Metrics) => (m.visitors > 0 ? eur(m.ratedRevenue / m.visitors, true) : "—");

function langPath(slug: string, lang: string) {
  return lang === "en" ? `/${slug}` : lang === "?" ? "" : `/${lang}/${slug}`;
}

export function AnalyticsPanel() {
  const [range, setRange] = useRange();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?range=${range}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`The analytics didn't load (${r.status}).`);
        return (await r.json()) as Analytics;
      })
      .then((d) => live && setData(d))
      .catch((e) => live && setError((e as Error).message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [range]);

  const total = data?.funnels.reduce(
    (t, f) => ({
      visitors: t.visitors + f.total.visitors,
      checkouts: t.checkouts + f.total.checkouts,
      orders: t.orders + f.total.orders,
      ratedOrders: t.ratedOrders + f.total.ratedOrders,
      revenue: t.revenue + f.total.revenue,
    }),
    { visitors: 0, checkouts: 0, orders: 0, ratedOrders: 0, revenue: 0 },
  );

  // Running tests, the latest started first; the ended ones go to the archive.
  const tests = data?.tests ?? [];
  const running = tests.filter((t) => !t.ended).sort((a, b) => (b.since ?? "").localeCompare(a.since ?? ""));
  const ended = tests.filter((t) => t.ended);

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Visitors, checkouts and sales per funnel.</p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>

      {error && <div className={`${s.notice} ${s.bad}`}>{error}</div>}
      {data && !data.sources.stripe && (
        <div className={s.notice}>
          <I.analytics size={14} /> Stripe isn&apos;t connected on this server, so card orders are missing below.
        </div>
      )}
      {data?.errors.map((e) => (
        <div key={e} className={`${s.notice} ${s.bad}`}>
          Couldn&apos;t read {e}
        </div>
      ))}

      <div className={`stats ${s.stats}`} style={{ opacity: loading ? 0.5 : 1 }}>
        <Stat label="VISITORS" value={total ? int(total.visitors) : "…"} color="var(--sky)" />
        <Stat label="CHECKOUTS" value={total ? int(total.checkouts) : "…"} sub={total ? pct(total.checkouts, total.visitors) : ""} color="var(--amber)" />
        <Stat label="ORDERS" value={total ? int(total.orders) : "…"} sub={total ? pct(total.ratedOrders, total.visitors) : ""} color="var(--mint)" />
        <Stat label="REVENUE" value={total ? eur(total.revenue) : "…"} color="var(--accent)" />
      </div>

      {/* The tests first, the newest on top; the ended ones folded away at the end of the page. */}
      {running.length > 0 && (
        <div className="section-head">
          <div className="section-title">
            A/B tests <span className="count">{running.length} running</span>
          </div>
        </div>
      )}
      {running.map((t) => (
        <TestCard key={`${t.funnel}|${t.name}`} t={t} />
      ))}

      <div className="section-head">
        <div className="section-title">
          Funnels <span className="count">{data?.funnels.length ?? "…"}</span>
        </div>
      </div>
      <div className={s.tableWrap} style={{ opacity: loading ? 0.5 : 1 }}>
        <div className={s.table}>
          <div className={`${s.row} ${s.head}`}>
            <span>FUNNEL</span>
            <span>VISITORS</span>
            <span>ORDER PAGE</span>
            <span>CHECKOUTS</span>
            <span>ORDERS</span>
            <span>REVENUE</span>
            <span title="Orders per landing visitor">CVR</span>
            <span title="Revenue per landing visitor">€ / VISITOR</span>
          </div>
          {!data && (
            <div className={s.empty}>
              {loading ? (
                "Loading…"
              ) : (
                <>
                  <img className={s.emptyArt} src="/funnels/dashboard/analytics.webp" width={96} height={96} alt="" />
                  No data
                </>
              )}
            </div>
          )}
          {data?.funnels.map((f) => (
            <div key={f.slug}>
              <MetricRow
                name={
                  <a href={f.url} target="_blank" rel="noreferrer" className={s.name}>
                    {f.name}
                  </a>
                }
                m={f.total}
              />
              {f.langs?.map((l) => (
                <MetricRow
                  key={l.lang}
                  sub
                  name={
                    <span className={s.lang}>
                      {LANG_NAMES[l.lang] ?? l.lang.toUpperCase()} <code>{langPath(f.slug, l.lang)}</code>
                    </span>
                  }
                  m={l.m}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {(data?.availability || (data?.bonuses?.length ?? 0) > 0) && (
        <div className="section-head" style={{ marginTop: 28 }}>
          <div className="section-title">Other experiments</div>
        </div>
      )}
      {data?.availability && <AvailabilityCard a={data.availability} />}
      {data?.bonuses?.map((b) => <BonusCard key={b.funnel} b={b} />)}

      {ended.length > 0 && (
        <details className={s.archive}>
          <summary>
            Ended tests <span className="count">{ended.length}</span>
          </summary>
          {ended.map((t) => (
            <TestCard key={`${t.funnel}|${t.name}`} t={t} />
          ))}
        </details>
      )}

      {data && (
        <p className={s.foot}>
          Visitors are unique per page per day (someone who comes back another day counts again), counted by our own script
          since it went live; ad blockers can hide a few. Checkouts = step 1 of the order form filled in. Orders and revenue come
          from Stripe and PayPal; dollar sales are converted at today&apos;s ECB rate ($1 = {eur(data.usdToEur, true)}). CVR and €
          / visitor only count orders{data.trackingSince ? ` since ${data.trackingSince}` : ""}, when visitors started being counted.
        </p>
      )}
    </main>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="stat">
      <div className="stat-label">
        <span className="lk" style={{ background: color }} />
        {label}
      </div>
      <div className="v">
        {value} {sub && sub !== "—" && <small>{sub} of visitors</small>}
      </div>
    </div>
  );
}

function MetricRow({ name, m, sub }: { name: React.ReactNode; m: Metrics; sub?: boolean }) {
  return (
    <div className={`${s.row} ${sub ? s.subRow : ""}`}>
      <span className={s.nameCell}>{name}</span>
      <span>{int(m.visitors)}</span>
      <span>{int(m.orderViews)}</span>
      <span>
        {int(m.checkouts)} <small>{pct(m.checkouts, m.visitors)}</small>
      </span>
      <span>
        {int(m.orders)} <small>{pct(m.ratedOrders, m.checkouts)}</small>
      </span>
      <span>{eur(m.revenue)}</span>
      <span className={s.strong}>{pct(m.ratedOrders, m.visitors)}</span>
      <span>{perVisitor(m)}</span>
    </div>
  );
}

const VERDICT: Record<TestStats["verdict"], string> = {
  waiting: "Waiting for the first visitors in the test.",
  early: "Too early to call.",
  winner: "We have a winner.",
  tie: "No clear winner: the variants sell about the same.",
};

/** "11-06 16:00", Rome time. */
const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date(iso))
    .reduce((o, p) => ({ ...o, [p.type]: p.value }), {} as Record<string, string>);
const whenText = (p: Record<string, string>) => `${p.month}-${p.day} ${p.hour}:${p.minute}`;

const mins = (sec: number) => (sec < 60 ? `${Math.round(sec)} s` : `${Math.floor(sec / 60)} min ${String(Math.round(sec % 60)).padStart(2, "0")} s`);

const rate1 = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "—");
const chance = (c: number | null) => (c == null ? "—" : `${Math.round(c * 100)}%`);

/** Dashboard → Analytics: the funnels before and after the "Checking availability…" popup (lib/analytics.ts availabilityStats). */
function AvailabilityCard({ a }: { a: AvailabilityStats }) {
  const sides = [
    { key: "before", title: `Before · ${whenText(when(a.before.from))} → ${whenText(when(a.before.to!))}`, v: a.before },
    { key: "after", title: `After · since ${whenText(when(a.after.from))}`, v: a.after },
  ] as const;
  const left = Math.max(0, a.needed - a.after.landings);
  // Under 200 visitors after, the normal approximation's % says more than the numbers do.
  const shown = (c: number | null) => (a.after.landings < 200 ? `— (${int(a.after.landings)} of 200 visitors)` : chance(c));
  const verdict =
    a.after.landings === 0
      ? "No visitor since the popup yet."
      : left > 0
        ? `Too early to call: ${int(a.after.landings)} of the ~${int(a.needed)} visitors needed after the popup to see a 5-point change in the click to the order page.`
        : (a.chanceClickUp ?? 0.5) >= 0.95
          ? "The click to the order page is up since the popup."
          : (a.chanceClickUp ?? 0.5) <= 0.05
            ? "The click to the order page is down since the popup."
            : "No clear change in the click to the order page.";
  return (
    <section className={s.test}>
      <div className={s.testHead}>
        <div>
          <div className={s.testTitle}>
            <I.analytics size={14} /> Availability popup · every funnel
          </div>
          <div className={s.testSub}>
            &ldquo;Checking availability…&rdquo; between the landing&apos;s button and the order page, live since {whenText(when(a.since))} · each browser counted once, on the side of the minute it first opened a landing · from the live tracking, kept 30 days · whatever the range above
          </div>
        </div>
      </div>

      <div className={s.variants}>
        {sides.map(({ key, title, v }) => (
          <div key={key} className={s.variant}>
            <div className={s.variantHead}>{title}</div>
            <div className={s.bonusBig}>
              {rate1(v.orderViews, v.landings)} <small>landing → order</small>
            </div>
            <div className={s.bonusPct}>{rate1(v.orders, v.landings)} landing → paid order</div>
            <dl className={s.kv}>
              <dt>Hours</dt>
              <dd>{int(Math.round(v.hours))}</dd>
              <dt>Visitors on a landing</dt>
              <dd>
                {int(v.landings)} <small>{v.hours >= 1 ? `${int(Math.round((v.landings / v.hours) * 24))}/day` : ""}</small>
              </dd>
              <dt>Went on to the order page</dt>
              <dd className={s.strong}>{int(v.orderViews)}</dd>
              <dt>Orders paid</dt>
              <dd className={s.strong}>{int(v.orders)}</dd>
            </dl>
          </div>
        ))}

        <div className={s.variant}>
          <div className={s.variantHead}>Is it better after?</div>
          <dl className={s.kv}>
            <dt>Chance landing → order is up</dt>
            <dd className={s.strong}>{shown(a.chanceClickUp)}</dd>
            <dt>Chance landing → paid order is up</dt>
            <dd>{shown(a.chanceOrderUp)}</dd>
          </dl>
          <div className={s.paidNote} style={{ marginTop: 10 }}>
            {verdict}{" "}The 5-minute bonus started the same evening on the Drum Kit order page, so a change in orders can be either; the click to the order page is the popup&apos;s alone. Orders = first orders paid in the window, upsells apart.
          </div>
          <dl className={s.kv} style={{ marginTop: 12 }}>
            {a.funnels.map((f) => (
              <Fragment key={f.slug}>
                <dt>{f.name}</dt>
                <dd>
                  {rate1(f.before.orderViews, f.before.landings)} → {rate1(f.after.orderViews, f.after.landings)}{" "}
                  <small>
                    {int(f.before.landings)} / {int(f.after.landings)}
                  </small>
                </dd>
              </Fragment>
            ))}
          </dl>
          <div className={s.paidNote}>Each funnel&apos;s landing → order, before → after (visitors before / after).</div>
        </div>
      </div>
    </section>
  );
}

/** Dashboard → Analytics: how many buyers pay within an order page's 5-minute bonus (Drum Kit, Jazz: lib/analytics.ts bonusStats). */
function BonusCard({ b }: { b: BonusStats }) {
  const top = Math.max(1, ...b.timing.map((t) => t.n));
  return (
    <section className={s.test}>
      <div className={s.testHead}>
        <div>
          <div className={s.testTitle}>
            <I.analytics size={14} /> 5-minute bonus · {b.name}
          </div>
          <div className={s.testSub}>
            Order page: the {b.item} free if paid within 5 minutes of arriving ·{" "}
            since {whenText(when(b.step2.after.from))} · the date range above doesn&apos;t apply
          </div>
        </div>
      </div>

      <div className={`${s.variants} ${s.two}`}>
        <div className={s.variant}>
          <div className={s.variantHead}>Checkout step 2: who paid, before vs after</div>
          <div className={s.beforeAfter}>
            {(["before", "after"] as const).map((k) => {
              const v = b.step2[k];
              return (
                <div key={k}>
                  <div className={s.baLabel}>{k === "before" ? "Before the bonus" : "With the bonus"}</div>
                  <div className={s.bonusBig}>{v.people ? pct(v.paid, v.people) : "—"}</div>
                  <div className={s.baSub}>
                    {int(v.paid)} paid of {int(v.people)}
                  </div>
                  <div className={s.baSub}>
                    {whenText(when(v.from))} → {v.to ? whenText(when(v.to)) : "now"}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={s.paidNote}>
            People who filled in step 1 and reached the payment form, each counted once; paid = bought the {b.name} (card or PayPal). Free-pack sign-ups and owner/test left out. Before starts 11-07 17:35: step 2 as it is today, card payments working.
          </div>
        </div>

        <div className={s.variant}>
          <div className={s.variantHead}>How long they took to pay</div>
          <div className={s.bonusBars}>
            {b.timing.map((t) => (
              <div key={t.label} className={s.bonusBar}>
                <span className={s.bonusLabel}>{t.label}</span>
                <span className={s.bonusTrack}>
                  <span style={{ width: `${(t.n / top) * 100}%`, background: t.within ? "var(--mint)" : "var(--fg-3)" }} />
                </span>
                <span className={s.bonusN}>{int(t.n)}</span>
              </div>
            ))}
          </div>
          <dl className={s.kv} style={{ marginTop: 10 }}>
            <dt>Median</dt>
            <dd className={s.strong}>{b.medianSec == null ? "—" : mins(b.medianSec)}</dd>
          </dl>
          <div className={s.paidNote}>
            From the first visit to the order page to the payment. Only card orders since 11-09 02:29 record this ({int(b.timed)} so far): PayPal and earlier orders aren&apos;t here, so it can be fewer than &quot;paid&quot; on the left. Green = within the 5 minutes.
          </div>
        </div>
      </div>
    </section>
  );
}

/** One test, read in a glance: the question, where it stands in a sentence, then each variant with a picture of its page, its conversion big, and the numbers behind it. */
function TestCard({ t }: { t: TestStats }) {
  const name = (v: string) => t.variants.find((x) => x.variant === v)?.label ?? v;
  const best = t.leader;
  const rateOf = (m: Metrics) => {
    const n = m.visitors || m.orderViews;
    return n > 0 ? m.ratedOrders / n : null;
  };
  const top = Math.max(0, ...t.variants.map((v) => rateOf(v.m) ?? 0));
  const status = t.ended ? "Ended" : t.verdict === "winner" ? "Winner found" : t.verdict === "waiting" ? "Just started" : "Running";
  return (
    <section className={s.tc}>
      <header className={s.tcHead}>
        <div>
          <div className={s.tcProduct}>{t.product}</div>
          <h2 className={s.tcTitle}>{t.name}</h2>
          {t.question && <p className={s.tcQuestion}>{t.question}</p>}
        </div>
        <div className={s.tcStatus}>
          <span className={`${s.tcBadge} ${t.ended ? s.tcEnded : t.verdict === "winner" ? s.tcWon : ""}`}>{status}</span>
          {t.since && (
            <span className={s.tcDays}>
              {t.ended ? `${t.since} → ${t.ended.day}` : `since ${t.since}`} · {t.days} day{t.days === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </header>

      <p className={`${s.tcVerdict} ${t.verdict === "winner" && !t.ended ? s.tcVerdictWin : ""}`}>
        {t.ended ? (
          <>
            <b>{name(t.ended.kept)} was kept.</b> Everyone sees it now and nothing new is counted. These are the numbers as the test finished
            {t.verdict === "winner" ? "" : ` (it stopped before a reliable answer: about ${t.target} sales per variant)`}.
          </>
        ) : t.verdict === "waiting" ? (
          <>
            <b>Waiting for the first visitors.</b> A reliable answer needs about {t.target} sales per variant.
          </>
        ) : t.verdict === "early" ? (
          <>
            <b>Too early to call.</b> A reliable answer needs about {t.target} sales per variant: {int(t.salesToGo)} to go
            {t.daysToGo != null ? `, about ${Math.ceil(t.daysToGo)} more day${Math.ceil(t.daysToGo) === 1 ? "" : "s"} at this pace` : ""}.
            {best ? ` ${name(best)} leads for now, but early leads often flip.` : ""}
          </>
        ) : t.verdict === "winner" && best ? (
          <>
            <b>{name(best)} wins.</b> It converts better than every other variant with at least 95% certainty. Keep it and end the test.
          </>
        ) : (
          <>
            <b>No clear winner.</b> Every variant has {t.target}+ sales and none is clearly ahead: keep any of them and test something bigger.
          </>
        )}
      </p>

      <div className={s.tcVariants}>
        {t.variants.map((v) => {
          const c = v.color;
          const r = rateOf(v.m);
          const of = v.m.visitors || v.m.orderViews;
          const lead = best === v.variant;
          return (
            <div key={v.variant} className={`${s.tcVariant} ${lead ? s.tcLead : ""}`}>
              {v.shot && (
                <a className={s.tcShot} href={v.shot} target="_blank" rel="noreferrer" title="Open the picture">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.shot} alt={`What visitors saw: ${v.label}`} loading="lazy" />
                </a>
              )}
              <div className={s.tcName}>
                <span className={s.swatch} style={{ background: `linear-gradient(180deg, ${c.from}, ${c.to})` }} />
                <span>{v.label}</span>
                {lead && <span className={s.badge}>LEADING</span>}
              </div>
              {v.paid && (
                <div className={s.tcPeriod}>
                  {whenText(when(v.paid.from))} → {v.paid.until ? whenText(when(v.paid.until)) : "now"}
                </div>
              )}

              <div className={s.tcBig}>
                <span className={s.tcRate}>{r == null ? "—" : `${(r * 100).toFixed(r < 0.1 ? 1 : 0)}%`}</span>
                <span className={s.tcRateOf}>
                  bought
                  <br />
                  {int(v.m.orders)} order{v.m.orders === 1 ? "" : "s"} · {int(of)} visitor{of === 1 ? "" : "s"}
                </span>
              </div>
              <div className={s.tcBar}>
                <span style={{ width: `${r != null && top > 0 ? Math.max(2, (r / top) * 100) : 0}%`, background: c.to }} />
              </div>

              {v.paid && (
                <div className={s.tcPaid}>
                  <div>
                    <b>{pct(v.paid.orders, v.paid.starts)}</b> paid after starting the checkout
                    <small>
                      {int(v.paid.orders)} of {int(v.paid.starts)}
                    </small>
                  </div>
                  {v.paid.phone && (
                    <div>
                      <b>{pct(v.paid.phone.orders, v.paid.phone.starts)}</b> on phones
                      <small>
                        {int(v.paid.phone.orders)} of {int(v.paid.phone.starts)}
                        {v.paid.phone.unknown ? ` · device unknown for ${v.paid.phone.unknown}` : ""}
                      </small>
                    </div>
                  )}
                </div>
              )}

              <dl className={s.tcKv}>
                <div>
                  <dt>Checkouts</dt>
                  <dd>
                    {int(v.m.checkouts)} <small>{pct(v.m.checkouts, v.m.visitors)}</small>
                  </dd>
                </div>
                <div>
                  <dt>Revenue</dt>
                  <dd>{eur(v.m.revenue)}</dd>
                </div>
                <div>
                  <dt>€ / visitor</dt>
                  <dd>{perVisitor(v.m)}</dd>
                </div>
                <div>
                  <dt>Chance it&apos;s best</dt>
                  <dd>{v.chanceBest == null || v.m.orders === 0 ? "—" : `${Math.round(v.chanceBest * 100)}%`}</dd>
                </div>
              </dl>

              <div className={s.progress} title={`${v.m.orders} of ${t.target} sales`}>
                <span style={{ width: `${Math.min(100, (v.m.orders / t.target) * 100)}%`, background: c.to }} />
              </div>
              <div className={s.progressLabel}>
                {int(v.m.orders)} of {t.target} sales for a reliable answer
              </div>
            </div>
          );
        })}
      </div>

      <details className={s.tcHow}>
        <summary>How this is counted</summary>
        <p>{t.where}</p>
        <p>
          &ldquo;Bought&rdquo; is orders per landing visitor (per order-page visitor when the landing has none), upsells apart. The whole test is counted, whatever the
          date range picked above.
          {t.variants.some((v) => v.paid) ? " “Paid after starting the checkout” counts people (one per email) who filled in step 1 while everyone had that page, free-pack sign-ups left out." : ""}
        </p>
      </details>
    </section>
  );
}
