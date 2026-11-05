import { cache } from "react";
import { supabase } from "@/lib/supabase";

// How a code funnel's page is laid out as edited in the dashboard (funnel map →
// Edit, app/funnels/[id]/texts; table page_layout, db/page-layout.sql), one
// row per page and language, beside its words (lib/pageTexts.ts):
//   order   the sections (lib/cfSections.ts ids) in the order they show; the
//           ones left out follow, in the code's order
//   hidden  sections the page doesn't show
//   button  the colour every visitor's buttons get (abtest.ts variants), which
//           ends the colour test on that page; unset, the test goes on
//   images  pictures replaced: the code's src → the uploaded picture (storage
//           bucket `pages`, public) and its size
//
// Read like the texts: a live page never waits long on the database; `strict`
// for cached pages, where a failed read throws so the cache keeps the last
// good page instead of going back to the code's layout.

export type LayoutImage = { src: string; w: number; h: number };
export type Layout = { order?: string[]; hidden?: string[]; button?: string; images?: Record<string, LayoutImage> };
/** page → its layout, for one funnel and language. */
export type PageLayouts = Record<string, Layout>;

// One read per page render.
export const pageLayouts = cache(async (funnel: string, lang: string, strict = false): Promise<PageLayouts> => {
  const rethrow = strict && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
  try {
    const read = supabase().from("page_layout").select("page, layout").eq("funnel", funnel).eq("lang", lang);
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500));
    const { data, error } = await Promise.race([read, timeout]);
    if (error) throw error;
    const out: PageLayouts = {};
    for (const r of (data ?? []) as { page: string; layout: Layout | null }[]) if (r.layout && typeof r.layout === "object") out[r.page] = r.layout;
    return out;
  } catch (err) {
    if (rethrow) throw err;
    return {};
  }
});

export const isEmptyLayout = (l: Layout) => !l.order?.length && !l.hidden?.length && !l.button && !Object.keys(l.images ?? {}).length;

/** Saves one page's layout in one language; an empty layout deletes the row (back to the code's). */
export async function saveLayout(funnel: string, page: string, lang: string, layout: Layout) {
  const db = supabase().from("page_layout");
  if (isEmptyLayout(layout)) {
    const { error } = await db.delete().eq("funnel", funnel).eq("page", page).eq("lang", lang);
    if (error) throw error;
    return;
  }
  const { error } = await db.upsert({ funnel, page, lang, layout, updated_at: new Date().toISOString() }, { onConflict: "funnel,page,lang" });
  if (error) throw error;
}

/** The storage bucket the editor's pictures go to (public, served by the storage CDN). */
export const PAGES_BUCKET = "pages";

/** Where that bucket's files are served from: the only place a replaced picture may come from. */
export function pagesPublicPrefix(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/${PAGES_BUCKET}/`;
}
