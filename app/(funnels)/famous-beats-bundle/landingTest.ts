// A/B test of the Famous Beats Bundle landing (2026-11-15, before its Meta ads restart: "test which
// landing converts best"), built like the MIDI Drum Kit's (../midi-drum-kit/landingTest.ts): same
// address, same order page after every landing, only the landing changes.
//
// proxy.ts gives each new visitor of /famous-beats-bundle one of the pages at random, evenly, and
// keeps them on it with a cookie (return visits, the order page): the address is rewritten to that
// page's route. The cookie's value is the letter every page view (lib/beacon.ts), checkout and order
// (Stripe metadata.variant, PayPal custom_id) carries, so Analytics counts each page to the sale
// (lib/analytics.ts TESTS, "Landing").
// ?lp=<name> (the part after "fbb-") shows one page without touching the visitor's cookie; with
// ?preview=1 nothing is counted.
//
// A cookie of its own: the Drum Kit's ab_lp is set on the same domain for every visitor of that page.

export const FBB_LP = {
  cookie: "ab_fbb",
  /**
   * fbb-old: the Astro page cloned 1:1, live 11-03 → 11-10 (./landing.ts, ./astro).
   * fbb-jazz: the Jazz-style page, the only one since 11-10 (./[currency]/page.tsx).
   */
  variants: ["fbb-old", "fbb-jazz"] as const,
  /** Each page's route under /famous-beats-bundle, before the currency. */
  route: { "fbb-old": "/old", "fbb-jazz": "" } as Record<string, string>,
  /** When the test went live (its deploy). */
  from: "2026-11-15T15:07:00Z",
};
export type FbbLp = (typeof FBB_LP.variants)[number];
export const isFbbLp = (v: unknown): v is FbbLp => (FBB_LP.variants as readonly string[]).includes(v as string);
