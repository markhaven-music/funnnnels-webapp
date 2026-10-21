import { revalidatePath } from "next/cache";
import { LANGS as DRUM_KIT_LANGS } from "@/app/(funnels)/midi-drum-kit/i18n";
import { supabase } from "@/lib/supabase";
import { CURRENCIES } from "@/lib/geo";

// Published content of a code funnel, edited in the dashboard editor.
// The live page must never wait on (or break because of) the database: a
// slow or failing read falls back to the funnel's coded defaults.
// `strict` is for cached pages: there a failed read throws instead, so the
// cache keeps serving the last good page and retries on the next visit —
// except during `next build` (no last good page yet) and `next dev`.
export async function getPublishedBlocks<T>(
  funnelId: string,
  fallback: T[],
  isValid: (b: unknown) => b is T,
  { strict = false }: { strict?: boolean } = {},
): Promise<T[]> {
  const rethrow =
    strict && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
  try {
    const read = supabase().from("funnels").select("published_pages").eq("id", funnelId).maybeSingle();
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500));
    const { data, error } = await Promise.race([read, timeout]);
    if (error) throw error;
    if (!data?.published_pages) return fallback;
    const blocks = (data.published_pages as { blocks?: unknown[] }[])[0]?.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) return fallback;
    const good = blocks.filter(isValid);
    return good.length ? good : fallback;
  } catch (err) {
    if (rethrow) throw err;
    return fallback;
  }
}

// Code funnels cache one page per currency (app/(funnels)/<slug>/[currency]).
// Called after a publish so the new copy is live within seconds everywhere.
export function revalidateFunnelPages(funnelId: string) {
  for (const currency of CURRENCIES) {
    revalidatePath(`/${funnelId}/${currency}`);
    revalidatePath(`/${funnelId}/order/${currency}`); // funnels with their own order page
  }
}

// Every page of a code funnel that shows a price (dashboard → Products saved
// one): its landing, order page and upsells, per currency (and language).
export function revalidateSalesPages(funnelId: string) {
  revalidateFunnelPages(funnelId);
  for (const currency of CURRENCIES) {
    revalidatePath(`/${funnelId}/offer/${currency}`); // TOP HITS' upsell
    if (funnelId !== "midi-drum-kit") continue;
    for (const lang of DRUM_KIT_LANGS) {
      for (const page of ["", "/order", "/offer", "/last-offer"]) revalidatePath(`/${funnelId}/${lang}${page}/${currency}`);
    }
  }
}
