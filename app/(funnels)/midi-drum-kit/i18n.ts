import type { Currency } from "@/lib/geo";
import { funnel } from "./funnel";

// The languages this funnel is sold in. English lives at /midi-drum-kit, the
// others at /<lang>/midi-drum-kit (proxy.ts rewrites both to the cached
// /midi-drum-kit/<lang>/<currency> pages). Add a language: its copy file in
// ./copy, an entry here, and nothing else.

export const LANGS = ["en", "fr", "es", "de", "it"] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang);

// Number and currency formats (€27.00 in English, 27,00 € in French, Spanish,
// German and Italian). Spanish dollars are Latin America's: $27.00, not Spain's 27,00 US$.
const LOCALE: Record<Lang, string> = { en: "en-US", fr: "fr-FR", es: "es-ES", de: "de-DE", it: "it-IT" };

export function money(n: number, currency: Currency, lang: Lang, cents = true): string {
  return new Intl.NumberFormat(lang === "es" && currency === "usd" ? "es-US" : LOCALE[lang], {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n);
}

/** The visitor-facing addresses of each page, in a language. */
export function paths(lang: Lang) {
  const prefix = lang === "en" ? "" : `/${lang}`;
  return {
    landing: `${prefix}${funnel.checkout.orderPage.replace(/\/order$/, "")}`,
    order: `${prefix}${funnel.checkout.orderPage}`,
    thankYou: `${prefix}${funnel.checkout.thankYou}`,
    // The one-click upsells, in order (funnel.offers).
    offers: funnel.offers.map((o) => `${prefix}/${funnel.slug}/${o.path}`),
  };
}
