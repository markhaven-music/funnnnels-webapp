// A/B test of the order page's step 2 (payment), started 2026-11-06 ("Should I
// build test B (sticky pay bar + short bumps)?" "Si!!!"). Of the people who
// reached step 2 since 11-02, 2 in 3 left without pressing pay, most within
// 35 seconds and on a phone, where the pay button sat ~1,050px below the card
// fields, after three long add-on offers, under the "reserved for" timer.
//
//   a  the step as it was
//   b  each add-on on one line (tick, name, price; the rest behind "Details"),
//      and a "Pay $27" bar fixed at the bottom of the screen in the timer's
//      place, until the real button is on screen; the bar's total follows the
//      ticked add-ons and pressing it presses the real button
//
// Same mechanism as the button-colour test (./abtest.ts), which keeps showing
// its colours at random but is no longer counted (3 orders each when this
// started): each visitor gets a letter at random on the order page and keeps
// it in a cookie. The letter travels with the page views (lib/beacon.ts
// abCookie), the order (Stripe metadata.variant, PayPal custom_id "v"), the
// upsells, and so into the dashboard (lib/analytics.ts TESTS, the funnel
// map's lanes). ?ab=a|b forces one; with ?preview=1 too it's only shown and
// not counted. To end the test: keep the winner in OrderForm.tsx, take this
// test out of TESTS and the pages.

export const PAY = {
  cookie: "ab_pay",
  variants: ["a", "b"] as const,
};
export type PayVariant = (typeof PAY.variants)[number];

export const PAY_LABELS: Record<PayVariant, string> = {
  a: "A · As it was",
  b: "B · Pay bar + short add-ons",
};
export const PAY_COLORS: Record<PayVariant, { from: string; to: string }> = {
  a: { from: "#94a3b8", to: "#64748b" },
  b: { from: "#34d399", to: "#059669" },
};

const LIST = PAY.variants.join("|");
const ATTR = "data-ab-pay";
const PREVIEW_KEY = "ab_preview_pay";

/** Runs first thing on the order page. */
export const PAY_SCRIPT = `(function(){try{
var re=/(?:^|; )${PAY.cookie}=(${LIST})(?:;|$)/,q=(location.search.match(/[?&]ab=(${LIST})(?:&|$)/)||[])[1];
var pre=/[?&]preview=1(?:&|$)/.test(location.search),v=null;
try{if(/[?&]preview=0(?:&|$)/.test(location.search))sessionStorage.removeItem('${PREVIEW_KEY}');else if(pre&&q)sessionStorage.setItem('${PREVIEW_KEY}',q);v=sessionStorage.getItem('${PREVIEW_KEY}');}catch(e){if(pre)v=q;}
if(v&&!/^(${LIST})$/.test(v))v=null;
if(!v){v=q||(document.cookie.match(re)||[])[1];
if(!v){var all=${JSON.stringify(PAY.variants)};v=all[Math.floor(Math.random()*all.length)];}
document.cookie='${PAY.cookie}='+v+'; path=/; max-age=15552000; samesite=lax';}
document.documentElement.setAttribute('${ATTR}',v);window.__abPay=v;
}catch(e){}})();`;

/** The visitor's letter, in the browser (null before the script ran). */
export function readPay(): PayVariant | null {
  if (typeof document === "undefined") return null;
  const shown = (window as unknown as { __abPay?: string }).__abPay;
  if (shown && (PAY.variants as readonly string[]).includes(shown)) return shown as PayVariant;
  const m = document.cookie.match(new RegExp(`(?:^|; )${PAY.cookie}=(${LIST})(?:;|$)`));
  return (m?.[1] as PayVariant) ?? null;
}
