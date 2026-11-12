import { pagesPublicPrefix } from "@/lib/pageLayout";

// The funnel cards' and maps' screenshots of each page (preview, order,
// thanks…). They're taken again after every production deploy by
// .github/workflows/funnel-shots.yml (tools/funnel-previews.sh) and put in the
// storage bucket through /api/shots, so a card shows the page as it is now
// without a deploy of its own. Kept 5 minutes by browsers (cacheControl 300).

const NAME = /^[a-z0-9-]{1,60}$/;

/** The storage path of a screenshot: shots/<slug>/<name>.webp. */
export function shotPath(slug: string, name: string): string | null {
  return NAME.test(slug) && NAME.test(name) ? `shots/${slug}/${name}.webp` : null;
}

/** Where the card or the map loads a screenshot from. */
export function shotSrc(slug: string, name: string): string {
  return `${pagesPublicPrefix()}shots/${slug}/${name}.webp`;
}
