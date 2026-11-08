"use client";

import { useEffect, useState } from "react";
import { I } from "@/components/icons";
import type { Analytics, BonusStats, Metrics, TestStats } from "@/lib/analytics";
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

      {data?.bonus && <BonusCard b={data.bonus} />}

      {data?.tests.map((t) => <TestCard key={`${t.funnel}|${t.name}`} t={t} />)}

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

/** Dashboard → Analytics: how many Drum Kit buyers pay within the order page's 5-minute bonus (lib/analytics.ts bonusStats). */
function BonusCard({ b }: { b: BonusStats }) {
  const card = b.within + b.after;
  const top = Math.max(1, ...b.timing.map((t) => t.n));
  return (
    <section className={s.test}>
      <div className={s.testHead}>
        <div>
          <div className={s.testTitle}>
            <I.analytics size={14} /> 5-minute bonus · MIDI Drum Kit
          </div>
          <div className={s.testSub}>
            Order page: the Expansions free if paid within 5 minutes of arriving · since {whenText(when(b.since))}, when everyone got it · whatever the range above
          </div>
        </div>
      </div>

      <div className={s.variants}>
        <div className={s.variant}>
          <div className={s.variantHead}>Orders paid within the 5 minutes</div>
          <div className={s.bonusBig}>
            {int(b.within)} <small>of {int(card)}</small>
          </div>
          <div className={s.bonusPct}>{pct(b.within, card)}</div>
          <dl className={s.kv}>
            <dt>Within 5 min (free Expansions)</dt>
            <dd className={s.strong}>{int(b.within)}</dd>
            <dt>After the 5 minutes</dt>
            <dd>{int(b.after)}</dd>
            {b.paypal > 0 && (
              <>
                <dt>PayPal (not known)</dt>
                <dd>{int(b.paypal)}</dd>
              </>
            )}
          </dl>
          <div className={s.paidNote}>Card orders, upsells apart. PayPal doesn&apos;t record whether the bonus was given, so its orders are left out of the %.</div>
        </div>

        <div className={s.variant}>
          <div className={s.variantHead}>Out of everyone who saw the clock</div>
          <div className={s.bonusBig}>
            {int(b.withinSinceClocks)} <small>of {int(b.clocks)}</small>
          </div>
          <div className={s.bonusPct}>{pct(b.withinSinceClocks, b.clocks)}</div>
          <dl className={s.kv}>
            <dt>Clocks started</dt>
            <dd>{int(b.clocks)}</dd>
            <dt>On phones</dt>
            <dd>
              {int(b.clocksPhone)} <small>{pct(b.clocksPhone, b.clocks)}</small>
            </dd>
            <dt>Paid within 5 min</dt>
            <dd className={s.strong}>
              {int(b.withinSinceClocks)} <small>{pct(b.withinSinceClocks, b.clocks)}</small>
            </dd>
            <dt>Paid at all</dt>
            <dd>
              {int(b.ordersSinceClocks)} <small>{pct(b.ordersSinceClocks, b.clocks)}</small>
            </dd>
          </dl>
          <div className={s.paidNote}>
            A clock starts the first time a browser reaches the order page (owner and test devices left out)
            {b.clocksSince ? ` · counted since ${whenText(when(b.clocksSince))}` : " · none counted yet"}
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
            From the clock&apos;s start to the payment, card orders that recorded it ({int(b.timed)} so far, from 11-09); green = within the 5 minutes.
          </div>
        </div>
      </div>
    </section>
  );
}

function TestCard({ t }: { t: TestStats }) {
  const name = (v: string) => t.variants.find((x) => x.variant === v)?.label ?? v;
  const best = t.leader;
  return (
    <section className={s.test}>
      <div className={s.testHead}>
        <div>
          <div className={s.testTitle}>
            <I.abtest size={14} /> {t.name} test · {t.product}
          </div>
          <div className={s.testSub}>
            {t.where}{t.since ? ` · since ${t.since} (${t.days} day${t.days === 1 ? "" : "s"})` : ""} · whole test, whatever the range above
          </div>
        </div>
        <div className={`${s.verdict} ${t.verdict === "winner" ? s.win : ""}`}>
          {t.verdict === "winner" && best ? `${name(best)} wins.` : VERDICT[t.verdict]}
        </div>
      </div>

      <p className={s.testNote}>
        {t.verdict === "early" || t.verdict === "waiting" ? (
          <>
            A reliable answer needs about {t.target} sales per variant: {int(t.salesToGo)} to go
            {t.daysToGo != null ? `, about ${Math.ceil(t.daysToGo)} more day${Math.ceil(t.daysToGo) === 1 ? "" : "s"} at the current pace` : ""}.
            {best ? ` ${name(best)} leads for now, but early leads often flip.` : ""}
          </>
        ) : t.verdict === "winner" && best ? (
          <>
            {name(best)} converts better than every other variant with at least 95% certainty. Keep it and end the test.
          </>
        ) : (
          <>Every variant has {t.target}+ sales and none is clearly ahead: keep any of them and test something bigger.</>
        )}
      </p>

      <div className={s.variants}>
        {t.variants.map((v) => {
          const c = v.color;
          return (
            <div key={v.variant} className={`${s.variant} ${best === v.variant ? s.leading : ""}`}>
              <div className={s.variantHead}>
                <span className={s.swatch} style={{ background: `linear-gradient(180deg, ${c.from}, ${c.to})` }} />
                {name(v.variant)}
                {best === v.variant && <span className={s.badge}>LEADING</span>}
              </div>
              <dl className={s.kv}>
                <dt>Visitors</dt>
                <dd>{int(v.m.visitors)}</dd>
                <dt>Order page</dt>
                <dd>{int(v.m.orderViews)}</dd>
                <dt>Checkouts</dt>
                <dd>
                  {int(v.m.checkouts)} <small>{pct(v.m.checkouts, v.m.visitors)}</small>
                </dd>
                <dt>Orders</dt>
                <dd>{int(v.m.orders)}</dd>
                <dt>Conversion</dt>
                <dd className={s.strong}>{pct(v.m.ratedOrders, v.m.visitors || v.m.orderViews)}</dd>
                <dt>Revenue</dt>
                <dd>{eur(v.m.revenue)}</dd>
                <dt>€ / visitor</dt>
                <dd>{perVisitor(v.m)}</dd>
                <dt>Chance it&apos;s best</dt>
                <dd>{v.chanceBest == null || v.m.orders === 0 ? "—" : `${Math.round(v.chanceBest * 100)}%`}</dd>
              </dl>
              {v.paid && (
                <div className={s.paid}>
                  <dl className={s.kv}>
                    <dt>Paid after checkout</dt>
                    <dd className={s.strong}>
                      {int(v.paid.orders)} of {int(v.paid.starts)} <small>{pct(v.paid.orders, v.paid.starts)}</small>
                    </dd>
                    {v.paid.phone && (
                      <>
                        <dt>On phones</dt>
                        <dd className={s.strong}>
                          {int(v.paid.phone.orders)} of {int(v.paid.phone.starts)} <small>{pct(v.paid.phone.orders, v.paid.phone.starts)}</small>
                        </dd>
                      </>
                    )}
                  </dl>
                  <div className={s.paidNote}>
                    {whenText(when(v.paid.from))} → {v.paid.until ? whenText(when(v.paid.until)) : "now"}, when everyone had it · MIDI Drum Kit buyers only, free-pack sign-ups left out
                    {v.paid.phone?.unknown ? ` · device unknown for ${v.paid.phone.unknown}` : ""}
                  </div>
                </div>
              )}
              <div className={s.progress} title={`${v.m.orders} of ${t.target} sales`}>
                <span style={{ width: `${Math.min(100, (v.m.orders / t.target) * 100)}%`, background: c.to }} />
              </div>
              <div className={s.progressLabel}>
                {int(v.m.orders)} / {t.target} sales
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
