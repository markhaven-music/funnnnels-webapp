// Which price a visitor sees. Vercel stamps every request with the visitor's
// country (x-vercel-ip-country); locally there is no header, so `?country=IT`
// lets you preview either price. Europe pays in euros, everyone else in dollars.

export type Currency = "eur" | "usd";
export const CURRENCIES: Currency[] = ["eur", "usd"];

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

export function currencyFor(country: string): Currency {
  return EUROPE.has(country) ? "eur" : "usd";
}

export function formatPrice(amount: number, currency: Currency): string {
  return currency === "eur" ? `€${amount}` : `$${amount}`;
}

// Browser side: the visitor's country from the cookie, when it matches the
// currency the page shows (so the server charges what the visitor saw).
export function cookieCountry(currency: Currency, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([A-Z]{2})(?:;|$)`));
  return m && currencyFor(m[1]) === currency ? m[1] : fallback;
}
