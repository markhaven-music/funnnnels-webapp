// The words of every order page's tick-box offers (order bumps), one place for every funnel.
//
// 2026-11-16 ("mi piace lo stile di unison audio … impara da questi esempi e forgia nuove copy"): the shape
// of Unison Audio's checkout bumps. Header "Yes, I want the <product>", then after the red "ONE-TIME OFFER:"
// a question about the pain, what you get with its number and how it fits what they're buying, the usual
// price against today's, "Producers who get the best results take this option." and the guarantee
// (ours: 60-day quality guarantee, never money back). Usual prices are only the ones our pages already
// state (the packs' own price added up); an add-on without one just says its price.
//
// And without pictures ("vorrei testare SENZA immagini che forse converte meglio"): BUMP_PICTURES off
// drops the product image from every bump box. Judged as a before/after (lib/analytics.ts TESTS,
// "Order bumps"), from BUMP_COPY_FROM.

import type { Lang } from "@/app/(funnels)/midi-drum-kit/i18n";

/** Show the product picture beside each bump. Off since BUMP_COPY_FROM. */
export const BUMP_PICTURES = false;
/** When the new words and the boxes without pictures went live (UTC). */
export const BUMP_COPY_FROM = "2026-11-16T22:45:00Z";

export type BumpWords = { headline: string; body: string[] };

type Entry = {
  /** "Yes, I want the …" */
  name: string;
  /** The question, then what you get. `{use}` = how it fits the main product ("your new MIDI Drum Kit"). */
  pitch: string;
  /** The usual price, as our pages state it, or none. */
  was?: number;
};

type Lines = {
  yes: (name: string) => string;
  deal: (was: string, off: number, price: string) => string;
  only: (price: string) => string;
  best: string;
  guarantee: string;
};

const LINES: Record<Lang, Lines> = {
  en: {
    yes: (n) => `Yes, I want the ${n}`,
    deal: (was, off, price) => `Normally ${was} but you can get it ${off}% off right now for only **${price}**.`,
    only: (price) => `Add it right now for only **${price}**.`,
    best: "Producers who get the best results take this option.",
    guarantee: "60-day quality guarantee.",
  },
  fr: {
    yes: (n) => `Oui, je veux ${n}`,
    deal: (was, off, price) => `Normalement ${was}, mais aujourd'hui c'est -${off} % : seulement **${price}**.`,
    only: (price) => `Aujourd'hui pour seulement **${price}**.`,
    best: "Les producteurs qui obtiennent les meilleurs résultats prennent cette option.",
    guarantee: "Garantie qualité de 60 jours.",
  },
  es: {
    yes: (n) => `Sí, quiero ${n}`,
    deal: (was, off, price) => `Normalmente ${was}, pero hoy tiene un ${off} % de descuento: solo **${price}**.`,
    only: (price) => `Hoy por solo **${price}**.`,
    best: "Los productores que consiguen los mejores resultados eligen esta opción.",
    guarantee: "Garantía de calidad de 60 días.",
  },
  de: {
    yes: (n) => `Ja, ich will ${n}`,
    deal: (was, off, price) => `Normalerweise ${was}, aber heute mit ${off} % Rabatt: nur **${price}**.`,
    only: (price) => `Heute für nur **${price}**.`,
    best: "Producer, die die besten Ergebnisse holen, nehmen diese Option.",
    guarantee: "60 Tage Qualitätsgarantie.",
  },
  it: {
    yes: (n) => `Sì, voglio ${n}`,
    deal: (was, off, price) => `Di solito ${was}, ma oggi è scontato del ${off}%: solo **${price}**.`,
    only: (price) => `Oggi a soli **${price}**.`,
    best: "I producer che ottengono i risultati migliori scelgono questa opzione.",
    guarantee: "Garanzia di qualità di 60 giorni.",
  },
};

// English for every add-on; the MIDI Drum Kit's three also in its four other languages
// (translations follow the English line by line).
const WORDS: Record<string, Partial<Record<Lang, Entry>> & { en: Entry }> = {
  expansions: {
    en: {
      name: "MIDI Drum Kit Expansions",
      pitch: "Making the same kind of beat every time? Get **172 drag & drop MIDI drum files** with complete beats for **House, Lo-Fi and Afrobeat**, to use with {use}.",
      was: 147,
    },
    fr: {
      name: "les extensions du MIDI Drum Kit",
      pitch: "Tu fais toujours le même genre de beat ? Récupère **172 fichiers MIDI de batterie à glisser-déposer** avec des beats complets **House, Lo-Fi et Afrobeat**, à utiliser avec {use}.",
      was: 147,
    },
    es: {
      name: "las MIDI Drum Kit Expansions",
      pitch: "¿Siempre haces el mismo tipo de beat? Consigue **172 archivos MIDI de batería para arrastrar y soltar** con beats completos de **House, Lo-Fi y Afrobeat**, para usar con {use}.",
      was: 147,
    },
    de: {
      name: "die MIDI Drum Kit Expansions",
      pitch: "Machst du jedes Mal die gleiche Art Beat? Hol dir **172 MIDI-Drum-Dateien per Drag & Drop** mit kompletten Beats für **House, Lo-Fi und Afrobeat**, für {use}.",
      was: 147,
    },
    it: {
      name: "le MIDI Drum Kit Expansions",
      pitch: "Fai sempre lo stesso tipo di beat? Prendi **172 file MIDI di batteria drag & drop** con beat completi per **House, Lo-Fi e Afrobeat**, da usare con {use}.",
      was: 147,
    },
  },
  hustle: {
    en: {
      name: "HUSTLE Bundle",
      pitch: "Out of ideas every time you open your DAW? Get **31 professional MIDI packs** with chord progressions, melodies and musical ideas: jazz, trap, hip-hop, lofi, pop and more. Each pack is {c29} on its own.",
      was: 899,
    },
    fr: {
      name: "le HUSTLE Bundle",
      pitch: "À court d'idées dès que tu ouvres ton DAW ? Récupère **31 packs MIDI professionnels** avec des progressions d'accords, des mélodies et des idées musicales : jazz, trap, hip-hop, lofi, pop et plus encore. Chaque pack coûte {c29} seul.",
      was: 899,
    },
    es: {
      name: "el HUSTLE Bundle",
      pitch: "¿Sin ideas cada vez que abres tu DAW? Consigue **31 packs MIDI profesionales** con progresiones de acordes, melodías e ideas musicales: jazz, trap, hip-hop, lofi, pop y más. Cada pack cuesta {c29} por separado.",
      was: 899,
    },
    de: {
      name: "das HUSTLE Bundle",
      pitch: "Keine Ideen, sobald du deine DAW öffnest? Hol dir **31 professionelle MIDI-Packs** mit Akkordfolgen, Melodien und musikalischen Ideen: Jazz, Trap, Hip-Hop, Lofi, Pop und mehr. Jedes Pack kostet einzeln {c29}.",
      was: 899,
    },
    it: {
      name: "l'HUSTLE Bundle",
      pitch: "A corto di idee ogni volta che apri la DAW? Prendi **31 pack MIDI professionali** con progressioni di accordi, melodie e idee musicali: jazz, trap, hip-hop, lofi, pop e altro. Ogni pack da solo costa {c29}.",
      was: 899,
    },
  },
  "top-hits": {
    en: {
      name: "TOP HITS MIDI Bundle",
      pitch: "Struggling to write chords that sound like a hit? Get **1000 chord progressions** from the biggest songs (Drake, Kendrick Lamar, Travis Scott, The Weeknd and more) as **drag & drop MIDI files**, to use with {use}.",
    },
    fr: {
      name: "le TOP HITS MIDI Bundle",
      pitch: "Du mal à écrire des accords qui sonnent comme un hit ? Récupère **1000 progressions d'accords** des plus grands morceaux (Drake, Kendrick Lamar, Travis Scott, The Weeknd et plus) en **fichiers MIDI à glisser-déposer**, à utiliser avec {use}.",
    },
    es: {
      name: "el TOP HITS MIDI Bundle",
      pitch: "¿Te cuesta escribir acordes que suenen a hit? Consigue **1000 progresiones de acordes** de las canciones más grandes (Drake, Kendrick Lamar, Travis Scott, The Weeknd y más) en **archivos MIDI para arrastrar y soltar**, para usar con {use}.",
    },
    de: {
      name: "das TOP HITS MIDI Bundle",
      pitch: "Fällt es dir schwer, Akkorde zu schreiben, die nach einem Hit klingen? Hol dir **1000 Akkordfolgen** aus den größten Songs (Drake, Kendrick Lamar, Travis Scott, The Weeknd und mehr) als **MIDI-Dateien per Drag & Drop**, für {use}.",
    },
    it: {
      name: "il TOP HITS MIDI Bundle",
      pitch: "Fai fatica a scrivere accordi che suonino come una hit? Prendi **1000 progressioni di accordi** dalle canzoni più grandi (Drake, Kendrick Lamar, Travis Scott, The Weeknd e altri) in **file MIDI drag & drop**, da usare con {use}.",
    },
  },
  "swing-grooves": {
    en: {
      name: "Drunk Swing Grooves",
      pitch: "Want the drunk, J Dilla-style swing of lofi and neo soul? Get **80 MIDI drum grooves** in 4 feels plus **31 groove templates** that swing any MIDI: snare on the beat, everything else laid back. Made to use with {use}.",
    },
  },
  "record-samples": {
    en: {
      name: "Jazz Record Samples",
      pitch: "Want chords that sound like they came off an old record? Get **122 WAV loops**: 82 lofi chord loops in Rhodes and 40 neo soul chord loops in piano, ready to drop over {use}.",
    },
  },
  "emotional-keys": {
    en: {
      name: "Emotional Keys MIDI Bundle",
      pitch: "Struggling to write melodies that make people feel something? Get **Emotional Keys Vol. 1, 2 and 3**: chord progressions, melodies and musical ideas written by pianist and composer Orazio Saracino. Each pack is {c29} on its own.",
      was: 87,
    },
  },
  "drum-kit": {
    en: {
      name: "MIDI Drum Kit Bundle",
      pitch: "Drums still sound stiff under your chords? Get **1050 MIDI drum patterns** modeled after Billboard producers like Southside, Lex Luger, Zaytoven and DJ Mustard: complete beats, patterns and fragments, to use with {use}.",
      was: 299,
    },
  },
  "famous-beats": {
    en: {
      name: "Famous Beats Bundle",
      pitch: "Want drums that sound like the records you love? Get **320 MIDI transcriptions** of the most influential drum beats of all time. A transcription service charges {c20} a beat.",
    },
  },
  "jazz-pack": {
    en: {
      name: "Jazz MIDI Pack",
      pitch: "Want chords that swing with your grooves? Get **10,496 MIDI files**: the most used jazz progressions × 12 voicings × 8 rhythms in all 12 keys, with walking bass lines, plus its 6 bonuses, to use with {use}.",
    },
  },
};

/** 27 → "$27" in English, "27 {c}" elsewhere; kept as the funnels' `{c}` mark, the page fills in the sign. */
function cash(n: number, lang: Lang): string {
  const s = n >= 1000 ? n.toLocaleString(lang === "en" ? "en-US" : lang) : String(n);
  return lang === "en" ? `{c}${s}` : `${s} {c}`;
}

/**
 * One add-on's words for an order page, at the price it is sold for there.
 * `use`: how it fits what they're buying, in the page's language ("your new MIDI Drum Kit").
 * Null for an add-on with no words here (the page keeps its own).
 */
export function bumpWords(id: string, price: number, use: string, lang: Lang = "en"): BumpWords | null {
  const w = WORDS[id];
  if (!w) return null;
  const e = w[lang] ?? (lang === "en" ? w.en : null);
  if (!e) return null;
  const l = LINES[lang];
  const pitch = e.pitch.replace("{use}", use).replace(/\{c(\d+)\}/g, (_, n: string) => cash(Number(n), lang));
  const off = e.was ? Math.round((1 - price / e.was) * 100) : 0;
  const deal = e.was && off >= 10 ? l.deal(cash(e.was, lang), off, cash(price, lang)) : l.only(cash(price, lang));
  return { headline: l.yes(e.name), body: [`${pitch} ${deal} ${l.best} ${l.guarantee}`] };
}
