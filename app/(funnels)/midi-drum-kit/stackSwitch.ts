// The order page's "what you get" box, like the Jazz MIDI Pack's order page
// (2026-11-10, "Sì e poi tracciamola in analytics in maniera chiara"): what's
// inside, the 3 bonuses with their value, total value against today's price.
// Before it, the left column was the product picture and 12 claims that phones
// never showed (top-hits-midi-bundle/order.module.css hides .list under 770px),
// and 1 in 4 who started the checkout paid, against 1 in 2 on Jazz.
//
// It switches itself on at `from` (a UTC midnight, as the visits are counted per
// UTC day), in every browser, with no deploy: the page is cached HTML, so a tiny
// script sets <html data-order-stack="on"> before anything paints and the CSS
// shows the box. Analytics judges it by its days (lib/analytics.ts TESTS,
// "Order summary"): the days just before (the step-2 test's C), the box after.
// ?preview=1&stack=1 shows it before then, for a look; nothing is counted with preview=1.

export const ORDER_STACK = {
  attr: "data-order-stack",
  /** When everyone gets the box: tonight ("Stanotte", 2026-11-10), 01:00 in Italy. */
  from: "2026-11-11T00:00:00Z",
  /** When the box really reached visitors: its deploy (1e27e0b) failed on 11-10 (next/font
   *  cache), so the cached page had no switch until 0ee5fe8 went live, 11-11 at 22:20 in Italy. */
  live: "2026-11-11T21:21:00Z",
  /** The first whole UTC day with the box, where Analytics' After starts (11-11 was half and half: left out). */
  firstDay: "2026-11-12",
  /** When the box went from 3 bonuses to 6 (the deploy of 2026-11-12, ~00:30 in Italy): before After's first whole day. */
  sixBonuses: "2026-11-11T23:12:00Z",
  /** When the page became the Jazz order page's layout (16acc3f): where the "old vs Jazz-style" test starts. */
  jazzStyle: "2026-11-11T23:27:00Z",
};

/**
 * The first three and 988 are what the landing's offer box states (copy/landing: t129-t131, t140).
 * Since 2026-11-12 three more bonuses ("rendiamola come jazz, aggiungi i bonus"), valued like the
 * Jazz pack's ("metti una cosa realistica che fa capire che hanno valore, non i prezzi a cui si
 * vendono che sono gia scontati"): a MIDI pack 37, a small WAV pack 27, the PDF guide 17 as Jazz's.
 */
export const STACK_VALUES = {
  /** Famous Beats, Beat Starters, Hit-Maker Drums, Drunk Swing Grooves, MYSTERY Hooks Pack, the guide: the order of copy/<lang>.ts order.stack.bonuses. */
  // 197, 197, 97 since 2026-11-12: the landing's picture always said them (497 + 197 + 197 + 97 = its 988), its list said
  // 97, 97, 67 and added up to 758. Now the picture (tools/value_stack.py), the list and this box say the same.
  bonuses: [197, 197, 97, 37, 27, 17],
  total: 988 + 37 + 27 + 17,
};

/** Runs first thing on the order page. */
export const ORDER_STACK_SCRIPT = `(function(){try{var s=location.search;
if(Date.now()>=${Date.parse(ORDER_STACK.from)}||(/[?&]preview=1(?:&|$)/.test(s)&&/[?&]stack=1(?:&|$)/.test(s)))document.documentElement.setAttribute('${ORDER_STACK.attr}','on');
}catch(e){}})();`;
