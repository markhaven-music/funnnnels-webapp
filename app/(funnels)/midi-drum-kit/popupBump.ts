import type { Lang } from "./i18n";

// The add-on asked in a pop-up instead of a tick-box (2026-11-16, "mettiamolo come popup bump"):
// the kit's grooves as WAV loops. It opens once, when the buyer presses pay (card or PayPal, and
// the pay bar), before anything is charged: "Yes" puts it in the order and pays the new total,
// "No thanks" pays what was there. Apple Pay / Google Pay pay at once, without it.
// It is a normal add-on for the server (dashboard → Products, funnel_items role "bump",
// key below): the pop-up shows only while Products sells it, so with no row it stays off.
export const POPUP_BUMP = "wav";

type Words = { title: string; body: string; yes: (price: string) => string; no: string };

// English first; the others follow it line by line (translations are literal).
export const POPUP_WORDS: Record<Lang, Words> = {
  en: {
    title: "Wait! Want the grooves as audio too?",
    body: "Add the WAV version: the kit's grooves as ready-to-play audio loops. Drag one into any DAW and it plays. No drum sampler, no MIDI routing.",
    yes: (p) => `Yes, add the WAVs (+${p})`,
    no: "No thanks, MIDI only",
  },
  fr: {
    title: "Attends ! Tu veux aussi les grooves en audio ?",
    body: "Ajoute la version WAV : les grooves du kit en boucles audio prêtes à jouer. Glisse-en une dans n'importe quel DAW et elle joue. Pas de sampler de batterie, pas de routage MIDI.",
    yes: (p) => `Oui, ajoute les WAV (+${p})`,
    no: "Non merci, MIDI seulement",
  },
  es: {
    title: "¡Espera! ¿Quieres los grooves también en audio?",
    body: "Añade la versión WAV: los grooves del kit como loops de audio listos para sonar. Arrastra uno a cualquier DAW y suena. Sin sampler de batería, sin ruteo MIDI.",
    yes: (p) => `Sí, añade los WAV (+${p})`,
    no: "No, gracias, solo MIDI",
  },
  de: {
    title: "Warte! Willst du die Grooves auch als Audio?",
    body: "Hol dir die WAV-Version: die Grooves des Kits als fertige Audio-Loops. Zieh einen in jede DAW und er spielt. Kein Drum-Sampler, kein MIDI-Routing.",
    yes: (p) => `Ja, WAVs dazu (+${p})`,
    no: "Nein danke, nur MIDI",
  },
  it: {
    title: "Aspetta! Vuoi i groove anche in audio?",
    body: "Aggiungi la versione WAV: i groove del kit come loop audio pronti da suonare. Trascinane uno in qualsiasi DAW e suona. Niente drum sampler, niente routing MIDI.",
    yes: (p) => `Sì, aggiungi i WAV (+${p})`,
    no: "No grazie, solo MIDI",
  },
};
