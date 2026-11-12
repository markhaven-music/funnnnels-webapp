import type { Currency } from "@/lib/geo";
import clips from "@/public/funnels/midi-drum-kit/player/v3/clips.json";
import type { Lang } from "./i18n";
import { CLIENT_JS } from "./landingNewClient";
import { STACK_VALUES } from "./stackSwitch";

// The new MIDI Drum Kit landing (B of the landing test, ./landingTest.ts), made from the old page's
// HTML so the two differ only in what was asked.
// 2026-11-12: "generare una nuova grafica per le boxes", "rendere la pagina più simile a Jazz MIDI
// Pack a livello di grandezze della headline", "implementare anche il player che ti fa sentire i midi".
// Same day, after a first look: "put the player earlier in the page", "find a clever way to also let
// the users audition the fragments and other files on the pack", "i want them to audition the bonuses,
// just like MIDI Jazz Pack", the bonuses "more like the MIDI Jazz Pack page in all aspects",
// "reorganize the list of folders so it doesnt scroll too long", the player "highly usable on mobile",
// and the first iridescent look (a blurred glow and a gradient edge) not liked.
//   - the boxes: kit-box-v3 (Marco's, Higgsfield GPT Image 2.6 Sunburst), the folders' box3-* in its
//     style, boxes-all-v3, value-stack-7 (tools/value_stack.py v3);
//   - the headlines at the Jazz landing's sizes (jazz-midi-pack/jazz.module.css .heroHead, .h2);
//   - the player right after the hero: all 11 folders, every file (tools/drum_player_data.py →
//     player/v3), single parts over a simple beat of the kit's own files (./landingNewClient.ts);
//   - the ten folder panels as one short list, a play button each (it drives the player);
//   - the bonuses as the Jazz page's (jazz-midi-pack/bonus.module.css): cover, "Bonus 1 · $197 Free",
//     name, text, what's inside counted from the files, and something to play;
//   - the iridescent light of the box as its real texture (iris-streaks, iris-foil: made from the
//     box with the same model): streaks in a panel's top right corner and a thin foil band on its top edge.

const IMG = "/funnels/midi-drum-kit/";
const V2 = `${IMG}player/v3/`;

const HERO = ".id-6Z-Renrye-167";
const H2 = [
  "id-6Z-DBZeEl-6", "id-6Z-yxj4QX-14", "id-6Z-dOX4QP-356", "id-6Z-nx4Nj9-159", "id-6Z-wzeml9-858", "id-6Z-mRX4MN-452",
  "id-6Z-wzeml9-5058", "id-6Z-kBro4X-76", "id-6Z-jLXXba-312", "id-6Z-dO4RNz-22", "id-6Z-dO4RNz-397", "id-6Z-dO4RNz-1822",
  "id-6Z-jLXXba-658", "id-6Z-dO4RNz-1942",
].map((id) => `.${id}`);
// The old page's dark panels that stay on this one: Introducing, the science box, Patterns, Fragments, the folder tree.
const CARDS = ["id-6Z-WOaYBj-1502", "id-6Z-wzeml9-854", "id-6Z-lLXzjA-420", "id-6Z-lLXzjA-450", "id-6Z-lLXzjA-209"].map((id) => `.${id}`);
const FOIL = [...CARDS, ".dk-foil"];

const DISPLAY = 'Poppins,"Poppins Fallback",sans-serif';
const BODY = 'Inter,"Inter Fallback",sans-serif';
const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";

const CSS = `
${HERO} .elHeadline{font-family:${DISPLAY}!important;font-size:clamp(30px,6.4vw,52px)!important;font-weight:800!important;line-height:1.14!important;letter-spacing:-.015em!important;text-wrap:balance}
${HERO} .elHeadline *{font-family:inherit!important;letter-spacing:inherit!important}
${H2.map((s) => `${s} .elHeadline`).join(",")}{font-family:${DISPLAY}!important;font-size:clamp(29px,5.4vw,46px)!important;font-weight:700!important;line-height:1.14!important;letter-spacing:-.022em!important;text-wrap:balance}
${H2.map((s) => `${s} .elHeadline *`).join(",")}{font-family:inherit!important;letter-spacing:inherit!important}

${FOIL.join(",")}{position:relative;isolation:isolate;overflow:hidden}
${FOIL.map((s) => `${s}::before`).join(",")}{content:"";position:absolute;z-index:-1;top:0;right:0;width:min(420px,68%);aspect-ratio:720/309;background:url(${IMG}iris-streaks-2.webp) right top/cover no-repeat;-webkit-mask:radial-gradient(115% 130% at 100% 0,#000 8%,rgba(0,0,0,.45) 42%,transparent 72%);mask:radial-gradient(115% 130% at 100% 0,#000 8%,rgba(0,0,0,.45) 42%,transparent 72%);opacity:.5;pointer-events:none}
${FOIL.map((s) => `${s}::after`).join(",")}{content:"";position:absolute;z-index:1;top:0;left:0;right:0;height:3px;background:url(${IMG}iris-foil-2.webp) center/cover no-repeat;pointer-events:none}

/* The old page's reset gives every element margin: 0 auto, which shrinks and centres a grid or flex child. */
.dkp-sec *,.dkf *,.dkb *{margin-left:0;margin-right:0}
.dk-play{position:relative;flex:none;display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:linear-gradient(180deg,#ffe14d,#f5b800);color:#1a1206;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dk-play svg{width:18px;height:18px;pointer-events:none}
.dk-play[data-state=loading]{opacity:.6;cursor:progress}

.dkp-sec{width:100%;box-sizing:border-box;background:#000;padding:64px 16px 72px;color:#fff;font-family:${BODY}}
.dkp-wrap{max-width:920px;margin:0 auto}
.dkp-h2{margin:0 auto;max-width:820px;text-align:center;font-family:${DISPLAY};font-size:clamp(29px,5.4vw,46px);font-weight:700;line-height:1.14;letter-spacing:-.022em;text-wrap:balance}
.dkp-sub{margin:16px auto 0;max-width:680px;text-align:center;font-size:clamp(16px,2vw,18px);line-height:1.5;color:rgba(255,255,255,.72)}
.dkp-panel{min-width:0;margin-top:32px;background:#0d0c10;border-radius:12px;padding:20px 20px 16px;text-align:left}
.dkp-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px;-webkit-overflow-scrolling:touch}
.dkp-chips::-webkit-scrollbar{display:none}
.dkp-chips+.dkp-chips{margin-top:8px}
.dkp-chip{flex:none;min-height:44px;padding:0 14px;border:0;border-radius:3px;background:#1c1b22;color:rgba(255,255,255,.78);font:600 14px/1 ${BODY};white-space:nowrap;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkp-chip i{font:500 11px/1 ${MONO};font-style:normal;opacity:.6;margin-left:4px}
.dkp-chip[aria-selected=true]{background:#f5b800;color:#1a1206;font-weight:700}
[data-row=groups] .dkp-chip{min-height:40px;background:none;color:rgba(255,255,255,.62)}
[data-row=groups] .dkp-chip[aria-selected=true]{background:#2a2932;color:#fff}
.dkp-head{margin-top:18px;min-height:46px}
.dkp-title{font:700 18px/1.25 ${DISPLAY}}
.dkp-meta{margin-top:3px;font:500 12px/1.3 ${MONO};color:rgba(255,255,255,.55)}
.dkp-roll{display:block;width:100%;height:140px;margin-top:12px;border-radius:4px;background:#08070a}
.dkp-bar{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px;margin-top:14px}
.dkp-step{min-height:52px;padding:0 8px;white-space:nowrap;border:0;border-radius:3px;background:#f5b800;color:#1a1206;font:700 15px/1 ${BODY};cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkp-bar .dk-play{width:64px;height:64px}
.dkp-bar .dk-play svg{width:26px;height:26px}
.dkp-foot{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px}
.dkp-panel [hidden]{display:none!important}
.dkp-beat,.dkp-reset{min-height:40px;padding:0 14px;border:0;border-radius:3px;background:none;color:rgba(255,255,255,.62);font:700 13px/1 ${BODY};cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkp-beat[aria-pressed=true]{background:#2a2932;color:#fff}
.dkp-reset{text-decoration:underline;text-underline-offset:3px}
.dkp-hint{margin:6px 0 0;font-size:13px;line-height:1.45;color:rgba(255,255,255,.55)}
.dkp-file{margin-top:12px;font:500 11px/1.5 ${MONO};color:rgba(255,255,255,.45);overflow-wrap:anywhere}
.dkp-file b{margin-right:6px;color:#f5b800;font-weight:600;letter-spacing:.12em}
.dkp-cta{display:block;width:fit-content;max-width:100%;margin:32px auto 0;padding:20px 40px;border-radius:999px;background:linear-gradient(180deg,#ffa13d,#ec6a0c);border:1px solid #b04c05;box-shadow:0 8px 28px rgba(236,106,12,.45),inset 0 1px 0 rgba(255,255,255,.45);color:#fff;font:800 clamp(17px,2.2vw,21px)/1.2 ${DISPLAY};text-align:center;text-decoration:none;text-shadow:0 1px 2px rgba(0,0,0,.35)}

.dkf{display:grid;gap:10px;width:100%;max-width:1083px;margin:28px auto 56px;padding:0;list-style:none;text-align:left;font-family:${BODY};color:#fff}
.dkf li{width:100%;box-sizing:border-box;display:grid;grid-template-columns:72px minmax(0,1fr) 48px;align-items:center;gap:14px;padding:12px 14px 12px 12px;border-radius:12px;background:#0d0c10}
.dkf img{display:block;width:72px;height:72px;object-fit:contain}
.dkf h3{margin:0;font:700 17px/1.25 ${DISPLAY};color:#fff}
.dkf p{margin:3px 0 0;font-size:14px;line-height:1.4;color:rgba(255,255,255,.72)}
.dkf span{display:block;margin-top:4px;font:500 11px/1.3 ${MONO};color:#f5b800}
.dkf .dk-play{width:48px;height:48px}

.dkb{display:grid;gap:48px;width:100%;max-width:1083px;margin:32px auto 0;padding:0;list-style:none;text-align:left;font-family:${BODY};color:#fff}
.dkb>li{width:100%;box-sizing:border-box;display:grid;gap:18px;padding:24px 22px 28px;border-radius:12px;background:#0d0c10}
.dkb-cover{max-width:300px;margin:0 auto}
.dkb-cover img{display:block;width:100%;height:auto;filter:drop-shadow(0 12px 18px rgba(0,0,0,.55))}
.dkb-label{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin:0;font:700 12px/1.2 ${DISPLAY};letter-spacing:.14em;text-transform:uppercase;color:#f5b800}
.dkb-price{padding:4px 8px 3px;border-radius:3px;background:linear-gradient(180deg,#ffe14d,#f5b800);font-weight:800;letter-spacing:.08em;color:#1a1206}
.dkb-price s{margin-right:3px;font-weight:700;opacity:.6}
.dkb h3{margin:8px 0 0;font:700 18px/1.28 ${DISPLAY};letter-spacing:-.01em;color:#fff}
.dkb-text{margin:10px 0 0;font-size:15px;line-height:1.5;color:rgba(255,255,255,.88)}
.dkb-inside{display:grid;gap:6px;margin:10px 0 0;padding:0;list-style:none;font-size:15px;font-weight:600;line-height:1.4;color:#fff}
.dkb-inside li{width:100%;box-sizing:border-box;text-align:left;display:grid;grid-template-columns:18px minmax(0,1fr);gap:8px;align-items:start}
.dkb-inside svg{width:16px;height:16px;margin-top:3px;color:#22c55e}
.dkb-preview{min-width:0}
.dkb-note{margin:0 0 10px;font-size:13px;color:rgba(255,255,255,.55)}
.dkb-rolls,.dkb-clips{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.dkb-rolls>li,.dkb-clips>li{width:100%;min-width:0;box-sizing:border-box}
.dkb-rolls{min-height:660px}
.dkr{border-radius:4px;background:#15141a;overflow:hidden}
.dkr-head{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:12px;padding:10px 14px 10px 10px}
.dkr-head b{display:block;font:700 15px/1.25 ${BODY};color:#fff;overflow-wrap:anywhere}
.dkr-head span{display:block;margin-top:2px;font:500 11px/1.3 ${MONO};color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dkr canvas{display:block;width:100%;height:60px;background:#0b0a0e}
.dkc{display:grid;grid-template-columns:44px minmax(96px,auto) minmax(0,1fr);grid-template-areas:"ico name wave" "ico bpm wave";column-gap:12px;align-items:center;width:100%;min-height:60px;padding:8px 14px 8px 8px;border:0;border-radius:4px;background:#15141a;color:#fff;font:inherit;text-align:left;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkc[aria-pressed=true]{background:rgba(245,184,0,.14)}
.dkc-ico{grid-area:ico;position:relative;width:44px;height:44px;border-radius:50%;background:linear-gradient(180deg,#ffe14d,#f5b800)}
.dkc-ico::after{content:"";position:absolute;top:50%;left:54%;translate:-50% -50%;border-left:13px solid #1a1206;border-top:8px solid transparent;border-bottom:8px solid transparent}
.dkc[aria-pressed=true] .dkc-ico::after{inset:15px;left:15px;top:15px;translate:none;border:0;border-radius:2px;background:#1a1206}
.dkc-name{grid-area:name;font-size:14px;font-weight:700;line-height:1.2}
.dkc-bpm{grid-area:bpm;font:500 12px/1.3 ${MONO};color:rgba(255,255,255,.55)}
.dkc svg{grid-area:wave;display:block;width:100%;height:34px}
.dkc rect{fill:rgba(255,255,255,.28)}
.dkc rect.on{fill:#ffe14d}
.dkpads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.dkpad{min-height:64px;padding:8px 6px;border:0;border-radius:4px;background:#1c1b22;color:#fff;font:700 14px/1.2 ${BODY};cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.dkpad small{display:block;margin-top:4px;font:500 10px/1.2 ${MONO};color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dkpad:active{background:#f5b800;color:#1a1206}
.dkpad.hit{animation:dkpad .28s ease-out}
@keyframes dkpad{from{background:#f5b800}to{background:#1c1b22}}

@media (max-width:640px){.dkp-sec{padding:48px 12px 56px}.dkp-panel{padding:14px 14px 12px;margin-top:24px}.dkp-chips{margin:0 -14px;padding:0 14px}.dkp-cta{padding:18px 26px}}
@media (min-width:720px){.dkp-bar{max-width:560px;margin-left:auto;margin-right:auto}.dkb-rolls,.dkb-clips{grid-template-columns:repeat(2,minmax(0,1fr))}.dkb-rolls{min-height:390px}.dkpads{grid-template-columns:repeat(4,minmax(0,1fr))}.dkf{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
@media (min-width:1000px){.dkb{gap:72px}.dkb>li{grid-template-columns:minmax(0,.42fr) minmax(0,.58fr);align-items:start;gap:0 56px;padding:44px 48px}.dkb-cover{grid-row:1/span 2;max-width:none;position:sticky;top:28px}.dkb-label{font-size:14px}.dkb h3{margin-top:10px;font-size:30px}.dkb-text{margin-top:14px;font-size:18px}.dkb-inside{gap:8px;margin-top:14px;font-size:17px}.dkb-preview{grid-column:2;margin-top:30px}.dkb>li.bare .dkb-preview{display:none}}
`;

type L = "en" | "it";
const WORDS: Record<L, Record<string, string>> = {
  en: {
    h2: "Press play. Hear the kit before you get it.",
    sub: "All 11 folders of the kit are in this player, with their real MIDI files, played with the Hit-Maker Drums bonus sounds. In your DAW they play whatever drums you load.",
    hint: "A single part plays over a simple beat made of the kit’s own files. Play a kick, a snare or a hat pattern and it stays in the beat while you try the rest.",
    play: "Play",
    stop: "Stop",
    loading: "Loading the sounds…",
    prev: "Previous",
    next: "Next",
    beatOn: "Beat on",
    beatOff: "Beat off",
    reset: "Start over",
    of: "of",
    inKit: "In the kit",
    files: "MIDI files",
    hear: "Play a file of this folder",
    cta: "Get The MIDI Drum Kit",
    rows: "808,Kick,Snare,Clap,Rim,Hat,Open hat,Perc",
    base: "Base Rhythms",
    baseText: "Straight and triplet hi-hats in 4ths, 8ths, 16ths and 32nds, four bars each.",
    bonus: "Bonus",
    free: "Free",
    pads: "Tap a pad to hear it.",
  },
  it: {
    h2: "Premi play. Ascolta il kit prima di prenderlo.",
    sub: "In questo player ci sono tutte le 11 cartelle del kit, con i loro file MIDI veri, suonati con i suoni del bonus Hit-Maker Drums. Nella tua DAW suonano con la batteria che carichi tu.",
    hint: "Una parte singola suona sopra un beat semplice fatto con i file del kit. Fai partire un pattern di kick, snare o hi-hat e resta nel beat mentre provi il resto.",
    play: "Play",
    stop: "Stop",
    loading: "Carico i suoni…",
    prev: "Indietro",
    next: "Avanti",
    beatOn: "Beat on",
    beatOff: "Beat off",
    reset: "Ricomincia",
    of: "di",
    inKit: "Nel kit",
    files: "file MIDI",
    hear: "Ascolta un file di questa cartella",
    cta: "Prendi il MIDI Drum Kit",
    rows: "808,Kick,Snare,Clap,Rim,Hat,Open hat,Perc",
    base: "Base Rhythms",
    baseText: "Hi-hat dritti e in terzine in quarti, ottavi, sedicesimi e trentaduesimi, quattro battute ciascuno.",
    bonus: "Bonus",
    free: "Gratis",
    pads: "Tocca un pad per sentirlo.",
  },
};
// The groups' names as the kit's folders have them, and in Italian as the page calls them.
const GROUPS: Record<L, Record<string, string>> = {
  en: {},
  it: { Patterns: "Pattern", Fragments: "Frammenti", Basic: "Base", Complex: "Complessi", "Hyper-Complex": "Ipercomplessi", "Roll Up": "Roll in salita", "Roll Down": "Roll in discesa" },
};

// The kit's folders in the page's order (tools/drum_player_data.py FOLDERS): the copy key of its
// name and of its line on the old page, its box, its files (counted from the zip).
const FOLDERS: { id: string; name: string | null; text: string | null; box: string; n: number }[] = [
  { id: "beats", name: "t071", text: "t073", box: "complete-beats", n: 50 },
  { id: "kick-snare", name: "t106", text: "t107", box: "kick-snare", n: 50 },
  { id: "kick-808", name: "t109", text: "t110", box: "kick-808", n: 55 },
  { id: "kick", name: "t074", text: "t075", box: "kick", n: 104 },
  { id: "snare", name: "t090", text: "t091", box: "snare", n: 120 },
  { id: "hats", name: "t078", text: "t079", box: "hats", n: 263 },
  { id: "open-hats", name: "t103", text: "t104", box: "open-hats", n: 42 },
  { id: "808", name: "t094", text: "t095", box: "808", n: 178 },
  { id: "accents", name: "t098", text: "t099", box: "accents", n: 76 },
  { id: "rolls", name: "t112", text: "t113", box: "rolls", n: 94 },
  { id: "base-rhythms", name: null, text: null, box: "base-rhythms", n: 8 },
];

// The bonuses: the copy keys of the old panel (name with its "BONUS #n:", text), the cover, what is
// inside (counted from the files buyers download) and what there is to play.
type Preview = "famous" | "starters" | "pads" | "dsg" | "hooks" | null;
const BONUSES: { name: string; text: string; cover: string; preview: Preview; inside: Record<L, string[]> }[] = [
  {
    name: "t116", text: "t117", cover: "bonus-famous", preview: "famous",
    inside: {
      en: ["50 multi-track MIDI drum patterns, in 5 volumes", "Kick, snare, clap, hats and percs on their own tracks", "50 MP3 samples"],
      it: ["50 pattern di batteria MIDI multitraccia, in 5 volumi", "Kick, snare, clap, hi-hat e percussioni su tracce separate", "50 sample MP3"],
    },
  },
  {
    name: "t119", text: "t120", cover: "bonus-starters", preview: "starters",
    inside: {
      en: ["355 MIDI files in 7 packs", "Chord progressions, pianos, guitars, melodies, strings and plucks", "371 MP3 previews"],
      it: ["355 file MIDI in 7 pack", "Progressioni di accordi, piani, chitarre, melodie, archi e pluck", "371 anteprime MP3"],
    },
  },
  {
    name: "t122", text: "t123", cover: "bonus-drums", preview: "pads",
    inside: {
      en: ["281 WAV one-shots", "113 snares, 87 hi-hats, 38 kicks, 22 claps, 17 percs, 4 rims"],
      it: ["281 one-shot WAV", "113 snare, 87 hi-hat, 38 kick, 22 clap, 17 percussioni, 4 rim"],
    },
  },
  {
    name: "t263", text: "t264", cover: "bonus-grooves", preview: "dsg",
    inside: {
      en: ["160 drum grooves", "31 groove templates", "20 neo soul keys MIDI files", "PDF guide"],
      it: ["160 groove di batteria", "31 groove template", "20 file MIDI di neo soul keys", "Guida PDF"],
    },
  },
  {
    name: "t266", text: "t267", cover: "bonus-hooks", preview: "hooks",
    inside: { en: ["17 WAV hooks", "From 86 to 160 BPM"], it: ["17 hook WAV", "Da 86 a 160 BPM"] },
  },
  { name: "t269", text: "t270", cover: "bonus-guide", preview: null, inside: { en: ["PDF, 5 pages"], it: ["PDF, 5 pagine"] } },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;|[\u00a0\u200b\u200c]/g, " ").replace(/\s+/g, " ").trim();
const TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

type Words = (key: string) => string;
type Ctx = { lang: L; w: Record<string, string>; words: Words; currency: Currency; order: string };

const folderName = (f: (typeof FOLDERS)[number], c: Ctx) => (f.name ? plain(c.words(f.name)) : c.w.base);

function player(c: Ctx): string {
  const { w } = c;
  const chips = FOLDERS.map((f, i) => `<button class="dkp-chip" type="button" role="tab" aria-selected="${i === 0}" data-f="${i}">${folderName(f, c)}</button>`).join("");
  return `<div class="dkp-sec" id="player"><div class="dkp-wrap">
<h2 class="dkp-h2">${esc(w.h2)}</h2>
<p class="dkp-sub">${esc(w.sub)}</p>
<div class="dkp-panel dk-foil" id="dkp">
<div class="dkp-chips" role="tablist" data-row="folders">${chips}</div>
<div class="dkp-chips" role="tablist" data-row="groups" hidden></div>
<div class="dkp-head"><div class="dkp-title">&nbsp;</div><div class="dkp-meta">&nbsp;</div></div>
<canvas class="dkp-roll" aria-hidden="true"></canvas>
<div class="dkp-bar"><button class="dkp-step" type="button" data-step="-1">‹ ${esc(w.prev)}</button><button class="dk-play dkp-play" type="button" data-state="stopped" aria-label="${esc(w.play)}">${PLAY}</button><button class="dkp-step" type="button" data-step="1">${esc(w.next)} ›</button></div>
<div class="dkp-foot"><button class="dkp-beat" type="button" aria-pressed="true" hidden>${esc(w.beatOn)}</button><button class="dkp-reset" type="button" hidden>${esc(w.reset)}</button></div>
<p class="dkp-hint" hidden>${esc(w.hint)}</p>
<div class="dkp-file"><b>${esc(w.inKit.toUpperCase())}</b>MIDI Drum Kit / <span></span></div>
</div>
<a class="dkp-cta" href="${c.order}" data-cta>${esc(w.cta)}</a>
</div></div>
`;
}

/** The ten folder panels of the old page as one list: box, name, the old panel's line, its files, a play button. */
function folders(c: Ctx): string {
  const rows = FOLDERS.map((f) => {
    const text = f.text ? c.words(f.text).replace(/[\u200b\u200c]/g, " ") : esc(c.w.baseText);
    return `<li><img src="${IMG}box3-${f.box}.webp" width="72" height="72" alt="" loading="lazy" decoding="async"><div><h3>${folderName(f, c)}</h3><p>${text}</p><span>${f.n} ${esc(c.w.files)}</span></div><button class="dk-play" type="button" data-dkf="${f.id}" data-state="stopped" aria-label="${esc(c.w.hear)}">${PLAY}</button></li>`;
  }).join("\n");
  return `<ul class="dkf">\n${rows}\n</ul>\n`;
}

const money = (v: number, c: Ctx) => (c.currency === "usd" ? `$${v}` : c.lang === "it" ? `${v}\u00a0€` : `€${v}`);

type Clip = { name: string; file: string; bpm: number; key?: string; peaks: number[] };
function clipList(kind: "starter" | "hook", list: Clip[]): string {
  const items = list.map((l, i) => {
    const bars = l.peaks.map((p, k) => `<rect x="${k * 4}" y="${(20 - Math.max(2, (p / 100) * 36) / 2).toFixed(1)}" width="2.4" height="${Math.max(2, (p / 100) * 36).toFixed(1)}" rx="1"/>`).join("");
    const meta = `${l.key ? `${esc(l.key)} · ` : ""}${l.bpm} bpm`;
    return `<li><button class="dkc" type="button" aria-pressed="false" data-src="${V2}clips/${kind}-${i + 1}.m4a"><span class="dkc-ico" aria-hidden="true"></span><span class="dkc-name">${esc(l.name)}</span><span class="dkc-bpm">${meta}</span><svg viewBox="0 0 ${l.peaks.length * 4} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg></button></li>`;
  }).join("");
  return `<ul class="dkb-clips">${items}</ul>`;
}

function preview(kind: Preview, c: Ctx): string {
  if (kind === "famous" || kind === "dsg") return `<ol class="dkb-rolls" data-rolls="${kind}"></ol>`;
  if (kind === "starters") return clipList("starter", clips.starters);
  if (kind === "hooks") return clipList("hook", clips.hooks);
  if (kind === "pads") {
    const pads = clips.pads.map((p, i) => `<button class="dkpad" type="button" data-src="${V2}clips/pad-${i + 1}.m4a">${esc(p.name)}<small>${esc(p.file)}</small></button>`).join("");
    return `<p class="dkb-note">${esc(c.w.pads)}</p><div class="dkpads">${pads}</div>`;
  }
  return "";
}

/** The bonuses as the Jazz MIDI Pack page shows them. */
function bonuses(c: Ctx): string {
  const items = BONUSES.map((b, i) => {
    const name = plain(c.words(b.name)).replace(/^BONUS\s*#?\d+\s*:\s*/i, "");
    const inside = b.inside[c.lang].map((x) => `<li>${TICK}<span>${esc(x)}</span></li>`).join("");
    const pre = preview(b.preview, c);
    return `<li class="dk-foil${pre ? "" : " bare"}">
<div class="dkb-cover"><img src="${IMG}${b.cover}.webp" width="900" height="900" alt="" loading="lazy" decoding="async"></div>
<div class="dkb-info"><p class="dkb-label"><span>${esc(c.w.bonus)} ${i + 1}</span><span class="dkb-price"><s>${money(STACK_VALUES.bonuses[i], c)}</s> ${esc(c.w.free)}</span></p>
<h3>${name}</h3>
<p class="dkb-text">${c.words(b.text)}</p>
<ul class="dkb-inside">${inside}</ul></div>
${pre ? `<div class="dkb-preview">${pre}</div>` : ""}
</li>`;
  }).join("\n");
  return `<ol class="dkb">\n${items}\n</ol>\n`;
}

// Where things go in the old page's HTML.
// The player: right after the hero and its producers strip, before the story ("put the player earlier").
const STORY = /<div data-page-element="SectionContainer\/V1" class="container fullContainer id-6Z-DBR54N-480[^"]*"/;
// The ten folder panels: from the first to the bonuses' headline. The bonus panels: from the first to the button after them.
const FOLDERS_AT = '<div data-page-element="FlexContainer/V1" class=" elFlexNoWrapMobile elFlexNoWrap id-6Z-lLXzjA-44"';
const BONUS_HEAD = '<div data-page-element="Headline/V1" class="elHeadlineWrapper id-6Z-wzeml9-5058">';
const BONUS_AT = '<div data-page-element="FlexContainer/V1" class=" elFlexNoWrapMobile elFlexNoWrap id-6Z-lLXzjA-66"';
const BONUS_END = '<div data-page-element="UniversalBlock/21769640" class="id-6Z-lLXzjA-1786">';

/** Replace html[from, to) (the positions of two markers, in order) with `by`; unchanged if either is missing. */
function swap(html: string, from: string, to: string, by: string): string {
  const a = html.indexOf(from);
  const b = a < 0 ? -1 : html.indexOf(to, a);
  return a < 0 || b < 0 ? html : html.slice(0, a) + by + html.slice(b);
}

/**
 * The new landing from the old one's finished HTML (after its words, images and speed-ups).
 * words: the old page's copy by key, in this language and currency (./landing.ts).
 */
export function newLanding(html: string, lang: Lang, currency: Currency, order: string, words: Words): string {
  const l: L = lang === "it" ? "it" : "en";
  const c: Ctx = { lang: l, w: WORDS[l], words, currency, order };
  let out = html
    .replaceAll(`${IMG}kit-box.webp`, `${IMG}kit-box-v3.webp`)
    .replaceAll(`${IMG}boxes-all.webp`, `${IMG}boxes-all-v3.webp`)
    .replaceAll(`${IMG}value-stack-6.webp`, `${IMG}value-stack-7.webp`)
    .replaceAll(`${IMG}value-stack-6-it.webp`, `${IMG}value-stack-7-it.webp`)
    // value-stack-7 is 1000 × 1214 (value-stack-6, 1000 × 1240).
    .replace(/(value-stack-7(?:-it)?\.webp"[^>]*?) height="1240"/g, '$1 height="1214"');
  // The later one first: the positions before it don't move.
  out = swap(out, BONUS_AT, BONUS_END, bonuses(c));
  out = swap(out, FOLDERS_AT, BONUS_HEAD, folders(c));
  out = out.replace(STORY, (at) => player(c) + at);
  const cfg = {
    play: c.w.play, stop: c.w.stop, loading: c.w.loading, of: c.w.of, beatOn: c.w.beatOn, beatOff: c.w.beatOff,
    rows: c.w.rows.split(","),
    groups: GROUPS[l],
    folders: Object.fromEntries(FOLDERS.map((f) => [f.id, folderName(f, c).replace(/&amp;/g, "&")])),
  };
  return out
    .replace("</head>", () => `<style>${CSS}</style>\n</head>`)
    .replace("</body>", () => `<script type="application/json" id="dk-cfg">${JSON.stringify(cfg).replace(/</g, "\\u003c")}</script>\n<script>${CLIENT_JS}</script>\n</body>`);
}
