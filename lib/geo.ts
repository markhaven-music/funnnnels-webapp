// Which price a visitor sees. Vercel stamps every request with the visitor's
// country (x-vercel-ip-country); locally there is no header, so `?country=IT`
// lets you preview either price. Europe pays in euros, everyone else in dollars;
// since 2026-11-16 on the funnels (wide) the UK pays in pounds and Switzerland in
// francs ("ora facciamo le valute: £27 e CHF 27"), the euro price's number: €27 → £27, CHF 27.

export type Currency = "eur" | "usd" | "gbp" | "chf";
export const CURRENCIES: Currency[] = ["eur", "usd", "gbp", "chf"];

/** The two price lists every product keeps (dashboard → Products): pounds and francs read the euro one. */
export type PriceList = "eur" | "usd";
export const PRICE_LISTS: PriceList[] = ["eur", "usd"];
export const listOf = (currency: Currency): PriceList => (currency === "usd" ? "usd" : "eur");
/** A product's price in the visitor's currency: £ and CHF take the € number. */
export function priceIn<T>(prices: Record<PriceList, T>, currency: Currency): T;
export function priceIn<T>(prices: Record<PriceList, T> | undefined, currency: Currency): T | undefined;
export function priceIn<T>(prices: Record<PriceList, T> | undefined, currency: Currency): T | undefined {
  return prices?.[listOf(currency)];
}
export const isCurrency = (v: unknown): v is Currency => typeof v === "string" && (CURRENCIES as string[]).includes(v);
export const SIGN: Record<Currency, string> = { eur: "€", usd: "$", gbp: "£", chf: "CHF " };

// Funnel pages are cached per currency, so the HTML can't carry the visitor's
// country; proxy.ts puts it in this cookie for the checkout to report.
export const COUNTRY_COOKIE = "visitor_country";

// Every European country, EU or not (UK, Switzerland, Norway… included).
const EUROPE = new Set([
  "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE",
  "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS",
  "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO",
  "PL", "PT", "RO", "RS", "SE", "SI", "SK", "SM", "UA", "VA", "XK",
]);

export function visitorCountry(headers: Headers, override?: string | null): string {
  const pick = (override ?? headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  return /^[A-Z]{2}$/.test(pick) ? pick : "US";
}

// Pounds: the UK and the Crown Dependencies. Francs: Switzerland and Liechtenstein.
const POUNDS = new Set(["GB", "GG", "JE", "IM"]);
const FRANCS = new Set(["CH", "LI"]);

/**
 * The visitor's currency. `wide`: the code funnels' pages and checkouts, which also
 * show pounds and francs; the shop, the home page and the launch kits keep € and $.
 */
export function currencyFor(country: string, wide = false): Currency {
  if (wide && POUNDS.has(country)) return "gbp";
  if (wide && FRANCS.has(country)) return "chf";
  return EUROPE.has(country) ? "eur" : "usd";
}

export function formatPrice(amount: number, currency: Currency): string {
  return `${SIGN[currency]}${amount}`;
}

/**
 * For the dashboard's smaller counters, which keep a € and a $ column: an amount in pounds or
 * francs as rough euros (Analytics itself uses the day's rate, lib/analytics.ts eurPer). Dollars stay dollars.
 */
const ROUGH_EUR_PER: Record<Currency, number> = { eur: 1, usd: 1, gbp: 1.19, chf: 1.07 };
export const euroColumn = (currency: string): boolean => currency !== "usd";
export const roughEuros = (amount: number, currency: string): number =>
  Math.round(amount * (ROUGH_EUR_PER[currency as Currency] ?? 1) * 100) / 100;

/** "{c}" in a text: the visitor's sign ("{c}27" → "£27", "CHF 27"; "27 {c}" → "27 CHF"). */
export function fillSign(text: string, currency: Currency): string {
  return text.replace(/\{c\}(?=\d)/g, SIGN[currency]).replaceAll("{c}", SIGN[currency].trim());
}

/**
 * Text written in euros (a page cloned from ClickFunnels, an email), said in the
 * visitor's currency: € becomes $ or £, and "€27" / "27 €" become "CHF 27".
 */
export function fromEuro(text: string, currency: Currency): string {
  if (currency === "eur") return text;
  if (currency !== "chf") return text.replaceAll("€", SIGN[currency]);
  return text
    .replace(/€\s?(?=\d)/g, "CHF ")
    .replace(/(\d)[\s ]?€/g, "$1 CHF")
    .replaceAll("€", "CHF");
}

// Browser side: the visitor's country from the cookie, when it matches the
// currency the page shows (so the server charges what the visitor saw).
export function cookieCountry(currency: Currency, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([A-Z]{2})(?:;|$)`));
  return m && (currencyFor(m[1], true) === currency || currencyFor(m[1]) === currency) ? m[1] : fallback;
}
