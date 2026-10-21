"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderRow } from "@/lib/sales";
import e from "./email.module.css";

// Dashboard → Orders: every paid order (lib/sales.ts), newest first, with
// whether its receipt email went out.

const DAY = 86_400_000;

function money(cents: number, currency: string): string {
  const n = cents / 100;
  const s = Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === "eur" ? `€${s}` : `$${s}`;
}

function totals(orders: OrderRow[], since = 0) {
  const o = orders.filter((x) => Date.parse(x.createdAt) >= since);
  const sum = (c: string) => o.filter((x) => x.currency === c).reduce((n, x) => n + x.amountCents, 0);
  const mains = o.filter((x) => !x.offer);
  return {
    orders: mains.length,
    upsells: o.length - mains.length,
    eur: sum("eur"),
    usd: sum("usd"),
    bumps: mains.filter((x) => x.items.length > 1).length,
  };
}

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const COLS = { gridTemplateColumns: "110px minmax(0,1.6fr) minmax(0,1.3fr) 90px 70px 60px 110px" };

function receipt(o: OrderRow): { label: string; cls: string; title?: string } {
  if (o.emailSentAt) return { label: "sent", cls: e.chip_sent };
  if (o.emailError) return { label: "not sent", cls: e.chip_failed, title: o.emailError };
  if (!o.email) return { label: "no email", cls: "" };
  // The job gives up on receipts older than 3 days (lib/outbox.ts).
  if (Date.now() - Date.parse(o.createdAt) > 3 * DAY) return { label: "—", cls: "", title: "Before receipt emails existed" };
  return { label: "queued", cls: e.chip_scheduled };
}

export function OrdersPanel() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/orders", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setOrders((await r.json()).orders ?? []);
      })
      .catch((err) => setError(`Couldn't load the orders (${String(err)}).`))
      .finally(() => setLoading(false));
  }, []);

  const all = useMemo(() => totals(orders), [orders]);
  const week = useMemo(() => totals(orders, Date.now() - 7 * DAY), [orders]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? orders.filter((o) => [o.email, o.name, o.id, o.funnel].some((v) => v?.toLowerCase().includes(needle))) : orders;
  }, [orders, q]);

  const stats = [
    { label: "ORDERS", value: String(all.orders), sub: `${week.orders} in the last 7 days` },
    { label: "UPSELLS", value: String(all.upsells), sub: all.orders ? `${Math.round((all.upsells / all.orders) * 100)}% per order` : "—" },
    { label: "REVENUE · EUR", value: money(all.eur, "eur"), sub: `${money(week.eur, "eur")} in 7 days` },
    { label: "REVENUE · USD", value: money(all.usd, "usd"), sub: `${money(week.usd, "usd")} in 7 days` },
    { label: "ADD-ON TAKE RATE", value: all.orders ? `${Math.round((all.bumps / all.orders) * 100)}%` : "—", sub: `${all.bumps} of ${all.orders} orders` },
  ];

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">
            {loading ? "Loading…" : error || "Paid orders from Stripe and PayPal, recorded from the webhook, the PayPal return and the thank-you pages."}
          </p>
        </div>
      </div>

      <div className={e.stats}>
        {stats.map((s) => (
          <div key={s.label} className={e.stat}>
            <div className={e.statLabel}>{s.label}</div>
            <div className={e.statValue}>{s.value}</div>
            <div className={e.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={e.toolbar}>
        <input className={e.input} style={{ width: 280 }} placeholder="Search email, name, order id…" value={q} onChange={(ev) => setQ(ev.target.value)} />
        <span className={e.mono}>{shown.length} shown</span>
      </div>

      {!loading && orders.length === 0 ? (
        <div className={e.empty}>
          <img className={e.emptyArt} src="/funnels/dashboard/orders.webp" width={112} height={112} alt="" />
          <div>No orders recorded yet.</div>
        </div>
      ) : (
        <div className={e.table}>
          <div className={e.head} style={COLS}>
            <span>WHEN</span>
            <span>BUYER</span>
            <span>PRODUCT</span>
            <span>AMOUNT</span>
            <span>PAID BY</span>
            <span>LANG</span>
            <span>RECEIPT</span>
          </div>
          {shown.slice(0, 500).map((o) => {
            const r = receipt(o);
            return (
              <div key={o.id} className={e.row} style={COLS}>
                <span className={e.mono}>{when(o.createdAt)}</span>
                <span className={e.cell} title={o.id}>
                  <span className={e.strong}>{o.email ?? "—"}</span>
                  {o.name ? <span className={e.dim}> · {o.name}</span> : null}
                </span>
                <span className={e.cell}>
                  {o.offer ? <span className={e.dim}>↳ upsell {o.offer}</span> : o.funnel}
                  {!o.offer && o.items.length > 1 ? <span className={e.dim}> + {o.items.length - 1} add-on{o.items.length > 2 ? "s" : ""}</span> : null}
                </span>
                <span className={e.strong}>{money(o.amountCents, o.currency)}</span>
                <span className={e.dim}>{o.provider === "paypal" ? "PayPal" : "Card"}</span>
                <span className={e.mono}>{o.lang}</span>
                <span className={`${e.chip} ${r.cls}`} title={r.title}>
                  {r.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
