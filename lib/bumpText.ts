import { bumpFull } from "@/lib/bumpFull";
import { amount } from "@/lib/restate";
import { supabase } from "@/lib/supabase";

// One set of order-bump words per product, said wherever it is a tick-box add-on
// ("modificare il testo degli order bump dei prodotti in un modo unificato cioè che quando lo
// modifico poi viene cambiato ovunque", 2026-11-17). Table bump_texts (db/bump-texts.sql), edited
// in dashboard → Products → Order bump words (components/BumpTextEditor.tsx). A product with no
// row keeps each funnel's own words, so nothing changes until the owner saves one.
//
// body: paragraphs split by a blank line, with the marks the order forms draw (**bold**,
// _italic_, __underline__). {price} is what that checkout charges and {full} the struck full
// price (lib/bumpFull.ts), so one text fits funnels that charge differently.

export const BUMP_LANGS = ["en", "it"] as const;
export type BumpLang = (typeof BUMP_LANGS)[number];
export type BumpText = { headline: string; body: string };

type Row = { product: string; lang: string; headline: string; body: string };

/** Every product's saved words, by product then language. Empty when the table can't be read. */
export async function bumpTexts(): Promise<Record<string, Partial<Record<string, BumpText>>>> {
  try {
    const { data, error } = await supabase().from("bump_texts").select("product, lang, headline, body");
    if (error) throw error;
    const out: Record<string, Partial<Record<string, BumpText>>> = {};
    for (const r of data as Row[]) (out[r.product] ??= {})[r.lang] = { headline: r.headline, body: r.body };
    return out;
  } catch (err) {
    console.error("bump texts: read failed, the funnels' own words stay", err);
    return {};
  }
}

/** "27" with the currency mark the forms fill ({c}): before the number in English, after it elsewhere. */
const priced = (n: number, lang: string) => (lang === "en" ? `{c}${amount(n, lang)}` : `${amount(n, lang)} {c}`);

/** The saved text's paragraphs with {price} and {full} said for this checkout. */
export function fillBump(body: string, id: string, price: number, lang: string): string[] {
  const full = bumpFull(id, price) ?? price;
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim().replaceAll("{price}", priced(price, lang)).replaceAll("{full}", priced(full, lang)))
    .filter(Boolean);
}

/**
 * A funnel's add-ons with their product's saved words (the language's, else English) in place of
 * the funnel's own. `words` (the on-page editor's key for the funnel's own line) goes with them.
 */
export async function sayBumps<T extends { id: string; price: number }>(funnel: string, bumps: readonly T[], lang = "en"): Promise<T[]> {
  if (!bumps.length) return [...bumps];
  try {
    const [texts, items] = await Promise.all([
      bumpTexts(),
      supabase().from("funnel_items").select("key, product").eq("funnel", funnel).eq("role", "bump"),
    ]);
    const productOf = Object.fromEntries(((items.data ?? []) as { key: string; product: string }[]).map((i) => [i.key, i.product]));
    return bumps.map((b) => {
      const saved = texts[productOf[b.id] ?? b.id];
      const t = saved?.[lang] ?? saved?.en;
      if (!t || (!t.headline.trim() && !t.body.trim())) return b;
      const { words: _own, ...rest } = b as T & { words?: string };
      void _own;
      return {
        ...(rest as unknown as T),
        ...(t.headline.trim() ? { headline: t.headline.trim() } : {}),
        ...(t.body.trim() ? { body: fillBump(t.body, b.id, b.price, lang) } : {}),
      };
    });
  } catch (err) {
    console.error("bump texts: applying failed, the funnels' own words stay", err);
    return [...bumps];
  }
}

/** Where each funnel's order form lives, for the editor's preview (the page itself, in a frame). */
export const ORDER_PAGE: Record<string, (lang: string) => string> = {
  "midi-drum-kit": (lang) => `/midi-drum-kit/${lang}/order/eur`,
  "jazz-midi-pack": () => "/jazz-midi-pack/order/eur",
  "top-hits-midi-bundle": () => "/top-hits-midi-bundle/order/eur",
  "top-hits-chords": () => "/top-hits-chords/order/eur",
  "famous-beats-bundle": () => "/famous-beats-bundle/order/eur",
  "drunk-swing-grooves": () => "/drunk-swing-grooves/order/eur",
};

/** Save (or, both empty, remove) a product's words in a language. */
export async function saveBumpText(product: string, lang: string, text: BumpText): Promise<void> {
  const db = supabase().from("bump_texts");
  if (!text.headline.trim() && !text.body.trim()) {
    const { error } = await db.delete().eq("product", product).eq("lang", lang);
    if (error) throw error;
    return;
  }
  const { error } = await db.upsert({ product, lang, headline: text.headline.trim(), body: text.body.trim(), updated_at: new Date().toISOString() });
  if (error) throw error;
}
