// The Jazz order page's 5-minute bonus (2026-11-09, "fai la stessa cosa che abbiamo
// fatto sul checkout di midi drum kit… con il Jazz Records… la collezione di wav"):
// the Jazz Record Samples (the €7/$7 add-on hidden from the order page since 11-08)
// are free if the buyer pays within 5 real minutes of reaching the order page.
// At 00:00 they're gone and the checkout is the normal one: no Record Samples
// add-on comes back ("quando scade non appare come order bump… esce checkout normale").
//
// Same mechanism as the Drum Kit's (../midi-drum-kit/bonusTest.ts, lib/bonusClock.ts):
// the start is a signed httpOnly cookie of its own (fv_bonus_jazz, so a Drum Kit
// visit doesn't use up the Jazz clock), set by /api/checkout/bonus; the card and
// PayPal routes give the add-on only while it runs (+30 s grace). Counted in
// dashboard → Analytics → "5-minute bonus · Jazz MIDI Pack" (bonus_clocks.funnel).
// ?bonus=off shows the page without it (previews).

export const JAZZ_BONUS = {
  funnel: "jazz-midi-pack",
  /** The add-on given free (the funnel_items key in dashboard → Products). */
  item: "record-samples",
  cookie: "fv_bonus_jazz",
  /** Where the browser keeps the end it last heard from the server, for the first paint. */
  endKey: "fv_bonus_jazz_end",
  minutes: 5,
  image: "/funnels/jazz-midi-pack/bump-records.webp",
};

export const JAZZ_BONUS_WORDS = {
  lead: "Order in the next {time} and get the Jazz Record Samples free: 122 WAV loops.",
  sub: "Not a fake timer. Close this page and the offer is gone.",
  over: "Time's up. The free Jazz Record Samples are gone.",
  badge: "BONUS",
  name: "Jazz Record Samples",
  line: "This pack's progressions as 122 WAV loops that sound like an old record:",
  list: ["82 Lofi chord loops in Rhodes", "40 Neo Soul chord loops in piano", "Chop them like a sample, no clearance needed"],
  free: "FREE",
  added: "Already in your order",
  summaryTag: "(+ FREE BONUS)",
  expired: "The 5 minutes are up: the free Jazz Record Samples are no longer in your order. Check the total and pay again.",
};
export type JazzBonusWords = typeof JAZZ_BONUS_WORDS;

/**
 * First thing on the order page: <html data-jazz-bonus="over"> when this browser's
 * 5 minutes ended on an earlier visit (or ?bonus=off): the page is the normal one,
 * nothing about the bonus shows ("se rivado sul checkout… è normale").
 */
export const bonusScript = (endKey: string) => `(function(){try{
var off=/[?&]bonus=off(?:&|$)/.test(location.search),e=Number(localStorage.getItem('${endKey}'));
if(off||(e&&e<=Date.now()))document.documentElement.setAttribute('data-jazz-bonus','over');
}catch(x){}})();`;
export const JAZZ_BONUS_SCRIPT = bonusScript(JAZZ_BONUS.endKey);

/** Right after the banner and the row: the countdown from the end this browser knows, until React takes over (no 05:00 on a refresh). */
export const bonusTimeScript = (endKey: string) => `(function(){try{
var e=Number(localStorage.getItem('${endKey}'));if(!e)return;
var p=function(n){return(n<10?'0':'')+n;};
var f=function(){if(window.__jazzBonusLive)return clearInterval(i);var s=Math.max(0,Math.ceil((e-Date.now())/1000)),t=p(Math.floor(s/60))+':'+p(s%60);
document.querySelectorAll('[data-jazz-bonus-time]').forEach(function(x){x.textContent=t;});};
var i=setInterval(f,250);f();
}catch(x){}})();`;
export const JAZZ_BONUS_TIME_SCRIPT = bonusTimeScript(JAZZ_BONUS.endKey);
