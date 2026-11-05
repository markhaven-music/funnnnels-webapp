import { pageEdits, type Texts } from "@/lib/pageTexts";

// The words of a page built in React (TOP HITS, Famous Beats' order page, the
// thank-you pages), kept in an object beside the page (its words.ts) instead
// of in the components, so the dashboard can edit them (funnel map → Edit,
// app/funnels/[id]/texts). An edit is saved by the text's path in the object
// ("hero.for", "letter.12", "faq.items.3.a.0") in page_texts and read back
// here when the page is built; a path the object no longer has is ignored.
// Marks inside a text: **bold**, __underline__, ==highlight==, _italic_,
// {c} = € or $, and the page's own tokens ({price}, {email}, {days}).

/** Every text in `value`, path → text, in the object's order. */
export function leaves(value: unknown, path = "", out: Texts = {}): Texts {
  if (typeof value === "string") out[path] = value;
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, path ? `${path}.${i}` : String(i), out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k, out);
  return out;
}

/** A copy of `value` with the text at each path replaced; paths that aren't a text are left alone. */
export function withTexts<T>(value: T, texts: Texts): T {
  if (!Object.keys(texts).length) return value;
  const out = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  for (const [path, text] of Object.entries(texts)) {
    const keys = path.split(".");
    let at: Record<string, unknown> | undefined = out;
    for (const k of keys.slice(0, -1)) at = at && typeof at[k] === "object" && at[k] !== null ? (at[k] as Record<string, unknown>) : undefined;
    const last = keys[keys.length - 1];
    if (at && typeof at[last] === "string") at[last] = text;
  }
  return out as T;
}

/**
 * The page's words with the dashboard's edits. strict: for a cached page, a
 * failed read throws so the cache keeps the last good page (lib/pageTexts.ts).
 */
export async function wordsFor<T>(funnel: string, page: string, words: T, { lang = "en", strict = false }: { lang?: string; strict?: boolean } = {}): Promise<T> {
  const edits = (await pageEdits(funnel, lang, strict))[page] ?? {};
  return withTexts(words, edits);
}

/** {name} tokens filled in (the marks stay for the page's renderer). */
export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
