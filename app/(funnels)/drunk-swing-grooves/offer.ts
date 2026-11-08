import { getFunnel, resolveFunnel, type Product } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { restate } from "@/lib/restate";
import type { OrderOffer } from "../midi-drum-kit/offer";
import { funnel } from "./funnel";
import { ORDER } from "./words";

// What the order form sells, as dashboard → Products has it, like Famous Beats'
// (../famous-beats-bundle/offer.ts): the pack's name and price, the add-ons in
// their order, their words from ./words.ts with the price restated when it
// changed. An add-on added from Products says its name and tagline.

// words: the add-ons' words as the page has them (with the dashboard's edits), else ./words.ts'.
export async function orderOffer(currency: Currency, product?: Product, words: Record<string, string[]> = ORDER.bumps): Promise<OrderOffer> {
  const code = getFunnel(funnel.slug)!;
  const f = product ?? (await resolveFunnel(funnel.slug)) ?? code;
  return {
    product: f.product,
    name: f.product === code.product ? funnel.orderName : f.product,
    price: f.price[currency],
    bumps: (f.bumps ?? []).map((b) => {
      const known = funnel.bumps.find((x) => x.id === b.id);
      const was = known?.price[currency] ?? b.price[currency];
      return {
        id: b.id,
        name: b.name,
        price: b.price[currency],
        image: known?.image ?? b.image ?? "",
        headline: known?.headline ?? `YES! Add ${b.name}!`,
        body: (words[b.id] ?? ORDER.bumps[b.id] ?? (b.pitch ? [b.pitch] : [])).map((p) => restate(p, was, b.price[currency])),
      };
    }),
  };
}
