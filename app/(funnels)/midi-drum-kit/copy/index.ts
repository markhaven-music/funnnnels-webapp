import type { Currency } from "@/lib/geo";
import type { Lang } from "../i18n";
import { en, type Copy } from "./en";
import { es } from "./es";
import { fr } from "./fr";

export type { Copy };

// French puts a space before : ; ! ? » % and after «, and keeps it on the
// line with the mark ("faciles !", "27 €"). Written as plain spaces in fr.ts,
// made non-breaking here so a « or a ! never starts a line on its own.
const frenchSpaces = (s: string) => s.replace(/ (?=[:;!?»%]|\{c\})/g, " ").replace(/« /g, "« ");

function mapStrings<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === "string") return fn(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)])) as T;
  }
  return value;
}

// Spanish keeps "27 €" and "90 %" on one line too. Its dollar visitors are in
// Latin America, where the sign goes first: "27 {c}" becomes "{c}27" ($27).
const spanishSpaces = (s: string) => s.replace(/ (?=%|\{c\})/g, " ");
const dollarFirst = (s: string) => s.replace(/(\d[\d.,]*) \{c\}/g, "{c}$1");

const COPY: Record<Lang, Copy> = { en, fr: mapStrings(fr, frenchSpaces), es: mapStrings(es, spanishSpaces) };
const COPY_USD: Partial<Record<Lang, Copy>> = { es: mapStrings(COPY.es, dollarFirst) };

export const copyFor = (lang: Lang, currency?: Currency): Copy => (currency === "usd" && COPY_USD[lang]) || COPY[lang];
