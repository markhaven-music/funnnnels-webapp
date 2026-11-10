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
};

/** The values the landing's offer box already states (copy/landing: t129-t131, t140), so both pages say the same. */
export const STACK_VALUES = {
  /** Famous Beats, Beat Starters, Hit-Maker Drums: the order of copy/<lang>.ts order.stack.bonuses. */
  bonuses: [97, 97, 67],
  total: 988,
};

/** Runs first thing on the order page. */
export const ORDER_STACK_SCRIPT = `(function(){try{var s=location.search;
if(Date.now()>=${Date.parse(ORDER_STACK.from)}||(/[?&]preview=1(?:&|$)/.test(s)&&/[?&]stack=1(?:&|$)/.test(s)))document.documentElement.setAttribute('${ORDER_STACK.attr}','on');
}catch(e){}})();`;
