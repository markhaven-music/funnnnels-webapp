import type { Lang } from "../i18n";
import { en, type Copy } from "./en";
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

const COPY: Record<Lang, Copy> = { en, fr: mapStrings(fr, frenchSpaces) };

export const copyFor = (lang: Lang): Copy => COPY[lang];
