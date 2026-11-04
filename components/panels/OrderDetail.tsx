"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { EmailEvent, OrderDetail as Detail } from "@/lib/orderDetail";
import type { OrderRow } from "@/lib/sales";
import e from "./email.module.css";
import s from "./orders.module.css";

// Dashboard → Orders → a row: the order's details (lib/orderDetail.ts) in a
// panel from the right. Esc closes it; ↑ ↓ move to the order above or below.

export function money(cents: number, currency: string): string {
  const n = cents / 100;
  const v = Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const c = currency.toLowerCase();
  return c === "eur" ? `€${v}` : c === "usd" ? `$${v}` : c === "gbp" ? `£${v}` : `${v} ${c.toUpperCase()}`;
}

const full = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const short = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function span(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 1) return "under a minute";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} days`;
}

const COUNTRY = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
const country = (code: string | null | undefined) => {
  if (!code) return null;
  try {
    return `${COUNTRY?.of(code.toUpperCase()) ?? code} (${code.toUpperCase()})`;
  } catch {
    return code;
  }
};

/** A key/value row, left out when the value is empty. */
function Row({ k, children }: { k: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "" || children === false) return null;
  return (
    <>
      <dt>{k}</dt>
      <dd>{children}</dd>
    </>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <div className={s.label}>{label}</div>
      {children}
    </section>
  );
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={s.iconBtn}
      style={{ padding: "1px 6px", marginLeft: 6, fontSize: 11 }}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
    >
      {done ? "copied" : "copy"}
    </button>
  );
}

const STATUS_CHIP: Record<string, string> = { sent: e.chip_sent, clicked: e.chip_on, failed: e.chip_failed };

export function OrderDrawer({
  id,
  onClose,
  onOpen,
  onStep,
}: {
  id: string;
  onClose: () => void;
  onOpen: (id: string) => void;
  onStep: (dir: 1 | -1) => void;
}) {
  const [data, setData] = useState<{ id: string; detail?: Detail; error?: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Detail;
      })
      .then((detail) => live && setData({ id, detail }))
      .catch((err) => live && setData({ id, error: `Couldn't load this order (${String(err)}).` }));
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      if (ev.key === "Escape") onClose();
      else if (ev.key === "ArrowDown" || ev.key === "j") (ev.preventDefault(), onStep(1));
      else if (ev.key === "ArrowUp" || ev.key === "k") (ev.preventDefault(), onStep(-1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, onStep]);

  const d = data?.id === id ? data.detail : undefined;
  const error = data?.id === id ? data.error : undefined;

  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <aside className={s.drawer} role="dialog" aria-label="Order details">
        {error ? (
          <div className={s.loading}>
            {error}{" "}
            <button type="button" className={s.iconBtn} onClick={onClose}>
              Close
            </button>
          </div>
        ) : !d ? (
          <div className={s.loading}>Loading the order from the database, {id.startsWith("pi_") ? "Stripe" : "PayPal"} and neo…</div>
        ) : (
          <Body d={d} onClose={onClose} onOpen={onOpen} />
        )}
        <div className={s.hint}>esc close · ↑ ↓ previous / next order</div>
      </aside>
    </>
  );
}

function Body({ d, onClose, onOpen }: { d: Detail; onClose: () => void; onOpen: (id: string) => void }) {
  const o = d.order;
  const p = d.payment;
  const a = d.attribution;
  const refunded = p && p.refundedCents > 0;
  const fullRefund = p && p.refundedCents >= o.amountCents;
  const firstSeen = a?.firstClickAt ?? d.checkoutStart?.at ?? null;
  // checkout_starts.reminders also reads 3 once a start is closed (a buyer), so count what really went out.
  const reminders = d.emails.filter((x) => x.kind === "reminder" && x.status === "sent").length;

  return (
    <>
      <div className={s.top}>
        <div style={{ minWidth: 0 }}>
          <div className={s.amount}>{money(o.amountCents, o.currency)}</div>
          <div className={s.title}>
            {o.offer ? "Upsell · " : ""}
            {d.lines.map((l) => l.name).join(" + ")}
          </div>
          <div className={s.when}>{full(o.createdAt)}</div>
          <div className={s.chips}>
            <span className={`${e.chip} ${o.status === "succeeded" ? e.chip_sent : e.chip_scheduled}`}>{o.status === "succeeded" ? "paid" : o.status}</span>
            <span className={e.chip}>{o.provider === "paypal" ? "PayPal" : "Stripe"}</span>
            {refunded ? <span className={`${e.chip} ${e.chip_failed}`}>{fullRefund ? "refunded" : `refunded ${money(p.refundedCents, o.currency)}`}</span> : null}
            {p?.disputed ? <span className={`${e.chip} ${e.chip_failed}`}>disputed</span> : null}
            {o.offer ? <span className={e.chip}>upsell</span> : null}
          </div>
        </div>
        <div className={s.topActions}>
          {p ? (
            <a className={s.iconBtn} href={p.dashboardUrl} target="_blank" rel="noreferrer">
              Open in {o.provider === "paypal" ? "PayPal" : "Stripe"} ↗
            </a>
          ) : null}
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      </div>

      <div className={s.body}>
        <Section label="WHAT WAS BOUGHT">
          <div className={s.list}>
            {d.lines.map((l, i) => (
              <div key={l.key} className={s.item}>
                <span>
                  {l.name} <span className={`${s.sub} ${s.mono}`}>{l.key}</span>
                </span>
                <span className={s.sub}>{o.offer ? "one-click upsell" : i === 0 ? "main product" : "add-on"}</span>
              </div>
            ))}
          </div>
          {d.parent ? (
            <>
              <div className={s.label} style={{ marginTop: 6 }}>BOUGHT RIGHT AFTER</div>
              <OrderList rows={[d.parent]} onOpen={onOpen} />
            </>
          ) : null}
          {d.upsells.length ? (
            <>
              <div className={s.label} style={{ marginTop: 6 }}>THEN TOOK THE UPSELL</div>
              <OrderList rows={d.upsells} onOpen={onOpen} base={o.createdAt} />
            </>
          ) : null}
        </Section>

        <Section label="BUYER">
          <dl className={s.kv}>
            <Row k="Name">{o.name}</Row>
            <Row k="Email">
              {o.email ? (
                <>
                  {o.email}
                  <Copy text={o.email} />
                </>
              ) : null}
            </Row>
            <Row k="Country">{country(o.country)}</Row>
            <Row k="Language">{o.lang}</Row>
            <Row k="Contact">
              {d.contact ? (
                <>
                  {d.contact.status} <span className={s.sub}>· since {short(d.contact.since)}{d.contact.source ? ` · from ${d.contact.source}` : ""}</span>
                </>
              ) : null}
            </Row>
            <Row k="Tags">
              {d.contact?.tags.length ? (
                <span className={e.tags}>
                  {d.contact.tags.map((t) => (
                    <span key={t} className={e.tag}>
                      {t}
                    </span>
                  ))}
                </span>
              ) : null}
            </Row>
            <Row k="Checkout started">
              {d.checkoutStart ? (
                <>
                  {short(d.checkoutStart.at)}
                  {Date.parse(d.checkoutStart.at) <= Date.parse(o.createdAt) ? (
                    <span className={s.sub}> · paid {span(Date.parse(o.createdAt) - Date.parse(d.checkoutStart.at))} later</span>
                  ) : null}
                  {reminders ? <span className={s.sub}> · {reminders} abandoned-checkout reminder{reminders > 1 ? "s" : ""} sent</span> : null}
                </>
              ) : null}
            </Row>
            <Row k="Library login">{d.libraryLogin ? `link sent ${short(d.libraryLogin)}` : null}</Row>
            <Row k="Support">
              {d.support ? (
                <>
                  {d.support.messages} email{d.support.messages > 1 ? "s" : ""}
                  <span className={s.sub}>
                    {d.support.last ? ` · last ${short(d.support.last)}` : ""} · {d.support.done ? "done" : "open"} (Sales → Support)
                  </span>
                </>
              ) : (
                <span className={s.sub}>no emails to support</span>
              )}
            </Row>
          </dl>
          {d.otherOrders.length ? (
            <>
              <div className={s.label} style={{ marginTop: 6 }}>THEIR OTHER ORDERS · {d.otherOrders.length}</div>
              <OrderList rows={d.otherOrders} onOpen={onOpen} />
            </>
          ) : null}
          {d.legacy.length ? (
            <>
              <div className={s.label} style={{ marginTop: 6 }}>BOUGHT BEFORE ON {d.legacy[0].source.toUpperCase()} · {d.legacy.length}</div>
              <div className={s.list}>
                {d.legacy.map((l, i) => (
                  <div key={i} className={s.item}>
                    <span>{l.product}</span>
                    <span className={`${s.sub} ${s.mono}`}>{l.at ? short(l.at) : ""}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </Section>

        <Section label="PAYMENT">
          {p ? (
            <>
              <dl className={s.kv}>
                <Row k="Method">{p.method}</Row>
                <Row k="Status">{p.status}</Row>
                <Row k="Charged">{money(o.amountCents, o.currency)}</Row>
                <Row k={o.provider === "paypal" ? "PayPal fee" : "Stripe fee"}>{p.feeCents != null ? money(p.feeCents, p.settledCurrency ?? o.currency) : null}</Row>
                <Row k="You received">
                  {p.netCents != null ? (
                    <>
                      <span style={{ fontWeight: 600 }}>{money(p.netCents, p.settledCurrency ?? o.currency)}</span>
                      {p.settledCurrency && p.settledCurrency !== o.currency ? <span className={s.sub}> · converted to {p.settledCurrency.toUpperCase()}</span> : null}
                      {refunded ? <span className={s.sub}> · before the refund</span> : null}
                    </>
                  ) : null}
                </Row>
                <Row k="Refunded">{refunded ? money(p.refundedCents, o.currency) : null}</Row>
                <Row k="Paid by">{[p.payer.name, p.payer.email && p.payer.email !== o.email ? p.payer.email : null].filter(Boolean).join(" · ") || null}</Row>
                <Row k="Payer country">{p.payer.country ? (p.payer.country.length === 2 ? country(p.payer.country) : p.payer.country) : null}</Row>
                <Row k="Address">{p.payer.address}</Row>
                <Row k="Risk">{p.risk}</Row>
                <Row k="Card checks">{p.checks}</Row>
                <Row k="Bank says">{p.network}</Row>
                <Row k={o.provider === "paypal" ? "Capture id" : "Charge id"}>{p.captureId ? <span className={s.mono}>{p.captureId}</span> : null}</Row>
                <Row k="Receipt">
                  {p.receiptUrl ? (
                    <a href={p.receiptUrl} target="_blank" rel="noreferrer">
                      Stripe receipt ↗
                    </a>
                  ) : null}
                </Row>
              </dl>
              {Object.keys(p.metadata).length ? (
                <details className={s.details}>
                  <summary>{o.provider === "paypal" ? "PayPal" : "Stripe"} metadata · {Object.keys(p.metadata).length}</summary>
                  <dl className={s.kv}>
                    {Object.entries(p.metadata).map(([k, v]) => (
                      <Row key={k} k={k}>
                        <span className={s.mono}>{v}</span>
                      </Row>
                    ))}
                  </dl>
                </details>
              ) : null}
            </>
          ) : (
            <p className={s.sub} style={{ fontSize: 13, margin: "0 0 10px" }}>
              Couldn&apos;t read the payment from {o.provider === "paypal" ? "PayPal" : "Stripe"}.
            </p>
          )}
        </Section>

        <Section label="WHERE THEY CAME FROM">
          {a ? (
            <>
              <dl className={s.kv}>
                <Row k="Channel">
                  {a.channel}
                  {a.organic ? <span className={s.sub}> · {a.organic}</span> : null}
                  {a.method ? <span className={s.sub}> · matched by {a.method}</span> : null}
                </Row>
                <Row k="Campaign">{a.campaign}</Row>
                <Row k="Ad set">{a.adset}</Row>
                <Row k="Ad">
                  {a.ad}
                  {a.adId ? <span className={`${s.sub} ${s.mono}`}> · {a.adId}</span> : null}
                </Row>
                <Row k="First Meta ad">{a.firstMetaAd}</Row>
                <Row k="Landed on">{a.landing}</Row>
                <Row k="Came from">{a.referrer}</Row>
                <Row k="Device">{a.device}</Row>
                <Row k="Click country">{country(a.country)}</Row>
                <Row k="First visit">{firstSeen ? `${short(firstSeen)} · bought ${span(Date.parse(o.createdAt) - Date.parse(firstSeen))} later` : null}</Row>
              </dl>
              {Object.keys(a.utm).length ? (
                <details className={s.details}>
                  <summary>UTM parameters · {Object.keys(a.utm).length}</summary>
                  <dl className={s.kv}>
                    {Object.entries(a.utm).map(([k, v]) => (
                      <Row key={k} k={k}>
                        <span className={s.mono}>{v}</span>
                      </Row>
                    ))}
                  </dl>
                </details>
              ) : null}
              {a.visits.length ? (
                <details className={s.details} open={a.visits.length <= 6}>
                  <summary>
                    Their visits before buying · {a.visits.length} page view{a.visits.length > 1 ? "s" : ""}
                  </summary>
                  <div className={s.timeline}>
                    {a.visits.map((v, i) => (
                      <div key={i} className={s.event}>
                        <span className={s.eventWhen}>{short(v.at)}</span>
                        <span className={s.eventWhat}>
                          {v.page}
                          <span className={s.sub}>{[v.source, v.content].filter(Boolean).length ? ` · ${[v.source, v.content].filter(Boolean).join(" / ")}` : ""}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          ) : (
            <p className={s.sub} style={{ fontSize: 13, margin: "0 0 10px" }}>
              neo has no record of this sale.
            </p>
          )}
        </Section>

        <Section label="EMAILS">
          {d.credited ? (
            <div className={s.credit}>
              Email → Insights credits this sale to <b>{d.credited.what}</b> ({d.credited.how === "click" ? "clicked" : "received"} {short(d.credited.at)}).
            </div>
          ) : null}
          {d.emails.length ? <Timeline events={d.emails} /> : <p className={s.sub} style={{ fontSize: 13, margin: "0 0 10px" }}>No emails to this address.</p>}
        </Section>

        <Section label="RECORD">
          <dl className={s.kv}>
            <Row k="Order id">
              <span className={s.mono}>{o.id}</span>
              <Copy text={o.id} />
            </Row>
            <Row k="Funnel">
              <span className={s.mono}>{o.funnel}</span>
            </Row>
            <Row k="Recorded">{full(o.createdAt)}</Row>
            <Row k="EU withdrawal">{o.waiver ? "waived (download started at once)" : "not waived"}</Row>
            <Row k="Receipt tries">{o.emailAttempts > 1 ? o.emailAttempts : null}</Row>
          </dl>
          {d.missing.length ? (
            <p className={s.note}>
              Couldn&apos;t read: {d.missing.join(" · ")}
            </p>
          ) : null}
        </Section>
      </div>
    </>
  );
}

function OrderList({ rows, onOpen, base }: { rows: OrderRow[]; onOpen: (id: string) => void; base?: string }) {
  return (
    <div className={s.list}>
      {rows.map((r) => (
        <button key={r.id} type="button" className={s.itemLink} onClick={() => onOpen(r.id)}>
          <span>
            {r.offer ? `upsell ${r.offer}` : r.funnel}
            {!r.offer && r.items.length > 1 ? <span className={s.sub}> + {r.items.length - 1} add-on{r.items.length > 2 ? "s" : ""}</span> : null}
            <span className={`${s.sub} ${s.mono}`}> · {base ? `${span(Date.parse(r.createdAt) - Date.parse(base))} later` : short(r.createdAt)}</span>
          </span>
          <span style={{ fontWeight: 500 }}>{money(r.amountCents, r.currency)} →</span>
        </button>
      ))}
    </div>
  );
}

// Opens are tracked from this deploy on (the pixel, lib/mail.ts): an older email has no "not opened".
const OPENS_SINCE = Date.parse("2026-11-04T20:00:00Z");

function Timeline({ events }: { events: EmailEvent[] }) {
  return (
    <div className={s.timeline}>
      {events.slice(0, 40).map((ev, i) => (
        <div key={i} className={s.event}>
          <span className={s.eventWhen}>{short(ev.at)}</span>
          <span className={s.eventWhat}>
            <span>
              {ev.what}
              <span className={s.sub}> · {ev.kind}</span>
            </span>
            <span className={s.marks}>
              {ev.status === "not sent" ? null : <span className={`${e.chip} ${ev.status === "failed" ? e.chip_failed : ""} ${s.mark}`}>{ev.status}</span>}
              <Opened ev={ev} />
              {ev.clicked ? (
                <span className={`${e.chip} ${e.chip_on} ${s.mark}`} title={ev.clicked.links.join("\n")}>
                  clicked {short(ev.clicked.at)}
                  {ev.clicked.count > 1 ? ` · ${ev.clicked.count}×` : ""}
                </span>
              ) : null}
            </span>
            {ev.clicked ? <span className={s.sub}>→ {ev.clicked.links.join(", ")}</span> : null}
            {ev.detail ? <span className={s.sub}>{ev.detail}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function Opened({ ev }: { ev: EmailEvent }) {
  const o = ev.opened;
  if (!o) {
    if (ev.status !== "sent" || Date.parse(ev.at) < OPENS_SINCE) return null;
    return <span className={`${e.chip} ${s.mark} ${s.markDim}`}>not opened</span>;
  }
  if (o.byPerson) {
    return (
      <span className={`${e.chip} ${e.chip_sent} ${s.mark}`}>
        opened {short(o.byPerson)}
        {o.count > 1 ? ` · ${o.count}×` : ""}
      </span>
    );
  }
  // Only machine opens: Apple Mail's proxy loads every email on delivery; a scanner checks links.
  const why = o.machine === "apple" ? "Apple Mail loads every email's images on delivery, read or not" : "a mail scanner, not a person";
  return (
    <span className={`${e.chip} ${e.chip_scheduled} ${s.mark}`} title={why}>
      {o.machine === "apple" ? "opened? (Apple Mail)" : "scanned"} {short(o.at)}
    </span>
  );
}
