import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import type { Currency } from "@/lib/geo";

// Every code funnel, by slug. The public APIs look funnels up here so prices,
// tags and products always come from the server, never from the visitor.
export const FUNNELS = { [jazz.slug]: jazz } as const;

export type Funnel = (typeof FUNNELS)[keyof typeof FUNNELS];

export function getFunnel(slug: unknown): Funnel | undefined {
  return FUNNELS[String(slug) as keyof typeof FUNNELS];
}

/** Order total in the smallest currency unit (cents). */
export function orderAmount(f: Funnel, currency: Currency, bump: boolean): number {
  return (f.price[currency] + (bump ? f.bump.price[currency] : 0)) * 100;
}
