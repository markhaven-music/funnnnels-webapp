import type { Currency } from "@/lib/geo";
import { fromEuro } from "@/lib/geo";
import { AVAILABILITY_JS } from "@/lib/availability";
import { beaconScript } from "@/lib/beacon";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { TEMPLATE } from "../midi-drum-kit/cf/upsell-famous";
import en from "../midi-drum-kit/copy/upsell-famous/en.json";
import { faster, mapText } from "../midi-drum-kit/landing";
import { FIXES, HIDE_CF_BAR, headScripts } from "../midi-drum-kit/upsell";
import { funnel } from "./funnel";
import { FBB_LP } from "./landingTest";
import { fbbPopupJs } from "./popupOffer";

// The landing test's "fbb-cf" (./landingTest.ts): ClickFunnels' own Famous Beats Bundle page, the red one
// (2026-11-15: "one of them should be the clickfunnel one with the red background", "we have run it
// already on funnels"). It's in the code as the MIDI Drum Kit's one-click upsell (../midi-drum-kit/cf/
// upsell-famous.ts, cloned 1:1 by tools/cf_clone.mjs, words in copy/upsell-famous/en.json); here the same
// page and words as a landing, changed only where the words or buttons belong to an upsell:
//   - "WAIT! WHILE YOUR ORDER IS STILL OPEN, CHECK THIS ONE-TIME OFFER..." → the other pages' Black Friday line;
//   - "OKAY / YES!! ADD TO MY ORDER (NOW)" → "… GET THE BUNDLE (NOW)", a link to the order page;
//   - the "No thanks…" links, ClickFunnels' "one time offer" bar and the "your copy is reserved" 5:00 popup are gone;
//   - the video: the upsell's (t1dx0gv5tg) opens "Wait. Before you go…" and ends "Add it to your order", so this
//     page plays the bundle's own video instead, the Jazz-style page's (funnel.vsl, 22n1sjknnn), with its thumbnail.
// The price is this funnel's (dashboard → Products); a dollar visitor reads $ everywhere.

const UPSELL_VIDEO = "t1dx0gv5tg";
const POSTER = "/funnels/famous-beats-bundle/vsl-en-960.webp";

const WORDS: Record<string, string> = {
  t001: "BLACK FRIDAY: 90% SALE ENDS SOON",
  t027: "OKAY, GET THE BUNDLE",
  t094: "YES!! GET THE BUNDLE",
  t118: "YES!! GET THE BUNDLE NOW",
  t120: "YES!! GET THE BUNDLE NOW",
};

// The ad's tags go along to the order page (neo credits the sale to the ad by them).
const CARRY = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "fbclid", "gclid"];
const CARRY_JS = `(function(){try{var q=new URLSearchParams(location.search),k=${JSON.stringify(CARRY)};
document.querySelectorAll('a[data-cta]').forEach(function(a){var u=new URL(a.getAttribute('href'),location.href);
for(var i=0;i<k.length;i++){var x=q.get(k[i]);if(x&&!u.searchParams.has(k[i]))u.searchParams.set(k[i],x);}
a.setAttribute('href',u.pathname+u.search);});}catch(e){}})();`;

// The buttons: the upsell's Yes keys, as links; the No links out.
const CSS = `${HIDE_CF_BAR}
a[data-no]{display:none!important}
#cf-offer-popup{display:none!important}`;

// popupPrice: the pop-up add-on's price (./popupOffer.ts, dashboard → Products); null = no pop-up.
export function cfLandingHtml(currency: Currency, price: number, popupPrice: number | null = null): string {
  const strings = { ...(en as Record<string, unknown>), ...WORDS } as Record<string, string>;
  const money = (t: string) => {
    let out = t.replace(/€27\b/g, `€${price}`).replace(/€0\.08\b/g, `€${(price / 320).toFixed(2)}`);
    out = fromEuro(out, currency);
    return out;
  };
  const text = (key: string) => (key.startsWith("s") ? money(strings[key] ?? "") : mapText(strings[key] ?? "", money));
  const order = funnel.checkout.orderPage;
  let html = TEMPLATE.replace(/\{\{([ts]\d{3})\}\}/g, (_, key: string) => text(key))
    // Every Yes: a plain link to the order page, as the other landings' buttons.
    .replaceAll('href="{{YES}}"', `href="${order}" data-cta`)
    .replaceAll('href="{{NO}}"', 'href="#" data-no')
    .replace("{{LANG}}", "en")
    .replace("{{TITLE}}", "Famous Beats Bundle · GRIND STUDIO")
    .replace("{{DESCRIPTION}}", "320 hip-hop drum beats transcribed note for note into multi-track MIDI. Any DAW.")
    .replace(
      "{{HEAD}}",
      `<script>${ORIGIN_BOUNCE_JS}</script>\n<style>${FIXES}\n${CSS}</style>\n<script>${beaconScript({ funnel: funnel.slug, page: "landing", abCookie: FBB_LP.cookie })};\n${popupPrice === null ? "" : fbbPopupJs(popupPrice, currency)}\n${AVAILABILITY_JS}</script>\n${headScripts()}`,
    )
    .replace("{{BODY}}", `<script>${CARRY_JS}</script>`);
  html = faster(html.replaceAll(UPSELL_VIDEO, funnel.vsl.wistiaId), "vsl-famous", [], "#f5b800").replaceAll("/funnels/midi-drum-kit/vsl-famous.webp", POSTER);
  return html;
}
