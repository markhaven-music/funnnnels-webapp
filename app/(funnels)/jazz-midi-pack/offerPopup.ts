// The popup offer (2026-11-15, "popup che compare quando premono get the pack che
// aggiunge qualcosa di molto piccolo", then "togliamo il checking availability e
// tracciamo se AOV sale"): a tap on any of the landing's buttons opens a popup
// that offers one small add-on, the Jazz Record Samples at €4 / $4, with Yes and
// No as big as each other. Both go on to the order page; Yes puts the add-on in
// the order (a line in the summary with a Remove link), No leaves the checkout
// as it was. It takes the place of "Checking availability…" (lib/availability.ts),
// which left every landing at the same minute.
//
// 2026-11-17 ("3.99 sounds good", then "ok lets try like this so remove it from order bumps on order page"):
// the Record Samples became the pack's 7th bonus on 11-15, so the popup offers Drunk Swing Grooves at
// its own price (€7 / $7, never below its own €7 funnel), and its tick box leaves the order page.
//
// 2026-11-19 ("metti prezzo drunk swing a 3.99"): the popup's Drunk Swing Grooves at €3.99 / $3.99
// (funnel_items jazz-midi-pack/swing-grooves). Its own funnel and the other order pages keep €7.
//
// The add-on is the funnel_items row `swing-grooves` (dashboard → Products, its
// price there), so the card and PayPal routes price and check it like any add-on
// (lib/funnels.ts pickedBumps). It never shows as a tick box on the order page.
//
// The choice goes from the landing to the order page in localStorage, not in the
// address: the order page is prerendered behind the popup from the tap on, at the
// same address, and opens at once. A choice older than CHOICE_MS is ignored.
//
// Measured in dashboard → Analytics → "Popup offer · Jazz MIDI Pack" (lib/analytics.ts
// popupOfferStats): average order before and after SINCE.

export const POPUP_OFFER = {
  funnel: "jazz-midi-pack",
  /** The add-on (the funnel_items key in dashboard → Products). */
  item: "swing-grooves",
  /** When the popup went live on the Jazz landing (and the availability popup left every landing). */
  since: "2026-11-17T20:30:00+01:00",
  /** The "before" side of the Analytics card starts here: Jazz back to 27 with seven bonuses (2026-11-16 evening). */
  before: "2026-11-16T21:00:00+01:00",
  key: "fv_popup_jazz",
  image: "/funnels/jazz-midi-pack/bump-grooves.webp",
};

/** A choice made longer ago than this doesn't reach the order page. */
export const CHOICE_MS = 30 * 60_000;

export const POPUP_WORDS = {
  title: "Want your beats to swing like Dilla's for {price}?",
  text: "The lazy, laid-back drums that make lofi and neo soul feel human, as MIDI you drag in:",
  list: ["80 drunk swing drum grooves, snare on 2 and 4", "31 groove templates to loosen any MIDI", "Drum rack and multitrack, any DAW"],
  yes: "Yes, add them · {price}",
  no: "No thanks, just the pack",
  remove: "Remove",
};
