// Which pages of which funnel have words the dashboard edits (funnel map → Edit,
// app/funnels/[id]/texts), for the map's Edit buttons. Light on purpose: the
// pages themselves (their words, their frames) are in lib/editablePages.ts,
// which the map doesn't need to load.
//   MIDI Drum Kit: every page in every language (the sales page and the
//     upsells also their sections, pictures and button colour)
//   TOP HITS, Famous Beats: sales page, order page, thank-you page (their
//     upsells are the Drum Kit's pages, edited there)
//   Jazz: the thank-you page (the sales and order pages have the section editor)
//   free: the free packs' sign-up pages, by page name (app/free/packs.ts)

export const EDITABLE: Record<string, readonly string[]> = {
  "midi-drum-kit": ["landing", "order", "famous-beats", "top-hits", "thank-you"],
  "top-hits-midi-bundle": ["landing", "order", "thank-you"],
  "famous-beats-bundle": ["landing", "order", "thank-you"],
  "jazz-midi-pack": ["thank-you"],
  free: ["rolls", "bounce", "hooks", "mystery-hooks", "free-store", "free-store-access", "bounce-midi-pack", "mystery-dopaspace-hooks"],
};

/** The Drum Kit's upsell pages, which other funnels show after their own order (TOP HITS, Famous Beats). */
export const DRUM_KIT_UPSELLS = new Set(["famous-beats", "top-hits"]);

/** The editor's address for a page, or null when it has none. */
export function editUrl(funnel: string, page: string, lang = "en"): string | null {
  if (EDITABLE[funnel]?.includes(page)) return `/funnels/${funnel}/texts?page=${page}&lang=${lang}`;
  // Another funnel's upsell that is a Drum Kit page: edited there (in English, as those funnels show it).
  if (DRUM_KIT_UPSELLS.has(page)) return `/funnels/midi-drum-kit/texts?page=${page}&lang=en`;
  return null;
}
