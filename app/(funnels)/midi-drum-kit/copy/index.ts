import type { Currency } from "@/lib/geo";
import type { Lang } from "../i18n";
import { de } from "./de";
import { en, type Copy } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";

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

// Spanish, German and Italian keep "27 €" and "90 %" on one line too. Spanish dollar
// visitors are in Latin America, where the sign goes first: "27 {c}" becomes "{c}27" ($27).
const unitSpaces = (s: string) => s.replace(/ (?=%|\{c\})/g, " ");
const dollarFirst = (s: string) => s.replace(/(\d[\d.,]*) \{c\}/g, "{c}$1");

const COPY: Record<Lang, Copy> = { en, fr: mapStrings(fr, frenchSpaces), es: mapStrings(es, unitSpaces), de: mapStrings(de, unitSpaces), it: mapStrings(it, unitSpaces) };
const COPY_USD: Partial<Record<Lang, Copy>> = { es: mapStrings(COPY.es, dollarFirst) };

export const copyFor = (lang: Lang, currency?: Currency): Copy => (currency === "usd" && COPY_USD[lang]) || COPY[lang];

// ─── the dashboard's edits ───────────────────────────────────
// Funnel map → Edit (app/funnels/[id]/texts) saves texts by their path in
// these files ("order.bullets.3", "form.bumps.hustle.body.0"); see ../texts.ts.

export const RAW: Record<Lang, Copy> = { en, fr, es, de, it };
const SPACES: Record<Lang, (s: string) => string> = { en: (s) => s, fr: frenchSpaces, es: unitSpaces, de: unitSpaces, it: unitSpaces };

/** A copy of `value` (its data, not its functions) with the text at each path replaced; paths that aren't a text are left alone. */
export function withTexts<T>(value: T, texts: Record<string, string>): T {
  const out = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  for (const [path, text] of Object.entries(texts)) {
    const keys = path.split(".");
    let at: Record<string, unknown> | undefined = out;
    for (const k of keys.slice(0, -1)) at = at && typeof at[k] === "object" ? (at[k] as Record<string, unknown>) : undefined;
    const last = keys[keys.length - 1];
    if (at && typeof at[last] === "string") at[last] = text;
  }
  return out as T;
}

/** copyFor() with the dashboard's edits for this language (path → text). */
export function copyWith(lang: Lang, currency: Currency | undefined, texts: Record<string, string>): Copy {
  if (!Object.keys(texts).length) return copyFor(lang, currency);
  const edited = mapStrings(withTexts(RAW[lang], texts), SPACES[lang]);
  const c = currency === "usd" && lang === "es" ? mapStrings(edited, dollarFirst) : edited;
  // The functions (thanks.receipt) don't survive the copy: they come back from the code.
  return { ...c, thanks: { ...c.thanks, receipt: copyFor(lang, currency).thanks.receipt } };
}
