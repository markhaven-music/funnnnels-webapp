"use client";

import { useCallback, useEffect, useState } from "react";
import { I } from "@/components/icons";
import { money, type Money } from "@/lib/launch";
import { SHOP_URL } from "@/lib/liveUrl";
import type { ShopProduct, ShopSettings, ShopStats } from "@/lib/shop";
import c from "./shop.module.css";

// Dashboard → Shop: the storefront (app/shop). Its numbers from the paid
// orders, the products in it (the Live ones) in the order the shop page
// shows them, and the page's heading and intro. Products themselves are
// made and edited in dashboard → Products (ProductsPanel.tsx).

type Data = { products: ShopProduct[]; settings: ShopSettings; stats: ShopStats };

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

const cents = (n: number, currency: "eur" | "usd") => money(Math.round(n) / 100, currency);
const prices = (m: Money) => `${money(m.eur, "eur")} / ${money(m.usd, "usd")}`;

export function ShopPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await send<Data>("/api/shop", "GET"));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const all = data?.products ?? [];
  const live = all.filter((p) => p.status === "live");
  const drafts = all.length - live.length;

  async function move(i: number, by: -1 | 1) {
    const next = [...live];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    // Drafts keep their place after the live ones.
    const order = [...next, ...all.filter((p) => p.status !== "live")];
    setData((d) => d && { ...d, products: order });
    await send("/api/shop/products", "PUT", { order: order.map((p) => p.slug) }).catch((err) => setError((err as Error).message));
  }

  const s = data?.stats;
  const stats = s
    ? [
        { label: "ORDERS", value: String(s.orders), sub: `${s.last7} in the last 7 days` },
        { label: "REVENUE · EUR", value: cents(s.eurCents, "eur"), sub: "paid by European buyers" },
        { label: "REVENUE · USD", value: cents(s.usdCents, "usd"), sub: "paid by everyone else" },
        { label: "IN THE SHOP", value: String(live.length), sub: `${drafts} draft${drafts === 1 ? "" : "s"} not shown` },
      ]
    : [];

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Shop</h1>
          <p className="page-sub">
            Your storefront: the products you put in it, on one page with a cart and one checkout (card or PayPal).
          </p>
        </div>
        <div className="cta-group">
          <a className="btn ghost" href={SHOP_URL} target="_blank" rel="noopener">
            <I.eye size={14} /> View shop
          </a>
          <a className="btn primary" href="/?nav=products">
            <I.plus size={14} /> Add products
          </a>
        </div>
      </div>

      {error && <p className={c.error}>{error}</p>}

      {s && (
        <div className={c.stats}>
          {stats.map((x) => (
            <div key={x.label} className={c.stat}>
              <div className={c.statLabel}>{x.label}</div>
              <div className={c.statValue}>{x.value}</div>
              <div className={c.statSub}>{x.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className={c.panel}>
        <div className={c.panelHead}>
          <p className={c.h2}>In the shop</p>
          <span className={c.mono}>{data ? `${live.length} · in the order the shop page shows them` : "Loading…"}</span>
        </div>
        {data && live.length === 0 ? (
          <div className={c.empty}>
            <p className={c.h2}>Nothing in the shop yet</p>
            <p className={c.sub}>
              Make a product in <a href="/?nav=products">Products</a>, add its picture and zip, and set it Live: it shows
              up here and in the shop.
            </p>
          </div>
        ) : (
          <div className={c.rows}>
            {live.map((p, i) => (
              <div key={p.slug} className={c.row}>
                {p.image ? <img className={c.thumb} src={p.image.sm} alt="" width={44} height={44} /> : <span className={c.thumb} />}
                <a className={c.rowMain} href={`/?nav=products&product=${p.slug}`}>
                  <span className={c.rowName}>{p.name}</span>
                  <span className={c.mono}>/shop/{p.slug}</span>
                </a>
                <span className={c.mono}>{prices(p.price)}</span>
                <span className={c.mono} title="Paid orders that included it">
                  {s?.sold[p.slug] ?? 0} sold
                </span>
                <a className={c.rowLink} href={`/?nav=products&product=${p.slug}`}>
                  Edit
                </a>
                <span className={c.moves}>
                  <button type="button" className={c.move} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" className={c.move} disabled={i === live.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                    ↓
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && <Settings settings={data.settings} onSaved={(settings) => setData((d) => d && { ...d, settings })} />}
    </main>
  );
}

// ─── the shop page ─────────────────────────────────────────────

function Settings({ settings, onSaved }: { settings: ShopSettings; onSaved: (s: ShopSettings) => void }) {
  const [f, setF] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { settings: next } = await send<{ settings: ShopSettings }>("/api/shop", "PATCH", f);
      onSaved(next);
      setF(next);
      setMsg({ ok: true, text: "Saved. The shop shows it within a minute." });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`${c.panel} ${c.form}`} onSubmit={save}>
      <div>
        <p className={c.h2}>Shop page</p>
        <p className={c.sub}>The heading and the line under it, above the products.</p>
      </div>
      <label className={c.field}>
        Heading
        <input className={c.input} value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </label>
      <label className={c.field}>
        Intro
        <textarea className={c.textarea} style={{ minHeight: 70 }} value={f.intro} maxLength={600} onChange={(e) => setF({ ...f, intro: e.target.value })} />
      </label>
      <div className={c.actions}>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <span className={msg.ok ? c.ok : c.error}>{msg.text}</span>}
      </div>
    </form>
  );
}
