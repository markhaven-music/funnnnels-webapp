import { sayBumps } from "@/lib/bumpText";
import { priceIn } from "@/lib/geo";
import { getFunnel, resolveFunnel, type Product } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { restate } from "@/lib/restate";
import { copyWith } from "./copy";
import type { Texts } from "@/lib/pageTexts";
import { funnel } from "./funnel";
import type { Lang } from "./i18n";

// What the order form sells, as dashboard → Products has it (lib/funnels.ts
// resolveFunnel): the kit's name and price, the add-ons in their order with
// their prices, in the page's language. Built on the server and handed to
// ./OrderForm.tsx, so the browser never reads prices of its own. An add-on
// written in ./copy keeps its words, with its price restated if it changed;
// one added from Products says its name and the product's tagline.

// words: the add-on's words in ./copy ("form.bumps.<id>"), so the dashboard's
// on-page editor knows each box's texts even with its price restated; none for
// an add-on that speaks with the product's tagline.
export type OrderBump = { id: string; name: string; price: number; image: string; headline: string; body: string[]; words?: string };
// was, variant, abCookie: the Black Friday copy (lib/blackFriday.ts): the regular price struck before `price`, the
// letter its orders carry instead of the landing test's, the cookie its page views are counted under.
export type OrderOffer = { product: string; name: string; price: number; bumps: OrderBump[]; was?: number; variant?: string; abCookie?: string };

// "YES! Add …!" for an add-on the copy has no words for, per language.
const ADD: Record<Lang, (name: string) => string> = {
  en: (n) => `YES! Add ${n}!`,
  fr: (n) => `OUI ! Ajoute ${n} !`,
  es: (n) => `¡SÍ! ¡Añade ${n}!`,
  de: (n) => `JA! ${n} dazu!`,
  it: (n) => `SÌ! Aggiungi ${n}!`,
};

// texts: the copy's edits from the dashboard (./texts.ts copyEdits).
export async function orderOffer(lang: Lang, currency: Currency, product?: Product, texts: Texts = {}): Promise<OrderOffer> {
  const code = getFunnel(funnel.slug)!;
  const f = product ?? (await resolveFunnel(funnel.slug)) ?? code;
  const words = copyWith(lang, currency, texts).form.bumps as Record<string, { headline: string; body: string[] } | undefined>;
  const offer = {
    product: f.product,
    // The form's own name for the kit, until the product is renamed.
    name: f.product === code.product ? funnel.orderName : f.product,
    price: priceIn(f.price, currency),
    bumps: (f.bumps ?? []).map((b) => {
      const known = funnel.bumps.find((x) => x.id === b.id);
      const w = words[b.id];
      const was = priceIn(known?.price, currency) ?? priceIn(b.price, currency);
      return {
        id: b.id,
        name: b.name,
        price: priceIn(b.price, currency),
        image: known?.image ?? b.image ?? "",
        headline: w?.headline ?? ADD[lang](b.name),
        body: (w?.body ?? (b.pitch ? [b.pitch] : [])).map((p) => restate(p, was, priceIn(b.price, currency), lang)),
        ...(w ? { words: `form.bumps.${b.id}` } : {}),
      };
    }),
  };
  // The product's own words where dashboard → Products has some (lib/bumpText.ts).
  return { ...offer, bumps: await sayBumps(funnel.slug, offer.bumps, lang) };
}
