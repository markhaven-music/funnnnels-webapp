// The keys of a page's editable texts (dashboard → funnel map → Edit), for the
// server and the editor alike:
//   tNNN          a text of a ClickFunnels clone's markup (tools/cf_clone.mjs), HTML
//   h<8 hex>[-n]  a text of any other cloned page's HTML (lib/htmlTexts.ts), HTML
//   a.b.0         a path in a page's words (lib/words.ts, a funnel's copy), plain
//                 with its marks (**bold**, {c} = € or $)

/** A text edited as it looks on the page, saved as HTML. */
export const isMarkupKey = (key: string) => /^(t\d{3}|h[0-9a-f]{8}(-\d+)?)$/.test(key);
