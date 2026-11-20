// A/B test of the Jazz MIDI Pack landing's hero headline (2026-11-20, "prova anche AB test Jazz, dici un altra cosa
// invece di rhodes"): A is the headline as the editor has it ("…Drag One Onto Your Rhodes", the old test's D), B the
// same sentence ending on the beat instead of an instrument many beatmakers don't own or name. Nothing else changes.
//
// Same mechanism as the old A–E test (./abtest.ts) and the Drum Kit's: each visitor gets one at random on their
// first visit and keeps it in a cookie (ab_jzh). The page is cached HTML: both headlines are in the <h1>, a tiny
// script sets <html data-jzh="…"> before anything paints and the CSS shows that one. The letter rides with the page
// views (Beacon abCookie), the checkout and the order (Stripe metadata.variant, PayPal custom_id), so Analytics
// counts each headline to the sale (lib/analytics.ts TESTS, "Headline: Rhodes vs beat"). The Buy buttons carry it as
// ?jzh= (KEEP_SCRIPT on the order page puts it back in the cookie) for buyers who switch browser to pay.
// ?jzh=rhodes|beat shows one; with ?preview=1 too nothing is counted and the cookie is left alone.

export const JZH = {
  cookie: "ab_jzh",
  variants: ["jzh-rhodes", "jzh-beat"] as const,
  /** When the test went live (its deploy). */
  from: "2026-11-20T21:00:00Z",
};
export type JzhVariant = (typeof JZH.variants)[number];
type Key = "rhodes" | "beat";
const KEYS: readonly Key[] = ["rhodes", "beat"];

/** B: the editor's headline with its last words swapped. "*w*" highlighted, "_w_" underlined. */
export const BEAT_HEADLINE =
  "Stop Looping The Same Four Chords. {files} *Jazz MIDI Files*, Voiced Like A Pianist, _Drag One Into Your Beat_.";

export const JZH_CLASS = "jzh";
const ATTR = "data-jzh";
const LIST = KEYS.join("|");

/** One headline shown: the visitor's, or A when the script can't run. */
export const JZH_CSS =
  `.${JZH_CLASS}{display:none}html:not([${ATTR}]) .${JZH_CLASS}[data-v="rhodes"]{display:inline}` +
  KEYS.map((k) => `html[${ATTR}="${k}"] .${JZH_CLASS}[data-v="${k}"]{display:inline}`).join("");

/** Runs at the top of the landing: a look (?jzh=, kept for the tab on a preview), else the cookie's, else a draw. */
export const JZH_SCRIPT = `(function(){try{
var s=location.search,q=(s.match(/[?&]jzh=(${LIST})(?:&|$)/)||[])[1],pre=/[?&]preview=1(?:&|$)/.test(s);
var re=/(?:^|; )${JZH.cookie}=jzh-(${LIST})(?:;|$)/,v=null;
if(q&&pre){v=q;}else{v=q||(document.cookie.match(re)||[])[1];
if(!v){var all=${JSON.stringify(KEYS)};v=all[Math.floor(Math.random()*all.length)];}
document.cookie='${JZH.cookie}=jzh-'+v+'; path=/; max-age=15552000; samesite=lax';}
document.documentElement.setAttribute('${ATTR}',v);window.__jzh=v;
}catch(e){}})();`;

/** The Buy buttons: ?jzh=<the visitor's> on the order page's link (not on a preview). */
export const JZH_CARRY_SCRIPT = `(function(){try{
document.addEventListener('click',function(e){try{
var a=e.target&&e.target.closest&&e.target.closest('a[data-cta]');if(!a)return;
var u=new URL(a.getAttribute('href'),location.href);if(u.origin!==location.origin)return;
if(/[?&]preview=1(?:&|$)/.test(location.search))return;
var v=window.__jzh;if(v&&/^(${LIST})$/.test(v))u.searchParams.set('jzh',v);
a.setAttribute('href',u.pathname+u.search+u.hash);
}catch(e){}},true);
}catch(e){}})();`;

/** The order page: ?jzh= from the landing's button becomes the visitor's cookie. Never draws one itself. */
export const JZH_KEEP_SCRIPT = `(function(){try{
var s=location.search,q=(s.match(/[?&]jzh=(${LIST})(?:&|$)/)||[])[1];if(!q||/[?&]preview=1(?:&|$)/.test(s))return;
try{if(sessionStorage.getItem('fv:preview')==='1')return;}catch(e){}
document.cookie='${JZH.cookie}=jzh-'+q+'; path=/; max-age=15552000; samesite=lax';
}catch(e){}})();`;
