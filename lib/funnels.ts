import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import type { Currency } from "@/lib/geo";
import { phaseAt, toCents, unitPrice, type Launch, type Money, type Phase } from "@/lib/launch";
import { getKitProduct } from "@/lib/products";

// Every product the checkout can sell. The public APIs look products up here
// so prices, tags and files always come from the server, never from the visitor.
//
// Two kinds share one shape:
//   code  the Jazz MIDI Pack, defined in app/(funnels)/jazz-midi-pack/funnel.ts
//         with its own hand-built page. No launch: always full price.
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
  checkout: { leadTags: readonly string[]; buyerTags: readonly string[]; thankYou: string };
  optin: { source: string; tags: readonly string[]; download?: string } | null;
  launch: Launch | null;
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

const CODE: Record<string, Product> = { [JAZZ.slug]: JAZZ };

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

/** Order total in the smallest currency unit (cents), at the price in force at `now`. */
export function orderAmount(f: Product, currency: Currency, bump: boolean, now = Date.now()): number {
  const extra = bump && f.bump ? f.bump.price[currency] : 0;
  return toCents(unitPrice(f.price, f.launch, currency, now) + extra);
}

/** Every total this product could have been sold at (early-bird and full), for checking a paid order. */
export function possibleAmounts(f: Product, currency: Currency, bump: boolean): number[] {
  const extra = bump && f.bump ? f.bump.price[currency] : 0;
  const prices = [f.price[currency], ...(f.launch ? [f.launch.early[currency]] : [])];
  return prices.map((p) => toCents(p + extra));
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
