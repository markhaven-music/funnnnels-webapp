import { revalidatePath } from "next/cache";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import { CURRENCIES } from "@/lib/geo";

// The words of a code funnel's pages as edited in the dashboard (funnel map →
// Edit, app/funnels/[id]/texts; table page_texts, db/page-texts.sql). A row
// replaces the code's text for one key of one page in one language; the pages
// read them when they're built (the cached ones are rebuilt on save).
//
// Like lib/pages.ts: a live page never waits long on the database. `strict`
// is for cached pages: there a failed read throws, so the cache keeps the last
// good page (with the edits) instead of going back to the code's words until
// the next rebuild; except while building and in `next dev`.

/** key → text, for one page. */
export type Texts = Record<string, string>;
/** page → its edited texts, for one funnel and language. */
export type PageEdits = Record<string, Texts>;

// One read per page render (the page and its metadata share it).
export const pageEdits = cache(async (funnel: string, lang: string, strict = false): Promise<PageEdits> => {
  const rethrow = strict && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
  try {
    const read = supabase().from("page_texts").select("page, key, value").eq("funnel", funnel).eq("lang", lang);
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500));
    const { data, error } = await Promise.race([read, timeout]);
    if (error) throw error;
    const out: PageEdits = {};
    for (const r of (data ?? []) as { page: string; key: string; value: string }[]) (out[r.page] ??= {})[r.key] = r.value;
    return out;
  } catch (err) {
    if (rethrow) throw err;
    return {};
  }
});

/** Saves one page's edits in one language: `set` texts replace the code's, `reset` keys go back to it. */
export async function saveTexts(funnel: string, page: string, lang: string, set: Texts, reset: string[]) {
  const db = supabase().from("page_texts");
  const rows = Object.entries(set).map(([key, value]) => ({ funnel, page, lang, key, value, updated_at: new Date().toISOString() }));
  if (rows.length) {
    const { error } = await db.upsert(rows, { onConflict: "funnel,page,lang,key" });
    if (error) throw error;
  }
  if (reset.length) {
    const { error } = await supabase().from("page_texts").delete().eq("funnel", funnel).eq("page", page).eq("lang", lang).in("key", reset);
    if (error) throw error;
  }
}

/** The cached pages of the MIDI Drum Kit in a language, rebuilt now so an edit is live in seconds. */
export function revalidateDrumKitTexts(lang: string) {
  for (const currency of CURRENCIES) {
    for (const page of ["", "/order", "/offer", "/last-offer"]) revalidatePath(`/midi-drum-kit/${lang}${page}/${currency}`);
    // The TOP HITS MIDI Bundle shows the Drum Kit's Famous Beats page after its own order.
    if (lang === "en") revalidatePath(`/top-hits-midi-bundle/offer/${currency}`);
    // The Famous Beats Bundle shows its TOP HITS page.
    if (lang === "en") revalidatePath(`/famous-beats-bundle/offer/${currency}`);
  }
}
