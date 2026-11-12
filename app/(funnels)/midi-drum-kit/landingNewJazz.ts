import type { Currency } from "@/lib/geo";
import type { Copy } from "./copy";
import { money, type Lang } from "./i18n";
import { STACK_VALUES } from "./stackSwitch";

// The sections of the new MIDI Drum Kit landing that are built as the Jazz MIDI Pack page's
// (2026-11-12: "make the hero like the MIDI Jazz Pack one (size of benefits/bullets, position of other
// elements, animation of the button etc)", "add comparison table section", "make the summary section like
// the MIDI Jazz Pack landing page", "add commercial license part with card image", the reviews "more in
// MIDI JAZZ PACK style", "footer and section before make it like MIDI Jazz Pack").
// Same markup as jazz-midi-pack/sections.tsx (Hero, Math_, Offer + ValueStack, Reviews, the license card,
// Final, the footer) with the classes of ./jazzCss.ts (tools/port_jazz_css.py), under the root class .jz.
// The words are the old page's (copy/landing by key, the order page's stack) wherever it has them; what
// the Jazz sections need and the old page never said is in WORDS, in English and Italian.

const IMG = "/funnels/midi-drum-kit/";
type L = "en" | "it";

const WORDS: Record<L, Record<string, string>> = {
  en: {
    // 10,296 since the evening of 2026-11-12 ("let's get them to 10k+"): the kit's 1,040 files and their 9,256 key
    // versions and combinations (tools/drum_kit_expand.py, the zip V2). The old landing still says 1050.
    tag: "10,296 MIDI files",
    count: "10,296",
    inner: "{price} · instant download",
    worksIn: "Works in",
    daws: "Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Studio One, Reason, Reaper, GarageBand and more",
    compareTitle: "Why *MIDI Drum Kit* beats the other ways to make drums.",
    summaryTitle: "10,296 MIDI drum files + 616 more MIDI files in the bonuses. Today {price}.",
    kit: "The kit",
    value: "value",
    bonus: "Bonus",
    total: "Total value:",
    today: "Today",
    save: "You save",
    pay: "Card or PayPal · secure checkout",
    payWays: "Card or PayPal",
    download: "Download buttons right after you pay",
    licenseTitle: "Commercial license.",
    licenseText: "Use every file in your own music, commercial releases included: sell the beats, lease them, put them out. The money is yours, no royalties. You just can’t resell or share the MIDI files themselves.",
    licenseAlt: "GRIND STUDIO commercial license card for the MIDI Drum Kit",
    licenseTag: "Included with the kit",
    stars: "5 stars",
    sealRing: "QUALITY GUARANTEE · QUALITY GUARANTEE · ",
    sealDays: "DAYS",
    sealAlt: "14-day quality guarantee",
  },
  it: {
    tag: "10.296 file MIDI",
    count: "10.296",
    inner: "{price} · download immediato",
    worksIn: "Funziona in",
    daws: "Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Studio One, Reason, Reaper, GarageBand e altre",
    compareTitle: "Perché il *MIDI Drum Kit* batte gli altri modi di fare la batteria.",
    summaryTitle: "10.296 file MIDI di batteria + altri 616 file MIDI nei bonus. Oggi {price}.",
    kit: "Il kit",
    value: "di valore",
    bonus: "Bonus",
    total: "Valore totale:",
    today: "Oggi",
    save: "Risparmi",
    pay: "Carta o PayPal · pagamento sicuro",
    payWays: "Carta o PayPal",
    download: "Pulsanti di download subito dopo il pagamento",
    licenseTitle: "Licenza commerciale.",
    licenseText: "Usa ogni file nella tua musica, uscite commerciali comprese: vendi i beat, dalli in leasing, pubblicali. I soldi sono tuoi, niente royalty. Non puoi solo rivendere o condividere i file MIDI.",
    licenseAlt: "Card della licenza commerciale GRIND STUDIO per il MIDI Drum Kit",
    licenseTag: "Inclusa nel kit",
    stars: "5 stelle",
    sealRing: "GARANZIA DI QUALITÀ · GARANZIA DI QUALITÀ · ",
    sealDays: "GIORNI",
    sealAlt: "Garanzia di qualità di 14 giorni",
  },
};
const TICKS: Record<L, string[]> = {
  en: ["Any DAW", "Drag & drop", "14-day quality guarantee"],
  it: ["Qualsiasi DAW", "Drag & drop", "Garanzia di qualità di 14 giorni"],
};

// The comparison chart: the kit first, then three other ways to get drums into a beat. Rows are what a
// beatmaker feels on each of them ("put things that they actually feel and present the midi drum kit as the
// obvious best choice", "a bigger and better reading MIDI DRUM KIT and put it as first", 2026-11-12). Every
// cell says what that way is, nothing about anyone's product. ok: true ✓, false ✗, null –.
type Cell = { ok: boolean | null; text: string };
const yes = (text: string): Cell => ({ ok: true, text });
const no = (text: string): Cell => ({ ok: false, text });
const meh = (text: string): Cell => ({ ok: null, text });
const CHART: Record<L, { kit: string; alts: string[]; rows: { label: string; kit: string; alts: Cell[] }[] }> = {
  en: {
    kit: "MIDI Drum Kit",
    // short: on a phone each of these columns is some 65px wide
    alts: ["By hand", "Audio loops", "Free MIDI"],
    rows: [
      { label: "Your drums bounce", kit: "From the first file you drag in", alts: [no("Only if you already know how"), meh("The loop’s bounce, not yours"), meh("Some files do")] },
      { label: "You never start from an empty piano roll", kit: "Over 10,000 places to start", alts: [no("Every single beat"), yes("A loop gets you going"), meh("Until the good ones run out")] },
      { label: "It sounds like you, not like a pack", kit: "Your sounds, your mix", alts: [yes("Yes"), no("Everyone has that loop"), yes("Yes")] },
      { label: "Fills and rolls are already made", kit: "250+ fragments to drop in", alts: [no("You draw each one"), no("Only what’s in the loop"), meh("Rarely")] },
      { label: "You find the right part in seconds", kit: "A numbered folder per drum", alts: [no("Nothing to pick from"), meh("Scroll and audition"), no("A pile of files")] },
      { label: "The drums are done in minutes", kit: "Drag, drop, done", alts: [no("Hit by hit"), yes("Yes"), meh("After the sorting")] },
      { label: "You can sell the beat", kit: "Commercial license included", alts: [yes("It’s yours"), meh("Check each license"), meh("Often not stated")] },
      { label: "What it costs", kit: "{price}, once", alts: [no("Your time, on every beat"), meh("A pack or a subscription"), yes("Nothing")] },
    ],
  },
  it: {
    kit: "MIDI Drum Kit",
    alts: ["A mano", "Loop audio", "MIDI gratis"],
    rows: [
      { label: "La tua batteria ha il bounce", kit: "Dal primo file che trascini", alts: [no("Solo se sai già come si fa"), meh("È il bounce del loop, non il tuo"), meh("Solo alcuni file")] },
      { label: "Non parti mai dal piano roll vuoto", kit: "Più di 10.000 punti di partenza", alts: [no("A ogni singolo beat"), yes("Un loop ti fa partire"), meh("Finché durano quelli buoni")] },
      { label: "Suona come te, non come un pack", kit: "I tuoi suoni, il tuo mix", alts: [yes("Sì"), no("Quel loop ce l’hanno tutti"), yes("Sì")] },
      { label: "Fill e roll sono già fatti", kit: "250+ frammenti da inserire", alts: [no("Li disegni uno a uno"), no("Solo quelli del loop"), meh("Di rado")] },
      { label: "Trovi la parte giusta in pochi secondi", kit: "Una cartella numerata per ogni pezzo", alts: [no("Niente tra cui scegliere"), meh("Scorri e ascolti"), no("Un mucchio di file")] },
      { label: "La batteria è fatta in pochi minuti", kit: "Trascini, rilasci, fatto", alts: [no("Un colpo alla volta"), yes("Sì"), meh("Dopo averli ordinati")] },
      { label: "Puoi vendere il beat", kit: "Licenza commerciale inclusa", alts: [yes("È tuo"), meh("Controlla ogni licenza"), meh("Spesso non è scritto")] },
      { label: "Quanto costa", kit: "{price}, una volta sola", alts: [no("Il tuo tempo, a ogni beat"), meh("Un pack o un abbonamento"), yes("Niente")] },
    ],
  },
};

// The questions under the old page's four (copy keys t242–t249, which stay editable): what a beatmaker asks
// before buying a MIDI drum pack ("add more FAQs"). Facts only: the zip's folders and READ ME, the bonuses'
// counts, the download page, the guarantee's words. `at`: where it goes among the old four (0 = before the first).
const FAQ: Record<L, { at: number; q: string; a: string }[]> = {
  en: [
    { at: 1, q: "What are the 10,296 files?", a: "1,040 are patterns and fragments written by hand, one by one. The other 9,256 are those same patterns ready in more ways, so you don’t have to build them: every 808 in all 12 keys, every kick pattern with every snare pattern, the kick and 808 beats with snares, the kick and snare beats with hi-hats." },
    { at: 1, q: "I’m just starting out. Is this too advanced for me?", a: "No. You drag a file onto a drum track and it plays. Start with the Complete Beats folder, where every drum is in one file, then swap single parts as you go." },
    { at: 1, q: "What’s the difference between a pattern and a fragment?", a: "A pattern is a full part for one drum, 1 to 4 bars long. A fragment is a short piece (a roll, a fill, a syncopation) you drop where you want a change. Any fragment goes on any beat." },
    { at: 1, q: "Which genres is it for?", a: "Hip hop and trap first: 808s, hi-hat rolls, half-time snares. The files run from 70 to 200 BPM, and since it’s MIDI you can use any part at any tempo, in any style that wants that bounce." },
    { at: 1, q: "Do the files follow my project’s tempo?", a: "Yes. MIDI plays at whatever tempo your project is set to. Nothing to stretch, nothing to warp." },
    { at: 1, q: "Do I need a MIDI keyboard or a special plugin?", a: "No. Any DAW and any drum sampler or drum rack that plays MIDI notes. The stock ones are enough." },
    { at: 4, q: "Do I get drum sounds too?", a: "Yes. The Hit-Maker Drums bonus is 281 WAV one-shots: kicks, snares, claps, hi-hats, rims and percs. They are the sounds you hear in the player on this page." },
    { at: 4, q: "How do I get the files?", a: "The download buttons are on the page you land on right after you pay, and the link comes by email too." },
    { at: 4, q: "Is it a subscription?", a: "No. {price} once, and the files are yours." },
    { at: 4, q: "What if something is wrong with my files?", a: "Email support@thegrind.studio within 14 days. We send a fresh download or a replacement, and if we can’t fix it you get a refund." },
  ],
  it: [
    { at: 1, q: "Cosa sono i 10.296 file?", a: "1.040 sono pattern e frammenti scritti a mano, uno per uno. Gli altri 9.256 sono gli stessi pattern già pronti in più modi, così non devi costruirli tu: ogni 808 in tutte le 12 tonalità, ogni pattern di kick con ogni pattern di snare, i beat di kick e 808 con le snare, i beat di kick e snare con gli hi-hat." },
    { at: 1, q: "Ho appena iniziato. È troppo avanzato per me?", a: "No. Trascini un file su una traccia di batteria e suona. Parti dalla cartella Complete Beats, dove tutta la batteria è in un solo file, poi cambi le singole parti man mano." },
    { at: 1, q: "Che differenza c’è tra un pattern e un frammento?", a: "Un pattern è una parte intera per un pezzo della batteria, lunga da 1 a 4 battute. Un frammento è un pezzo corto (un roll, un fill, una sincope) che metti dove vuoi un cambio. Ogni frammento va su qualsiasi beat." },
    { at: 1, q: "Per quali generi va bene?", a: "Hip hop e trap prima di tutto: 808, roll di hi-hat, snare in half-time. I file vanno da 70 a 200 BPM e, essendo MIDI, puoi usare ogni parte a qualsiasi tempo, in qualsiasi stile che voglia quel bounce." },
    { at: 1, q: "I file seguono il tempo del mio progetto?", a: "Sì. Il MIDI suona al tempo impostato nel tuo progetto. Niente da stirare, niente da adattare." },
    { at: 1, q: "Mi serve una tastiera MIDI o un plugin particolare?", a: "No. Una DAW qualsiasi e un qualsiasi sampler di batteria o drum rack che suoni note MIDI. Bastano quelli di serie." },
    { at: 4, q: "Ci sono anche i suoni di batteria?", a: "Sì. Il bonus Hit-Maker Drums sono 281 one-shot WAV: kick, snare, clap, hi-hat, rim e percussioni. Sono i suoni che senti nel player di questa pagina." },
    { at: 4, q: "Come ricevo i file?", a: "I pulsanti di download sono nella pagina su cui arrivi subito dopo il pagamento, e il link ti arriva anche via email." },
    { at: 4, q: "È un abbonamento?", a: "No. {price} una volta sola, e i file sono tuoi." },
    { at: 4, q: "E se c’è qualcosa che non va nei miei file?", a: "Scrivi a support@thegrind.studio entro 14 giorni. Ti mandiamo un nuovo download o un file sostitutivo e, se non riusciamo a risolvere, ti rimborsiamo." },
  ],
};
// The guarantee, as three steps: the old page's promise (t255) said as what happens.
const STEPS: Record<L, string[]> = {
  en: ["Email support@thegrind.studio within 14 days", "We send a fresh download or a replacement", "If we can’t fix it, you get a refund"],
  it: ["Scrivi a support@thegrind.studio entro 14 giorni", "Ti mandiamo un nuovo download o un file sostitutivo", "Se non riusciamo a risolvere, ti rimborsiamo"],
};

// What each bonus holds, in the summary's list (counted from the files buyers download).
const COUNTS: Record<L, string[]> = {
  en: ["Vol.1 to Vol.5 · 50 multi-track MIDI beats", "355 MIDI files", "281 WAV one-shots", "211 MIDI files", "17 WAV hooks", "PDF, 5 pages"],
  it: ["Dal Vol.1 al Vol.5 · 50 beat MIDI multitraccia", "355 file MIDI", "281 one-shot WAV", "211 file MIDI", "17 hook WAV", "PDF, 5 pagine"],
};
const COVERS = ["famous", "starters", "drums", "grooves", "hooks", "guide"];
/** The kit's value in the offer: the old picture's (tools/value_stack.py KIT). */
const KIT_VALUE = STACK_VALUES.total - STACK_VALUES.bonuses.reduce((a, b) => a + b, 0);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;|[ ​‌]/g, " ").replace(/\s+/g, " ").trim();
/** *words* in the page's orange. */
const hl = (s: string) => esc(s).replace(/\*(.+?)\*/g, '<em class="jz-hl">$1</em>');
/** copy.ts's **bold** as <b>. */
const bold = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

const TICK = '<svg class="jz-tick" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SHIELD = '<svg class="jz-shield" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="currentColor" opacity=".18"/><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW = '<svg class="jzb-arrow" aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M13 5l7 7-7 7M4 12h16" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MARKS = {
  yes: '<span class="jz-mark jz-markYes" role="img" aria-label="Yes"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
  no: '<span class="jz-mark jz-markNo" role="img" aria-label="No"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span>',
  meh: '<span class="jz-mark jz-markMeh" role="img" aria-label="Partly"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5.5 10h9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span>',
};

export type JazzCtx = {
  lang: Lang;
  currency: Currency;
  /** The old page's copy by key (landing.ts words). */
  words: (key: string) => string;
  /** The order page's address. */
  order: string;
  /** The kit's price today, in this currency. */
  price: number;
  /** The order page's "what you get" words (copy/<lang>.ts order.stack): the tick list, the proof numbers, the guarantee line. */
  stack: Copy["order"]["stack"];
};
const l = (c: JazzCtx): L => (c.lang === "it" ? "it" : "en");
const priceOf = (c: JazzCtx) => money(c.price, c.currency, c.lang, !Number.isInteger(c.price));
const worth = (n: number, c: JazzCtx) => money(n, c.currency, c.lang, false);
const fill = (s: string, c: JazzCtx) => s.replaceAll("{price}", priceOf(c));

/** The one call to action, the Jazz page's key (jazz-midi-pack/Cta.tsx): the old page's "GET THE PACK!" on it. */
export function key(c: JazzCtx, inner?: string, note?: string): string {
  const w = WORDS[l(c)];
  return `<a href="${c.order}" class="jzb-btn" data-cta><span class="jzb-shine" aria-hidden="true"></span><span class="jzb-label"><span>${plain(c.words("t011"))}</span>${ARROW}</span><span class="jzb-inner">${esc(fill(inner ?? w.inner, c))}</span></a>${note ? `<p class="jzb-note">${note}</p>` : ""}`;
}

/** The key on its own between two sections, in place of one of the old page's buttons. */
export const cta = (c: JazzCtx) => `<div class="jz dk-cta"><div class="jz-ctaBlock">${key(c)}</div></div>\n`;

const ticks = (items: string[], cls: string) => `<ul class="${cls}">${items.map((t) => `<li>${TICK}<span>${t}</span></li>`).join("")}</ul>`;

/** The hero: wordmark and tag, pre-title, headline, sub, the video, the benefits in two columns, the key, the DAWs, three real numbers. */
export function hero(c: JazzCtx, video: string): string {
  const w = WORDS[l(c)];
  // the old page's "1050" in the first bullet becomes the kit's files today
  const bullets = ["t005", "t006", "t007", "t008", "t009", "t010"].map((k) => c.words(k).replace(/1[.,]?050/g, w.count));
  return `<div class="jz" id="dk-hero"><section class="jz-hero">
<div class="jz-heroBg" aria-hidden="true"></div>
<div class="jz-topband"><header class="jz-wrap jz-topbar"><span class="jz-logo"><img src="${IMG}logo.webp" alt="GRIND STUDIO" width="360" height="42"></span><span class="jz-tag"><span class="jz-dot" aria-hidden="true"></span>${esc(w.tag)}</span></header></div>
<div class="jz-wrap jz-heroCenter">
<p class="jz-heroPre">${c.words("t002")}</p>
<h1 class="jz-heroHead">${c.words("t003")}</h1>
<p class="jz-heroSub">${c.words("t004")}</p>
<div class="jz-vsl">${video}</div>
${ticks(bullets, "jz-heroBullets")}
<div class="jz-heroCta">${key(c)}</div>
${ticks(TICKS[l(c)].map(esc), "jz-proofRow")}
</div>
<div class="jz-wrap jz-dawStrip"><span class="jz-mono">${esc(w.worksIn)}</span><img class="jz-dawLogos" src="${IMG}daws.webp" alt="${esc(w.daws)}" width="1000" height="63"></div>
<div class="jz-wrap"><ul class="jz-proof" style="--n:${c.stack.proof.length}">${c.stack.proof.map((p) => `<li>${bold(p)}</li>`).join("")}</ul></div>
</section></div>
`;
}

/** The comparison chart (Jazz: "Other ways to get jazz voicings."): here the kit's column comes first, wide and in the button's orange. */
export function compare(c: JazzCtx): string {
  const w = WORDS[l(c)];
  const chart = CHART[l(c)];
  const mark = (ok: boolean | null) => (ok === true ? MARKS.yes : ok === false ? MARKS.no : MARKS.meh);
  const head = `<span class="dkx-corner" role="columnheader"></span><span class="dkx-col dkx-win" role="columnheader"><img class="dkx-box" src="${IMG}kit-box-v3-160.webp" width="160" height="206" alt="" loading="lazy" decoding="async"><b>${esc(chart.kit)}</b></span>${chart.alts.map((a) => `<span class="dkx-col" role="columnheader">${esc(a)}</span>`).join("")}`;
  const rows = chart.rows
    .map(
      (row) =>
        `<div class="dkx-row" role="row"><span class="dkx-label" role="rowheader">${esc(row.label)}</span><span class="dkx-cell dkx-win" role="cell">${MARKS.yes}<span>${esc(fill(row.kit, c))}</span></span>${row.alts
          .map((cell) => `<span class="dkx-cell dkx-${cell.ok === true ? "yes" : cell.ok === false ? "no" : "meh"}" role="cell">${mark(cell.ok)}<span>${esc(cell.text)}</span></span>`)
          .join("")}</div>`,
    )
    .join("\n");
  return `<div class="jz"><section class="jz-sec dk-compare"><div class="jz-wrap">
<div class="jz-secHead"><h2 class="jz-h2">${hl(w.compareTitle)}</h2></div>
<div class="dkx" role="table" aria-label="${esc(w.compareTitle.replaceAll("*", ""))}">
<div class="dkx-row dkx-head" role="row">${head}</div>
${rows}
</div>
<div class="jz-ctaBlock">${key(c)}</div>
</div></section></div>
`;
}

/** The summary before the checkout (Jazz: "10,496 jazz MIDI files + 4,197 in the bonuses. Today €27."): the kit, the six bonuses with their value, the total against today's price. */
export function summary(c: JazzCtx): string {
  const w = WORDS[l(c)];
  const total = STACK_VALUES.total;
  const bonuses = STACK_VALUES.bonuses
    .map((v, i) => {
      const name = plain(c.words(["t116", "t119", "t122", "t263", "t266", "t269"][i])).replace(/^BONUS\s*#?\d+\s*:\s*/i, "");
      return `<li><img src="${IMG}bonus2-${COVERS[i]}-132.webp" width="132" height="196" alt="" loading="lazy" decoding="async"><span class="jzv-itemText"><span class="jzv-kicker">${esc(w.bonus)} #${i + 1}</span><span class="jzv-itemName">${name}</span><span class="jzv-itemCount">${esc(COUNTS[l(c)][i])}</span></span><span class="jzv-itemValue">${worth(v, c)} ${esc(w.value)}</span></li>`;
    })
    .join("\n");
  return `<div class="jz" id="buy"><section class="jz-sec jz-order"><div class="jz-wrap">
<div class="jz-secHead"><h2 class="jz-h2">${esc(fill(w.summaryTitle, c))}</h2></div>
<div class="jzv-stack">
<div class="jzv-main"><div class="jzv-mainBox"><span class="jzv-ribbon">${worth(KIT_VALUE, c)} ${esc(w.value)}</span><img src="${IMG}kit-box-v3-640.webp" width="640" height="824" alt="MIDI Drum Kit" loading="lazy" decoding="async"></div>
<div><p class="jzv-kicker">${esc(w.kit)}</p><p class="jzv-mainName">MIDI Drum Kit</p>${ticks(c.stack.items.map(bold), "jz-stack")}</div></div>
<ol class="jzv-list">
${bonuses}
</ol>
<div class="jzv-total"><span class="jzv-bracket" aria-hidden="true"></span><p class="jzv-totalLine">${esc(w.total)} <span>${worth(total, c)}</span></p><p class="jzv-today"><span class="jzv-todayLabel">${esc(w.today)}</span><s class="jzv-old">${worth(total, c)}</s><span class="jzv-now">${priceOf(c)}</span></p><p class="jzv-save">${esc(w.save)} ${worth(total - c.price, c)}</p></div>
</div>
<div class="jz-ctaBlock">${key(c, w.pay)}</div>
<ul class="jz-payList"><li>${TICK} ${esc(w.payWays)}</li><li>${TICK} ${esc(w.download)}</li><li>${SHIELD} ${esc(c.stack.guarantee)}</li></ul>
</div></section></div>
`;
}

/** The reviews as the Jazz page sets them: stars, the quote, the name and role, no cards and no faces. The old page's sixteen. */
export function reviews(c: JazzCtx): string {
  const items: string[] = [];
  for (let k = 191; k <= 236; k += 3) {
    const [quote, name, role] = [k, k + 1, k + 2].map((n) => plain(c.words(`t${n}`)));
    if (!quote) continue;
    items.push(`<li class="jzr-item"><span class="jzr-stars" role="img" aria-label="${esc(WORDS[l(c)].stars)}">★★★★★</span><p class="jzr-quote">${quote}</p><p class="jzr-who"><b>${name}</b><span class="jzr-role">${role}</span></p></li>`);
  }
  return `<div class="jz"><section class="jz-sec"><div class="jz-wrap">
<div class="jz-secHead"><h2 class="jz-h2">${c.words("t189")}</h2><p class="jz-sub">${c.words("t190")}</p></div>
<ul class="jzr-grid">
${items.join("\n")}
</ul>
<div class="jz-ctaBlock">${key(c)}</div>
</div></section></div>
`;
}

/** The license card and what the license lets a buyer do: a panel after the bonuses (first asked "higher up" than the page's end, then "show it after the bonuses"). */
export function license(c: JazzCtx): string {
  const w = WORDS[l(c)];
  return `<div class="jz dk-license"><div class="jz-guarantee jz-panel jz-two dk-foil"><div class="jz-twoBody jz-licenseArt"><img src="${IMG}dk-license-640.webp" srcset="${IMG}dk-license-640.webp 640w, ${IMG}dk-license-900.webp 900w" sizes="(min-width: 1000px) 420px, 90vw" width="1168" height="880" alt="${esc(w.licenseAlt)}" loading="lazy" decoding="async"></div>
<div class="jz-twoHead"><p class="dk-eyebrow">${esc(w.licenseTag)}</p><h2 class="jz-h2">${esc(w.licenseTitle)}</h2><p class="jz-sub">${esc(w.licenseText)}</p></div></div></div>
`;
}

/** The questions, as the Jazz page sets them (one line each, + to open): the old page's four and FAQ's, then the key. */
export function faq(c: JazzCtx): string {
  const old = [242, 244, 246, 248].map((k) => ({ q: plain(c.words(`t${k}`)), a: c.words(`t${k + 1}`) })).filter((x) => x.q);
  const more = FAQ[l(c)];
  const items: { q: string; a: string }[] = [];
  for (let i = 0; i <= old.length; i++) {
    for (const m of more) if (m.at === i) items.push({ q: esc(m.q), a: esc(fill(m.a, c)) });
    if (i < old.length) items.push(old[i]);
  }
  return `<div class="jz"><section class="jz-sec dk-faq"><div class="jz-wrap jz-col">
<div class="jz-secHead"><h2 class="jz-h2">${c.words("t241")}</h2></div>
<div class="jz-faq">
${items.map((x) => `<details><summary>${x.q}</summary><p>${x.a}</p></details>`).join("\n")}
</div>
<div class="jz-ctaBlock">${key(c)}</div>
</div></section></div>
`;
}

/** The guarantee as the Jazz page's panel: the seal, the old page's words (t252–t254), and its promise as three steps ("remake the Risk Free section"). */
export function guarantee(c: JazzCtx): string {
  const w = WORDS[l(c)];
  const seal = `<svg class="jz-seal" viewBox="0 0 200 200" role="img" aria-label="${esc(w.sealAlt)}"><defs><linearGradient id="dk-seal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb866"/><stop offset=".5" stop-color="#f5851f"/><stop offset="1" stop-color="#c85a06"/></linearGradient><path id="dk-seal-arc" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0"/></defs><circle cx="100" cy="100" r="98" fill="url(#dk-seal)"/><circle cx="100" cy="100" r="88" fill="#0d0c10"/><circle cx="100" cy="100" r="60" fill="none" stroke="url(#dk-seal)" stroke-width="1.5"/><text class="jz-sealRing" fill="#ffa13d"><textPath href="#dk-seal-arc" textLength="462">${esc(w.sealRing)}</textPath></text><text x="100" y="108" text-anchor="middle" class="jz-sealDays" fill="#ffa13d">14</text><text x="100" y="134" text-anchor="middle" class="jz-sealUnit" fill="#fff">${esc(w.sealDays)}</text></svg>`;
  const steps = STEPS[l(c)].map((s, i) => `<li><b>${i + 1}</b><span>${esc(s)}</span></li>`).join("");
  return `<div class="jz"><section class="jz-sec dk-guar"><div class="jz-wrap">
<div class="jz-guarantee jz-panel jz-two dk-foil"><div class="jz-sealWrap jz-twoBody">${seal}</div>
<div class="jz-twoHead"><p class="dk-eyebrow">${plain(c.words("t253"))}</p><h2 class="jz-h2">${c.words("t252")}</h2><p class="jz-sub">${c.words("t254")}</p><ol class="dk-steps">${steps}</ol></div></div>
</div></section></div>
`;
}

/** The last section over the picture of the box in the studio, and the footer. */
export function finale(c: JazzCtx): string {
  return `<div class="jz"><section class="jz-sec jz-final"><div class="jz-finalBg" aria-hidden="true"><img src="${IMG}dk-stage-900.webp" srcset="${IMG}dk-stage-900.webp 900w, ${IMG}dk-stage-1344.webp 1344w" sizes="100vw" width="1344" height="576" alt="" loading="lazy" decoding="async"></div>
<div class="jz-wrap jz-finalIn"><h2 class="jz-h2">${c.words("t256")}</h2><p class="jz-sub">${c.words("t257")}</p><div class="jz-ctaBlock">${key(c, undefined, c.words("t260"))}</div></div></section>
<footer class="jz-footer"><p>${c.words("t262")}</p><p class="jz-legal">${c.words("t261")}</p></footer></div>
`;
}

/** The styles of this file's sections that the Jazz page doesn't have (./landingNew.ts adds them after JAZZ_CSS). */
export const JAZZ_MORE_CSS = `
/* the hero's headline in the Jazz page's face at its weight: the old page's words carry their own spans */
.jz-heroHead *{font-family:inherit!important;font-weight:inherit!important;letter-spacing:inherit!important}
.dk-eyebrow{margin-bottom:10px;font:700 13px/1.3 var(--font-display),sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ff9a2e}
.dk-cta{padding:8px 0 0}
.dk-cta .jz-ctaBlock{margin-top:20px}
/* every key the same width on a phone, whatever box it sits in (they were 288 to 355px wide) */
@media (max-width:719px){.jz-ctaBlock,.jz-heroCta{position:relative;left:50%;width:calc(100vw - 36px);max-width:512px;translate:-50% 0}}

/* the comparison chart: the kit's column first, wide, in the button's orange; the others small, their words white ("they're too dark") */
.dkx-row{display:grid;grid-template-columns:minmax(0,1.8fr) repeat(3,minmax(0,1fr));gap:0 6px}
.dkx-corner{display:none}
.dkx-head{position:sticky;top:var(--dk-top,0px);z-index:4;align-items:stretch;padding:10px 0 4px;background:#070707}
.dkx-col{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:0 2px 6px;font:700 10.5px/1.2 var(--font-display),sans-serif;letter-spacing:.05em;text-transform:uppercase;text-align:center;color:#fff}
.dkx-col.dkx-win{flex-direction:row;justify-content:flex-start;gap:8px;padding:8px 10px;border-radius:10px;background:linear-gradient(180deg,#ffa13d,#f5851f 55%,#dd6408);box-shadow:0 10px 28px -12px rgba(236,106,12,.7);text-align:left;color:#1a0d00}
.dkx-col.dkx-win b{font:800 16px/1.1 var(--font-display),sans-serif;letter-spacing:-.01em;text-transform:none}
.dkx-box{flex:none;width:36px!important;height:auto;filter:drop-shadow(0 4px 6px rgba(0,0,0,.45))}
.dkx-label{grid-column:1/-1;padding:18px 2px 8px;font:700 16px/1.3 var(--font-display),sans-serif;color:#fff}
.dkx-cell{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:10px;background:#0d0c10;font-size:11.5px;line-height:1.3;text-align:center;color:#fff}
.dkx-cell .jz-mark{width:24px;height:24px}
.dkx-cell.dkx-win{align-items:flex-start;gap:8px;padding:11px 10px 12px;background:#2a1808;box-shadow:inset 0 0 0 1.5px #f5851f;font-size:14px;font-weight:700;text-align:left;color:#fff}
.dkx-cell.dkx-win .jz-mark{color:#06210f;background:#3fd16b;box-shadow:0 0 14px rgba(63,209,107,.45)}
.dkx-no .jz-mark{color:#ff8a73;background:rgba(224,87,63,.24)}
@media (min-width:860px){
.dkx-row{grid-template-columns:minmax(0,1.2fr) minmax(0,1.5fr) repeat(3,minmax(0,1fr));gap:0 10px;margin-top:8px}
.dkx-corner{display:block}
.dkx-head{position:static;padding:0;align-items:end}
.dkx-col{padding:0 6px 12px;font-size:13px}
.dkx-col.dkx-win{flex-direction:column;align-items:center;justify-content:flex-end;gap:10px;padding:18px 12px 16px;border-radius:14px;text-align:center}
.dkx-col.dkx-win b{font-size:26px}
.dkx-box{width:88px!important}
.dkx-label{grid-column:auto;display:flex;align-items:center;padding:0 12px 0 0;font-size:18px}
.dkx-cell{flex-direction:row;justify-content:flex-start;gap:10px;padding:14px;font-size:14px;text-align:left}
.dkx-cell.dkx-win{align-items:center;gap:12px;padding:14px 18px;font-size:18px}
.dkx-cell.dkx-win .jz-mark{width:28px;height:28px}
}

/* the questions: a card each */
.dk-faq .jz-faq details{margin-top:8px;padding:0 18px;border-radius:12px;background:#0d0c10}
.dk-faq .jz-faq summary{padding-right:34px;font-size:17px;line-height:1.35}
.dk-faq .jz-faq summary::after{right:0;top:13px}
.dk-faq .jz-faq details p{font-size:16px;line-height:1.55}
.dk-faq .jz-ctaBlock{margin-top:36px}

/* the guarantee's three steps */
.dk-steps{display:grid;gap:8px;margin-top:22px;text-align:left}
.dk-steps li{display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;gap:12px;padding:12px 14px;border-radius:8px;background:#15141a;font-size:15px;font-weight:600;line-height:1.35;color:#fff;overflow-wrap:anywhere}
.dk-steps b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(180deg,#ffa13d,#ec6a0c);font:800 14px/1 var(--font-display),sans-serif;color:#1a0d00}
.dk-guar .jz-sub{margin-top:12px}
.dk-guar .jz-twoHead,.dk-license .jz-twoHead{position:static}
@media (min-width:1000px){.dk-guar .jz-two{grid-template-columns:minmax(0,.42fr) minmax(0,1fr);align-items:center}.dk-guar .jz-twoHead{grid-column:2}.dk-guar .jz-twoBody{grid-column:1}.dk-guar .jz-seal{width:220px;height:220px}}

/* the license card, in the kit's own section */
.dk-license{max-width:1083px;margin:64px auto 8px}
.dk-license .jz-twoBody{width:100%}
.dk-license .jz-licenseArt{background:#0d0c10}
.dk-license .jz-licenseArt img{max-width:340px}
@media (min-width:1000px){.dk-license .jz-two{grid-template-columns:minmax(0,.8fr) minmax(0,1fr);align-items:center}.dk-license .jz-twoHead{grid-column:2}.dk-license .jz-twoBody{grid-column:1}.dk-license .jz-licenseArt img{max-width:420px}}
`;
