import { revalidatePath } from "next/cache";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { toCents, type Money } from "@/lib/launch";
import { BUCKET as FILES_BUCKET, filePath } from "@/lib/products";
import { supabase } from "@/lib/supabase";

// The shop: products sold side by side at /shop, with a cart (app/shop),
// next to the funnels. Tables shop_products + shop_settings (db/shop.sql).
//
// One order is one payment for several products. Stripe's metadata.items and
// PayPal's order lines (sku = slug) say which; it's recorded in `orders` like
// every sale (funnel "shop", items = the slugs), so Orders, the receipt, the
// abandoned-checkout reminder and Analytics treat the shop like a funnel
// (the "shop" product in lib/funnels.ts). Prices come from here, never from
// the browser: /api/checkout/shop/* price the cart with priceCart().
//
// Digital products only: each one is a zip in the private "product-files"
// bucket under shop/<slug>/, handed out like the launch kit's (a 60-second
// signed link, after Stripe or PayPal confirms the payment).

export const SHOP_SLUG = "shop";
const IMAGES_BUCKET = "shop-images";
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Addresses under /shop that aren't products (app/shop, proxy.ts).
export const SHOP_PATHS = new Set(["cart", "thank-you", "download", ...CURRENCIES]);

// Products in one order. Stripe keeps 500 characters per metadata value,
// and metadata.items holds the slugs.
export const MAX_ITEMS = 20;

export type ShopImage = { sm: string; lg: string }; // public URLs, square, 600 and 1200 px

/** A product as the shop shows it. */
export type ShopItem = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: Money;
  image: ShopImage | null;
};

/** …and as the dashboard edits it. */
export type ShopProduct = ShopItem & {
  status: "draft" | "live";
  file: string | null; // the zip's name, or null before the upload
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type ShopSettings = { title: string; intro: string };

type Row = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price_eur_cents: number;
  price_usd_cents: number;
  image: { sm: string; lg: string } | null;
  file: string | null;
  status: "draft" | "live";
  position: number;
  created_at: string;
  updated_at: string;
};

const units = (cents: number) => cents / 100;

export const imageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGES_BUCKET}/${path}`;

function toProduct(r: Row): ShopProduct {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    price: { eur: units(r.price_eur_cents), usd: units(r.price_usd_cents) },
    image: r.image ? { sm: imageUrl(r.image.sm), lg: imageUrl(r.image.lg) } : null,
    status: r.status,
    file: r.file ? (r.file.split("/").pop() ?? r.file) : null,
    position: r.position,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const toItem = ({ slug, name, tagline, description, price, image }: ShopProduct): ShopItem => ({
  slug,
  name,
  tagline,
  description,
  price,
  image,
});

// ─── the shop's pages ──────────────────────────────────────────
// Read by cached pages: a failed read throws, so the CDN keeps serving the
// last good page and tries again on the next visit.

export async function liveProducts(): Promise<ShopItem[]> {
  const { data, error } = await supabase()
    .from("shop_products")
    .select("*")
    .eq("status", "live")
    .order("position")
    .order("created_at");
  if (error) throw error;
  return (data as Row[]).map((r) => toItem(toProduct(r)));
}

export async function liveProduct(slug: string): Promise<ShopItem | null> {
  if (!SLUG.test(slug)) return null;
  const { data, error } = await supabase().from("shop_products").select("*").eq("slug", slug).eq("status", "live").maybeSingle();
  if (error) throw error;
  return data ? toItem(toProduct(data as Row)) : null;
}

export async function shopSettings(): Promise<ShopSettings> {
  const { data, error } = await supabase().from("shop_settings").select("title, intro").eq("id", 1).maybeSingle();
  if (error) throw error;
  return { title: data?.title ?? "The shop", intro: data?.intro ?? "" };
}

/** A description as the product page shows it: paragraphs (blank line between) and "- " lists. */
export function descriptionBlocks(text: string): ({ p: string } | { ul: string[] })[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines) =>
      lines.every((l) => /^[-•*]\s+/.test(l)) ? { ul: lines.map((l) => l.replace(/^[-•*]\s+/, "")) } : { p: lines.join(" ") },
    );
}

// ─── orders ────────────────────────────────────────────────────

/** The slugs an order is for, from Stripe's metadata.items ("a,b,c"). */
export function shopItems(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return [...new Set(raw.split(",").filter((s) => SLUG.test(s)))];
}

/**
 * The cart at today's prices, in cents: live products only, each once (a
 * download is bought once). An error in plain words when it can't be sold.
 */
export async function priceCart(
  raw: unknown,
  currency: Currency,
): Promise<{ items: ShopItem[]; amount: number } | { error: string }> {
  const slugs = Array.isArray(raw) ? [...new Set(raw.filter((s): s is string => typeof s === "string" && SLUG.test(s)))] : [];
  if (slugs.length === 0) return { error: "Your cart is empty." };
  if (slugs.length > MAX_ITEMS) return { error: `One order takes ${MAX_ITEMS} products at most. Split it in two.` };
  const { data, error } = await supabase().from("shop_products").select("*").in("slug", slugs).eq("status", "live");
  if (error) throw error;
  const found = new Map((data as Row[]).map((r) => [r.slug, toItem(toProduct(r))]));
  if (found.size !== slugs.length) return { error: "Something in your cart isn't for sale any more. Refresh the page and check your cart." };
  // In the order the buyer added them.
  const items = slugs.map((s) => found.get(s)!);
  return { items, amount: items.reduce((sum, it) => sum + toCents(it.price[currency]), 0) };
}

export type ShopLabel = { name: string; image: ShopImage | null };

/** Names and covers (drafts too: an order outlives its products' status), for the receipt, the thank-you page and the account. */
export async function shopLabels(slugs: readonly string[]): Promise<Record<string, ShopLabel>> {
  const wanted = [...new Set(slugs)].filter((s) => SLUG.test(s));
  if (!wanted.length) return {};
  const { data, error } = await supabase().from("shop_products").select("slug, name, image").in("slug", wanted);
  if (error) throw error;
  return Object.fromEntries(
    (data as Pick<Row, "slug" | "name" | "image">[]).map((r) => [
      r.slug,
      { name: r.name, image: r.image ? { sm: imageUrl(r.image.sm), lg: imageUrl(r.image.lg) } : null },
    ]),
  );
}

/** "Neo Soul Pack", "Neo Soul Pack + 2 more": an order in a few words. */
export function orderTitle(items: readonly string[], labels: Record<string, ShopLabel>): string {
  const first = labels[items[0]]?.name ?? items[0] ?? "Your order";
  return items.length > 1 ? `${first} + ${items.length - 1} more` : first;
}

/** Where a product's zip is in the private bucket, or null. */
export async function shopFile(slug: string): Promise<string | null> {
  if (!SLUG.test(slug)) return null;
  const { data, error } = await supabase().from("shop_products").select("file").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data?.file ?? null;
}

// ─── dashboard ─────────────────────────────────────────────────

export type ShopStats = {
  orders: number;
  last7: number; // orders in the last 7 days
  eurCents: number;
  usdCents: number;
  sold: Record<string, number>; // per product slug
};

export async function shopStats(): Promise<ShopStats> {
  const { data, error } = await supabase()
    .from("orders")
    .select("items, amount_cents, currency, created_at")
    .eq("funnel", SHOP_SLUG)
    .eq("status", "succeeded")
    .limit(10000);
  if (error) throw error;
  const week = Date.now() - 7 * 86_400_000;
  const stats: ShopStats = { orders: 0, last7: 0, eurCents: 0, usdCents: 0, sold: {} };
  for (const o of data ?? []) {
    stats.orders += 1;
    if (Date.parse(o.created_at) >= week) stats.last7 += 1;
    if (o.currency === "eur") stats.eurCents += o.amount_cents;
    if (o.currency === "usd") stats.usdCents += o.amount_cents;
    for (const s of (o.items ?? []) as string[]) stats.sold[s] = (stats.sold[s] ?? 0) + 1;
  }
  return stats;
}

export async function listShopProducts(): Promise<ShopProduct[]> {
  const { data, error } = await supabase().from("shop_products").select("*").order("position").order("created_at");
  if (error) throw error;
  return (data as Row[]).map(toProduct);
}

/** One product, with where its files are in storage. */
export async function getShopProduct(slug: string): Promise<(ShopProduct & { filePath: string | null; imagePaths: ShopImage | null }) | null> {
  const { data, error } = await supabase().from("shop_products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as Row;
  return { ...toProduct(r), filePath: r.file, imagePaths: r.image };
}

export type ShopProductInput = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: Money;
  status: "draft" | "live";
};

const num = (v: unknown) => (typeof v === "number" ? v : Number(v));

export function parseShopProduct(raw: unknown): ShopProductInput {
  const p = (raw ?? {}) as Record<string, unknown>;
  const price = (p.price ?? {}) as Record<string, unknown>;
  return {
    slug: String(p.slug ?? "").trim().toLowerCase(),
    name: String(p.name ?? "").trim().slice(0, 120),
    tagline: String(p.tagline ?? "").trim().slice(0, 200),
    description: String(p.description ?? "").trim().slice(0, 6000),
    price: { eur: num(price.eur), usd: num(price.usd) },
    status: p.status === "live" ? "live" : "draft",
  };
}

/** Problems in plain words ([] = fine). `current`: the product being edited, null for a new one. */
export function checkShopProduct(p: ShopProductInput, current: { file: string | null } | null): string[] {
  const errors: string[] = [];
  if (!current) {
    if (!SLUG.test(p.slug) || p.slug.length > 60) errors.push("The URL can only use lowercase letters, numbers and dashes.");
    if (SHOP_PATHS.has(p.slug)) errors.push(`"${p.slug}" is taken by the shop's own pages. Pick another URL.`);
  }
  if (!p.name) errors.push("The product needs a name.");
  for (const c of CURRENCIES) if (!(p.price[c] >= 0.5)) errors.push(`${c.toUpperCase()} price is required (0.50 at least).`);
  // A live product without its zip would take money and hand over nothing.
  if (p.status === "live" && !current?.file) errors.push("Upload the product's .zip before you put it live.");
  return errors;
}

export async function createShopProduct(p: ShopProductInput): Promise<ShopProduct> {
  const db = supabase();
  const { data: last } = await db.from("shop_products").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("shop_products")
    .insert({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      price_eur_cents: toCents(p.price.eur),
      price_usd_cents: toCents(p.price.usd),
      // New products start as drafts: the zip comes after.
      status: "draft",
      position: (last?.position ?? -1) + 1,
    })
    .select("*")
    .single();
  if (error) throw error.code === "23505" ? new Error(`A product at /shop/${p.slug} already exists.`) : error;
  return toProduct(data as Row);
}

export async function updateShopProduct(slug: string, p: ShopProductInput): Promise<ShopProduct | null> {
  const { data, error } = await supabase()
    .from("shop_products")
    .update({
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      price_eur_cents: toCents(p.price.eur),
      price_usd_cents: toCents(p.price.usd),
      status: p.status,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? toProduct(data as Row) : null;
}

/** Remove a product and its files. Only for products never sold: buyers' downloads would stop working. */
export async function deleteShopProduct(slug: string): Promise<{ error: string } | null> {
  const sold = (await shopStats()).sold[slug] ?? 0;
  if (sold > 0) return { error: `Sold ${sold} time${sold === 1 ? "" : "s"}: put it back to Draft instead, so its buyers keep their download.` };
  const db = supabase();
  const zips = await db.storage.from(FILES_BUCKET).list(`shop/${slug}`);
  if (zips.data?.length) await db.storage.from(FILES_BUCKET).remove(zips.data.map((f) => `shop/${slug}/${f.name}`));
  const pics = await db.storage.from(IMAGES_BUCKET).list(slug);
  if (pics.data?.length) await db.storage.from(IMAGES_BUCKET).remove(pics.data.map((f) => `${slug}/${f.name}`));
  const { error } = await db.from("shop_products").delete().eq("slug", slug);
  if (error) throw error;
  return null;
}

/** The shop's order, as the dashboard lists it. */
export async function reorderShop(slugs: string[]) {
  const db = supabase();
  for (const [position, slug] of slugs.entries()) {
    const { error } = await db.from("shop_products").update({ position }).eq("slug", slug);
    if (error) throw error;
  }
}

export async function updateShopSettings(s: ShopSettings): Promise<ShopSettings> {
  const { data, error } = await supabase()
    .from("shop_settings")
    .update({ title: s.title.trim().slice(0, 120) || "The shop", intro: s.intro.trim().slice(0, 600), updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("title, intro")
    .single();
  if (error) throw error;
  return data as ShopSettings;
}

// ─── uploads ───────────────────────────────────────────────────
// The browser uploads straight to Supabase Storage with one-time signed URLs
// (a Vercel function can't take a body over 4.5 MB), then tells us it's done
// so the product points at the new files. Pictures are resized to webp in
// the browser first (components/panels/ShopPanel.tsx), at 600 and 1200 px.

export async function zipUploadTarget(slug: string, filename: string) {
  const path = filePath(`shop/${slug}`, filename);
  const { data, error } = await supabase().storage.from(FILES_BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (error) throw error;
  return { path, signedUrl: data.signedUrl };
}

async function exists(bucket: string, path: string) {
  const at = path.lastIndexOf("/");
  const { data } = await supabase().storage.from(bucket).list(path.slice(0, at), { search: path.slice(at + 1) });
  return Boolean(data?.some((f) => f.name === path.slice(at + 1)));
}

export async function attachZip(slug: string, path: string): Promise<ShopProduct> {
  const p = await getShopProduct(slug);
  if (!p) throw new Error("Not found");
  if (!path.startsWith(`shop/${slug}/`) || !path.endsWith(".zip")) throw new Error("That file belongs to another product.");
  if (!(await exists(FILES_BUCKET, path))) throw new Error("The upload didn't arrive. Try again.");
  const db = supabase();
  const { data, error } = await db.from("shop_products").update({ file: path, updated_at: new Date().toISOString() }).eq("slug", slug).select("*").single();
  if (error) throw error;
  // A zip under another name replaces the old one, for past buyers too.
  if (p.filePath && p.filePath !== path) await db.storage.from(FILES_BUCKET).remove([p.filePath]);
  return toProduct(data as Row);
}

export async function imageUploadTargets(slug: string, ext: "webp" | "jpg") {
  // A new name per upload: the pictures are cached for a year.
  const base = `${slug}/${Date.now().toString(36)}`;
  const store = supabase().storage.from(IMAGES_BUCKET);
  const [sm, lg] = await Promise.all(
    ([600, 1200] as const).map(async (size) => {
      const path = `${base}-${size}.${ext}`;
      const { data, error } = await store.createSignedUploadUrl(path);
      if (error) throw error;
      return { path, signedUrl: data.signedUrl };
    }),
  );
  return { sm, lg };
}

export async function attachImage(slug: string, paths: { sm: string; lg: string }): Promise<ShopProduct> {
  const p = await getShopProduct(slug);
  if (!p) throw new Error("Not found");
  const ok = (path: string, size: number) => path.startsWith(`${slug}/`) && new RegExp(`-${size}\\.(webp|jpg)$`).test(path);
  if (!ok(paths.sm, 600) || !ok(paths.lg, 1200)) throw new Error("Those pictures belong to another product.");
  if (!(await exists(IMAGES_BUCKET, paths.sm)) || !(await exists(IMAGES_BUCKET, paths.lg))) throw new Error("The upload didn't arrive. Try again.");
  const db = supabase();
  const { data, error } = await db
    .from("shop_products")
    .update({ image: { sm: paths.sm, lg: paths.lg }, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select("*")
    .single();
  if (error) throw error;
  if (p.imagePaths) await db.storage.from(IMAGES_BUCKET).remove([p.imagePaths.sm, p.imagePaths.lg]);
  return toProduct(data as Row);
}

/** After a change: the shop page, the cart (it carries the prices) and the product's page, in both currencies. */
export function revalidateShop(slug?: string) {
  for (const c of CURRENCIES) {
    revalidatePath(`/shop/${c}`);
    revalidatePath(`/shop/${c}/cart`);
    if (slug) revalidatePath(`/shop/${c}/${slug}`);
  }
}
