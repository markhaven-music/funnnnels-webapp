"use client";

import { useCallback, useEffect, useState } from "react";
import { I } from "@/components/icons";
import type { ProductUse } from "@/lib/catalog";
import { money, type Money } from "@/lib/launch";
import { SHOP_URL } from "@/lib/liveUrl";
import type { ShopProduct, ShopStats } from "@/lib/shop";
import c from "./shop.module.css";

// Dashboard → Products, as in ClickFunnels: one product per zip, and every
// place it's sold (lib/catalog.ts). For each product:
//   its name, words, picture and zip (lib/shop.ts: the zip reaches every
//     funnel that sells it, and past buyers);
//   each funnel that sells it, as main product, add-on or upsell, with the
//     name and price it has there: saved straight to that checkout, whose
//     pages refresh (lib/funnels.ts reads them); the free uses (a bonus, a
//     file another add-on brings) are listed too;
//   another funnel to sell it in, as an add-on;
//   the shop: in it or not, at its shop price.
// A product leaves for good only if it never sold and no funnel sells it.

type Entry = ShopProduct & { uses: ProductUse[]; sold: number };
type Data = { products: Entry[]; funnels: { slug: string; name: string }[]; shop: ShopStats };

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

const ROLE_ORDER = ["Main", "Add-on", "Upsell", "Shop", "Bonus", "Included"];
const rank = (p: Entry) => Math.min(...p.uses.map((u) => ROLE_ORDER.indexOf(u.role)), ROLE_ORDER.length);
const funnelCount = (p: Entry) => new Set(p.uses.filter((u) => u.role !== "Shop").map((u) => u.funnel)).size;

/** "Main in TOP HITS MIDI Bundle · Upsell in MIDI Drum Kit · In the shop" */
function where(p: Entry): string {
  const seen = new Set<string>();
  const said = p.uses
    .map((u) => (u.role === "Shop" ? "In the shop" : `${u.role} in ${u.funnelName}`))
    .filter((x) => !seen.has(x) && seen.add(x))
    .join(" · ");
  return said || (p.status === "live" ? "In the shop" : "Not sold anywhere yet");
}

/** Its price where it's sold, "from …" when the places differ, "free bonus" when it's only ever given away. */
function priceOf(p: Entry): string {
  const paid = p.uses.flatMap((u) => (u.price ? [u.price] : []));
  if (!paid.length) return p.uses.length ? "free bonus" : p.price ? prices(p.price) : "—";
  const low = paid.reduce((a, b) => (b.eur < a.eur ? b : a));
  return paid.every((m) => m.eur === low.eur && m.usd === low.usd) ? prices(low) : `from ${prices(low)}`;
}

export function ProductsPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await send<Data>("/api/products", "GET"));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
    // ?nav=products&product=<slug> (the Shop's "Edit") opens that product.
    const want = new URLSearchParams(window.location.search).get("product");
    if (want) setSelected(want);
  }, [load]);

  const products = [...(data?.products ?? [])].sort((a, b) => rank(a) - rank(b) || a.position - b.position);
  const live = products.filter((p) => p.status === "live").length;
  const toggle = (slug: string) => setSelected(selected === slug ? null : slug);

  const stats = data
    ? [
        { label: "PRODUCTS", value: String(products.length), sub: "one per zip buyers download" },
        { label: "IN FUNNELS", value: String(products.filter((p) => funnelCount(p) > 0).length), sub: "main product, add-on, upsell or bonus" },
        { label: "IN THE SHOP", value: String(live), sub: `${data.shop.orders} shop order${data.shop.orders === 1 ? "" : "s"}` },
        { label: "SOLD", value: String(products.reduce((n, p) => n + p.sold, 0)), sub: "times, in paid orders recorded in Orders" },
      ]
    : [];

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">
            Everything you sell, one product per zip, with every place it&rsquo;s sold: a funnel&rsquo;s main product,
            an add-on, an upsell, a bonus, or the shop. Names and prices saved here are what the checkouts charge.
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

      {stats.length > 0 && (
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
          <p className={c.h2}>All products</p>
          <span className={c.mono}>{data ? String(products.length) : "Loading…"}</span>
        </div>
        {data && products.length === 0 ? (
          <div className={c.empty}>
            <p className={c.h2}>No products yet</p>
            <p className={c.sub}>Click New product: name it and price it, add a square picture and the zip buyers download.</p>
          </div>
        ) : (
          <div className={c.rows}>
            {products.map((p) => (
              <div key={p.slug}>
                <div className={`${c.row} ${selected === p.slug ? c.rowOn : ""}`}>
                  {p.image ? <img className={c.thumb} src={p.image.sm} alt="" width={44} height={44} /> : <span className={c.thumb} />}
                  <button type="button" className={c.rowMain} onClick={() => toggle(p.slug)}>
                    <span className={c.rowName}>{p.name}</span>
                    <span className={c.mono}>{where(p)}</span>
                  </button>
                  <span className={c.mono}>{priceOf(p)}</span>
                  {funnelCount(p) > 0 ? (
                    <span className={`${c.chip} ${c.chip_funnel}`}>
                      {funnelCount(p)} funnel{funnelCount(p) === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className={`${c.chip} ${c[`chip_${p.status}`]}`}>{p.status === "live" ? "In the shop" : "Draft"}</span>
                  )}
                  <span className={c.mono} title="Paid orders it was in, every place together">
                    {p.sold} sold
                  </span>
                  <button type="button" className={c.rowLink} onClick={() => toggle(p.slug)}>
                    {selected === p.slug ? "Close" : "Edit"}
                  </button>
                </div>
                {selected === p.slug && data && (
                  <Editor
                    p={p}
                    funnels={data.funnels}
                    onSaved={load}
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

function Editor({ p, funnels, onSaved, onDeleted }: { p: Entry; funnels: Data["funnels"]; onSaved: () => void; onDeleted: () => void }) {
  return (
    <div className={c.panel} style={{ margin: "4px 0 12px", background: "var(--bg-2)" }}>
      <div className={c.editor}>
        <div className={c.media}>
          <Picture p={p} onSaved={onSaved} />
          {p.status === "live" && (
            <a className="btn ghost" href={`${SHOP_URL}/${p.slug}`} target="_blank" rel="noopener">
              <I.eye size={14} /> Its shop page
            </a>
          )}
        </div>
        <div className={c.form}>
          <Details p={p} onSaved={onSaved} />
          <Zip p={p} onSaved={onSaved} />
          <Uses p={p} onSaved={onSaved} />
          <AddToFunnel p={p} funnels={funnels} onSaved={onSaved} />
          <Danger p={p} onDeleted={onDeleted} />
        </div>
      </div>
    </div>
  );
}

/** Two money fields that may stay empty (null: no price). */
function MaybePrice({ label, value, onChange }: { label: string; value: Money | null; onChange: (m: Money | null) => void }) {
  const set = (cur: "eur" | "usd", n: number) => {
    const next = { eur: value?.eur ?? NaN, usd: value?.usd ?? NaN, [cur]: n };
    onChange(Number.isNaN(next.eur) && Number.isNaN(next.usd) ? null : next);
  };
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
            value={value && !Number.isNaN(value[cur]) ? value[cur] : ""}
            onChange={(e) => set(cur, e.target.valueAsNumber)}
          />
        </label>
      ))}
    </>
  );
}

/** Its name and words (the shop, and an add-on the funnel's copy has no words for), and the shop. */
function Details({ p, onSaved }: { p: Entry; onSaved: () => void }) {
  const [f, setF] = useState({ name: p.name, tagline: p.tagline, description: p.description, price: p.price, status: p.status });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { product } = await send<{ product: ShopProduct }>(`/api/shop/products/${p.slug}`, "PATCH", f);
      onSaved();
      setMsg({ ok: true, text: product.status === "live" ? "Saved. The shop shows it within a minute." : "Saved." });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={c.form} onSubmit={save}>
      <p className={c.legend}>Product</p>
      <label className={c.field}>
        Name (in Products and the shop; each funnel has its own below)
        <input className={c.input} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <label className={c.field}>
        Tagline (one line, under the name in the shop; the text of an add-on its funnel has no words for)
        <input className={c.input} value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
      </label>
      <label className={c.field}>
        Description, for the shop (plain text: a blank line starts a paragraph, lines starting with &ldquo;- &rdquo; make a list)
        <textarea className={c.textarea} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </label>
      <p className={c.legend}>Shop</p>
      <label className={c.field} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={f.status === "live"} disabled={!p.file} onChange={(e) => setF({ ...f, status: e.target.checked ? "live" : "draft" })} />
        In the shop{p.file ? "" : " (upload its zip first)"}
      </label>
      <div className={c.fields}>
        <MaybePrice label="Shop price" value={f.price} onChange={(price) => setF({ ...f, price })} />
      </div>
      <div className={c.actions}>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <span className={msg.ok ? c.ok : c.error}>{msg.text}</span>}
      </div>
    </form>
  );
}

/** Every place it's sold: the priced ones editable, the free ones listed. */
function Uses({ p, onSaved }: { p: Entry; onSaved: () => void }) {
  const funnels = p.uses.filter((u) => u.role !== "Shop");
  if (!funnels.length) return null;
  return (
    <div>
      <p className={c.legend}>In funnels</p>
      <div className={c.extras} style={{ margin: "10px 0 0" }}>
        {funnels.map((u) => (u.key ? <PricedUse key={`${u.funnel}/${u.role}/${u.key}`} u={u} onSaved={onSaved} /> : <FreeUse key={`${u.funnel}/${u.role}/${u.soldAs}`} u={u} />))}
      </div>
      <p className={c.note} style={{ marginTop: 8 }}>
        A price saved here is what that checkout charges from now on, and its order form and upsell page say it. Their
        words state the price too, and follow it; reread any line that does math with it (&ldquo;90% off&rdquo;,
        &ldquo;€0.08 per hit&rdquo;, &ldquo;usually €147&rdquo;) after a change.
      </p>
    </div>
  );
}

const API_ROLE = { Main: "main", "Add-on": "bump", Upsell: "upsell" } as const;

function PricedUse({ u, onSaved }: { u: ProductUse; onSaved: () => void }) {
  const [f, setF] = useState({ name: u.soldAs, price: u.price as Money | null });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const role = API_ROLE[u.role as keyof typeof API_ROLE];
  const changed = f.name !== u.soldAs || f.price?.eur !== u.price?.eur || f.price?.usd !== u.price?.usd;

  async function act(method: "PATCH" | "DELETE" | "PUT", move?: -1 | 1) {
    setBusy(true);
    setMsg(null);
    try {
      await send("/api/products/items", method, { funnel: u.funnel, role, key: u.key, name: f.name, price: f.price, move });
      setMsg({ ok: true, text: method === "DELETE" ? "Taken out of the funnel." : method === "PUT" ? "Moved: the order form shows the new order." : "Saved: the checkout charges it now." });
      onSaved();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={c.useEdit}>
      <div className={c.useHead}>
        <span>
          <b>{u.funnelName}</b> <span className={c.dim}>· {u.role}{u.place ? ` ${u.place.at} of ${u.place.of}` : ""}</span>
        </span>
        <span className={c.mono}>{u.sold ?? 0} sold</span>
      </div>
      <div className={c.fields}>
        <label className={c.field}>
          Name at this checkout
          <input className={c.input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <MaybePrice label="Price" value={f.price} onChange={(price) => setF({ ...f, price })} />
      </div>
      <div className={c.actions}>
        <button type="button" className="btn primary" disabled={busy || !changed} onClick={() => act("PATCH")}>
          Save
        </button>
        {u.place && u.place.of > 1 && (
          <>
            <button type="button" className="btn ghost" disabled={busy || u.place.at === 1} onClick={() => act("PUT", -1)} title="Show it one place higher on the order form">
              ↑ Up
            </button>
            <button type="button" className="btn ghost" disabled={busy || u.place.at === u.place.of} onClick={() => act("PUT", 1)} title="Show it one place lower on the order form">
              ↓ Down
            </button>
          </>
        )}
        {u.role !== "Main" && (
          <button type="button" className={`btn ghost ${c.danger}`} disabled={busy} onClick={() => act("DELETE")}>
            Take out of {u.funnelName}
          </button>
        )}
        {msg && <span className={msg.ok ? c.ok : c.error}>{msg.text}</span>}
      </div>
    </div>
  );
}

function FreeUse({ u }: { u: ProductUse }) {
  return (
    <div className={c.use}>
      <span>
        {u.funnelName}
        <span className={c.dim}> · {u.role === "Bonus" ? `free bonus with ${u.with}` : `comes with ${u.with}`}</span>
      </span>
      <span className={c.mono}>{u.role}</span>
      <span className={c.mono}>free</span>
      <span />
      <span className={c.mono}>in its funnel&rsquo;s code</span>
    </div>
  );
}

/** Sell it in another funnel, as an add-on (or an upsell its funnel has a page for). */
function AddToFunnel({ p, funnels, onSaved }: { p: Entry; funnels: Data["funnels"]; onSaved: () => void }) {
  const [funnel, setFunnel] = useState("");
  const [role, setRole] = useState<"bump" | "upsell">("bump");
  const [price, setPrice] = useState<Money | null>(p.price ?? p.uses.find((u) => u.price)?.price ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function add() {
    setBusy(true);
    setMsg(null);
    try {
      await send("/api/products/items", "POST", { funnel, product: p.slug, role, price });
      setMsg({ ok: true, text: "Added: its checkout offers it now." });
      setFunnel("");
      onSaved();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className={c.legend}>Sell it in a funnel</p>
      <div className={c.fields} style={{ marginTop: 10 }}>
        <label className={c.field}>
          Funnel
          <select className={c.select} value={funnel} onChange={(e) => setFunnel(e.target.value)}>
            <option value="">Pick a funnel…</option>
            {funnels.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className={c.field}>
          As
          <select className={c.select} value={role} onChange={(e) => setRole(e.target.value as "bump" | "upsell")}>
            <option value="bump">An add-on (a tick-box at its checkout)</option>
            <option value="upsell">An upsell (needs its page)</option>
          </select>
        </label>
        <MaybePrice label="Price" value={price} onChange={setPrice} />
      </div>
      <div className={c.actions} style={{ marginTop: 10 }}>
        <button type="button" className="btn ghost" disabled={busy || !funnel || !price} onClick={add}>
          <I.plus size={13} /> Add to the funnel
        </button>
        {msg && <span className={msg.ok ? c.ok : c.error}>{msg.text}</span>}
      </div>
      <p className={c.note} style={{ marginTop: 6 }}>
        A new add-on shows its picture, &ldquo;YES! Add {p.name}!&rdquo; in the page&rsquo;s language and the
        product&rsquo;s tagline (in English) as its text.
      </p>
    </div>
  );
}

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

function Picture({ p, onSaved }: { p: Entry; onSaved: () => void }) {
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
      await send<{ product: ShopProduct }>(`/api/shop/products/${p.slug}/files`, "PUT", { kind: "image", sm: t.sm.path, lg: t.lg.path });
      onSaved();
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

const STORES = { supabase: "uploaded here", r2: "in Cloudflare R2", local: "shipped with the site" } as const;

function Zip({ p, onSaved }: { p: Entry; onSaved: () => void }) {
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
      await send<{ product: ShopProduct }>(`/api/shop/products/${p.slug}/files`, "PUT", { kind: "zip", path: t.path });
      onSaved();
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
        <div className={c.mono}>
          {state ?? (p.file ? `${p.file} · ${STORES[p.store]}` : "No zip yet: it can't be sold without one")}
        </div>
        {error && <div className={c.error}>{error}</div>}
        <div className={c.note}>
          Private: buyers get a short-lived link once Stripe or PayPal confirms the payment. A new zip reaches every
          funnel that sells it, and past buyers too. Uploads go to Supabase, 50 MB at most on the current plan: for a
          bigger one, ask Claude Code to put it in Cloudflare R2.
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

function Danger({ p, onDeleted }: { p: Entry; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (p.uses.some((u) => u.role !== "Shop")) return null;
  if (p.sold > 0) {
    return <p className={c.note}>Sold {p.sold} time{p.sold === 1 ? "" : "s"}, so it stays: take it out of the shop instead. Its buyers keep their download.</p>;
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
