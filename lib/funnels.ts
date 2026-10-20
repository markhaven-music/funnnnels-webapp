import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { LANGS as DRUM_KIT_LANGS } from "@/app/(funnels)/midi-drum-kit/i18n";
import { funnel as topHits } from "@/app/(funnels)/top-hits-midi-bundle/funnel";
import type { Currency } from "@/lib/geo";
import { phaseAt, toCents, unitPrice, type Launch, type Money, type Phase } from "@/lib/launch";
import { getKitProduct } from "@/lib/products";

// Every product the checkout can sell. The public APIs look products up here
// so prices, tags and files always come from the server, never from the visitor.
//
// Two kinds share one shape:
//   code  hand-built pages with their funnel.ts: the Jazz MIDI Pack, the
//         TOP HITS MIDI Bundle and the MIDI Drum Kit (app/(funnels)/<slug>).
//         No launch: always full price.
//   kit   products made in the dashboard (Launches): a row in `products`, the
//         template page in app/(funnels)/[slug], zips in Supabase Storage, and
//         optionally a launch whose dates set the phase and the price.

export type Bump = { id: string; name: string; price: Money; pitch: string };

export type Product = {
  kind: "code" | "kit";
  slug: string;
  product: string; // display name
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
};

const JAZZ: Product = {
  kind: "code",
  slug: jazz.slug,
  product: jazz.product,
  brand: jazz.brand,
  tagline: jazz.tagline,
  price: jazz.price,
  bump: jazz.bump,
  checkout: jazz.checkout,
  optin: jazz.optin,
  launch: null,
};

const TOP_HITS: Product = {
  kind: "code",
  slug: topHits.slug,
  product: topHits.product,
  brand: topHits.brand,
  tagline: topHits.tagline,
  price: topHits.price,
  bump: null,
  bumps: topHits.bumps.map(({ id, name, price, pitch }) => ({ id, name, price, pitch })),
  checkout: topHits.checkout,
  optin: null,
  launch: null,
};

const DRUM_KIT: Product = {
  kind: "code",
  slug: drumKit.slug,
  product: drumKit.product,
  brand: drumKit.brand,
  tagline: drumKit.tagline,
  price: drumKit.price,
  bump: null,
  bumps: drumKit.bumps.map(({ id, name, price, pitch }) => ({ id, name, price, pitch })),
  checkout: drumKit.checkout,
  optin: null,
  launch: null,
  langs: DRUM_KIT_LANGS,
};

const CODE: Record<string, Product> = { [JAZZ.slug]: JAZZ, [TOP_HITS.slug]: TOP_HITS, [DRUM_KIT.slug]: DRUM_KIT };

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

/** The hand-built funnels, in the order the dashboard lists them. */
export const codeFunnels = (): Product[] => Object.values(CODE);

/** Code products only (no database read). */
export function getFunnel(slug: unknown): Product | undefined {
  return CODE[String(slug)];
}

/** Any product: code first, then the dashboard's products (with their current launch). */
export async function resolveFunnel(slug: unknown): Promise<Product | undefined> {
  const code = getFunnel(slug);
  if (code) return code;
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
