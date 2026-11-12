// A/B test of the MIDI Drum Kit landing (2026-11-12, "voglio fare un AB pulito tra vecchio
// funnel e nuovo senza cambiare URL"): the old page against a new one with the new box
// pictures (Higgsfield, GPT Image 2.6), headlines the size of the Jazz MIDI Pack's and a
// player that plays the kit's real MIDI files. Same address, same order page after both
// ("Cambia solo la landing"); English and Italian only (the funnels that get traffic).
//
// proxy.ts splits the visitors 50/50 on their first visit and keeps each on their page with
// a cookie (return visits, the order page): /midi-drum-kit is rewritten to the old page's
// route or to the new one's ([lang]/new/[currency]). The cookie's value is the letter every
// page view (lib/beacon.ts), checkout and order (Stripe metadata.variant, PayPal custom_id)
// carries, so Analytics counts both pages to the sale (lib/analytics.ts TESTS, "Landing").
// The values are not a/b: those letters were step 2's, 11-06 → 11-09, and would mix in.
// ?lp=old|new shows one page without touching the visitor's cookie (with ?preview=1 nothing is counted).

export const LP = {
  cookie: "ab_lp",
  variants: ["lp-old", "lp-new"] as const,
  /** When the test went live (its deploy): the button-colour test ended there, orange kept. */
  from: "2026-11-12T14:50:00Z",
  /** The languages the test runs in; the others always get the old page. */
  langs: ["en", "it"] as readonly string[],
  /**
   * Everyone on this page, no split, since 2026-11-12 19:38 UTC (20:38 Italy) ("lets not do A/B at the same time, we have data
   * for previous pages"): the new page is judged against the old one's days before the test (lib/analytics.ts).
   * The cookie is set to it too, so checkouts and orders carry it. null = split 50/50 again.
   */
  live: "lp-new" as "lp-old" | "lp-new" | null,
  /** When `live` took over (its deploy). */
  liveFrom: "2026-11-12T19:38:00Z",
};
export type LpVariant = (typeof LP.variants)[number];
export const isLp = (v: unknown): v is LpVariant => (LP.variants as readonly string[]).includes(v as string);
