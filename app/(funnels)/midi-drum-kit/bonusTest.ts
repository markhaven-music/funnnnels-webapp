import type { Lang } from "./i18n";

// A/B test on the Drum Kit order page (11-08, "order within 5 minutes and get
// this exclusive bonus… not a trick… ed è vero"): half the visitors get the
// Expansions (the €7 add-on) free if they pay within 5 minutes of reaching the
// order page. The bonus is already in their order (a row in the summary with
// the timer), with a banner under the header counting down; at 00:00 it really
// goes: the row and the banner's offer disappear, the €7 add-on is back, and
// the server no longer gives it (lib/bonusClock.ts: the start is a signed,
// httpOnly cookie, so a refresh or a cleared localStorage doesn't restart it).
//
//   bonus-off  the page as it was (the "reserved for" box, no bonus)
//   bonus-on   the 5-minute bonus, in the "reserved for" box's place
//
// Same mechanism as ./payTest.ts: a letter at random on the order page, kept in
// a cookie, sent with the page views (Beacon abCookie) and the order (Stripe
// metadata.variant, PayPal custom_id "v"), counted in lib/analytics.ts TESTS.
// ?bonus=on|off forces one (and keeps it). To end the test: keep the winner,
// take this test out of TESTS and the page.

export const BONUS = {
  cookie: "ab_bonus",
  variants: ["bonus-off", "bonus-on"] as const,
  /** The add-on given free (funnel.ts bumps). */
  item: "expansions",
  minutes: 5,
  /** Accepted after 00:00 for a click that was on time (the request's trip, a slow phone). */
  graceMs: 30_000,
};
export type BonusVariant = (typeof BONUS.variants)[number];
export const BONUS_MS = BONUS.minutes * 60_000;

export const BONUS_LABELS: Record<BonusVariant, string> = {
  "bonus-off": "A · No bonus (reserved-for box)",
  "bonus-on": "B · Expansions free for 5 minutes",
};
export const BONUS_COLORS: Record<BonusVariant, { from: string; to: string }> = {
  "bonus-off": { from: "#94a3b8", to: "#64748b" },
  "bonus-on": { from: "#ffe14d", to: "#f5b800" },
};

const LIST = BONUS.variants.join("|");

/** Runs first thing on the order page: <html data-ab-bonus="on|off"> before anything paints. */
export const BONUS_SCRIPT = `(function(){try{
var re=/(?:^|; )${BONUS.cookie}=(${LIST})(?:;|$)/,q=(location.search.match(/[?&]bonus=(on|off)(?:&|$)/)||[])[1];
var v=q?'bonus-'+q:(document.cookie.match(re)||[])[1];
if(!v)v=Math.random()<0.5?'bonus-off':'bonus-on';
document.cookie='${BONUS.cookie}='+v+'; path=/; max-age=15552000; samesite=lax';
document.documentElement.setAttribute('data-ab-bonus',v==='bonus-on'?'on':'off');
}catch(e){}})();`;

/** The visitor's letter, in the browser (null before the script ran). */
export function readBonus(): BonusVariant | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${BONUS.cookie}=(${LIST})(?:;|$)`));
  return (m?.[1] as BonusVariant) ?? null;
}

// The words, per language, following the English line by line.
// {time} is the countdown.
export type BonusWords = {
  lead: string;
  sub: string;
  over: string;
  badge: string;
  name: string;
  line: string;
  free: string;
  added: string;
  /** Beside "Summary" in step 2 while the bonus is in the order. */
  summaryTag: string;
  expired: string;
};

export const BONUS_WORDS: Record<Lang, BonusWords> = {
  en: {
    lead: "Order in the next {time} and get the Expansions free.",
    sub: "Not a fake timer. Close this page and the offer is gone.",
    over: "Time's up. The free Expansions are gone.",
    badge: "BONUS",
    name: "MIDI Drum Kit Expansions",
    line: "3 expansions: complete beats for House, Lo-Fi and Afrobeat.",
    free: "FREE",
    added: "Already in your order",
    summaryTag: "(+ FREE BONUS)",
    expired: "The 5 minutes are up: the free Expansions are no longer in your order. Check the total and pay again.",
  },
  fr: {
    lead: "Commande dans les {time} et les Expansions sont offertes.",
    sub: "Ce n'est pas un faux minuteur. Ferme cette page et l'offre disparaît.",
    over: "Temps écoulé. Les Expansions offertes ne sont plus disponibles.",
    badge: "BONUS",
    name: "MIDI Drum Kit Expansions",
    line: "3 expansions : des beats complets House, Lo-Fi et Afrobeat.",
    free: "OFFERT",
    added: "Déjà dans ta commande",
    summaryTag: "(+ BONUS OFFERT)",
    expired: "Les 5 minutes sont passées : les Expansions offertes ne sont plus dans ta commande. Vérifie le total et paie à nouveau.",
  },
  es: {
    lead: "Pide en los próximos {time} y llévate las Expansions gratis.",
    sub: "No es un temporizador falso. Cierra esta página y la oferta desaparece.",
    over: "Se acabó el tiempo. Las Expansions gratis ya no están.",
    badge: "BONUS",
    name: "MIDI Drum Kit Expansions",
    line: "3 expansiones: beats completos de House, Lo-Fi y Afrobeat.",
    free: "GRATIS",
    added: "Ya en tu pedido",
    summaryTag: "(+ BONUS GRATIS)",
    expired: "Pasaron los 5 minutos: las Expansions gratis ya no están en tu pedido. Revisa el total y paga de nuevo.",
  },
  de: {
    lead: "Bestelle in den nächsten {time} und die Expansions sind gratis dabei.",
    sub: "Kein Fake-Timer. Schließt du diese Seite, ist das Angebot weg.",
    over: "Die Zeit ist um. Die gratis Expansions sind weg.",
    badge: "BONUS",
    name: "MIDI Drum Kit Expansions",
    line: "3 Expansions: komplette Beats für House, Lo-Fi und Afrobeat.",
    free: "GRATIS",
    added: "Schon in deiner Bestellung",
    summaryTag: "(+ GRATIS-BONUS)",
    expired: "Die 5 Minuten sind um: Die gratis Expansions sind nicht mehr in deiner Bestellung. Prüfe den Gesamtbetrag und bezahle erneut.",
  },
  it: {
    lead: "Ordina nei prossimi {time} e le Expansions sono gratis.",
    sub: "Non è un timer finto. Chiudi questa pagina e l'offerta sparisce.",
    over: "Tempo scaduto. Le Expansions gratis non ci sono più.",
    badge: "BONUS",
    name: "MIDI Drum Kit Expansions",
    line: "3 espansioni: beat completi House, Lo-Fi e Afrobeat.",
    free: "GRATIS",
    added: "Già nel tuo ordine",
    summaryTag: "(+ BONUS GRATIS)",
    expired: "I 5 minuti sono passati: le Expansions gratis non sono più nel tuo ordine. Controlla il totale e paga di nuovo.",
  },
};

/** Where the browser keeps the end it last heard from the server (this device's clock), for the first paint. */
export const BONUS_END_KEY = "fv_bonus_end";

/**
 * Right after the banner and the card in the HTML: writes the countdown from the
 * end this browser already knows, and keeps it ticking until React takes over,
 * so a refresh shows 04:12 at once instead of 05:00 until the page's scripts run.
 * The server's clock is still the one that counts (lib/bonusClock.ts).
 */
export const BONUS_TIME_SCRIPT = `(function(){try{
var e=Number(localStorage.getItem('${BONUS_END_KEY}'));if(!e)return;
var p=function(n){return(n<10?'0':'')+n;};
var f=function(){if(window.__bonusLive)return clearInterval(i);var s=Math.max(0,Math.ceil((e-Date.now())/1000)),t=p(Math.floor(s/60))+':'+p(s%60);
document.querySelectorAll('[data-bonus-time]').forEach(function(x){x.textContent=t;});};
var i=setInterval(f,250);f();
}catch(x){}})();`;
