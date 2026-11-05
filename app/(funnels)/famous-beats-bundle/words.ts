import { ORDER as TOP_HITS_ORDER } from "../top-hits-midi-bundle/words";
import { bumpCopy, orderBullets, reviews } from "./copy";

// The words of the Famous Beats Bundle's order page (TOP HITS' template, so
// TOP HITS' words with this bundle's list, reviews and add-ons), so the
// dashboard can edit them (funnel map → Edit; lib/words.ts). Its thank-you page
// uses TOP HITS' THANKS, its own edits saved under this funnel.
export const ORDER = {
  ...TOP_HITS_ORDER,
  bullets: orderBullets,
  reviews: reviews.map((r) => ({ quote: r.quote, name: r.name, role: r.role })),
  bumps: bumpCopy,
};
