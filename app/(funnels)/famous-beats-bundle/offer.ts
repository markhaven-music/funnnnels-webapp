import { priceIn } from "@/lib/geo";
import { getFunnel, resolveFunnel, type Product } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { restate } from "@/lib/restate";
import type { OrderOffer } from "../midi-drum-kit/offer";
import { bumpCopy } from "./copy";
import { funnel } from "./funnel";

// What the order form sells, as dashboard → Products has it, like TOP HITS'
// (../top-hits-midi-bundle/offer.ts): the bundle's name and price, the add-ons
// in their order, their words from ./copy with the price restated when it
// changed. An add-on added from Products says its name and tagline.

// words: the add-ons' words as the page has them (with the dashboard's edits), else ./copy.ts'.
export async function orderOffer(currency: Currency, product?: Product, words: Record<string, string[]> = bumpCopy): Promise<OrderOffer> {
  const code = getFunnel(funnel.slug)!;
  const f = product ?? (await resolveFunnel(funnel.slug)) ?? code;
  return {
    product: f.product,
    name: f.product === code.product ? funnel.orderName : f.product,
    price: priceIn(f.price, currency),
    bumps: (f.bumps ?? []).map((b) => {
      const known = funnel.bumps.find((x) => x.id === b.id);
      const was = priceIn(known?.price, currency) ?? priceIn(b.price, currency);
      return {
        id: b.id,
        name: b.name,
        price: priceIn(b.price, currency),
        image: known?.image ?? b.image ?? "",
        headline: known?.headline ?? `YES! Add ${b.name}!`,
        body: (words[b.id] ?? bumpCopy[b.id] ?? (b.pitch ? [b.pitch] : [])).map((p) => restate(p, was, priceIn(b.price, currency))),
      };
    }),
  };
}
