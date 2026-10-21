import { createHmac, timingSafeEqual } from "node:crypto";
import type Stripe from "stripe";
import { funnel as drumKit, unlocked as drumKitUnlocked } from "@/app/(funnels)/midi-drum-kit/funnel";
import { funnel as jazz, unlocked as jazzUnlocked } from "@/app/(funnels)/jazz-midi-pack/funnel";
import { funnel as topHits } from "@/app/(funnels)/top-hits-midi-bundle/funnel";
import { resolveFunnel } from "@/lib/funnels";
import { SHOP_HOME } from "@/lib/liveUrl";
import { getOrder, orderFromIntent, type Order } from "@/lib/orders";
import { SHOP_SLUG, orderTitle, shopLabels, type ShopLabel } from "@/lib/shop";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// The customer login (m.thegrind.studio/account): a buyer types the email
// they bought with, gets a sign-in link by email, and sees everything bought
// with that email, with its download buttons. No password, no account table:
//   - the link and the session are signed tokens (email, language, expiry);
//   - the purchases are asked to Stripe (metadata.email) and read from
//     paypal_sales, then each one is checked like on the thank-you pages.

export type Lang = "en" | "fr" | "es" | "de" | "it";
export const LANGS: readonly Lang[] = ["en", "fr", "es", "de", "it"];
export const isLang = (l: unknown): l is Lang => LANGS.includes(l as Lang);

export const SESSION_COOKIE = "gs_account";
export const LANG_COOKIE = "gs_lang";
export const SESSION_DAYS = 30;
const LINK_MINUTES = 30;

// Where a buyer finds their downloads again: the thank-you pages link here.
export const ACCOUNT_URL = "https://m.thegrind.studio/account";

// ── Signed tokens ──────────────────────────────────────────────────────────
// ACCOUNT_SECRET if set, otherwise a key derived from the server's Supabase
// secret (never sent anywhere): changing either signs everybody out.
function key(): Buffer {
  const secret = process.env.ACCOUNT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("ACCOUNT_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set");
  return createHmac("sha256", secret).update("grind-account-v1").digest();
}

type Claims = { e: string; l: Lang; x: number; p: "link" | "session" };

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const mac = (body: string) => createHmac("sha256", key()).update(body).digest();

function sign(claims: Claims): string {
  const body = b64(JSON.stringify(claims));
  return `${body}.${b64(mac(body))}`;
}

function verify(token: unknown, purpose: Claims["p"]): Claims | null {
  if (typeof token !== "string" || token.length > 600) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = mac(body);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString()) as Claims;
    if (c.p !== purpose || typeof c.e !== "string" || !isLang(c.l) || !(c.x > Date.now())) return null;
    return c;
  } catch {
    return null;
  }
}

export const linkToken = (email: string, lang: Lang) => sign({ e: email, l: lang, x: Date.now() + LINK_MINUTES * 60_000, p: "link" });
export const sessionToken = (email: string, lang: Lang) => sign({ e: email, l: lang, x: Date.now() + SESSION_DAYS * 86_400_000, p: "session" });
export const readLink = (token: unknown) => verify(token, "link");
export const readSession = (token: unknown) => verify(token, "session");
export { LINK_MINUTES };

export const cleanEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
export const isEmail = (v: string) => v.length <= 200 && /^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/.test(v);

// ── The products a buyer can own ───────────────────────────────────────────
// Per funnel: what each file key is called, what an order unlocks (bonuses
// come with the pack), the download link, the cover.
type Shelf = {
  product: string;
  labels: Record<string, string>;
  unlocked: (items: string[]) => string[];
  cover: (order: Order) => string;
  download: (order: Order, file: string) => string;
};

const OFFER_COVERS: Record<string, string> = {
  "famous-beats": "/funnels/midi-drum-kit/bonus-famous.webp",
  "top-hits": "/funnels/top-hits-midi-bundle/product.webp",
};

const SHELVES: Record<string, Shelf> = {
  [drumKit.slug]: {
    product: drumKit.product,
    labels: {
      pack: `${drumKit.product} Bundle`,
      ...Object.fromEntries(drumKit.bumps.map((b) => [b.id, b.name])),
      ...Object.fromEntries(drumKit.offers.map((o) => [o.id, o.name])),
      ...drumKit.fileNames,
    },
    unlocked: drumKitUnlocked,
    cover: (o) => (o.offer ? (OFFER_COVERS[o.offer] ?? "/funnels/midi-drum-kit/kit-box.webp") : "/funnels/midi-drum-kit/kit-box.webp"),
    download: (o, file) => `/${drumKit.slug}/download?order=${o.id}&file=${file}`,
  },
  [topHits.slug]: {
    product: topHits.product,
    labels: { pack: topHits.product, ...Object.fromEntries(topHits.bumps.map((b) => [b.id, b.name])) },
    unlocked: (items) => items,
    cover: () => "/funnels/top-hits-midi-bundle/product.webp",
    download: (o, file) => `/${topHits.slug}/download?order=${o.id}&file=${file}`,
  },
  [jazz.slug]: {
    product: jazz.product,
    labels: { pack: jazz.product, [jazz.bump.id]: jazz.bump.name, ...Object.fromEntries(jazz.bonuses.map((x) => [x.id, x.name])) },
    unlocked: jazzUnlocked,
    cover: () => "/funnels/jazz-midi-pack/box-520.webp",
    download: (o, file) => `/${jazz.slug}/download?order=${o.id}&file=${file}`,
  },
};

/** An order's downloads with their names, as links on the brand domain (the receipt email, lib/outbox.ts). Null for products without a shelf. */
export function shelfOf(funnel: string, order: Pick<Order, "id" | "items" | "offer">): { name: string; files: { key: string; label: string; href: string }[] } | null {
  const shelf = SHELVES[funnel];
  if (!shelf) return null;
  const o = order as Order;
  return {
    name: o.offer ? (shelf.labels[o.offer] ?? o.offer) : shelf.product,
    files: shelf.unlocked(o.items).map((k) => ({ key: k, label: shelf.labels[k] ?? k, href: `${ACCOUNT_URL.replace(/\/account$/, "")}${shelf.download(o, k)}` })),
  };
}

// The shop's orders (lib/shop.ts) have no shelf: their products are named in
// the database, and each one is a download of its own.
const owned = (funnel: string) => Boolean(SHELVES[funnel]) || funnel === SHOP_SLUG;
const SHOP_COVER = "/funnels/dashboard/orders.webp"; // for products without a picture

export type Purchase = {
  order: Order;
  funnel: string;
  name: string; // the product, or the upsell bought after it
  date: Date;
  lang: string; // the language of the funnel it was bought in
  cover: string;
  files: { key: string; label: string; href: string }[];
};

/** Everything bought with this email, newest first. */
export async function purchasesOf(email: string): Promise<Purchase[]> {
  const found: { order: Order; funnel: string; date: Date; lang: string }[] = [];

  if (stripeConfigured() && isEmail(email)) {
    const intents: Stripe.PaymentIntent[] = [];
    let page: string | undefined;
    for (let i = 0; i < 5; i++) {
      const res = await stripe().paymentIntents.search({ query: `status:'succeeded' AND metadata['email']:'${email}'`, limit: 100, ...(page ? { page } : {}) });
      intents.push(...res.data);
      if (!res.has_more || !res.next_page) break;
      page = res.next_page;
    }
    for (const intent of intents) {
      if (!owned(intent.metadata.funnel)) continue;
      found.push({ order: orderFromIntent(intent), funnel: intent.metadata.funnel, date: new Date(intent.created * 1000), lang: intent.metadata.lang || "en" });
    }
  }

  const { data: rows } = isEmail(email)
    ? await supabase()
        .from("paypal_sales")
        .select("order_id, funnel, lang, created_at")
        .or(`email.eq."${email}",payer_email.eq."${email}"`)
        .limit(200)
    : { data: [] };
  const paypal = await Promise.all(
    (rows ?? [])
      .filter((r) => owned(r.funnel))
      .map(async (r) => ({ order: await getOrder(r.order_id, r.funnel), funnel: r.funnel as string, date: new Date(r.created_at), lang: r.lang as string })),
  );
  for (const p of paypal) if (p.order?.status === "succeeded") found.push({ ...p, order: p.order });

  // Newest order first, each followed by the one-click upsells bought after it.
  const byDate = (a: { date: Date }, b: { date: Date }) => b.date.getTime() - a.date.getTime();
  const mains = found.filter((p) => !p.order.offer).sort(byDate);
  const ids = new Set(mains.map((p) => p.order.id));
  const ordered = [
    ...mains.flatMap((m) => [m, ...found.filter((p) => p.order.offer && p.order.parent === m.order.id).sort((a, b) => -byDate(a, b))]),
    ...found.filter((p) => p.order.offer && !ids.has(p.order.parent ?? "")).sort(byDate),
  ];
  const shop = await shopLabels(found.filter((p) => p.funnel === SHOP_SLUG).flatMap((p) => p.order.items)).catch((): Record<string, ShopLabel> => ({}));
  // The add-ons' and upsells' names as dashboard → Products has them (one added there is on no shelf).
  const names: Record<string, Record<string, string>> = Object.fromEntries(
    await Promise.all(
      [...new Set(found.map((p) => p.funnel).filter((f) => SHELVES[f]))].map(async (slug) => {
        const f = await resolveFunnel(slug).catch(() => undefined);
        return [slug, Object.fromEntries([...(f?.bumps ?? []), ...(f?.offers ?? [])].map((x) => [x.id, x.name]))] as const;
      }),
    ),
  );
  return ordered.map(({ order, funnel, date, lang }) => {
      if (funnel === SHOP_SLUG) {
        return {
          order,
          funnel,
          date,
          lang,
          name: orderTitle(order.items, shop),
          cover: order.items.map((k) => shop[k]?.image?.sm).find(Boolean) ?? SHOP_COVER,
          files: order.items.map((k) => ({ key: k, label: shop[k]?.name ?? k, href: `${SHOP_HOME}/shop/download?order=${order.id}&file=${k}` })),
        };
      }
      const shelf = SHELVES[funnel];
      const label = (k: string) => names[funnel]?.[k] ?? shelf.labels[k] ?? k;
      return {
        order,
        funnel,
        date,
        lang,
        name: order.offer ? label(order.offer) : shelf.product,
        cover: shelf.cover(order),
        files: shelf.unlocked(order.items).map((k) => ({ key: k, label: label(k), href: shelf.download(order, k) })),
      };
    });
}

/** The language a buyer bought in most recently: their account's language. */
export const purchaseLang = (purchases: Purchase[]): Lang | null => {
  const l = purchases[0]?.lang;
  return isLang(l) ? l : null;
};

// ── One sign-in email per address per minute ───────────────────────────────
export async function mayEmail(email: string): Promise<boolean> {
  const db = supabase();
  const { data } = await db.from("account_logins").select("sent_at").eq("email", email).maybeSingle();
  if (data && Date.now() - new Date(data.sent_at).getTime() < 60_000) return false;
  await db.from("account_logins").upsert({ email, sent_at: new Date().toISOString() });
  return true;
}
