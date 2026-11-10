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
//
// ENDED 2026-11-10 ("D vince chiudi ma tieni i test in archivio per eventuali
// confronti"): D is the editor's headline (content.ts and the funnels table),
// the pages no longer pick, show or count a letter (AB_SCRIPT, AB_CSS and
// AB_KEEP_SCRIPT are unused; AB_CARRY_SCRIPT still carries the ad tags). The
// five headlines, their labels and the test's numbers stay: lib/analytics.ts
// TESTS keeps it with `ended`, so dashboard → Analytics still shows the card.
// At the end: A 1 order / 43 landing visits, B 1 / 43, C 3 / 75, D 3 / 45,
// E 2 / 54: 10 orders, far from a reliable answer; D was the user's call.

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

// The Buy buttons carry the headline and the ad's tags to the order page
// (2026-11-05). A Meta ad opens the landing in Instagram's or Facebook's own
// browser, and buyers often finish in Safari or Chrome (to pay with a PayPal
// they're signed in to there): a browser with no ab_head cookie and no UTMs,
// so the order came in with no headline and no source. The first Jazz sale did
// just that (two B landings from JAZZ_Ringtone, then the order from a fresh
// browser). Now every [data-cta] link gets ?ab=<the visitor's headline> plus
// the landing's utm_* / fbclid / gclid as it's clicked, and the order page
// puts ?ab= back in the cookie (AB_KEEP_SCRIPT) before anything reads it.
// Not on a preview (the tab's own headline isn't a visitor's).
// campaign_id/adset_id/ad_id too (2026-11-08): without them the order page's
// click had names only, and neo filed 3 of the first 4 Jazz sales under a
// second, id-less copy of the campaign instead of the ad that sold.
const CARRY = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "fbclid", "gclid"];
export const AB_CARRY_SCRIPT = `(function(){try{
document.addEventListener('click',function(e){try{
var a=e.target&&e.target.closest&&e.target.closest('a[data-cta]');if(!a)return;
var u=new URL(a.getAttribute('href'),location.href);if(u.origin!==location.origin)return;
var q=new URLSearchParams(location.search),k=${JSON.stringify(CARRY)};
for(var i=0;i<k.length;i++){var x=q.get(k[i]);if(x&&!u.searchParams.has(k[i]))u.searchParams.set(k[i],x);}
var pre=false;try{pre=sessionStorage.getItem('fv:preview')==='1'||!!sessionStorage.getItem('${PREVIEW_KEY}');}catch(e){pre=/[?&]preview=1(?:&|$)/.test(location.search);}
var v=window.__abHead;if(!pre&&v&&/^(${LIST})$/.test(v))u.searchParams.set('ab',v);
a.setAttribute('href',u.pathname+u.search+u.hash);
}catch(e){}},true);
}catch(e){}})();`;

/** The order page: ?ab= from the landing's button becomes the visitor's cookie. Never picks one itself. */
export const AB_KEEP_SCRIPT = `(function(){try{
var q=(location.search.match(/[?&]ab=(${LIST})(?:&|$)/)||[])[1];if(!q)return;
try{if(sessionStorage.getItem('fv:preview')==='1'||sessionStorage.getItem('${PREVIEW_KEY}'))return;}catch(e){}
if(/[?&]preview=1(?:&|$)/.test(location.search))return;
document.cookie='${AB.cookie}='+q+'; path=/; max-age=15552000; samesite=lax';
}catch(e){}})();`;
