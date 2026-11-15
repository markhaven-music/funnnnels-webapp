"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CfOrder } from "@/lib/cfOrders";
import e from "./email.module.css";
import b from "./blog.module.css";
import c from "./clickfunnels.module.css";

// Dashboard → ClickFunnels (lib/cfOrders.ts): the sales ClickFunnels took
// before funnnnels, 26 Nov 2025 to 2 Nov 2026. An archive: the numbers never
// change. Totals, one chart (the tile picked says what it draws), what sold
// by product and by funnel, then every order to search through.
// Everything is counted here from the one list the server sends (1,130 orders).

const FIRST = "2025-11-26";
const LAST = "2026-11-02";
const PAGE = 100;

type Metric = "collected" | "orders";

const eur = (cents: number) => `€${(cents / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const eur0 = (cents: number) => `€${Math.round(cents / 100).toLocaleString("en-GB")}`;
const sum = (a: number[]) => a.reduce((n, x) => n + x, 0);
const day = (o: CfOrder) => o.at.slice(0, 10);
const dayLabel = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthLabel = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const lastDayOf = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

/** A sale: paid and money came in. The 822 orders of ClickFunnels' own count. */
const isSale = (o: CfOrder) => o.status === "paid" && o.collected > 0;
const refunded = (o: CfOrder) => (o.status === "refunded" ? o.amount : o.status === "partially-refunded" ? Math.max(0, o.amount - o.collected) : 0);

const STATUS: Record<string, string> = {
  paid: "Paid",
  abandoned: "Abandoned",
  "past-due": "Past due",
  refunded: "Refunded",
  pending: "Pending",
  disputed: "Disputed",
  "partially-refunded": "Partly refunded",
};
const statusLabel = (s: string) => STATUS[s] ?? (s || "—");
const chip = (s: string) => (s === "paid" ? e.chip_sent : s === "refunded" || s === "disputed" || s === "partially-refunded" ? e.chip_failed : s === "past-due" ? e.chip_scheduled : "");

const PRESETS: { label: string; from: string; to: string }[] = [
  { label: "All of it", from: FIRST, to: LAST },
  { label: "2025", from: FIRST, to: "2025-12-31" },
  { label: "2026", from: "2026-01-01", to: LAST },
];

const COLS = { gridTemplateColumns: "64px 104px minmax(0,1.3fr) minmax(0,1.7fr) 92px 124px" };

type Bar = { key: string; label: string; value: number; from: string; to: string };

/** Sales per month (per day when the dates picked span two months or less). A click on a month shows that month. */
function Chart({ bars, format, unit, note, onPick }: { bars: Bar[]; format: (n: number) => string; unit: string; note: string; onPick?: (bar: Bar) => void }) {
  const max = Math.max(1, ...bars.map((x) => x.value));
  const ticks = [max, max / 2];
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover !== null && bars[hover] ? bars[hover] : null;
  const labelEvery = Math.max(1, Math.ceil(bars.length / 13));
  return (
    <div className={b.chart}>
      <div className={b.chartTop}>
        <span className={b.chartTotal}>
          {format(sum(bars.map((x) => x.value)))} <span>{unit}</span>
        </span>
        <span className={b.chartHover}>{shown ? `${shown.label} · ${format(shown.value)}` : note}</span>
      </div>
      <div className={`${b.plot} ${c.plot}`}>
        {ticks.map((t) => (
          <span key={t} className={b.tick} style={{ bottom: `${(t / max) * 100}%` }}>
            {format(t)}
          </span>
        ))}
        <div className={b.bars} onMouseLeave={() => setHover(null)}>
          {bars.map((x, i) => (
            <button
              key={x.key}
              type="button"
              className={`${b.barSlot} ${c.slot}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => onPick?.(x)}
              disabled={!onPick}
              title={`${x.label}: ${format(x.value)}`}
              aria-label={`${x.label}: ${format(x.value)}`}
            >
              <div className={`${b.bar} ${hover === i ? b.barOn : ""}`} style={{ height: `${(x.value / max) * 100}%` }} />
            </button>
          ))}
        </div>
      </div>
      <div className={c.axis}>
        {bars.map((x, i) => (
          <span key={x.key}>{i % labelEvery === 0 ? x.label : ""}</span>
        ))}
      </div>
    </div>
  );
}

export function ClickFunnelsPanel() {
  const [orders, setOrders] = useState<CfOrder[] | null>(null);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(FIRST);
  const [to, setTo] = useState(LAST);
  const [metric, setMetric] = useState<Metric>("collected");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const listRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    fetch("/api/cf-orders", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setOrders((await r.json()).orders ?? []);
      })
      .catch((err) => setError(`Couldn't load ClickFunnels' orders (${String(err)}).`));
  }, []);

  const lo = from || FIRST;
  const hi = to || LAST;
  const whole = lo <= FIRST && hi >= LAST;
  const setRange = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    setLimit(PAGE);
  };

  // The orders of the dates picked: what every number below counts.
  const scope = useMemo(() => (orders ?? []).filter((o) => day(o) >= lo && day(o) <= hi), [orders, lo, hi]);
  const sales = useMemo(() => scope.filter(isSale), [scope]);

  const total = useMemo(() => {
    const back = scope.filter((o) => refunded(o) > 0);
    const unpaid = scope.filter((o) => o.status === "abandoned" || o.status === "past-due" || o.status === "pending");
    return {
      orders: sales.length,
      collected: sum(sales.map((o) => o.collected)),
      buyers: new Set(sales.map((o) => o.email.toLowerCase())).size,
      refunds: back.length,
      refunded: sum(back.map(refunded)),
      unpaid: unpaid.length,
      abandoned: unpaid.filter((o) => o.status === "abandoned").length,
    };
  }, [scope, sales]);

  // By month; by day once the dates picked fit in two months.
  const byDay = (Date.parse(hi) - Date.parse(lo)) / 86_400_000 <= 62;
  const bars = useMemo<Bar[]>(() => {
    if (!orders || lo > hi) return [];
    const out: Bar[] = [];
    const start = lo < FIRST ? FIRST : lo;
    const end = hi > LAST ? LAST : hi;
    if (byDay) {
      for (let t = Date.parse(`${start}T12:00:00Z`); t <= Date.parse(`${end}T12:00:00Z`); t += 86_400_000) {
        const d = new Date(t).toISOString().slice(0, 10);
        out.push({ key: d, label: dayLabel(d).replace(/ \d{4}$/, ""), value: 0, from: d, to: d });
      }
    } else {
      for (let m = start.slice(0, 7); m <= end.slice(0, 7); ) {
        out.push({ key: m, label: monthLabel(m), value: 0, from: `${m}-01`, to: lastDayOf(m) });
        const [y, mo] = m.split("-").map(Number);
        m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
      }
    }
    const at = new Map(out.map((x, i) => [x.key, i]));
    for (const o of sales) {
      const i = at.get(byDay ? day(o) : day(o).slice(0, 7));
      if (i !== undefined) out[i].value += metric === "collected" ? o.collected : 1;
    }
    return out;
  }, [orders, sales, lo, hi, byDay, metric]);

  const products = useMemo(() => {
    const m = new Map<string, { name: string; sold: number; cents: number }>();
    for (const o of sales)
      for (const it of o.items) {
        const row = m.get(it.name) ?? { name: it.name, sold: 0, cents: 0 };
        row.sold += 1;
        row.cents += it.cents;
        m.set(it.name, row);
      }
    return [...m.values()].sort((a, x) => x.cents - a.cents || x.sold - a.sold);
  }, [sales]);

  const funnels = useMemo(() => {
    const m = new Map<string, { name: string; orders: number; cents: number }>();
    for (const o of sales) {
      const row = m.get(o.funnel) ?? { name: o.funnel, orders: 0, cents: 0 };
      row.orders += 1;
      row.cents += o.collected;
      m.set(o.funnel, row);
    }
    return [...m.values()].sort((a, x) => x.cents - a.cents);
  }, [sales]);

  const statuses = useMemo(() => {
    const m = new Map<string, { status: string; orders: number; amount: number; collected: number }>();
    for (const o of scope) {
      const row = m.get(o.status) ?? { status: o.status, orders: 0, amount: 0, collected: 0 };
      row.orders += 1;
      row.amount += o.amount;
      row.collected += o.collected;
      m.set(o.status, row);
    }
    return [...m.values()].sort((a, x) => x.orders - a.orders);
  }, [scope]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/^#/, "");
    return scope
      .filter((o) => status === "all" || o.status === status)
      .filter(
        (o) =>
          !needle ||
          String(o.number) === needle ||
          [o.name, o.email, o.funnel, o.id, o.payments, ...o.items.map((it) => it.name)].some((v) => v.toLowerCase().includes(needle)),
      )
      .reverse(); // newest first
  }, [scope, status, q]);

  const find = (text: string, st = "all") => {
    setQ(text);
    setStatus(st);
    setLimit(PAGE);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const span = whole ? "26 Nov 2025 to 2 Nov 2026" : lo === hi ? dayLabel(lo) : `${dayLabel(lo)} to ${dayLabel(hi)}`;
  const topProduct = products[0]?.cents || 1;
  const topFunnel = funnels[0]?.cents || 1;

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">ClickFunnels</h1>
          <p className="page-sub">
            {error ||
              (orders
                ? "The sales ClickFunnels took before funnnnels, 26 Nov 2025 to 2 Nov 2026. An archive: nothing here changes any more."
                : "Loading…")}
          </p>
        </div>
      </div>

      {orders ? (
        <>
          <div className={e.toolbar}>
            <label className={c.date}>
              <span>From</span>
              <input className={e.input} type="date" min={FIRST} max={LAST} value={from} onChange={(ev) => setRange(ev.target.value, to)} />
            </label>
            <label className={c.date}>
              <span>to</span>
              <input className={e.input} type="date" min={FIRST} max={LAST} value={to} onChange={(ev) => setRange(from, ev.target.value)} />
            </label>
            <div className={c.presets}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`${c.preset} ${lo === p.from && hi === p.to ? c.presetOn : ""}`}
                  onClick={() => setRange(p.from, p.to)}
                  aria-pressed={lo === p.from && hi === p.to}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className={e.mono}>{span} · UTC days</span>
          </div>

          <div className={e.stats}>
            <button type="button" className={`${e.stat} ${b.tile} ${metric === "collected" ? b.tileOn : ""}`} onClick={() => setMetric("collected")} aria-pressed={metric === "collected"}>
              <div className={e.statLabel}>REVENUE COLLECTED</div>
              <div className={e.statValue}>{eur(total.collected)}</div>
              <div className={e.statSub}>from paid orders, in euro</div>
            </button>
            <button type="button" className={`${e.stat} ${b.tile} ${metric === "orders" ? b.tileOn : ""}`} onClick={() => setMetric("orders")} aria-pressed={metric === "orders"}>
              <div className={e.statLabel}>PAID ORDERS</div>
              <div className={e.statValue}>{total.orders.toLocaleString("en-GB")}</div>
              <div className={e.statSub}>
                {total.buyers.toLocaleString("en-GB")} buyer{total.buyers === 1 ? "" : "s"}
              </div>
            </button>
            <div className={e.stat}>
              <div className={e.statLabel}>AVERAGE ORDER</div>
              <div className={e.statValue}>{total.orders ? eur(Math.round(total.collected / total.orders)) : "—"}</div>
              <div className={e.statSub}>collected per paid order</div>
            </div>
            <div className={e.stat}>
              <div className={e.statLabel}>REFUNDS</div>
              <div className={e.statValue}>{total.refunds}</div>
              <div className={e.statSub}>{total.refunds ? `${eur(total.refunded)} given back` : "none in these dates"}</div>
            </div>
            <div className={e.stat}>
              <div className={e.statLabel}>NOT PAID</div>
              <div className={e.statValue}>{total.unpaid}</div>
              <div className={e.statSub}>{total.abandoned} abandoned, the rest pending or past due</div>
            </div>
          </div>

          {bars.length ? (
            <Chart
              bars={bars}
              format={metric === "collected" ? eur0 : (n) => String(Math.round(n))}
              unit={metric === "collected" ? "collected" : "paid orders"}
              note={byDay ? "by day" : "by month · click a month to open it"}
              onPick={byDay ? undefined : (bar) => setRange(bar.from < FIRST ? FIRST : bar.from, bar.to > LAST ? LAST : bar.to)}
            />
          ) : null}

          <div className={b.two}>
            <div>
              <h2 className={b.title}>By product</h2>
              <div className={e.table}>
                <div className={`${e.head} ${c.product}`}>
                  <span>PRODUCT</span>
                  <span />
                  <span className={b.num}>SOLD</span>
                  <span className={b.num}>AT ITS PRICE</span>
                </div>
                {products.length === 0 ? (
                  <div className={e.row}>
                    <span className={e.dim}>No paid orders in these dates.</span>
                  </div>
                ) : (
                  products.map((p) => (
                    <button key={p.name} type="button" className={`${e.rowButton} ${c.product} ${c.pick}`} onClick={() => find(p.name, "paid")} title="Show its orders">
                      <span className={`${e.cell} ${e.strong}`} title={p.name}>{p.name}</span>
                      <span className={b.sourceBar}>
                        <i style={{ width: `${Math.max(p.cents ? 2 : 0, (p.cents / topProduct) * 100)}%` }} />
                      </span>
                      <span className={b.num}>{p.sold}</span>
                      <span className={b.num}>{eur(p.cents)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className={b.title}>By funnel</h2>
              <div className={e.table}>
                <div className={`${e.head} ${c.product}`}>
                  <span>FUNNEL</span>
                  <span />
                  <span className={b.num}>ORDERS</span>
                  <span className={b.num}>COLLECTED</span>
                </div>
                {funnels.length === 0 ? (
                  <div className={e.row}>
                    <span className={e.dim}>No paid orders in these dates.</span>
                  </div>
                ) : (
                  funnels.map((f) => {
                    const cells = (
                      <>
                        <span className={`${e.cell} ${f.name ? e.strong : e.dim}`} title={f.name}>{f.name || "No funnel on the order"}</span>
                        <span className={b.sourceBar}>
                          <i style={{ width: `${Math.max(2, (f.cents / topFunnel) * 100)}%` }} />
                        </span>
                        <span className={b.num}>{f.orders}</span>
                        <span className={b.num}>{eur(f.cents)}</span>
                      </>
                    );
                    return f.name ? (
                      <button key={f.name} type="button" className={`${e.rowButton} ${c.product} ${c.pick}`} onClick={() => find(f.name, "paid")} title="Show its orders">
                        {cells}
                      </button>
                    ) : (
                      <div key="none" className={`${e.row} ${c.product}`}>
                        {cells}
                      </div>
                    );
                  })
                )}
              </div>

              <h2 className={b.title}>By status</h2>
              <div className={e.table}>
                <div className={`${e.head} ${c.status}`}>
                  <span>STATUS</span>
                  <span className={b.num}>ORDERS</span>
                  <span className={b.num}>ORDER TOTAL</span>
                  <span className={b.num}>COLLECTED</span>
                </div>
                {statuses.map((s) => (
                  <button key={s.status} type="button" className={`${e.rowButton} ${c.status} ${c.pick}`} onClick={() => find("", s.status)} title="Show these orders">
                    <span>
                      <span className={`${e.chip} ${chip(s.status)}`}>{statusLabel(s.status)}</span>
                    </span>
                    <span className={b.num}>{s.orders}</span>
                    <span className={b.num}>{eur(s.amount)}</span>
                    <span className={b.num}>{eur(s.collected)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className={b.hint}>Click a product, a funnel or a status to see its orders below.</p>

          <h2 className={b.title} ref={listRef} style={{ scrollMarginTop: 80 }}>
            Orders
          </h2>
          <div className={e.toolbar}>
            <input
              className={e.input}
              style={{ width: 320, maxWidth: "100%" }}
              placeholder="Search order number, name, email, product…"
              value={q}
              onChange={(ev) => {
                setQ(ev.target.value);
                setLimit(PAGE);
              }}
            />
            <select
              className={e.select}
              value={status}
              onChange={(ev) => {
                setStatus(ev.target.value);
                setLimit(PAGE);
              }}
              aria-label="Status"
            >
              <option value="all">Every status</option>
              {Object.keys(STATUS).map((s) => (
                <option key={s} value={s}>
                  {STATUS[s]}
                </option>
              ))}
            </select>
            {q || status !== "all" ? (
              <button type="button" className={c.preset} onClick={() => find("")}>
                Clear
              </button>
            ) : null}
            <span className={e.mono}>
              {shown.length.toLocaleString("en-GB")} order{shown.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className={e.table}>
            <div className={`${e.head} ${c.cols}`} style={COLS}>
              <span>ORDER</span>
              <span>DATE</span>
              <span>CUSTOMER</span>
              <span>PRODUCTS</span>
              <span className={b.num}>AMOUNT</span>
              <span>STATUS</span>
            </div>
            {shown.length === 0 ? (
              <div className={e.row}>
                <span className={e.dim}>No order matches.</span>
              </div>
            ) : (
              shown.slice(0, limit).map((o) => (
                <Fragment key={o.id}>
                  <button
                    type="button"
                    className={`${e.rowButton} ${c.cols} ${c.pick} ${open === o.id ? c.rowOn : ""}`}
                    style={COLS}
                    onClick={() => setOpen(open === o.id ? null : o.id)}
                    aria-expanded={open === o.id}
                  >
                    <span className={e.mono}>#{o.number}</span>
                    <span className={c.when}>{dayLabel(day(o))}</span>
                    <span className={b.postName}>
                      <span className={e.strong}>{o.name || "—"}</span>
                      <span className={b.postMeta}>{o.email}</span>
                    </span>
                    <span className={e.cell} title={o.items.map((it) => it.name).join(", ")}>
                      {o.items.map((it) => it.name).join(", ") || "—"}
                    </span>
                    <span className={`${b.num} ${o.collected ? "" : e.dim}`} title={o.collected ? "Collected" : "The order's total; nothing was collected"}>
                      {eur(o.collected || o.amount)}
                    </span>
                    <span>
                      <span className={`${e.chip} ${chip(o.status)}`}>{statusLabel(o.status)}</span>
                    </span>
                  </button>
                  {open === o.id ? (
                    <div className={c.detail}>
                      <dl>
                        <dt>Placed</dt>
                        <dd>{when(o.at)} UTC</dd>
                        <dt>Funnel</dt>
                        <dd>{o.funnel || "—"}</dd>
                        <dt>Country</dt>
                        <dd>{o.country || "—"}</dd>
                        <dt>Order total</dt>
                        <dd>
                          {eur(o.amount)} · collected {eur(o.collected)}
                          {o.service ? ` · ${o.service}` : ""}
                        </dd>
                        <dt>Payment ids</dt>
                        <dd className={c.ids}>{o.payments || "—"}</dd>
                        <dt>ClickFunnels id</dt>
                        <dd className={c.ids}>{o.id}</dd>
                      </dl>
                      <ul>
                        {o.items.map((it, i) => (
                          <li key={i}>
                            <span>{it.name}</span>
                            <span className={b.num}>{eur(it.cents)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </Fragment>
              ))
            )}
          </div>
          {shown.length > limit ? (
            <button type="button" className={`btn ${c.more}`} onClick={() => setLimit(limit + PAGE)}>
              Show {Math.min(PAGE, shown.length - limit)} more of {(shown.length - limit).toLocaleString("en-GB")}
            </button>
          ) : null}

          <p className={b.foot}>
            From ClickFunnels&apos; own export of 4 Nov 2026 (1,130 orders, #1003 to #2138, all in euro); its last paid order was on 31 Oct 2026. Revenue and paid orders count the
            orders ClickFunnels marks paid; products are named as ClickFunnels named them; disputed and partly refunded ones are under By status. A product&apos;s &quot;at its price&quot; adds up the price of each line sold, so the
            products together differ a little from the revenue collected. Days are UTC days. Today&apos;s sales are in Orders and in neo.
          </p>
        </>
      ) : null}
    </main>
  );
}
