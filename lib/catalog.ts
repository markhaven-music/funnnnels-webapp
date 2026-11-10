import { readFile } from "node:fs/promises";
import path from "node:path";
import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import { funnel as topHits } from "@/app/(funnels)/top-hits-midi-bundle/funnel";
import { funnel as topHitsChords } from "@/app/(funnels)/top-hits-chords/funnel";
import { funnel as famousBeats } from "@/app/(funnels)/famous-beats-bundle/funnel";
import { funnel as drunkGrooves } from "@/app/(funnels)/drunk-swing-grooves/funnel";
import type { Money } from "@/lib/launch";
import { signedDownload } from "@/lib/products";
import { presignedDownload, r2Configured } from "@/lib/r2";
import { SHOP_SLUG, imageUrl } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

// Products as in ClickFunnels: one per zip a buyer downloads, in `catalog`,
// used by the funnels through `funnel_items` (db/catalog.sql): each funnel's
// main product, add-ons and upsells, with the name and price they're sold at
// there. Dashboard → Products edits both; the funnels and their checkout read
// them (lib/funnels.ts resolveFunnel), and the downloads find the zip here.
//
// What stays in each funnel.ts: the pages, their words in every language,
// and the free files (the Jazz bonuses, the files an add-on brings), which
// are listed here as uses but have no price of their own.

export type FileStore = "supabase" | "r2" | "local";
export type StoredFile = { store: FileStore; path: string };
export type ItemRole = "main" | "bump" | "upsell";

/** A product as a funnel sells it (a row of funnel_items, with the product's picture). */
export type FunnelItem = {
  funnel: string;
  role: ItemRole;
  key: string; // what orders carry: "pack", an add-on's or upsell's id
  product: string; // catalog slug
  name: string;
  price: Money;
  position: number;
  image: string | null; // the product's picture, for an add-on the funnel's code has none for
  tagline: string;
};

type ItemRow = {
  funnel: string;
  role: ItemRole;
  key: string;
  product: string;
  name: string;
  price_eur_cents: number;
  price_usd_cents: number;
  position: number;
  catalog: { tagline: string; image: { sm: string; lg: string } | null; cover: string | null } | null;
};

const units = (cents: number) => cents / 100;

const toItem = (r: ItemRow): FunnelItem => ({
  funnel: r.funnel,
  role: r.role,
  key: r.key,
  product: r.product,
  name: r.name,
  price: { eur: units(r.price_eur_cents), usd: units(r.price_usd_cents) },
  position: r.position,
  image: r.catalog?.image ? imageUrl(r.catalog.image.sm) : (r.catalog?.cover ?? null),
  tagline: r.catalog?.tagline ?? "",
});

/** What a funnel sells (every funnel's, without `funnel`), in order. */
export async function funnelItems(funnel?: string): Promise<FunnelItem[]> {
  let q = supabase().from("funnel_items").select("*, catalog(tagline, image, cover)");
  if (funnel) q = q.eq("funnel", funnel);
  const { data, error } = await q.order("position");
  if (error) throw error;
  return (data as ItemRow[]).map(toItem);
}

// ─── the funnels' code, read for what it doesn't keep in the tables ─────

/** The zips the code funnels name, by file name → their catalog product (seeded by db/catalog.sql). */
const ZIP_PRODUCT: Record<string, string> = {
  "Jazz MIDI Pack.zip": "jazz-midi-pack",
  "TOP HITS MIDI Bundle.zip": "top-hits",
  "MIDI Drum Kit - Bundle.zip": "midi-drum-kit",
  "The Chord Progressions Bible.zip": "chord-bible",
  "Emotional Keys MIDI Bundle.zip": "emotional-keys",
  "HUSTLE MIDI Bundle.zip": "hustle",
  "Famous Beats Bundle (320 MIDI Beats).zip": "famous-beats",
  "EXPLORER Expansions (House, Lofi, Afrobeat).zip": "expansions",
  "Jazz MIDI Chord Pack.zip": "jazz-chord-pack",
  "Anime & Video Game MIDI Chord Pack.zip": "anime-pack",
  "Drum Loops for Songwriting.zip": "drum-loops",
  "Drunk Swing Grooves.zip": "drunk-swing-grooves",
  "Jazz Record Samples.zip": "jazz-record-samples",
};

type CodeFunnel = {
  slug: string;
  name: string;
  files: Readonly<Record<string, string>>;
  includes?: Readonly<Record<string, readonly string[]>>;
  bonuses?: readonly { id: string; name: string }[];
};

export const CODE_FUNNELS: CodeFunnel[] = [
  { slug: jazz.slug, name: jazz.product, files: { ...jazz.files, ...jazz.remoteFiles }, bonuses: jazz.bonuses },
  { slug: topHits.slug, name: topHits.product, files: topHits.files },
  { slug: topHitsChords.slug, name: topHitsChords.label, files: topHitsChords.files, includes: topHitsChords.includes },
  { slug: drumKit.slug, name: drumKit.product, files: drumKit.files, includes: drumKit.includes },
  { slug: famousBeats.slug, name: famousBeats.product, files: famousBeats.files },
  { slug: drunkGrooves.slug, name: drunkGrooves.product, files: drunkGrooves.files, includes: drunkGrooves.includes },
];

const zipOf = (p: string) => p.split("/").pop() ?? p;

/** The product behind a funnel's file key: its funnel_items row, else the zip its code names. */
async function productOf(funnel: string, key: string): Promise<string | null> {
  const { data, error } = await supabase().from("funnel_items").select("product").eq("funnel", funnel).eq("key", key).limit(1);
  if (error) throw error;
  if (data?.[0]) return data[0].product as string;
  const code = CODE_FUNNELS.find((f) => f.slug === funnel)?.files[key];
  return code ? (ZIP_PRODUCT[zipOf(code)] ?? null) : null;
}

/** Where a product's zip is. */
export async function catalogFile(slug: string): Promise<StoredFile | null> {
  const { data, error } = await supabase().from("catalog").select("store, file").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data?.file ? { store: data.store as FileStore, path: data.file as string } : null;
}

/**
 * The zip a funnel hands out for a file key: the product's as Products has it
 * (a zip replaced there reaches every funnel), else the file the funnel's
 * code names (`fallback`), so a database hiccup never stops a download.
 */
export async function fileFor(funnel: string, key: string, fallback?: StoredFile): Promise<StoredFile | null> {
  try {
    const product = await productOf(funnel, key);
    const file = product ? await catalogFile(product) : null;
    if (file) return file;
  } catch (err) {
    console.error(`catalog: no file for ${funnel}/${key} from the database`, err);
  }
  return fallback ?? null;
}

/** The answer to a paid download: a short-lived link to the zip, or the zip itself when it ships with the deployment. */
export async function deliver(file: StoredFile): Promise<Response | null> {
  const name = zipOf(file.path);
  if (file.store === "r2") {
    if (!r2Configured()) return null;
    return new Response(null, { status: 303, headers: { location: presignedDownload(file.path, name), "cache-control": "private, no-store" } });
  }
  if (file.store === "supabase") {
    const link = await signedDownload(file.path);
    return link ? new Response(null, { status: 303, headers: { location: link, "cache-control": "private, no-store" } }) : null;
  }
  const data = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), file.path)).catch(() => null);
  if (!data) return null;
  return new Response(new Uint8Array(data), {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${name.replace(/"/g, "")}"`, "cache-control": "private, no-store" },
  });
}

// ─── dashboard → Products ──────────────────────────────────────

export type UseRole = "Main" | "Add-on" | "Upsell" | "Bonus" | "Included" | "Shop";

export type ProductUse = {
  funnel: string; // slug, or "shop"
  funnelName: string;
  role: UseRole;
  key: string | null; // the funnel_items key of a priced use
  soldAs: string;
  price: Money | null; // null: free with something else
  sold: number | null; // paid orders it was in; null when free
  with?: string;
  place?: { at: number; of: number }; // an add-on's place among its funnel's tick-boxes (1-based)
};

export const ROLE_NAME: Record<ItemRole, UseRole> = { main: "Main", bump: "Add-on", upsell: "Upsell" };

/** Paid orders per "<funnel>/<key>" (the shop's per "shop/<slug>"). */
async function soldCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase().from("orders").select("funnel, items, offer").eq("status", "succeeded").limit(20000);
  if (error) throw error;
  const sold = new Map<string, number>();
  const add = (k: string) => sold.set(k, (sold.get(k) ?? 0) + 1);
  for (const o of (data ?? []) as { funnel: string; items: string[] | null; offer: string | null }[]) {
    if (o.offer) add(`${o.funnel}/${o.offer}`);
    else for (const item of o.items ?? ["pack"]) add(`${o.funnel}/${item}`);
  }
  return sold;
}

/** Every product's uses: its funnel_items, the free files the funnels' code gives with something, and the shop. */
export async function productUses(shop: { slug: string; status: string; price: Money | null }[]): Promise<Record<string, ProductUse[]>> {
  const [items, sold] = await Promise.all([funnelItems(), soldCounts()]);
  const names = Object.fromEntries(CODE_FUNNELS.map((f) => [f.slug, f.name]));
  const uses: Record<string, ProductUse[]> = {};
  const push = (slug: string, u: ProductUse) => (uses[slug] ??= []).push(u);
  const order: ItemRole[] = ["main", "bump", "upsell"];
  for (const it of [...items].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role))) {
    const siblings = items.filter((x) => x.funnel === it.funnel && x.role === it.role).sort((a, b) => a.position - b.position);
    push(it.product, {
      place: it.role === "bump" ? { at: siblings.indexOf(it) + 1, of: siblings.length } : undefined,
      funnel: it.funnel,
      funnelName: names[it.funnel] ?? it.funnel,
      role: ROLE_NAME[it.role],
      key: it.key,
      soldAs: it.name,
      price: it.price,
      sold: sold.get(`${it.funnel}/${it.key}`) ?? 0,
    });
  }
  for (const f of CODE_FUNNELS) {
    const product = (key: string) => (f.files[key] ? ZIP_PRODUCT[zipOf(f.files[key])] : undefined);
    for (const b of f.bonuses ?? []) {
      const p = product(b.id);
      if (p) push(p, { funnel: f.slug, funnelName: f.name, role: "Bonus", key: null, soldAs: b.name, price: null, sold: null, with: f.name });
    }
    for (const [bump, keys] of Object.entries(f.includes ?? {})) {
      const by = items.find((i) => i.funnel === f.slug && i.key === bump);
      for (const key of keys) {
        const p = product(key);
        if (p) push(p, { funnel: f.slug, funnelName: f.name, role: "Included", key: null, soldAs: by?.name ?? bump, price: null, sold: null, with: by?.name ?? bump });
      }
    }
  }
  for (const s of shop) {
    if (s.status === "live") push(s.slug, { funnel: SHOP_SLUG, funnelName: "Shop", role: "Shop", key: null, soldAs: "", price: s.price, sold: sold.get(`${SHOP_SLUG}/${s.slug}`) ?? 0 });
  }
  return uses;
}

/** What a funnel charges (its map's Prices): the main product, add-ons and upsells, in order, with their paid orders. */
export async function funnelPrices(funnel: string): Promise<(FunnelItem & { sold: number })[]> {
  const [items, sold] = await Promise.all([funnelItems(funnel), soldCounts()]);
  const order: ItemRole[] = ["main", "bump", "upsell"];
  return items
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || a.position - b.position)
    .map((i) => ({ ...i, sold: sold.get(`${funnel}/${i.key}`) ?? 0 }));
}

/** The funnels a product can be added to as an add-on (the ones whose order form shows add-ons). */
export const ADD_ON_FUNNELS = CODE_FUNNELS.map((f) => ({ slug: f.slug, name: f.name }));

// ─── editing what a funnel sells ───────────────────────────────

const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Jazz's checkout (the CheckoutWidget) shows one add-on.
const ONE_ADD_ON = new Set<string>([jazz.slug]);

type Price = { eur: number; usd: number };
const okPrice = (p: Price) => p.eur >= 0.5 && p.usd >= 0.5;

/** A placement's new name and price. */
export async function updateItem(funnel: string, role: ItemRole, key: string, name: string, price: Price): Promise<string | null> {
  if (!name.trim()) return "It needs a name.";
  if (!okPrice(price)) return "Prices are 0.50 at least.";
  const { data, error } = await supabase()
    .from("funnel_items")
    .update({ name: name.trim().slice(0, 120), price_eur_cents: Math.round(price.eur * 100), price_usd_cents: Math.round(price.usd * 100), updated_at: new Date().toISOString() })
    .eq("funnel", funnel)
    .eq("role", role)
    .eq("key", key)
    .select("key");
  if (error) throw error;
  return data?.length ? null : "Not found.";
}

/**
 * A product as a funnel's add-on (after the others), or back as an upsell its
 * code has a page for. The key is the product's slug, as orders will carry it.
 */
export async function addItem(funnel: string, product: string, role: "bump" | "upsell", price: Price): Promise<string | null> {
  const code = CODE_FUNNELS.find((f) => f.slug === funnel);
  if (!code) return "Unknown funnel.";
  if (!okPrice(price)) return "Prices are 0.50 at least.";
  const db = supabase();
  const [{ data: p }, { data: items }] = await Promise.all([
    db.from("catalog").select("slug, name, file").eq("slug", product).maybeSingle(),
    db.from("funnel_items").select("role, key, product, position").eq("funnel", funnel),
  ]);
  if (!p) return "Unknown product.";
  if (!p.file) return "Upload its zip first: buyers would get nothing.";
  const rows = (items ?? []) as { role: ItemRole; key: string; product: string; position: number }[];
  if (rows.some((r) => r.product === product && r.role === role)) return `${code.name} already sells it as ${role === "bump" ? "an add-on" : "an upsell"}.`;
  let key = product;
  if (role === "upsell") {
    // Only an upsell whose page the funnel's code has (lib/funnels.ts withItems keeps those).
    const page = CODE_UPSELLS[funnel]?.find((u) => ZIP_PRODUCT[zipOf(code.files[u] ?? "")] === product);
    if (!page) return "This funnel has no upsell page for it yet: an upsell needs its own page.";
    key = page;
  } else {
    if (ONE_ADD_ON.has(funnel) && rows.some((r) => r.role === "bump")) return `${code.name}'s checkout shows one add-on: remove the one it has first.`;
    // A key the code already uses for another file would hand out that file.
    const taken = code.files[product] && ZIP_PRODUCT[zipOf(code.files[product])] !== product;
    // The same key as an upsell is fine (and wanted: an add-on "top-hits" makes the
    // TOP HITS upsell page skip itself, OrderForm.tsx fv_owned); only two add-ons can't share one.
    if (!KEY.test(key) || key.length > 24 || taken || rows.some((r) => r.key === key && r.role === "bump")) return "This product's URL can't be an add-on id here (24 characters at most).";
  }
  const position = Math.max(-1, ...rows.filter((r) => r.role === role).map((r) => r.position)) + 1;
  const { error } = await db.from("funnel_items").insert({
    funnel,
    role,
    key,
    product,
    name: p.name,
    price_eur_cents: Math.round(price.eur * 100),
    price_usd_cents: Math.round(price.usd * 100),
    position,
  });
  if (error) throw error;
  return null;
}

/** An add-on or upsell out of a funnel (its past orders keep their downloads). The main product stays. */
/** An add-on (or upsell) one place earlier (-1) or later (+1) at its funnel's checkout. */
export async function moveItem(funnel: string, role: ItemRole, key: string, move: -1 | 1): Promise<string | null> {
  if (role === "main") return "The main product has no place to move.";
  const db = supabase();
  const { data, error } = await db.from("funnel_items").select("key, position").eq("funnel", funnel).eq("role", role).order("position");
  if (error) throw error;
  const rows = (data ?? []) as { key: string; position: number }[];
  const at = rows.findIndex((r) => r.key === key);
  if (at < 0) return "Not found.";
  const to = at + move;
  if (to < 0 || to >= rows.length) return null;
  [rows[at], rows[to]] = [rows[to], rows[at]];
  // Positions renumbered 0, 1, 2… in the new order.
  for (const [i, r] of rows.entries()) {
    if (r.position === i) continue;
    const { error: e } = await db.from("funnel_items").update({ position: i, updated_at: new Date().toISOString() }).eq("funnel", funnel).eq("role", role).eq("key", r.key);
    if (e) throw e;
  }
  return null;
}

export async function removeItem(funnel: string, role: ItemRole, key: string): Promise<string | null> {
  if (role === "main") return "A funnel's main product stays: rename it or change its price instead.";
  const { data, error } = await supabase().from("funnel_items").delete().eq("funnel", funnel).eq("role", role).eq("key", key).select("key");
  if (error) throw error;
  return data?.length ? null : "Not found.";
}

/** The upsells each code funnel has a page for, by key. */
const CODE_UPSELLS: Record<string, string[]> = {
  [topHits.slug]: topHits.offers.map((o) => o.id),
  [topHitsChords.slug]: topHitsChords.offers.map((o) => o.id),
  [drumKit.slug]: drumKit.offers.map((o) => o.id),
  [famousBeats.slug]: famousBeats.offers.map((o) => o.id),
  [jazz.slug]: jazz.offers.map((o) => o.id),
  [drunkGrooves.slug]: drunkGrooves.offers.map((o) => o.id),
};

// ─── what a buyer owns ──────────────────────────────────────────────────
// 2026-11-08 ("se lo ha preso non deve vederlo come upsell. Questo in generale in
// tutto funnnnels"): every product a buyer has, from their paid orders (main
// product, add-ons, upsells, and the files those bring along: the Jazz pack's
// bonuses, an add-on's `includes`) and ClickFunnels' legacy_purchases. It tags
// them owns-<product> (lib/sales.ts) and makes an upsell page skip a product the
// buyer already has (/api/checkout/owned, /api/checkout/upsell).

type OrderLike = { funnel: string; items: readonly string[] | null };

/** The catalog products some orders bring, by catalog slug. */
export async function productsOfOrders(orders: readonly OrderLike[]): Promise<Set<string>> {
  const owned = new Set<string>();
  if (!orders.length) return owned;
  const rows = await funnelItems().catch((): FunnelItem[] => []);
  const byKey = new Map(rows.map((r) => [`${r.funnel}/${r.key}`, r.product]));
  for (const o of orders) {
    if (o.funnel === SHOP_SLUG) {
      for (const slug of o.items ?? []) owned.add(slug);
      continue;
    }
    const code = CODE_FUNNELS.find((f) => f.slug === o.funnel);
    const zipProduct = (key: string) => (code?.files[key] ? ZIP_PRODUCT[zipOf(code.files[key])] : undefined);
    for (const key of o.items ?? ["pack"]) {
      const p = byKey.get(`${o.funnel}/${key}`) ?? zipProduct(key);
      if (p) owned.add(p);
      for (const extra of code?.includes?.[key] ?? []) {
        const x = zipProduct(extra);
        if (x) owned.add(x);
      }
      // A pack's own bonuses (the Jazz MIDI Pack's).
      if (key === "pack") {
        for (const b of code?.bonuses ?? []) {
          const x = zipProduct(b.id);
          if (x) owned.add(x);
        }
      }
    }
  }
  return owned;
}

/**
 * Every catalog product this email has bought, here or on ClickFunnels.
 * except: an upsell bought after this order (a reload of its page, a second tap)
 * doesn't count, so the page answers "paid" again rather than skipping it.
 */
export async function ownedProducts(email: string, except?: { parent: string; offer: string }): Promise<Set<string>> {
  const e = email.trim().toLowerCase();
  if (!e) return new Set();
  const db = supabase();
  const [{ data: orders, error }, { data: legacy, error: lErr }] = await Promise.all([
    db.from("orders").select("funnel, items, parent, offer").eq("email", e).eq("status", "succeeded").limit(500),
    db.from("legacy_purchases").select("product").eq("email", e),
  ]);
  if (error) throw error;
  if (lErr) throw lErr;
  const kept = ((orders ?? []) as (OrderLike & { parent: string | null; offer: string | null })[]).filter(
    (o) => !(except && o.parent === except.parent && o.offer === except.offer),
  );
  const owned = await productsOfOrders(kept);
  for (const r of legacy ?? []) owned.add(r.product as string);
  return owned;
}

/** The catalog product a funnel's upsell (or add-on) sells. */
export async function offerProduct(funnel: string, key: string): Promise<string | null> {
  return productOf(funnel, key);
}

/** The owns-<product> tags for a set of products. */
export const ownsTags = (products: Iterable<string>) => [...products].map((p) => `owns-${p}`);
