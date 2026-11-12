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
    tag: "1050 MIDI files",
    inner: "{price} · instant download",
    worksIn: "Works in",
    daws: "Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Studio One, Reason, Reaper, GarageBand and more",
    compareTitle: "Other ways to get drums that bounce.",
    summaryTitle: "1050 MIDI drum patterns + 616 more MIDI files in the bonuses. Today {price}.",
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
    stars: "5 stars",
  },
  it: {
    tag: "1050 file MIDI",
    inner: "{price} · download immediato",
    worksIn: "Funziona in",
    daws: "Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Studio One, Reason, Reaper, GarageBand e altre",
    compareTitle: "Gli altri modi per avere una batteria con il bounce.",
    summaryTitle: "1050 pattern di batteria MIDI + altri 616 file MIDI nei bonus. Oggi {price}.",
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
    stars: "5 stelle",
  },
};
const TICKS: Record<L, string[]> = {
  en: ["Any DAW", "Drag & drop", "14-day quality guarantee"],
  it: ["Qualsiasi DAW", "Drag & drop", "Garanzia di qualità di 14 giorni"],
};

// The comparison chart: three other ways to get drums into a beat against the kit. Every cell says
// what that way is, nothing about anyone's product. ok: true ✓, false ✗, null –.
type Cell = { ok: boolean | null; text: string };
const CHART: Record<L, { cols: string[]; rows: { label: string; cells: Cell[] }[] }> = {
  en: {
    cols: ["Program every hit", "Audio drum loops", "Free MIDI packs", "MIDI Drum Kit"],
    rows: [
      { label: "Your own drum sounds", cells: [{ ok: true, text: "Yes" }, { ok: false, text: "The sound is baked in" }, { ok: true, text: "Yes" }, { ok: true, text: "Any kit, any sampler" }] },
      { label: "Change any note, any tempo", cells: [{ ok: true, text: "Yes" }, { ok: false, text: "Stretch it, slice it" }, { ok: true, text: "Yes" }, { ok: true, text: "It’s MIDI: move what you want" }] },
      { label: "Each drum on its own", cells: [{ ok: true, text: "You write each one" }, { ok: false, text: "One mixed file" }, { ok: null, text: "Depends on the pack" }, { ok: true, text: "A folder per drum, plus complete beats" }] },
      { label: "Fills and rolls ready to drop in", cells: [{ ok: false, text: "You draw every roll" }, { ok: false, text: "No" }, { ok: null, text: "Rarely" }, { ok: true, text: "250+ fragments" }] },
      { label: "A beat going in minutes", cells: [{ ok: false, text: "Hit by hit" }, { ok: true, text: "Yes" }, { ok: null, text: "After you sort them" }, { ok: true, text: "Drag, drop, done" }] },
      { label: "What it costs", cells: [{ ok: false, text: "Your time, on every beat" }, { ok: null, text: "A pack or a subscription" }, { ok: true, text: "Nothing" }, { ok: true, text: "{price} once" }] },
    ],
  },
  it: {
    // short: on a phone each of the first three columns is some 50px wide
    cols: ["Tutto a mano", "Loop audio", "MIDI gratis", "MIDI Drum Kit"],
    rows: [
      { label: "I tuoi suoni di batteria", cells: [{ ok: true, text: "Sì" }, { ok: false, text: "Il suono è già dentro" }, { ok: true, text: "Sì" }, { ok: true, text: "Qualsiasi kit, qualsiasi sampler" }] },
      { label: "Cambi ogni nota e il tempo", cells: [{ ok: true, text: "Sì" }, { ok: false, text: "Devi stirarlo e tagliarlo" }, { ok: true, text: "Sì" }, { ok: true, text: "È MIDI: sposti quello che vuoi" }] },
      { label: "Ogni pezzo della batteria da solo", cells: [{ ok: true, text: "Li scrivi uno per uno" }, { ok: false, text: "Un unico file mixato" }, { ok: null, text: "Dipende dal pack" }, { ok: true, text: "Una cartella per pezzo, più i beat completi" }] },
      { label: "Fill e roll pronti da inserire", cells: [{ ok: false, text: "Ogni roll lo disegni tu" }, { ok: false, text: "No" }, { ok: null, text: "Di rado" }, { ok: true, text: "250+ frammenti" }] },
      { label: "Un beat che gira in pochi minuti", cells: [{ ok: false, text: "Un colpo alla volta" }, { ok: true, text: "Sì" }, { ok: null, text: "Dopo averli ordinati" }, { ok: true, text: "Trascini, rilasci, fatto" }] },
      { label: "Quanto costa", cells: [{ ok: false, text: "Il tuo tempo, a ogni beat" }, { ok: null, text: "Un pack o un abbonamento" }, { ok: true, text: "Niente" }, { ok: true, text: "{price} una volta" }] },
    ],
  },
};

// What each bonus holds, in the summary's list (counted from the files buyers download).
const COUNTS: Record<L, string[]> = {
  en: ["50 multi-track MIDI beats", "355 MIDI files", "281 WAV one-shots", "211 MIDI files", "17 WAV hooks", "PDF, 5 pages"],
  it: ["50 beat MIDI multitraccia", "355 file MIDI", "281 one-shot WAV", "211 file MIDI", "17 hook WAV", "PDF, 5 pagine"],
};
const COVERS = ["famous", "starters", "drums", "grooves", "hooks", "guide"];
/** The kit's value in the offer: the old picture's (tools/value_stack.py KIT). */
const KIT_VALUE = STACK_VALUES.total - STACK_VALUES.bonuses.reduce((a, b) => a + b, 0);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;|[ ​‌]/g, " ").replace(/\s+/g, " ").trim();
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

const ticks = (items: string[], cls: string) => `<ul class="${cls}">${items.map((t) => `<li>${TICK}<span>${t}</span></li>`).join("")}</ul>`;

/** The hero: wordmark and tag, pre-title, headline, sub, the video, the benefits in two columns, the key, the DAWs, three real numbers. */
export function hero(c: JazzCtx, video: string): string {
  const w = WORDS[l(c)];
  const bullets = ["t005", "t006", "t007", "t008", "t009", "t010"].map((k) => c.words(k));
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

/** The comparison chart (Jazz: "Other ways to get jazz voicings."). */
export function compare(c: JazzCtx): string {
  const w = WORDS[l(c)];
  const chart = CHART[l(c)];
  const last = chart.cols.length - 1;
  const head = chart.cols
    .map((col, i) => `<span role="columnheader" class="jz-chHead${i === last ? " jz-chWin" : ""}">${i === last ? `<img class="jz-chBox" src="${IMG}kit-box-v3-160.webp" width="160" height="206" alt="" loading="lazy" decoding="async">` : ""}<span>${esc(col)}</span></span>`)
    .join("");
  const rows = chart.rows
    .map(
      (row) =>
        `<div class="jz-chRow" role="row"><span role="rowheader" class="jz-chLabel">${esc(row.label)}</span>${row.cells
          .map((cell, i) => `<span role="cell" class="jz-chCell${i === last ? " jz-chWin" : ""}">${cell.ok === true ? MARKS.yes : cell.ok === false ? MARKS.no : MARKS.meh}<span${i === last ? "" : ' class="jz-chAlt"'}>${esc(fill(cell.text, c))}</span></span>`)
          .join("")}</div>`,
    )
    .join("\n");
  return `<div class="jz"><section class="jz-sec jz-band"><div class="jz-wrap">
<div class="jz-secHead"><h2 class="jz-h2">${esc(w.compareTitle)}</h2></div>
<div class="jz-chart" role="table" aria-label="${esc(w.compareTitle)}" style="--alts:${last}"><span class="jz-chWinBg" aria-hidden="true"></span>
<div class="jz-chRow" role="row"><span class="jz-chCorner" role="columnheader"></span>${head}</div>
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

/** The license card and what the license lets a buyer do, as under the Jazz page's guarantee. */
export function license(c: JazzCtx): string {
  const w = WORDS[l(c)];
  return `<div class="jz"><section class="jz-sec dk-licenseSec"><div class="jz-wrap">
<div class="jz-guarantee jz-two jz-license"><div class="jz-twoBody jz-licenseArt"><img src="${IMG}dk-license-640.webp" srcset="${IMG}dk-license-640.webp 640w, ${IMG}dk-license-900.webp 900w" sizes="(min-width: 1000px) 420px, 90vw" width="1168" height="880" alt="${esc(w.licenseAlt)}" loading="lazy" decoding="async"></div>
<div class="jz-twoHead"><h2 class="jz-h2">${esc(w.licenseTitle)}</h2><p class="jz-sub">${esc(w.licenseText)}</p></div></div>
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
