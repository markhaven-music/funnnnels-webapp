// A/B/C/D/E test of the hero headline on the Jazz MIDI Pack landing
// ("3 mi piace, 7, 15, 19, 20. possiamo ABCDE testarle tutte?", 2026-11-05):
// the five the user picked from a list of 20 written on Dan Kennedy's
// principles, each against the others. The editor's headline is out of
// rotation while the test runs.
//
// Same mechanism as the Drum Kit's button-colour test (../midi-drum-kit/abtest.ts):
// each visitor gets one headline at random on their first visit and keeps it
// in a cookie. The page is cached HTML, the same for everyone: every headline
// is in the <h1>, a tiny script at the top of the page sets
// <html data-ab-head="…"> before anything paints, and AB_CSS shows that one.
// The letter travels with the page views (lib/beacon.ts abCookie), the order
// (Stripe metadata.variant, PayPal custom_id "v") and so into the dashboard
// (lib/analytics.ts TESTS, the funnel map's lanes). ?ab=a|b|c|d|e forces one;
// with ?preview=1 too (the map's lanes) it's only shown and not counted.
//
// Every claim is in BRIEF.md. {files} is filled like any hero text (sections.tsx fill).
// To end the test: put the winner in the editor's headline, then take this
// test out of TESTS in lib/analytics.ts and out of the pages.

export const AB = {
  cookie: "ab_head",
  variants: ["a", "b", "c", "d", "e"] as const,
};
export type Variant = (typeof AB.variants)[number];

/** "*w*" = highlighted, "_w_" = underlined (sections.tsx Marked). The number is its place in the list of 20. */
export const HEADLINES: Record<Variant, string> = {
  // 3 · "Who else wants"
  a: "Who Else Wants A *Jazz Vibe* In Their Beats _Without Months Of Piano Lessons_?",
  // 7 · "Finally"
  b: "Finally, The *Jazz Chords* Your Beats Were Missing, _Already Played_ The Way A Pianist Plays Them.",
  // 15 · "The lazy man's way" ("3,536 Chords" in the list: they're files of progressions, not single chords)
  c: "The Lazy Producer’s Way To A *Jazz Vibe*: {files} MIDI Files, Already Voiced, _Already In All 12 Keys_.",
  // 19 · "Stop" + specifics
  d: "Stop Looping The Same Four Chords. {files} *Jazz MIDI Files*, Voiced Like A Pianist, _Drag One Onto Your Rhodes_.",
  // 20 · message-to-market match
  e: "For Lofi, Neo Soul And Trap Soul Producers: The *Jazz Chords* Your Genre Is Built On, Already Voiced, _In All 12 Keys_.",
};

/** How the dashboard names each lane. */
export const LABELS: Record<Variant, string> = {
  a: "A · Who else wants",
  b: "B · Finally",
  c: "C · Lazy producer",
  d: "D · Stop looping",
  e: "E · For lofi producers",
};

/** The lanes' colours in the dashboard (nothing on the page changes colour). */
export const COLORS: Record<Variant, { from: string; to: string }> = {
  a: { from: "#60a5fa", to: "#2563eb" },
  b: { from: "#34d399", to: "#059669" },
  c: { from: "#fbbf24", to: "#d97706" },
  d: { from: "#fb7185", to: "#e11d48" },
  e: { from: "#a78bfa", to: "#7c3aed" },
};

const LIST = AB.variants.join("|");
const ATTR = "data-ab-head";
const PREVIEW_KEY = "ab_preview_head";

/** Runs at the top of the page, before the hero is parsed. */
export const AB_SCRIPT = `(function(){try{
var re=/(?:^|; )${AB.cookie}=(${LIST})(?:;|$)/,q=(location.search.match(/[?&]ab=(${LIST})(?:&|$)/)||[])[1];
var pre=/[?&]preview=1(?:&|$)/.test(location.search),v=null;
try{if(/[?&]preview=0(?:&|$)/.test(location.search))sessionStorage.removeItem('${PREVIEW_KEY}');else if(pre&&q)sessionStorage.setItem('${PREVIEW_KEY}',q);v=sessionStorage.getItem('${PREVIEW_KEY}');}catch(e){if(pre)v=q;}
if(v&&!/^(${LIST})$/.test(v))v=null;
if(!v){v=q||(document.cookie.match(re)||[])[1];
if(!v){var all=${JSON.stringify(AB.variants)};v=all[Math.floor(Math.random()*all.length)];}
document.cookie='${AB.cookie}='+v+'; path=/; max-age=15552000; samesite=lax';}
document.documentElement.setAttribute('${ATTR}',v);window.__abHead=v;
}catch(e){}})();`;

// The <h1> holds every headline in a span with data-v; only the visitor's
// shows. Without the script (no JavaScript) A shows.
export const AB_CLASS = "ab-head";
export const AB_CSS =
  `.${AB_CLASS}{display:none}html:not([${ATTR}]) .${AB_CLASS}[data-v="a"]{display:inline}` +
  AB.variants.map((v) => `html[${ATTR}="${v}"] .${AB_CLASS}[data-v="${v}"]{display:inline}`).join("");
