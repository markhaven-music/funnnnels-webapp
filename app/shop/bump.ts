// The shop checkout's order bump (2026-11-27, "che order bumps potremmo mettere
// al checkout dello shop" → the Expansions first): a cart with one or two of the
// MIDI Drum Kit's three Expansions is offered the others together, cheaper than
// in the shop. One rule for the cart page (CartView.tsx) and the checkout's
// server (lib/shop.ts priceCart), which prices it again.

export const EXPANSIONS = ["expansion-house", "expansion-lofi", "expansion-afrobeat"] as const;
export const EXPANSIONS_BUMP = "expansions-rest";

// What the missing ones cost together, by how many are missing: €15 for two
// (€24 in the shop), €8 for one (€12). The same number in every currency, like
// the shop's prices.
const PRICE: Record<number, number> = { 1: 8, 2: 15 };

export const EXPANSION_WORDS: Record<string, { short: string; grooves: number }> = {
  "expansion-house": { short: "House", grooves: 1448 },
  "expansion-lofi": { short: "Lo-Fi", grooves: 4060 },
  "expansion-afrobeat": { short: "Afrobeat", grooves: 4495 },
};

/** The offer for this cart: the Expansions it lacks and their price together, or null. */
export function expansionsBump(slugs: readonly string[]): { missing: string[]; price: number } | null {
  if (!EXPANSIONS.some((x) => slugs.includes(x))) return null;
  const missing = EXPANSIONS.filter((x) => !slugs.includes(x));
  const price = PRICE[missing.length];
  return price ? { missing, price } : null;
}
