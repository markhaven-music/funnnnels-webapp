// Black Friday copies of the MIDI Drum Kit and the Jazz MIDI Pack (2026-11-23, the owner: "Crea una nuova cartella
// di funnels su Funnnnels e mettici midi drum kit e jazz midi kit uguali identici ma invece di 27 è scontato
// visibilmente per black friday con un timer e prezzo è 9.99 il timer scade allo scadere del black friday US time").
//
// Same funnels, same pages, same add-ons and upsells, at their own addresses:
//   /midi-drum-kit/black-friday (+ /<lang>/…), /midi-drum-kit/black-friday/order
//   /jazz-midi-pack/black-friday, /jazz-midi-pack/black-friday/order
// The kit is 9.99 there (27 struck) until `ends`, with a countdown in the red bar on top. The orders are the
// funnel's own orders (same slug: files, emails, upsells and the account work unchanged), told apart by their
// variant "bf" (Stripe metadata.variant, PayPal custom_id "v", the page views' variant), which keeps them out of
// the landing tests and lets dashboard → Black Friday count them. Client-safe: plain data and strings.
//
// Honest deadline: the server charges 9.99 only before `ends` (an early-bird launch, lib/launch.ts), and from
// `ends` on proxy.ts sends the Black Friday addresses to the funnels' own pages, at 27.

import type { Launch, Money } from "@/lib/launch";
import type { Product } from "@/lib/funnels";

export const BF = {
  /** The letter the orders and page views carry (lib/abtest cleanVariant-safe). */
  variant: "bf",
  /** Set by proxy.ts on the Black Friday pages: the page views' variant (lib/beacon.ts abCookie). */
  cookie: "bf_promo",
  /** End of Black Friday, Fri 27 Nov 2026, midnight US Pacific (PST, UTC-8) = 09:00 in Italy. */
  ends: "2026-11-28T08:00:00Z",
  price: { eur: 9.99, usd: 9.99 } as Money,
  funnels: ["midi-drum-kit", "jazz-midi-pack"] as readonly string[],
  /** The path after the funnel's own: /<slug>/black-friday, /<slug>/black-friday/order. */
  path: "black-friday",
};

export const bfLive = (now = Date.now()) => now < Date.parse(BF.ends);

/** The dashboard's ids for the copies (dashboard → Funnels → Black Friday, Analytics): "<slug>-bf". */
export const BF_SUFFIX = "-bf";
/** The funnel a Black Friday id copies, or null. */
export const bfBase = (id: string) => (id.endsWith(BF_SUFFIX) && BF.funnels.includes(id.slice(0, -BF_SUFFIX.length)) ? id.slice(0, -BF_SUFFIX.length) : null);

const LAUNCH: Launch = {
  id: "black-friday-2026",
  waitlistAt: "2026-11-23T00:00:00Z",
  cartOpenAt: "2026-11-23T00:00:00Z",
  earlyBirdEndAt: BF.ends,
  early: BF.price,
  waitlistTag: "",
};

/**
 * The product as the Black Friday pages sell it: 9.99 until `ends` (then its own price), add-ons and upsells as
 * they are. Only for the two funnels, only when the order says it comes from those pages.
 */
export function withBlackFriday<P extends Product | undefined>(f: P, variant: unknown): P {
  if (!f || variant !== BF.variant || f.kind !== "code" || !BF.funnels.includes(f.slug)) return f;
  return { ...f, launch: LAUNCH };
}

// ─── the red bar's countdown ─────────────────────────────────────

type BarLang = "en" | "it" | "fr" | "es" | "de";
const ENDS_IN: Record<BarLang, string> = { en: "Ends in", it: "Finisce tra", fr: "Se termine dans", es: "Termina en", de: "Endet in" };
const DAY: Record<BarLang, string> = { en: "d", it: "g", fr: "j", es: "d", de: "T" };

const barLang = (lang: string): BarLang => (lang in ENDS_IN ? (lang as BarLang) : "en");

/** The bar's words: "BLACK FRIDAY: <s>€27</s> €9.99 · Ends in 4d 12:30:05" (the clock filled in by BF_CLOCK_JS). */
export function bfBarHtml(lang: string, was: string, now: string): string {
  const l = barLang(lang);
  return `<b>BLACK FRIDAY:</b> <s style="opacity:.75">${was}</s> <b>${now}</b> · ${ENDS_IN[l]} <span data-bf-left data-bf-day="${DAY[l]}" style="font-variant-numeric:tabular-nums;white-space:nowrap">${clock(Date.parse(BF.ends) - Date.now(), DAY[l])}</span>`;
}

function clock(ms: number, day: string): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d ? `${d}${day} ` : ""}${p(Math.floor((s % 86400) / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Ticks every [data-bf-left] each second; at zero the page reloads (proxy.ts then sends it to the regular page). */
export const BF_CLOCK_JS = `(function(){var end=${Date.parse(BF.ends)},done=0;
function p(n){return(n<10?'0':'')+n}
function tick(){var s=Math.max(0,Math.floor((end-Date.now())/1000)),d=Math.floor(s/86400);
var els=document.querySelectorAll('[data-bf-left]');
for(var i=0;i<els.length;i++){var u=els[i].getAttribute('data-bf-day')||'d';els[i].textContent=(d?d+u+' ':'')+p(Math.floor(s%86400/3600))+':'+p(Math.floor(s%3600/60))+':'+p(s%60);}
if(s<=0&&!done){done=1;setTimeout(function(){location.reload()},1500);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();
setInterval(tick,1000);})();`;
