import { RAW } from "./copy";
import landingDe from "./copy/landing/de.json";
import landingEn from "./copy/landing/en.json";
import landingEs from "./copy/landing/es.json";
import landingFr from "./copy/landing/fr.json";
import landingIt from "./copy/landing/it.json";
import famousDe from "./copy/upsell-famous/de.json";
import famousEn from "./copy/upsell-famous/en.json";
import famousEs from "./copy/upsell-famous/es.json";
import famousFr from "./copy/upsell-famous/fr.json";
import famousIt from "./copy/upsell-famous/it.json";
import topHitsDe from "./copy/upsell-tophits/de.json";
import topHitsEn from "./copy/upsell-tophits/en.json";
import topHitsEs from "./copy/upsell-tophits/es.json";
import topHitsFr from "./copy/upsell-tophits/fr.json";
import topHitsIt from "./copy/upsell-tophits/it.json";
import type { Lang } from "./i18n";
import type { PageEdits, Texts } from "@/lib/pageTexts";

// Which words of the MIDI Drum Kit the dashboard can edit (funnel map → Edit,
// app/funnels/[id]/texts), page by page, and the code's version of each:
//   tNNN  a text of ClickFunnels' markup (./copy/landing, ./copy/upsell-*), HTML:
//         the editor keeps its tags (bold, colours) and changes the words
//   paths a text of ./copy/<lang>.ts ("order.bullets.3"), plain with its marks
//         (**bold**, {c} = € or $)
// The pages read the edits through ./landing.ts, ./upsell.ts and copyWith().

export const TEXT_PAGES = [
  { id: "landing", name: "Sales page" },
  { id: "order", name: "Order page" },
  { id: "famous-beats", name: "Upsell 1: Famous Beats" },
  { id: "top-hits", name: "Upsell 2: TOP HITS" },
  { id: "thank-you", name: "Thank-you page" },
] as const;
export type TextPage = (typeof TEXT_PAGES)[number]["id"];
export const isTextPage = (v: unknown): v is TextPage => TEXT_PAGES.some((p) => p.id === v);

type Json = Record<string, unknown>;
const MARKUP: Partial<Record<TextPage, Record<Lang, Json>>> = {
  landing: { en: landingEn, fr: landingFr, es: landingEs, de: landingDe, it: landingIt },
  "famous-beats": { en: famousEn, fr: famousFr, es: famousEs, de: famousDe, it: famousIt },
  "top-hits": { en: topHitsEn, fr: topHitsFr, es: topHitsEs, de: topHitsDe, it: topHitsIt },
};

// The parts of ./copy/<lang>.ts each page shows (the footer is on the order and thank-you pages).
const COPY_PARTS: Partial<Record<TextPage, string[]>> = {
  landing: ["meta.title", "meta.description"],
  order: ["meta.orderTitle", "orderTopbar", "order", "form", "footer"],
  "thank-you": ["meta.thanksTitle", "thanks"],
};

/** Every text under a path of the copy, path → text (names of pictures left out). */
function leaves(value: unknown, path: string, out: Texts) {
  if (typeof value === "string") {
    if (!/\.avatar$/.test(path)) out[path] = value;
  } else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${path}.${i}`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) leaves(v, `${path}.${k}`, out);
  return out;
}

function copyTexts(page: TextPage, lang: Lang): Texts {
  const out: Texts = {};
  for (const part of COPY_PARTS[page] ?? []) {
    const value = part.split(".").reduce<unknown>((at, k) => (at as Json | undefined)?.[k], RAW[lang]);
    leaves(value, part, out);
  }
  return out;
}

function markupTexts(page: TextPage, lang: Lang): Texts {
  const json = MARKUP[page];
  if (!json) return {};
  // A key the language hasn't translated shows the English text, as on the page.
  const all = { ...json.en, ...json[lang] };
  return Object.fromEntries(Object.entries(all).filter((e): e is [string, string] => /^t\d{3}$/.test(e[0]) && typeof e[1] === "string"));
}

/** The code's texts of a page in a language, in the page's order. */
export function codeTexts(page: TextPage, lang: Lang): Texts {
  return { ...markupTexts(page, lang), ...copyTexts(page, lang) };
}

export const isMarkupKey = (key: string) => /^t\d{3}$/.test(key);

/** The edits of ./copy/<lang>.ts, from every page, for copyWith(). */
export function copyEdits(edits: PageEdits): Texts {
  const out: Texts = {};
  for (const texts of Object.values(edits)) for (const [k, v] of Object.entries(texts)) if (!isMarkupKey(k)) out[k] = v;
  return out;
}

/** The edits of a page's markup texts (tNNN). */
export function markupEdits(edits: PageEdits, page: TextPage): Texts {
  return Object.fromEntries(Object.entries(edits[page] ?? {}).filter(([k]) => isMarkupKey(k)));
}
