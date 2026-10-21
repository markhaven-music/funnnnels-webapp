"use client";

import { useCallback, useEffect, useState } from "react";
import { I } from "@/components/icons";
import { money, type Money } from "@/lib/launch";
import { SHOP_URL } from "@/lib/liveUrl";
import type { ShopProduct, ShopSettings, ShopStats } from "@/lib/shop";
import c from "./shop.module.css";

// Dashboard → Shop: the store next to the funnels (lib/shop.ts, app/shop).
//   the shop's numbers, from the paid orders
//   products: name, prices, description, a square picture, the paid zip,
//     Draft or Live, their order on the shop page
//   the shop page's heading and intro
// A product goes live only with its zip; one that sold can't be deleted
// (its buyers keep their download), only put back to Draft.

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

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

export function ShopPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  const products = data?.products ?? [];
  const live = products.filter((p) => p.status === "live").length;
  const replace = (p: ShopProduct) => setData((d) => d && { ...d, products: d.products.map((x) => (x.slug === p.slug ? p : x)) });

  async function move(i: number, by: -1 | 1) {
    const next = [...products];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    setData((d) => d && { ...d, products: next });
    await send("/api/shop/products", "PUT", { order: next.map((p) => p.slug) }).catch((err) => setError((err as Error).message));
  }

  const s = data?.stats;
  const stats = s
    ? [
        { label: "ORDERS", value: String(s.orders), sub: `${s.last7} in the last 7 days` },
        { label: "REVENUE · EUR", value: cents(s.eurCents, "eur"), sub: "paid by European buyers" },
        { label: "REVENUE · USD", value: cents(s.usdCents, "usd"), sub: "paid by everyone else" },
        { label: "LIVE PRODUCTS", value: String(live), sub: `${products.length - live} draft${products.length - live === 1 ? "" : "s"}` },
      ]
    : [];

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Shop</h1>
          <p className="page-sub">
            Your products on one page, with a cart and one checkout (card or PayPal). Instant downloads, next to the funnels.
          </p>
        </div>
        <div className="cta-group">
          <a className="btn ghost" href={SHOP_URL} target="_blank" rel="noopener">
            <I.eye size={14} /> View shop
          </a>
          <button type="button" className="btn primary" onClick={() => setCreating((v) => !v)}>
            <I.plus size={14} /> New product
          </button>
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

      {creating && (
        <NewProduct
          onCancel={() => setCreating(false)}
          onCreated={async (p) => {
            setCreating(false);
            await load();
            setSelected(p.slug);
          }}
        />
      )}

      <div className={c.panel}>
        <div className={c.panelHead}>
          <p className={c.h2}>Products</p>
          <span className={c.mono}>{data ? `${products.length} · in the order the shop shows them` : "Loading…"}</span>
        </div>
        {data && products.length === 0 ? (
          <div className={c.empty}>
            <p className={c.h2}>No products yet</p>
            <p className={c.sub}>
              Click New product: name it and price it, add a square picture and the zip buyers download, then put it live.
            </p>
          </div>
        ) : (
          <div className={c.rows}>
            {products.map((p, i) => (
              <div key={p.slug}>
                <div className={`${c.row} ${selected === p.slug ? c.rowOn : ""}`}>
                  {p.image ? <img className={c.thumb} src={p.image.sm} alt="" width={44} height={44} /> : <span className={c.thumb} />}
                  <button type="button" className={c.rowMain} onClick={() => setSelected(selected === p.slug ? null : p.slug)}>
                    <span className={c.rowName}>{p.name}</span>
                    <span className={c.mono}>/shop/{p.slug}</span>
                  </button>
                  <span className={c.mono}>{prices(p.price)}</span>
                  <span className={`${c.chip} ${c[`chip_${p.status}`]}`}>{p.status === "live" ? "Live" : "Draft"}</span>
                  <span className={c.mono} title="Orders that included it">
                    {s?.sold[p.slug] ?? 0} sold
                  </span>
                  <span className={c.moves}>
                    <button type="button" className={c.move} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                      ↑
                    </button>
                    <button type="button" className={c.move} disabled={i === products.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                      ↓
                    </button>
                  </span>
                </div>
                {selected === p.slug && (
                  <Editor
                    p={p}
                    sold={s?.sold[p.slug] ?? 0}
                    onSaved={replace}
                    onDeleted={async () => {
                      setSelected(null);
                      await load();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {data && <Settings settings={data.settings} onSaved={(settings) => setData((d) => d && { ...d, settings })} />}
    </main>
  );
}

// ─── new product ───────────────────────────────────────────────

function MoneyInputs({ label, value, onChange }: { label: string; value: Money; onChange: (m: Money) => void }) {
  return (
    <>
      {(["eur", "usd"] as const).map((cur) => (
        <label key={cur} className={c.field}>
          {label} {cur === "eur" ? "€ (Europe)" : "$ (everyone else)"}
          <input
            className={c.input}
            type="number"
            min="0.5"
            step="0.01"
            required
            value={Number.isNaN(value[cur]) ? "" : value[cur]}
            onChange={(e) => onChange({ ...value, [cur]: e.target.valueAsNumber })}
          />
        </label>
      ))}
    </>
  );
}

function NewProduct({ onCancel, onCreated }: { onCancel: () => void; onCreated: (p: ShopProduct) => void }) {
  const [f, setF] = useState({ name: "", slug: "", tagline: "", price: { eur: 27, usd: 27 } as Money });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { product } = await send<{ product: ShopProduct }>("/api/shop/products", "POST", f);
      onCreated(product);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className={`${c.panel} ${c.form}`} onSubmit={submit}>
      <div>
        <p className={c.h2}>New product</p>
        <p className={c.sub}>It starts as a draft. Add its picture, description and zip next, then put it live.</p>
      </div>
      <div className={c.fields}>
        <label className={c.field}>
          Name
          <input
            className={c.input}
            required
            value={f.name}
            placeholder="Neo Soul MIDI Pack"
            onChange={(e) => setF((cur) => ({ ...cur, name: e.target.value, slug: slugTouched ? cur.slug : slugify(e.target.value) }))}
          />
        </label>
        <label className={c.field}>
          URL: …/shop/{f.slug || "…"}
          <input
            className={c.input}
            required
            value={f.slug}
            onChange={(e) => (setSlugTouched(true), setF((cur) => ({ ...cur, slug: slugify(e.target.value) })))}
          />
        </label>
      </div>
      <label className={c.field}>
        Tagline (one line, under the name)
        <input className={c.input} value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
      </label>
      <div className={c.fields}>
        <MoneyInputs label="Price" value={f.price} onChange={(price) => setF({ ...f, price })} />
      </div>
      {error && <p className={c.error}>{error}</p>}
      <div className={c.actions}>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Creating…" : "Create product"}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── editing a product ─────────────────────────────────────────

function Editor({ p, sold, onSaved, onDeleted }: { p: ShopProduct; sold: number; onSaved: (p: ShopProduct) => void; onDeleted: () => void }) {
  const [f, setF] = useState({ name: p.name, tagline: p.tagline, description: p.description, price: p.price, status: p.status });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { product } = await send<{ product: ShopProduct }>(`/api/shop/products/${p.slug}`, "PATCH", f);
      onSaved(product);
      setMsg({ ok: true, text: product.status === "live" ? "Saved. The shop shows it within a minute." : "Saved as a draft: the shop doesn't show it." });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={c.panel} style={{ margin: "4px 0 12px", background: "var(--bg-2)" }}>
      <div className={c.editor}>
        <div className={c.media}>
          <Picture p={p} onSaved={onSaved} />
          {p.status === "live" && (
            <a className="btn ghost" href={`${SHOP_URL}/${p.slug}`} target="_blank" rel="noopener">
              <I.eye size={14} /> Open its page
            </a>
          )}
        </div>
        <form className={c.form} onSubmit={save}>
          <div className={c.fields}>
            <label className={c.field}>
              Name
              <input className={c.input} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </label>
            <label className={c.field}>
              Status
              <select className={c.select} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ShopProduct["status"] })}>
                <option value="draft">Draft: only here</option>
                <option value="live" disabled={!p.file}>
                  Live: in the shop{p.file ? "" : " (upload the zip first)"}
                </option>
              </select>
            </label>
          </div>
          <label className={c.field}>
            Tagline (one line, under the name)
            <input className={c.input} value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
          </label>
          <div className={c.fields}>
            <MoneyInputs label="Price" value={f.price} onChange={(price) => setF({ ...f, price })} />
          </div>
          <label className={c.field}>
            Description (plain text: a blank line starts a paragraph, lines starting with &ldquo;- &rdquo; make a list)
            <textarea className={c.textarea} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </label>
          <Zip p={p} onSaved={onSaved} />
          <div className={c.actions}>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            {msg && <span className={msg.ok ? c.ok : c.error}>{msg.text}</span>}
          </div>
          <Danger p={p} sold={sold} onDeleted={onDeleted} />
        </form>
      </div>
    </div>
  );
}

/** A square crop of the picture at `size` px, as webp (jpeg where the browser can't write webp). */
async function square(bitmap: ImageBitmap, size: number, type: "image/webp" | "image/jpeg"): Promise<Blob> {
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't resize pictures.");
  // The shop's card colour behind transparent pictures.
  ctx.fillStyle = "#16130f";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, type === "image/webp" ? 0.82 : 0.86));
  if (!blob) throw new Error("This browser couldn't save the picture.");
  return blob;
}

async function put(url: string, body: Blob, type: string) {
  const res = await fetch(url, { method: "PUT", headers: { "content-type": type, "cache-control": "max-age=31536000" }, body });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message ?? j.error ?? `Upload failed (${res.status})`);
  }
}

function Picture({ p, onSaved }: { p: ShopProduct; onSaved: (p: ShopProduct) => void }) {
  const [state, setState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setState("Resizing…");
    try {
      const bitmap = await createImageBitmap(file).catch(() => {
        throw new Error("Couldn't read that picture. Use a JPG, PNG or WebP.");
      });
      let lg = await square(bitmap, 1200, "image/webp");
      // Safari before 17 writes PNG when asked for webp: fall back to jpeg.
      const ext = lg.type === "image/webp" ? "webp" : "jpg";
      const type = ext === "webp" ? "image/webp" : "image/jpeg";
      if (ext === "jpg") lg = await square(bitmap, 1200, type);
      const sm = await square(bitmap, 600, type);
      setState("Uploading…");
      const t = await send<{ sm: { path: string; signedUrl: string }; lg: { path: string; signedUrl: string } }>(`/api/shop/products/${p.slug}/files`, "POST", { kind: "image", ext });
      await Promise.all([put(t.sm.signedUrl, sm, type), put(t.lg.signedUrl, lg, type)]);
      const { product } = await send<{ product: ShopProduct }>(`/api/shop/products/${p.slug}/files`, "PUT", { kind: "image", sm: t.sm.path, lg: t.lg.path });
      onSaved(product);
      setState(Math.min(bitmap.width, bitmap.height) < 600 ? "Saved. It's under 600 px, so it may look soft." : null);
    } catch (err) {
      setError((err as Error).message);
      setState(null);
    }
  }

  return (
    <>
      {p.image ? <img className={c.preview} src={p.image.lg} alt="" width={220} height={220} /> : <div className={c.preview}>No picture yet</div>}
      <label className="btn ghost" style={{ cursor: "pointer", justifyContent: "center" }}>
        {p.image ? "Replace picture" : "Upload picture"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
      </label>
      <span className={c.note}>{state ?? "Cropped to a square from the middle, saved at 600 and 1200 px."}</span>
      {error && <span className={c.error}>{error}</span>}
    </>
  );
}

function Zip({ p, onSaved }: { p: ShopProduct; onSaved: (p: ShopProduct) => void }) {
  const [state, setState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setState(`Uploading ${file.name}…`);
    try {
      const t = await send<{ path: string; signedUrl: string }>(`/api/shop/products/${p.slug}/files`, "POST", { kind: "zip", filename: file.name });
      const res = await fetch(t.signedUrl, { method: "PUT", headers: { "content-type": "application/zip", "x-upsert": "true" }, body: file });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? j.error ?? `Upload failed (${res.status})`);
      }
      const { product } = await send<{ product: ShopProduct }>(`/api/shop/products/${p.slug}/files`, "PUT", { kind: "zip", path: t.path });
      onSaved(product);
      setState(null);
    } catch (err) {
      setError((err as Error).message);
      setState(null);
    }
  }

  return (
    <div className={c.fileRow}>
      <div>
        <div>Paid file</div>
        <div className={c.mono}>{state ?? p.file ?? "No zip yet: it can't go live without one"}</div>
        {error && <div className={c.error}>{error}</div>}
        <div className={c.note}>
          Private: buyers get a 60-second link on the thank-you page, after Stripe or PayPal confirms the payment. A new
          zip reaches past buyers too. 50 MB at most on the current Supabase plan.
        </div>
      </div>
      <label className="btn ghost" style={{ cursor: "pointer" }}>
        {p.file ? "Replace .zip" : "Upload .zip"}
        <input
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
      </label>
    </div>
  );
}

function Danger({ p, sold, onDeleted }: { p: ShopProduct; sold: number; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (sold > 0) {
    return <p className={c.note}>Sold {sold} time{sold === 1 ? "" : "s"}, so it stays: put it back to Draft to take it out of the shop. Its buyers keep their download.</p>;
  }
  return confirm ? (
    <div className={c.actions}>
      <button
        type="button"
        className={`btn ghost ${c.danger}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await send(`/api/shop/products/${p.slug}`, "DELETE");
            onDeleted();
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        }}
      >
        <I.trash size={13} /> {busy ? "Deleting…" : "Delete forever"}
      </button>
      <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
        Cancel
      </button>
      {error && <span className={c.error}>{error}</span>}
    </div>
  ) : (
    <div className={c.actions}>
      <button type="button" className={`btn ghost ${c.danger}`} onClick={() => setConfirm(true)}>
        Delete…
      </button>
      <span className={c.note}>Never sold, so it can go, with its picture and zip.</span>
    </div>
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
