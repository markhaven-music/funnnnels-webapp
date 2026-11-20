// A/B/C/D test of the MIDI Drum Kit landing's headline (2026-11-19, "ok testiamo AB e poi voglio una piu emotiva e una
// che segue le regole del D2C", "lascia tutto identico cambia solo headline"): only the hero's <h1> changes, the
// line above it, the sub, the video and the rest of the page stay as they are, every visitor in green (the accent
// test's winner). Emotional = what the producer feels; D2C = outcome + speed + no effort + proof in numbers.
//
// The letter rides in the landing test's cookie (ab_lp, ./landingTest.ts LP.draw): proxy.ts gives each English or
// Italian visitor one of the two on their first visit and keeps it, so the page views, the checkout and the order
// (Stripe metadata.variant, PayPal custom_id) carry it, and Analytics counts each headline to the sale
// (lib/analytics.ts TESTS, "Headline"). The page is cached HTML: both headlines are in it, a tiny script sets
// <html data-hl="…"> from the cookie before anything paints and the CSS shows that one. ?hl=stiff|relief|simple|charts shows one
// without touching the cookie (with ?preview=1 nothing is counted).

export const HL = {
  variants: ["hl-stiff", "hl-relief", "hl-simple", "hl-charts"] as const,
  /** When the test went live (its deploy). */
  from: "2026-11-19T22:02:00Z",
};
export type HlVariant = (typeof HL.variants)[number];
export const isHl = (v: unknown): v is HlVariant => (HL.variants as readonly string[]).includes(v as string);
export type HlKey = "stiff" | "relief" | "simple" | "charts";
export const HL_KEYS: readonly HlKey[] = ["stiff", "relief", "simple", "charts"];

/**
 * The four headlines, *highlighted* and _underlined_ parts like the one before ("facciamo ABCD": the two proposed
 * first, frustration and relief, one in the plainest words ("ne voglio anche una per IQ 75 ... sostituisci la c",
 * it took the emotional one's place) and the owner's own line, word for word, in the D2C one's place
 * ("esattamente come l'avevo scritta io. sostituisci D")).
 */
export const HEADLINES: Record<"en" | "it", Record<HlKey, string>> = {
  en: {
    stiff: "Your Beats Sound Stiff. *Theirs Bounce*. _Here's The Difference_.",
    relief: "Stop Fighting The Piano Roll. *Drop In A Groove* _That Already Feels Right_.",
    simple: "Want Drums That Sound Good? *Drag One File In*. _Done_.",
    charts: "Make Beats Like The Charts. *Like The Big Artists*. _Just Drag-And-Drop_. We've Done All The Work!!",
  },
  it: {
    stiff: "I Tuoi Beat Suonano Rigidi. *I Loro Rimbalzano*. _Ecco La Differenza_.",
    relief: "Smetti Di Combattere Con Il Piano Roll. *Trascina Un Groove* _Che Suona Già Giusto_.",
    simple: "Vuoi Una Batteria Che Suona Bene? *Trascina Un File*. _Fatto_.",
    charts: "Fai Beat Come Le Classifiche. *Come I Big Artist*. _Solo Drag-And-Drop_. Abbiamo Fatto Tutto Noi!!",
  },
};

/** One headline shown: the visitor's, or the first one when the script can't run. */
export const HL_CSS =
  `.jz-heroHead[data-hl]{display:none}` +
  `html:not([data-hl]) .jz-heroHead[data-hl="stiff"]{display:block}` +
  HL_KEYS.map((k) => `html[data-hl="${k}"] .jz-heroHead[data-hl="${k}"]{display:block}`).join("");

/** Runs first thing in the page: ?hl= (a look) or the cookie's headline on <html data-hl>. */
export const HL_SCRIPT = `(function(){try{
var q=(location.search.match(/[?&]hl=(${HL_KEYS.join("|")})(?:&|$)/)||[])[1];
var c=(document.cookie.match(/(?:^|; )ab_lp=hl-(${HL_KEYS.join("|")})(?:;|$)/)||[])[1];
var v=q||c;if(v)document.documentElement.setAttribute('data-hl',v);
}catch(e){}})();`;
