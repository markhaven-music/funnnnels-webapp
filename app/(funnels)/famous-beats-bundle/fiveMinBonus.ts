import type { JazzBonusWords } from "../jazz-midi-pack/fiveMinBonus";

// The Famous Beats order page's 5-minute bonus (2026-11-09, "Ne crei uno più simile a
// quello jazz per famous beats bundle? Offerta + simile"): the MIDI Drum Kit Expansions
// (172 MIDI files, the Drum Kit's own 5-minute bonus) are free if the buyer pays within
// 5 real minutes of reaching the order page. At 00:00 they're gone and the checkout is
// the normal one, no add-on in their place, as on the Jazz page.
//
// Same mechanism as Jazz's (../jazz-midi-pack/fiveMinBonus.ts, lib/bonusClock.ts): a
// signed httpOnly cookie of its own (fv_bonus_fbb), set by /api/checkout/bonus; the card
// and PayPal routes give the add-on only while it runs. The add-on must be in dashboard →
// Products as one of this funnel's add-ons (key "expansions"); the order page hides it
// from the tick boxes. ?bonus=off shows the page without it.

export const FBB_BONUS = {
  funnel: "famous-beats-bundle",
  /** The add-on given free (the funnel_items key in dashboard → Products). */
  item: "expansions",
  cookie: "fv_bonus_fbb",
  /** Where the browser keeps the end it last heard from the server, for the first paint. */
  endKey: "fv_bonus_fbb_end",
  minutes: 5,
  image: "/funnels/midi-drum-kit/bump-expansions.webp",
};

// The Expansions' contents as the Drum Kit's bonus words have them (../midi-drum-kit/bonusTest.ts, counted 2026-11-08).
export const FBB_BONUS_WORDS: JazzBonusWords = {
  lead: "Order in the next {time} and get the MIDI Drum Kit Expansions free: 172 MIDI files.",
  sub: "Not a fake timer. Close this page and the offer is gone.",
  over: "Time's up. The free MIDI Drum Kit Expansions are gone.",
  badge: "BONUS",
  name: "MIDI Drum Kit Expansions",
  line: "172 more MIDI drum files in 3 styles:",
  list: ["Afrobeat: 61 patterns, 7 fragments, 5 complete multi-track beats", "Lo-Fi: 87 MIDI files", "House: 12 complete beats"],
  free: "FREE",
  added: "Already in your order",
  summaryTag: "(+ FREE BONUS)",
  expired: "The 5 minutes are up: the free MIDI Drum Kit Expansions are no longer in your order. Check the total and pay again.",
};
