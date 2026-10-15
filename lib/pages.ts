import { supabase } from "@/lib/supabase";

// Published content of a code funnel, edited in the dashboard editor.
// The live page must never wait on (or break because of) the database: a
// slow or failing read falls back to the funnel's coded defaults.
export async function getPublishedBlocks<T>(funnelId: string, fallback: T[], isValid: (b: unknown) => b is T): Promise<T[]> {
  try {
    const read = supabase().from("funnels").select("published_pages").eq("id", funnelId).maybeSingle();
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500));
    const { data, error } = await Promise.race([read, timeout]);
    if (error || !data?.published_pages) return fallback;
    const blocks = (data.published_pages as { blocks?: unknown[] }[])[0]?.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) return fallback;
    const good = blocks.filter(isValid);
    return good.length ? good : fallback;
  } catch {
    return fallback;
  }
}
