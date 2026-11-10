import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import { funnel as famousBeats } from "@/app/(funnels)/famous-beats-bundle/funnel";
import { funnel as drunkGrooves } from "@/app/(funnels)/drunk-swing-grooves/funnel";
import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { LANGS as DRUM_KIT_LANGS } from "@/app/(funnels)/midi-drum-kit/i18n";
import { funnel as topHits } from "@/app/(funnels)/top-hits-midi-bundle/funnel";
import { funnel as topHitsChords } from "@/app/(funnels)/top-hits-chords/funnel";
import type { Currency } from "@/lib/geo";
import { phaseAt, toCents, unitPrice, type Launch, type Money, type Phase } from "@/lib/launch";
import { funnelItems, type FunnelItem } from "@/lib/catalog";
import { getKitProduct } from "@/lib/products";
import { SHOP_HOME } from "@/lib/liveUrl";
import { SHOP_SLUG } from "@/lib/shop";

// Every product the checkout can sell. The public APIs look products up here
// so prices, tags and files always come from the server, never from the visitor.
//
// Two kinds share one shape:
//   code  hand-built pages with their funnel.ts: the Jazz MIDI Pack, the
//         TOP HITS MIDI Bundle, the MIDI Drum Kit and the Famous Beats Bundle
//         (app/(funnels)/<slug>).
//         No launch: always full price.
//   kit   products made in the dashboard (Launches): a row in `products`, the
//         template page in app/(funnels)/[slug], zips in Supabase Storage, and
//         optionally a launch whose dates set the phase and the price.
//   shop  the shop (dashboard → Shop, lib/shop.ts): one entry for the whole
//         cart. It lends the checkout its tags and pages; its own APIs
//         (/api/checkout/shop/*) price the products in the cart.
//
// The code funnels' prices, add-ons and upsells are in the database since
// 2026-10-22 (funnel_items, lib/catalog.ts: dashboard → Products edits them),
// seeded with what their funnel.ts says; resolveFunnel applies them. Their
// funnel.ts keeps the pages, the words and the ids, and is the fallback when
// the database can't be read. getFunnel is the code alone.

// image: the add-on's picture on the order forms that show one.
export type Bump = { id: string; name: string; price: Money; pitch: string; image?: string };

/** A one-click upsell: its own page after the order (`path` after /<slug>/), charged to the card just used. */
export type Offer = { id: string; path: string; name: string; price: Money };

export type Product = {
  kind: "code" | "kit" | "shop";
  slug: string;
  product: string; // display name
  // The dashboard's name for the funnel when the product's isn't enough (two funnels selling one product).
  label?: string;
  brand: string;
  tagline: string;
  price: Money;
  bump: Bump | null;
  // Checkouts with several tick-box offers (ClickFunnels-style multi-bump) list
  // them here instead of `bump`; the browser then sends `bumps: [ids]`.
  bumps?: readonly Bump[];
  // orderPage: where the order form lives when it isn't the landing's #buy.
  checkout: { leadTags: readonly string[]; buyerTags: readonly string[]; thankYou: string; orderPage?: string };
  optin: { source: string; tags: readonly string[]; download?: string } | null;
  launch: Launch | null;
  // Languages the pages come in. English keeps the plain addresses; the others
  // live under /<lang> (see checkoutPages).
  langs?: readonly string[];
  // One-click upsells after the order, in order (MIDI Drum Kit, TOP HITS, Famous Beats, Jazz).
  offers?: readonly Offer[];
  // The origin its pages are on, when it isn't the brand domain (the shop, see SHOP_HOME).
  home?: string;
};

const JAZZ: Product = {
  kind: "code",
  slug: jazz.slug,
  product: jazz.product,
  brand: jazz.brand,
  tagline: jazz.tagline,
  price: jazz.price,
  // The old single add-on (the Chord Pack, a bonus now) is gone from the
  // checkout; no order ever bought it (orders table, 2026-11-05).
  bump: null,
  bumps: jazz.bumps,
  checkout: jazz.checkout,
  optin: jazz.optin,
  launch: null,
  offers: jazz.offers,
};

const TOP_HITS: Product = {
  kind: "code",
  slug: topHits.slug,
  product: topHits.product,
  brand: topHits.brand,
  tagline: topHits.tagline,
  price: topHits.price,
  bump: null,
  bumps: topHits.bumps.map(({ id, name, price, pitch, image }) => ({ id, name, price, pitch, image })),
  checkout: topHits.checkout,
  optin: null,
  launch: null,
  offers: topHits.offers,
};

// TOP HITS' new funnel (2026-11-10, "crea un funnel a parte"): the same product on its own pages at
// /top-hits-chords, with the 5-minute bonus, the Jazz MIDI Pack then Famous Beats after the order.
const TOP_HITS_CHORDS: Product = {
  kind: "code",
  slug: topHitsChords.slug,
  product: topHitsChords.product,
  label: topHitsChords.label,
  brand: topHitsChords.brand,
  tagline: topHitsChords.tagline,
  price: topHitsChords.price,
  bump: null,
  bumps: topHitsChords.bumps.map(({ id, name, price, pitch, image }) => ({ id, name, price, pitch, image })),
  checkout: topHitsChords.checkout,
  optin: null,
  launch: null,
  offers: topHitsChords.offers,
};

const DRUM_KIT: Product = {
  kind: "code",
  slug: drumKit.slug,
  product: drumKit.product,
  brand: drumKit.brand,
  tagline: drumKit.tagline,
  price: drumKit.price,
  bump: null,
  bumps: drumKit.bumps.map(({ id, name, price, pitch, image }) => ({ id, name, price, pitch, image })),
  checkout: drumKit.checkout,
  optin: null,
  launch: null,
  langs: DRUM_KIT_LANGS,
  offers: drumKit.offers,
};

const FAMOUS_BEATS: Product = {
  kind: "code",
  slug: famousBeats.slug,
  product: famousBeats.product,
  brand: famousBeats.brand,
  tagline: famousBeats.tagline,
  price: famousBeats.price,
  bump: null,
  bumps: famousBeats.bumps.map(({ id, name, price, pitch, image }) => ({ id, name, price, pitch, image })),
  checkout: famousBeats.checkout,
  optin: null,
  launch: null,
  offers: famousBeats.offers,
};

// Drunk Swing Grooves (2026-11-08): €7, the Record Samples add-on, the Jazz MIDI Pack then Famous Beats after the order.
const DRUNK_GROOVES: Product = {
  kind: "code",
  slug: drunkGrooves.slug,
  product: drunkGrooves.product,
  brand: drunkGrooves.brand,
  tagline: drunkGrooves.tagline,
  price: drunkGrooves.price,
  bump: null,
  bumps: drunkGrooves.bumps.map(({ id, name, price, pitch, image }) => ({ id, name, price, pitch, image })),
  checkout: drunkGrooves.checkout,
  optin: null,
  launch: null,
  offers: drunkGrooves.offers,
};

const CODE: Record<string, Product> = { [JAZZ.slug]: JAZZ, [TOP_HITS.slug]: TOP_HITS, [TOP_HITS_CHORDS.slug]: TOP_HITS_CHORDS, [DRUM_KIT.slug]: DRUM_KIT, [FAMOUS_BEATS.slug]: FAMOUS_BEATS, [DRUNK_GROOVES.slug]: DRUNK_GROOVES };

// Named for the abandoned-checkout reminder ("Your GRIND STUDIO order is
// waiting"); the receipt names the products themselves.
const SHOP: Product = {
  kind: "shop",
  slug: SHOP_SLUG,
  product: `${jazz.brand} order`,
  brand: jazz.brand,
  tagline: "",
  price: { eur: 0, usd: 0 },
  bump: null,
  checkout: {
    leadTags: ["checkout-started"],
    // Plus buyer-shop-<slug> per product bought (lib/sales.ts).
    buyerTags: ["buyer", "buyer-shop"],
    thankYou: "/shop/thank-you",
    orderPage: "/shop/cart",
  },
  optin: null,
  launch: null,
  home: SHOP_HOME,
};

/**
 * The thank-you and order pages in the buyer's language: /fr/midi-drum-kit/…
 * for a language the product has, the plain English ones otherwise.
 */
export function checkoutPages(f: Product, lang: unknown): { thankYou: string; orderPage: string; lang: string | null } {
  const order = f.checkout.orderPage ?? `/${f.slug}#buy`;
  if (typeof lang !== "string" || lang === "en" || !f.langs?.includes(lang)) {
    return { thankYou: f.checkout.thankYou, orderPage: order, lang: null };
  }
  return { thankYou: `/${lang}${f.checkout.thankYou}`, orderPage: `/${lang}${order}`, lang };
}

/**
 * One-click upsells are switched on with UPSELLS=on: they change the main
 * checkout (the card is kept for them), so they go live only once tested.
 */
export const upsellsOn = (f: Product) => Boolean(f.offers?.length) && process.env.UPSELLS === "on";

/** The product's upsell with this id. */
export const offerOf = (f: Product, id: unknown) => f.offers?.find((o) => o.id === id);

/**
 * Where the buyer goes next: after the order (`after` = null) or after an
 * upsell (its id), the next upsell, then the thank-you page. `owned`: what
 * the order already has (an add-on ticked at checkout), whose upsell is skipped.
 */
export function nextStep(f: Product, lang: unknown, after: string | null, owned: readonly string[] = []): string {
  const pages = checkoutPages(f, lang);
  if (!upsellsOn(f)) return pages.thankYou;
  const offers = f.offers ?? [];
  const at = after === null ? -1 : offers.findIndex((o) => o.id === after);
  const next = after !== null && at < 0 ? undefined : offers.slice(at + 1).find((o) => !owned.includes(o.id));
  return next ? `${pages.lang ? `/${pages.lang}` : ""}/${f.slug}/${next.path}` : pages.thankYou;
}

/** A funnel's name on the dashboard: its label when it has one, else its product. */
export const funnelLabel = (f: Pick<Product, "product" | "label">) => f.label ?? f.product;

/** The hand-built funnels, in the order the dashboard lists them. */
export const codeFunnels = (): Product[] => Object.values(CODE);

/** Code products only (no database read). */
export function getFunnel(slug: unknown): Product | undefined {
  return CODE[String(slug)];
}

/**
 * A code funnel as funnel_items sells it: the main product's name and price,
 * its add-ons and upsells in their order, with their names and prices. An
 * add-on the code doesn't know takes its pitch and picture from the product;
 * an upsell needs the page its code has, so only those are kept.
 */
export function withItems(p: Product, items: readonly FunnelItem[]): Product {
  if (!items.length) return p;
  const main = items.find((i) => i.role === "main");
  const code = p.bumps ?? (p.bump ? [p.bump] : []);
  const bumps: Bump[] = items
    .filter((i) => i.role === "bump")
    .map((i) => {
      const known = code.find((b) => b.id === i.key);
      return { id: i.key, name: i.name, price: i.price, pitch: known?.pitch ?? i.tagline, image: known?.image ?? i.image ?? undefined };
    });
  const offers = items.flatMap((i) => {
    const known = i.role === "upsell" ? p.offers?.find((o) => o.id === i.key) : undefined;
    return known ? [{ ...known, name: i.name, price: i.price }] : [];
  });
  return {
    ...p,
    product: main?.name ?? p.product,
    price: main?.price ?? p.price,
    // Single-add-on checkouts (Jazz) take the first.
    ...(p.bumps ? { bumps } : { bump: bumps[0] ?? null }),
    ...(p.offers ? { offers } : {}),
  };
}

/** Any product: code first (as funnel_items sells it), the shop, then the dashboard's products (with their current launch). */
export async function resolveFunnel(slug: unknown): Promise<Product | undefined> {
  const code = getFunnel(slug);
  if (code) {
    try {
      return withItems(code, await funnelItems(code.slug));
    } catch (err) {
      console.error(`funnel ${code.slug}: its prices couldn't be read, so the code's are used`, err);
      return code;
    }
  }
  if (slug === SHOP_SLUG) return SHOP;
  if (typeof slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return undefined;
  return (await getKitProduct(slug)) ?? undefined;
}

/** Every add-on the checkout offers: the multi-bump list, or the single bump. */
export function offeredBumps(f: Product): readonly Bump[] {
  return f.bumps ?? (f.bump ? [f.bump] : []);
}

/**
 * The add-ons an order includes, from what the browser sent: `bumps: [ids]`
 * (multi-bump checkouts) or `bump: true` (the single one). Ids this product
 * doesn't offer are dropped, so nothing unpriced can ride along.
 */
export function pickedBumps(f: Product, body: { bump?: unknown; bumps?: unknown }): Bump[] {
  const ids = body.bumps;
  if (Array.isArray(ids)) return offeredBumps(f).filter((b) => ids.includes(b.id));
  return body.bump === true && f.bump ? [f.bump] : [];
}

/** The add-ons an order or a check refers to: a list, or the single bump's yes/no. */
const addOns = (f: Product, bump: boolean | readonly Bump[]): readonly Bump[] =>
  typeof bump === "boolean" ? (bump && f.bump ? [f.bump] : []) : bump;

const addOnTotal = (f: Product, currency: Currency, bump: boolean | readonly Bump[]) =>
  addOns(f, bump).reduce((sum, b) => sum + b.price[currency], 0);

/** Order total in the smallest currency unit (cents), at the price in force at `now`. */
export function orderAmount(f: Product, currency: Currency, bump: boolean | readonly Bump[], now = Date.now()): number {
  return toCents(unitPrice(f.price, f.launch, currency, now) + addOnTotal(f, currency, bump));
}

/** Every total this product could have been sold at (early-bird and full), for checking a paid order. */
export function possibleAmounts(f: Product, currency: Currency, bump: boolean | readonly Bump[]): number[] {
  const extra = addOnTotal(f, currency, bump);
  const prices = [f.price[currency], ...(f.launch ? [f.launch.early[currency]] : [])];
  return prices.map((p) => toCents(p + extra));
}

/** "Product + Add-on + Add-on", for the payment's description. */
export function orderDescription(f: Product, bumps: readonly Bump[]): string {
  return [f.product, ...bumps.map((b) => b.name)].join(" + ");
}

export function checkoutPhase(f: Product, now = Date.now()): Phase {
  return phaseAt(f.launch, now);
}

// ─── testing the phases ────────────────────────────────────────
// Off production (preview deployments, next dev), the checkout APIs accept
// `now` (an ISO date) to price an order as if it were that moment, and
// `dryRun: true` to return the price without creating a payment. Production
// ignores both, so nobody can buy at yesterday's early-bird price. Fails
// closed: only an explicit preview deployment or `next dev` turns it on.

const TEST_CLOCK = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";

export function requestNow(body: { now?: unknown }): number {
  if (!TEST_CLOCK || typeof body.now !== "string") return Date.now();
  const t = Date.parse(body.now);
  return Number.isNaN(t) ? Date.now() : t;
}

export function isDryRun(body: { dryRun?: unknown }): boolean {
  return TEST_CLOCK && body.dryRun === true;
}
