import { priceIn } from "@/lib/geo";
import { getFunnel, resolveFunnel, type Product } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { restate } from "@/lib/restate";
import { bumpWords } from "@/lib/bumpWords";
import type { OrderOffer } from "../midi-drum-kit/offer";
import { bumpCopy } from "./copy";
import { funnel } from "./funnel";

// What the order form sells, as dashboard → Products has it, like the MIDI
// Drum Kit's (../midi-drum-kit/offer.ts): the bundle's name and price, the
// add-ons in their order, their words from ./copy with the price restated
// when it changed. An add-on added from Products says its name and tagline.

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
      // The Unison-style words (lib/bumpWords.ts, 11-16) at the price sold here; else the page's own.
      const said = bumpWords(b.id, priceIn(b.price, currency), "your new TOP HITS MIDI Bundle");
      return {
        id: b.id,
        name: b.name,
        price: priceIn(b.price, currency),
        image: known?.image ?? b.image ?? "",
        headline: said?.headline ?? known?.headline ?? `YES! Add ${b.name}!`,
        body: (said?.body ?? words[b.id] ?? bumpCopy[b.id] ?? (b.pitch ? [b.pitch] : [])).map((p) => restate(p, was, priceIn(b.price, currency))),
      };
    }),
  };
}
