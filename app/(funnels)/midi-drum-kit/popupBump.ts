import { landingPopupJs } from "@/lib/landingPopup";
import type { Lang } from "./i18n";

// The pop-up add-on (2026-11-16, "mettiamolo come popup bump", then "il popup dovrebbe uscire quando
// cliccano sulla landing page non sull order page"): the kit's grooves as WAV loops, offered in a pop-up
// when a landing button is tapped, before the order page. Yes and No are the same size and both go on to
// the order page; Yes arrives there with the WAVs in the order (a line in the summary with a Remove link),
// No as before. A tap outside or Escape only closes it. "Checking availability…"
// is shown after the answer (lib/availability.ts window.__fvAvShow; 2026-11-17 "check availability dovrebbe apparire
// dopo qualsiasi bottone premuto e popup bump scomparsa").
//
// For the server it is a normal add-on (dashboard → Products, funnel_items role "bump", key below), priced
// and checked like any other (lib/funnels.ts pickedBumps); it never shows as a tick-box on the order page.
// No such row in Products: no pop-up, the landings keep "Checking availability…".
//
// Counted (2026-11-17): the tap on a button, Yes, No and a close with no answer go to landing_taps
// (lib/beacon.ts __fvTap) for dashboard → Analytics → "Button taps".
//
// The answer goes from the landing to the order page in localStorage (the order page is prerendered behind
// the pop-up at the same address, so not in the URL); an answer older than CHOICE_MS is ignored.
export const POPUP_BUMP = "wav";
export const POPUP_KEY = "fv_popup_dk";
export const CHOICE_MS = 30 * 60_000;
/** The pop-up's picture when the Products row has none: the kit's box. */
export const POPUP_IMAGE = "/funnels/midi-drum-kit/kit-box-v3-160.webp";

type Words = { title: string; body: string; yes: string; no: string; remove: string };

// English first; the others follow it line by line (translations are literal). {price}: the add-on's price.
export const POPUP_WORDS: Record<Lang, Words> = {
  en: {
    title: "Want the grooves as audio too?",
    body: "Add the WAV version: the kit's grooves as ready-to-play audio loops. Drag one into any DAW and it plays. No drum sampler, no MIDI routing.",
    yes: "Yes, add the WAVs · {price}",
    no: "No thanks, MIDI only",
    remove: "Remove",
  },
  fr: {
    title: "Tu veux aussi les grooves en audio ?",
    body: "Ajoute la version WAV : les grooves du kit en boucles audio prêtes à jouer. Glisse-en une dans n'importe quel DAW et elle joue. Pas de sampler de batterie, pas de routage MIDI.",
    yes: "Oui, ajoute les WAV · {price}",
    no: "Non merci, MIDI seulement",
    remove: "Retirer",
  },
  es: {
    title: "¿Quieres los grooves también en audio?",
    body: "Añade la versión WAV: los grooves del kit como loops de audio listos para sonar. Arrastra uno a cualquier DAW y suena. Sin sampler de batería, sin ruteo MIDI.",
    yes: "Sí, añade los WAV · {price}",
    no: "No, gracias, solo MIDI",
    remove: "Quitar",
  },
  de: {
    title: "Willst du die Grooves auch als Audio?",
    body: "Hol dir die WAV-Version: die Grooves des Kits als fertige Audio-Loops. Zieh einen in jede DAW und er spielt. Kein Drum-Sampler, kein MIDI-Routing.",
    yes: "Ja, WAVs dazu · {price}",
    no: "Nein danke, nur MIDI",
    remove: "Entfernen",
  },
  it: {
    title: "Vuoi i groove anche in audio?",
    body: "Aggiungi la versione WAV: i groove del kit come loop audio pronti da suonare. Trascinane uno in qualsiasi DAW e suona. Niente drum sampler, niente routing MIDI.",
    yes: "Sì, aggiungi i WAV · {price}",
    no: "No grazie, solo MIDI",
    remove: "Rimuovi",
  },
};

/** The landing's script (in place of lib/availability.ts): taps on links to …/order open the pop-up (lib/landingPopup.ts). */
export function popupLandingJs(lang: Lang, price: string, image: string, abCookie = "ab_lp"): string {
  const w = POPUP_WORDS[lang];
  return landingPopupJs({ key: POPUP_KEY, abCookie, image, title: w.title, body: w.body, yes: w.yes.replace("{price}", price), no: w.no });
}

/** The order page: the landing's answer, if fresh. true = add the WAVs. */
export function popupChoice(): boolean {
  try {
    const c = JSON.parse(localStorage.getItem(POPUP_KEY) ?? "null");
    return Boolean(c && c.add === true && Date.now() - Number(c.at) < CHOICE_MS);
  } catch {
    return false;
  }
}
