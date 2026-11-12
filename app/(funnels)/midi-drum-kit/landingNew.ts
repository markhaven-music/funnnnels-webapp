import type { Currency } from "@/lib/geo";
import clips from "@/public/funnels/midi-drum-kit/player/v5/clips.json";
import tree from "@/public/funnels/midi-drum-kit/player/v5/tree.json";
import type { Copy } from "./copy";
import type { Lang } from "./i18n";
import { JAZZ_CSS } from "./jazzCss";
import { CLIENT_JS } from "./landingNewClient";
import { compare, cta, faq, finale, guarantee, hero, key, JAZZ_MORE_CSS, license, reviews, summary, type JazzCtx } from "./landingNewJazz";
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
// Later the same day: the comparison chart with the kit first, the folders as cards with the old panels'
// moving piano rolls ("prima era meglio… voglio che si capisca esattamente la folder structure con esempi ma
// che non sia lunghissima la pagina. E anche le forme/immagini che c'erano (gif) erano carine"), the folder
// tree as a tree, more questions, the guarantee as a panel with its seal, the license card right after the
// kit's folders, every button the Jazz page's key at one width, no card logos, and "NO BOUNCE VS BOUNCE" to
// hear where the page explains bounce.

const IMG = "/funnels/midi-drum-kit/";
const V2 = `${IMG}player/v5/`;

const HERO = ".id-6Z-Renrye-167";
const H2 = [
  "id-6Z-DBZeEl-6", "id-6Z-yxj4QX-14", "id-6Z-dOX4QP-356", "id-6Z-nx4Nj9-159", "id-6Z-wzeml9-858", "id-6Z-mRX4MN-452",
  "id-6Z-wzeml9-5058", "id-6Z-kBro4X-76", "id-6Z-jLXXba-312", "id-6Z-dO4RNz-22", "id-6Z-dO4RNz-397", "id-6Z-dO4RNz-1822",
  "id-6Z-jLXXba-658", "id-6Z-dO4RNz-1942",
].map((id) => `.${id}`);
// The old page's dark panels that stay on this one: Introducing, the science box, Patterns, Fragments.
const CARDS = ["id-6Z-WOaYBj-1502", "id-6Z-wzeml9-854", "id-6Z-lLXzjA-420", "id-6Z-lLXzjA-450", "id-6Z-wzeml9-5419"].map((id) => `.${id}`);
const FOIL = [...CARDS, ".dk-foil"];
// The producers' quotes and the reviews: columns with a grey or blue-grey fill and a 1px border.
const BOXES = [
  "id-6Z-gYXZX5-1294", "id-6Z-gYXZX5-1318", "id-6Z-WOaYBj-1579", "id-6Z-WOaYBj-1581", "id-6Z-WOaYBj-1616", "id-6Z-WOaYBj-1644",
  "id-6Z-dO4RNz-409", "id-6Z-dO4RNz-410", "id-6Z-dO4RNz-411", "id-6Z-dO4RNz-412", "id-6Z-dO4RNz-494", "id-6Z-dO4RNz-510", "id-6Z-dO4RNz-526",
  "id-6Z-dO4RNz-544", "id-6Z-dO4RNz-563", "id-6Z-dO4RNz-579", "id-6Z-dO4RNz-595", "id-6Z-dO4RNz-613", "id-6Z-dO4RNz-632", "id-6Z-dO4RNz-648",
  "id-6Z-dO4RNz-664", "id-6Z-dO4RNz-682",
].map((id) => `.${id}>.col-inner`);

// The button's orange (abtest.ts COLORS.orange: #ffa13d → #ec6a0c), as text on black.
const ACCENT = "#ff9a2e";
const DISPLAY = 'Poppins,"Poppins Fallback",sans-serif';
const BODY = 'Inter,"Inter Fallback",sans-serif';
const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";

const CSS = `${JAZZ_CSS}${JAZZ_MORE_CSS}
${HERO} .elHeadline{font-family:${DISPLAY}!important;font-size:clamp(30px,6.4vw,52px)!important;font-weight:800!important;line-height:1.14!important;letter-spacing:-.015em!important;text-wrap:balance}
${HERO} .elHeadline *{font-family:inherit!important;letter-spacing:inherit!important}
${H2.map((s) => `${s} .elHeadline`).join(",")}{font-family:${DISPLAY}!important;font-size:clamp(29px,5.4vw,46px)!important;font-weight:700!important;line-height:1.14!important;letter-spacing:-.022em!important;text-wrap:balance}
${H2.map((s) => `${s} .elHeadline *`).join(",")}{font-family:inherit!important;letter-spacing:inherit!important}

/* One page background and dark cards, as on the Jazz MIDI Pack page ("check the backgrounds of all sections.
   let's keep it card like MIDI Jazz Pack", 2026-11-12): the old page's sections were black, four greys, a
   two-tone strip and a navy fade; its cards three greys, a green one and a white one. The hero keeps its picture. */
html:root,.pageRoot{background:#070707}
.pageRoot>.container:not(.stickyTop):not(.id-6Z-Renrye-150){background:#070707!important}
.id-6Z-WOaYBj-1502,.id-6Z-gYXZX5-1221,.id-6Z-gYXZX5-1248,.id-6Z-gYXZX5-1263,.id-6Z-wzeml9-5419{background:#0d0c10!important;border:0!important;box-shadow:none!important}
${BOXES.join(",")}{background:#0d0c10!important;border:0!important;border-radius:12px!important}
.id-6Z-dO4RNz-1960{border:0!important}
/* the offer card was white with navy words */
.id-6Z-wzeml9-5419,.id-6Z-wzeml9-5580,.id-6Z-wzeml9-5585,.id-6Z-wzeml9-5591,.id-6Z-wzeml9-5440,.id-6Z-wzeml9-5419 .price-wrap,.id-6Z-wzeml9-5419 .price-wrap .new,.id-6Z-wzeml9-5419 .elBulletList,.id-6Z-wzeml9-5419 .elBulletList *:not(i){color:#fff!important}
/* One accent, the button's orange ("same color button and accents right now accents are green but button is
   orange. also wistia player color should be consistent"): the highlighted words (a green gradient), the
   short rules, "Black Deal:". The ticks stay green and the crosses red, as on the Jazz page. */
.pageRoot strike{background:none!important;-webkit-text-fill-color:currentColor!important;color:${ACCENT}!important}
.id-6Z-wzeml9-864 .elDivider,.id-6Z-lLXzjA-430 .elDivider,.id-6Z-lLXzjA-481 .elDivider{border-color:${ACCENT}!important}
.id-6Z-WOXX4V-654 .elDivider{border-color:rgba(255,255,255,.14)!important}
.id-6Z-wzeml9-5588{color:${ACCENT}!important}

/* clip, not hidden: a hidden box would stop the bonus cover from staying on screen (position: sticky) */
${FOIL.join(",")}{position:relative;isolation:isolate;overflow:hidden;overflow:clip}
${FOIL.map((s) => `${s}::before`).join(",")}{content:"";position:absolute;z-index:-1;top:0;right:0;width:min(420px,68%);aspect-ratio:720/309;background:url(${IMG}iris-streaks-2.webp) right top/cover no-repeat;-webkit-mask:radial-gradient(115% 130% at 100% 0,#000 8%,rgba(0,0,0,.45) 42%,transparent 72%);mask:radial-gradient(115% 130% at 100% 0,#000 8%,rgba(0,0,0,.45) 42%,transparent 72%);opacity:.5;pointer-events:none}
${FOIL.map((s) => `${s}::after`).join(",")}{content:"";position:absolute;z-index:1;top:0;left:0;right:0;height:3px;background:url(${IMG}iris-foil-2.webp) center/cover no-repeat;pointer-events:none}

/* The old page's reset gives every element margin: 0 auto, which shrinks and centres a grid or flex child. */
.dkp-sec *,.dkf *,.dkb *,.dkt-sec *,.dkn *{margin-left:0;margin-right:0}
/* The old page's sections that this one rebuilds further up or down: the last call, the disclaimer, the footer. */
.pageRoot>.container.id-6Z-dO4RNz-1939,.pageRoot>.container.id-6Z-dO4RNz-1983,.pageRoot>.container.id-6Z-N7M7VX-43{display:none!important}
/* the value ribbon above the box, not over its name (this box has its name at the top) */
.jzv-mainBox{margin-top:26px}
.jzv-ribbon{top:-18px}
/* the last section: the old page's "decision time" line under the headline; on a computer both stay left of the box in the picture */
.jz-finalIn .jz-sub{margin-top:14px}
@media (min-width:1000px){.jz-finalIn .jz-h2,.jz-finalIn .jz-sub{max-width:580px}.jz-finalIn .jzb-note{margin-left:0;text-align:left}}
.dk-play{position:relative;flex:none;display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:linear-gradient(180deg,#ffa13d,#ec6a0c);color:#1a0d00;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dk-play svg{width:18px;height:18px;pointer-events:none}
.dk-play[data-state=loading]{opacity:.6;cursor:progress}

.dkp-sec{width:100%;box-sizing:border-box;background:#070707;padding:64px 16px 72px;color:#fff;font-family:${BODY}}
.dkp-wrap{max-width:920px;margin:0 auto}
.dkp-h2{margin:0 auto;max-width:820px;text-align:center;font-family:${DISPLAY};font-size:clamp(29px,5.4vw,46px);font-weight:700;line-height:1.14;letter-spacing:-.022em;text-wrap:balance}
.dkp-sub{margin:16px auto 0;max-width:680px;text-align:center;font-size:clamp(16px,2vw,18px);line-height:1.5;color:rgba(255,255,255,.72)}
.dkp-panel{min-width:0;margin-top:32px;background:#0d0c10;border-radius:12px;padding:20px 20px 16px;text-align:left}
.dkp-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px;-webkit-overflow-scrolling:touch}
.dkp-chips::-webkit-scrollbar{display:none}
.dkp-chips+.dkp-chips{margin-top:8px}
.dkp-chip{flex:none;min-height:44px;padding:0 14px;border:0;border-radius:3px;background:#1c1b22;color:rgba(255,255,255,.78);font:600 14px/1 ${BODY};white-space:nowrap;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkp-chip i{font:500 11px/1 ${MONO};font-style:normal;opacity:.6;margin-left:4px}
.dkp-chip[aria-selected=true]{background:#f5851f;color:#1a0d00;font-weight:700}
[data-row=groups] .dkp-chip{min-height:40px;background:none;color:rgba(255,255,255,.62)}
[data-row=groups] .dkp-chip[aria-selected=true]{background:#2a2932;color:#fff}
.dkp-head{margin-top:18px;min-height:46px}
.dkp-title{font:700 18px/1.25 ${DISPLAY}}
.dkp-meta{margin-top:3px;font:500 12px/1.3 ${MONO};color:rgba(255,255,255,.55)}
.dkp-roll{display:block;width:100%;height:140px;margin-top:12px;border-radius:4px;background:#08070a}
.dkp-bar{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px;margin-top:14px}
.dkp-step{min-height:52px;padding:0 8px;white-space:nowrap;border:0;border-radius:3px;background:#f5851f;color:#1a0d00;font:700 15px/1 ${BODY};cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkp-bar .dk-play{width:64px;height:64px}
.dkp-bar .dk-play svg{width:26px;height:26px}
.dkp-beatbox{margin-top:16px;padding:14px;border-radius:4px;background:#15141a}
.dkp-seg{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:4px;background:#0b0a0e}
.dkp-seg button{min-height:44px;border:0;border-radius:3px;background:none;color:rgba(255,255,255,.62);font:700 15px/1 ${BODY};cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkp-seg button[aria-pressed=true]{background:#f5851f;color:#1a0d00}
.dkp-explain{margin:10px 0 0;font-size:13px;line-height:1.5;color:rgba(255,255,255,.62)}
.dkp-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin:10px 0 0;font:500 11px/1.4 ${MONO};color:rgba(255,255,255,.62)}
.dkp-legend i{display:inline-block;width:14px;height:8px;margin-right:6px;border-radius:1px;background:rgba(255,255,255,.3)}
.dkp-legend i.sel{background:#f5851f}
.dkp-opt{display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:8px;margin-top:10px}
.dkp-optl{font:600 11px/1.2 ${MONO};letter-spacing:.1em;text-transform:uppercase;color:#ff9a2e}
.dkp-opt .dkp-chips{margin:0;padding:0}
.dkp-opt .dkp-chip{min-height:40px;padding:0 12px;font-size:13px}
.dkp-opt .dkp-chip[aria-pressed=true]{background:#2a2932;color:#fff;font-weight:700}
.dkp-beatbox.off .dkp-opt{opacity:.4}
.dkp-filesl{margin:16px 0 8px;font:600 11px/1.2 ${MONO};letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.dkp-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);grid-auto-columns:100px;gap:6px;overflow-x:auto;margin:0 -20px;padding:0 20px 6px;scrollbar-width:thin;scrollbar-color:#2a2932 transparent;-webkit-overflow-scrolling:touch;min-height:118px}
.dkp-thumb{display:block;width:100px;padding:4px 4px 3px;border:0;border-radius:3px;background:#15141a;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkp-thumb canvas{display:block;width:92px;height:34px}
.dkp-thumb span{display:block;margin-top:2px;font:500 10px/1.2 ${MONO};color:rgba(255,255,255,.5);text-align:left}
.dkp-thumb[aria-current=true]{background:#2a2932;box-shadow:inset 0 0 0 2px #f5851f}
.dkp-thumb[aria-current=true] span{color:#fff}
.dkp-file{margin-top:12px;font:500 11px/1.5 ${MONO};color:rgba(255,255,255,.45);overflow-wrap:anywhere}
.dkp-file b{margin-right:6px;color:#ff9a2e;font-weight:600;letter-spacing:.12em}
.dkp-keywrap{margin-top:8px}
/* centred: the rule above that zeroes side margins in the player would push the key left */
.dkp-keywrap .jzb-btn{margin-left:auto;margin-right:auto}

/* The kit's folders: a card each, with the old panel's examples (its moving piano rolls) and the folder's real name and subfolders. */
.dkf{display:grid;gap:12px;width:100%;max-width:1083px;margin:28px auto 40px;padding:0;list-style:none;text-align:left;font-family:${BODY};color:#fff}
.dkf>li{width:100%;box-sizing:border-box;padding:14px 14px 16px;border-radius:12px;background:#0d0c10;break-inside:avoid}
.dkf-top{display:grid;grid-template-columns:112px minmax(0,1fr);align-items:center;gap:14px}
.dkf-top img{display:block;width:112px;height:112px;object-fit:contain}
.dkf h3{margin:0;font:700 20px/1.2 ${DISPLAY};color:#fff}
.dkf-top p{margin:4px 0 0;font-size:14px;line-height:1.4;color:rgba(255,255,255,.72)}
.dkf-n{display:block;margin-top:8px;font:700 18px/1 ${DISPLAY};color:#ff9a2e}
.dkf-n small{font:500 10px/1.2 ${MONO};letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.dkf-path{display:flex;flex-wrap:wrap;align-items:center;gap:5px 6px;margin:12px 0 0;font:500 11px/1.4 ${MONO};color:rgba(255,255,255,.62)}
.dkf-path svg{flex:none;width:14px;height:14px;color:#ff9a2e}
.dkf-path b{margin-right:2px;font-weight:600;color:#fff}
.dkf-path span{padding:2px 6px;border-radius:3px;background:#1c1b22;white-space:nowrap}
.dkf-path i{margin-left:5px;font-style:normal;color:#ff9a2e}
.dkf-more{column-span:all}
.dkf-more h3{font-size:21px;line-height:1.25}
.dkf-more>p{margin:8px 0 0;font-size:15px;line-height:1.45;color:rgba(255,255,255,.72)}
.dkf-more ul{display:grid;gap:6px;margin:14px 0 0;padding:0;list-style:none}
.dkf-more li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 12px;align-items:baseline;padding:10px 12px;border-radius:6px;background:#15141a}
.dkf-more b{font:600 13px/1.3 ${MONO};color:#fff}
.dkf-more span{grid-column:1;font-size:13.5px;line-height:1.4;color:rgba(255,255,255,.7)}
.dkf-more i{grid-column:2;grid-row:1/span 2;align-self:center;font:700 18px/1 ${DISPLAY};font-style:normal;color:#ff9a2e}
.dkf-subs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0 0;padding:0;list-style:none}
.dkf-subs.one{grid-template-columns:minmax(0,1fr)}
.dkf-subs li{min-width:0}
.dkf-ex{display:block;height:100%;padding:8px;border-radius:6px;background:#15141a;color:#fff;text-align:left}
.dkf-exl{display:flex;align-items:center;min-height:26px;font:600 12.5px/1.25 ${BODY}}
.dkf-ex img{display:block;width:100%;height:auto;margin-top:6px;border-radius:3px}
.dkf-ex img.roll{aspect-ratio:4/1;object-fit:cover;background:#08121a}
.dkf-subs.one .dkf-ex img.roll{aspect-ratio:5/1;object-position:left center}

/* The folder tree, as a file browser: the zip's own names, files counted, two file names per folder. */
.dkt-sec{width:100%;box-sizing:border-box;background:#070707;padding:64px 16px 72px;color:#fff;font-family:${BODY}}
.dkt-wrap{max-width:1083px;margin:0 auto}
.dkt-grid{display:grid;gap:24px;margin-top:32px}
.dkt-win{min-width:0;padding-bottom:10px;border-radius:12px;background:#0d0c10;text-align:left}
.dkt-bar{display:flex;align-items:center;gap:6px;padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.07);font:600 12px/1 ${MONO};color:rgba(255,255,255,.62)}
.dkt-bar i{width:9px;height:9px;border-radius:50%;background:#2a2932}
.dkt-bar span{margin-left:6px}
.dkt-tree,.dkt-tree ul{margin:0;padding:0;list-style:none}
.dkt-tree{padding:8px 8px 0;font:500 13px/1.3 ${MONO}}
.dkt-tree ul{padding-left:20px}
.dkt-tree li{width:100%;box-sizing:border-box;text-align:left}
.dkt-row{display:grid;grid-template-columns:12px 16px minmax(0,1fr) auto;align-items:center;gap:7px;min-height:36px;padding:0 6px;border-radius:4px;color:#fff;-webkit-tap-highlight-color:transparent}
summary.dkt-row{cursor:pointer;list-style:none;touch-action:manipulation}
summary.dkt-row::-webkit-details-marker{display:none}
.dkt-row .c{width:10px;height:10px;color:rgba(255,255,255,.45);transition:rotate .15s}
details[open]>summary.dkt-row .c{rotate:90deg}
.dkt-row .f{width:16px;height:16px;color:#ff9a2e}
.dkt-row b{font:500 11px/1 ${MONO};color:rgba(255,255,255,.5);white-space:nowrap}
.dkt-row span{min-width:0;overflow-wrap:anywhere}
.dkt-tree ul .dkt-row{min-height:30px;color:rgba(255,255,255,.86)}
.dkt-file{padding:3px 6px 5px 41px;font-size:11.5px;color:rgba(255,255,255,.5);overflow-wrap:anywhere}
.dkt-file i{margin-left:6px;font-style:normal;white-space:nowrap;color:rgba(255,255,255,.32)}
.dkt-label{margin:14px 14px 4px;font:600 10.5px/1.2 ${MONO};letter-spacing:.12em;text-transform:uppercase;color:#ff9a2e}
.dkt-facts{display:grid;gap:12px;margin:0;padding:0;list-style:none;text-align:left;font-size:16px;line-height:1.45;color:rgba(255,255,255,.8)}
.dkt-facts li{display:grid;grid-template-columns:20px minmax(0,1fr);gap:10px;align-items:start}
.dkt-facts svg{width:18px;height:18px;margin-top:3px;color:#22c55e}
.dkt-facts b{color:#fff}
.dkt-side .jz-ctaBlock{margin-top:28px}

/* "No bounce vs bounce": one switch, one roll, one play button. */
.dkn{width:100%;max-width:820px;box-sizing:border-box;margin:40px auto 48px;padding:22px 16px 18px;border-radius:12px;background:#0d0c10;text-align:left;font-family:${BODY};color:#fff}
.dkn-tag{margin:0;font:700 12px/1.2 ${DISPLAY};letter-spacing:.14em;text-transform:uppercase;color:#ff9a2e}
.dkn h3{margin:8px 0 0;font:700 clamp(25px,4.6vw,34px)/1.15 ${DISPLAY};letter-spacing:-.02em;color:#fff}
.dkn-sub{margin:10px 0 0;font-size:15px;line-height:1.5;color:rgba(255,255,255,.72)}
.dkn-sw{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:18px;padding:6px;border-radius:12px;background:#08070a}
.dkn-sw button{min-height:58px;padding:0 6px;border:0;border-radius:8px;background:none;color:rgba(255,255,255,.6);font:800 16px/1.1 ${DISPLAY};letter-spacing:.04em;text-transform:uppercase;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.dkn-sw button[aria-pressed=true]{background:#2a2932;color:#fff}
.dkn-sw button[data-bounce="1"][aria-pressed=true]{background:linear-gradient(180deg,#ffa13d,#ec6a0c);color:#1a0d00}
.dkn-sw button.nudge{animation:dkn-nudge 1.1s ease-in-out infinite}
@keyframes dkn-nudge{50%{box-shadow:inset 0 0 0 2px #f5851f;color:#fff}}
.dkn-roll{display:block;width:100%;height:118px;margin-top:14px;border-radius:4px;background:#08070a}
.dkn-bar{display:grid;grid-template-columns:56px minmax(0,1fr);align-items:center;gap:14px;margin-top:14px}
.dkn-bar .dk-play{width:56px;height:56px}
.dkn-bar .dk-play svg{width:22px;height:22px}
.dkn-what{margin:0;font-size:14px;line-height:1.45;color:rgba(255,255,255,.82);overflow-wrap:anywhere}
.dkn-what b{display:block;margin-bottom:2px;font:600 11px/1.3 ${MONO};letter-spacing:.1em;text-transform:uppercase;color:#ff9a2e}
.dkn-what small{display:block;margin-top:3px;font:500 11px/1.4 ${MONO};color:rgba(255,255,255,.45)}

.dkb{display:grid;gap:48px;width:100%;max-width:1083px;margin:32px auto 0;padding:0;list-style:none;text-align:left;font-family:${BODY};color:#fff}
.dkb>li{width:100%;box-sizing:border-box;display:grid;gap:18px;padding:24px 22px 28px;border-radius:12px;background:#0d0c10}
.dkb-cover{max-width:300px;margin:0 auto}
.dkb-cover img{display:block;width:100%;height:auto;filter:drop-shadow(0 12px 18px rgba(0,0,0,.55))}
.dkb-label{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin:0;font:700 12px/1.2 ${DISPLAY};letter-spacing:.14em;text-transform:uppercase;color:#ff9a2e}
.dkb-price{padding:4px 8px 3px;border-radius:3px;background:linear-gradient(180deg,#ffa13d,#ec6a0c);font-weight:800;letter-spacing:.08em;color:#1a0d00}
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
.dkc[aria-pressed=true]{background:rgba(236,106,12,.2)}
.dkc-ico{grid-area:ico;position:relative;width:44px;height:44px;border-radius:50%;background:linear-gradient(180deg,#ffa13d,#ec6a0c)}
.dkc-ico::after{content:"";position:absolute;top:50%;left:54%;translate:-50% -50%;border-left:13px solid #1a0d00;border-top:8px solid transparent;border-bottom:8px solid transparent}
.dkc[aria-pressed=true] .dkc-ico::after{inset:15px;left:15px;top:15px;translate:none;border:0;border-radius:2px;background:#1a0d00}
.dkc-name{grid-area:name;font-size:14px;font-weight:700;line-height:1.2}
.dkc-bpm{grid-area:bpm;font:500 12px/1.3 ${MONO};color:rgba(255,255,255,.55)}
.dkc svg{grid-area:wave;display:block;width:100%;height:34px}
.dkc rect{fill:rgba(255,255,255,.28)}
.dkc rect.on{fill:#ffb45e}
.dkpads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.dkpad{min-height:64px;padding:8px 6px;border:0;border-radius:4px;background:#1c1b22;color:#fff;font:700 14px/1.2 ${BODY};cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.dkpad small{display:block;margin-top:4px;font:500 10px/1.2 ${MONO};color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dkpad:active{background:#f5851f;color:#1a0d00}
.dkpad.hit{animation:dkpad .28s ease-out}
@keyframes dkpad{from{background:#f5851f}to{background:#1c1b22}}

@media (max-width:640px){.dkp-sec{padding:48px 12px 56px}.dkp-panel{padding:14px 14px 12px;margin-top:24px}.dkp-chips{margin:0 -14px;padding:0 14px}.dkp-grid{margin:0 -14px;padding:0 14px 6px}.dkp-opt .dkp-chips{margin:0 -14px 0 0;padding:0 14px 0 0}}
@media (min-width:720px){.dkp-bar{max-width:560px;margin-left:auto;margin-right:auto}.dkb-rolls,.dkb-clips{grid-template-columns:repeat(2,minmax(0,1fr))}.dkb-rolls{min-height:390px}.dkpads{grid-template-columns:repeat(4,minmax(0,1fr))}.dkf{display:block;columns:2;column-gap:12px}.dkf>li{margin-bottom:12px}.dkf-top{grid-template-columns:140px minmax(0,1fr);gap:18px}.dkf-top img{width:140px;height:140px}.dkf h3{font-size:22px}.dkf-more ul{grid-template-columns:repeat(2,minmax(0,1fr))}.dkn{padding:30px 32px 26px}}
@media (min-width:1000px){.dkt-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:48px;align-items:start}.dkt-side{position:sticky;top:72px;padding-top:8px}.dkb{gap:72px}.dkb>li{grid-template-columns:minmax(0,.36fr) minmax(0,.64fr);align-items:start;gap:0 56px;padding:44px 48px}.dkb-cover{grid-row:1/span 2;max-width:none;position:sticky;top:64px}.dkb-label{font-size:14px}.dkb h3{margin-top:10px;font-size:30px}.dkb-text{margin-top:14px;font-size:18px}.dkb-inside{gap:8px;margin-top:14px;font-size:17px}.dkb-preview{grid-column:2;margin-top:30px}.dkb>li.bare .dkb-preview{display:none}}
`;

type L = "en" | "it";
const WORDS: Record<L, Record<string, string>> = {
  en: {
    h2: "Press play. Hear the kit before you get it.",
    sub: "The kit’s 11 folders of hand-written patterns are in this player, with their real MIDI files, played with the Hit-Maker Drums bonus sounds. In your DAW they play whatever drums you load.",
    hint: "A single part plays over a simple beat made of the kit’s own files. Play a kick, a snare or a hat pattern and it stays in the beat while you try the rest.",
    inBeat: "In a beat",
    alone: "Alone",
    explain: "In a beat: you hear the file where you would use it, over a kick, a snare and hats from the kit. Alone: only the file. A kick, snare or hat pattern you play takes that drum’s place in the beat.",
    legendFile: "this file",
    legendBeat: "the beat around it",
    beatLabel: "Beat",
    tempoLabel: "Tempo",
    auto: "File",
    all: "All {n} files of this folder · tap one",
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
    hearEx: "Play a file of",
    baseEx: "4ths, 8ths, 16ths and 32nds",
    treeSub: "Unzip it and this is what you see: the folders are numbered, every drum has its own, and the file names say what’s inside.",
    treeWin: "MIDI Drum Kit Bundle",
    treeBonus: "Bonuses",
    more: "more",
    moreTitle: "And every pattern again, ready in more ways: 9,256 more files",
    moreText: "Folders 12 to 17 are the kit’s own patterns in every key and in ready combinations, so you don’t have to build them.",
    facts: "**17 numbered folders**: 11 written by hand, 6 with every key and ready combinations|**Patterns and fragments** in their own subfolders|**Hi-hats sorted by difficulty**: Basic, Complex, Hyper-Complex, plus Roll Up and Roll Down|**File names tell you what’s inside**: the tempo, the 808’s key, notes like (triplets)|**Every bonus in its own folder**",
    bnTag: "Hear it",
    bnTitle: "No bounce vs bounce.",
    bnSub: "Same sounds, same tempo, four bars. Only the pattern changes. Press play, then flip the switch.",
    bnOff: "No bounce",
    bnOn: "Bounce",
    bnOffWhat: "A plain beat: kick and 808 on the one, snare on the three, straight hi-hats.",
    bnOnWhat: "Complete Beat 01 from the kit, exactly as it is in the zip.",
  },
  it: {
    h2: "Premi play. Ascolta il kit prima di prenderlo.",
    sub: "In questo player ci sono le 11 cartelle di pattern scritti a mano del kit, con i loro file MIDI veri, suonati con i suoni del bonus Hit-Maker Drums. Nella tua DAW suonano con la batteria che carichi tu.",
    hint: "Una parte singola suona sopra un beat semplice fatto con i file del kit. Fai partire un pattern di kick, snare o hi-hat e resta nel beat mentre provi il resto.",
    inBeat: "Dentro un beat",
    alone: "Da solo",
    explain: "Dentro un beat: senti il file dove lo useresti, sopra kick, snare e hi-hat presi dal kit. Da solo: solo il file. Un pattern di kick, snare o hi-hat che fai partire prende il posto di quel pezzo nel beat.",
    legendFile: "questo file",
    legendBeat: "il beat intorno",
    beatLabel: "Beat",
    tempoLabel: "Tempo",
    auto: "File",
    all: "Tutti i {n} file di questa cartella · toccane uno",
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
    hearEx: "Ascolta un file di",
    baseEx: "Quarti, ottavi, sedicesimi e trentaduesimi",
    treeSub: "Apri lo zip e vedi questo: le cartelle sono numerate, ogni pezzo della batteria ha la sua e i nomi dei file dicono cosa c’è dentro.",
    treeWin: "MIDI Drum Kit Bundle",
    treeBonus: "Bonus",
    more: "altri",
    moreTitle: "E ogni pattern di nuovo, già pronto in più modi: altri 9.256 file",
    moreText: "Le cartelle dalla 12 alla 17 sono i pattern del kit in tutte le tonalità e in combinazioni pronte, così non devi costruirle tu.",
    facts: "**17 cartelle numerate**: 11 scritte a mano, 6 con tutte le tonalità e le combinazioni pronte|**Pattern e frammenti** nelle loro sottocartelle|**Hi-hat ordinati per difficoltà**: Basic, Complex, Hyper-Complex, più Roll Up e Roll Down|**I nomi dei file dicono cosa c’è dentro**: il tempo, la tonalità dell’808, note come (triplets)|**Ogni bonus nella sua cartella**",
    bnTag: "Ascoltalo",
    bnTitle: "Senza bounce vs con bounce.",
    bnSub: "Stessi suoni, stesso tempo, quattro battute. Cambia solo il pattern. Premi play, poi sposta l’interruttore.",
    bnOff: "Senza bounce",
    bnOn: "Con bounce",
    bnOffWhat: "Un beat piatto: kick e 808 sull’uno, snare sul tre, hi-hat dritti.",
    bnOnWhat: "Il Complete Beat 01 del kit, esattamente com’è nello zip.",
  },
};
// The groups' names as the kit's folders have them, and in Italian as the page calls them.
// The beats a single part can play over (tools/drum_player_data.py STYLES), in Italian.
const STYLES: Record<L, Record<string, string>> = {
  en: {},
  it: { Simple: "Semplice", "2 and 4": "2 e 4", "Triplet hats": "Hi-hat in terzine", "16th hats": "Hi-hat in sedicesimi" },
};
const TEMPOS = [90, 110, 130, 150, 170];
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
// What each folder's card shows under its name: the old panel's examples, each with its label's copy key
// (null: WORDS.baseEx), its pictures (g-*: the old page's moving piano rolls, 4:1; cb/ks/k8: still ones)
// and the player's group a tap on it plays (the group's place in tools/drum_player_data.py FOLDERS).
const EXAMPLES: Record<string, { label: string | null; pics: string[]; g: number }[]> = {
  beats: [{ label: "t073", pics: ["cb-1", "cb-2"], g: 0 }],
  "kick-snare": [{ label: "t108", pics: ["ks-1", "ks-2", "ks-3"], g: 0 }],
  "kick-808": [{ label: "t111", pics: ["k8-1", "k8-2", "k8-3"], g: 0 }],
  kick: [{ label: "t076", pics: ["g-kick-patterns"], g: 0 }, { label: "t077", pics: ["g-kick-fragments"], g: 1 }],
  snare: [{ label: "t092", pics: ["g-snare-patterns"], g: 0 }, { label: "t093", pics: ["g-snare-fragments"], g: 1 }],
  hats: [
    { label: "t080", pics: ["g-hat-basic"], g: 0 }, { label: "t083", pics: ["g-hatf-basic"], g: 0 },
    { label: "t081", pics: ["g-hat-complex"], g: 1 }, { label: "t084", pics: ["g-hatf-complex"], g: 1 },
    { label: "t082", pics: ["g-hat-hyper"], g: 2 }, { label: "t085", pics: ["g-hatf-hyper"], g: 2 },
    { label: "t086", pics: ["g-hat-rollups"], g: 3 }, { label: "t087", pics: ["g-hat-rolldowns"], g: 4 },
  ],
  "open-hats": [{ label: "t105", pics: ["g-accents"], g: 0 }],
  "808": [{ label: "t096", pics: ["g-808-patterns"], g: 0 }, { label: "t097", pics: ["g-808-fragments"], g: 1 }],
  accents: [{ label: "t100", pics: ["g-accents"], g: 0 }],
  rolls: [{ label: "t114", pics: ["g-rolls"], g: 0 }],
  "base-rhythms": [{ label: null, pics: ["g-hat-basic"], g: 0 }],
};
// The still pictures' sizes (the moving ones are drawn 4:1, whatever theirs).
const STILLS: Record<string, [number, number]> = { "cb-1": [900, 139], "cb-2": [900, 139], "ks-1": [900, 46], "ks-2": [900, 46], "ks-3": [900, 46], "k8-1": [900, 46], "k8-2": [900, 46], "k8-3": [900, 46] };
// Folders 12 to 17 of the zip V2 (tools/drum_kit_expand.py prints these counts): the kit's own patterns in every key and in combinations.
const MORE: { dir: string; n: number; text: Record<L, string> }[] = [
  { dir: "12. 808 in All 12 Keys", n: 1958, text: { en: "Every 808 pattern and fragment, in the 11 other keys", it: "Ogni pattern e frammento di 808, nelle altre 11 tonalità" } },
  { dir: "13. Kick and 808 in All 12 Keys (Multi-Track)", n: 605, text: { en: "Every Kick & 808 beat, its 808 on every note", it: "Ogni beat Kick & 808, con l’808 su ogni nota" } },
  { dir: "14. Complete Beats in All 12 Keys (Multi-Track)", n: 319, text: { en: "Every Complete Beat that has an 808, on every note", it: "Ogni Complete Beat con l’808, su ogni nota" } },
  { dir: "15. Kick + Snare Combos (Multi-Track)", n: 1944, text: { en: "Every kick pattern with every snare pattern", it: "Ogni pattern di kick con ogni pattern di snare" } },
  { dir: "16. Kick, 808 + Snare Combos (Multi-Track)", n: 1980, text: { en: "Every Kick & 808 beat with every snare pattern", it: "Ogni beat Kick & 808 con ogni pattern di snare" } },
  { dir: "17. Beats with Hi-Hats (Multi-Track)", n: 2450, text: { en: "Every Kick & Snare beat with every basic 4-bar hi-hat pattern", it: "Ogni beat Kick & Snare con ogni pattern base di hi-hat da 4 battute" } },
];
// 1,958 and 1.958: by hand, as Italian leaves four-digit numbers ungrouped
const thousands = (n: number, lang: L) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "it" ? "." : ",");
// The bonuses in the folder tree: the three in the kit's zip by their folder's name there, the others by their own.
const TREE_BONUSES: { dir: string; n: string; subs?: string[] }[] = [
  { dir: "2 - BONUS - Famous Beats MIDI Bundle", n: "50 MIDI", subs: ["Famous Beats Vol.1", "Famous Beats Vol.2", "Famous Beats Vol.3", "Famous Beats Vol.4", "Famous Beats Vol.5"] },
  { dir: "3 - BONUS - Beat Starters MIDI Bundle", n: "355 MIDI", subs: ["Chord Progressions MIDI Pack", "Emotional Pianos MIDI Pack", "Guitars MIDI Pack", "Melodies MIDI Pack", "Strings MIDI Pack", "Trap Pianos MIDI Pack", "Trap Plucks MIDI Pack"] },
  { dir: "4 - BONUS - Hit-Making Drums - Drumkit", n: "281 WAV", subs: ["clap|22", "hihat|87", "kick|38", "perc|17", "rim|4", "snare|113"] },
  // numbered as the three before them ("fix the bonuses folder file name you're missing the numbers")
  { dir: "5 - BONUS - Drunk Swing Grooves", n: "160 grooves" },
  { dir: "6 - BONUS - MYSTERY Hooks Pack", n: "17 WAV" },
  { dir: "7 - BONUS - MIDI Drum Kit Guide", n: "PDF" },
];

// The bonuses: the copy keys of the old panel (name with its "BONUS #n:", text), the cover, what is
// inside (counted from the files buyers download) and what there is to play.
type Preview = "famous" | "starters" | "pads" | "dsg" | "hooks" | null;
const BONUSES: { name: string; text: string; cover: string; preview: Preview; inside: Record<L, string[]> }[] = [
  {
    name: "t116", text: "t117", cover: "bonus2-famous", preview: "famous",
    inside: {
      // "scrivi anche che il bundle contiene Vol.1 to Vol.5 (ma ci sono 31 volumi nel bundle grande da 27 euro)", 2026-11-12
      en: ["Famous Beats Vol.1 to Vol.5: 50 multi-track MIDI drum patterns", "Kick, snare, clap, hats and percs on their own tracks", "50 MP3 samples", "The full Famous Beats bundle has 31 volumes: these are the first five"],
      it: ["Famous Beats dal Vol.1 al Vol.5: 50 pattern di batteria MIDI multitraccia", "Kick, snare, clap, hi-hat e percussioni su tracce separate", "50 sample MP3", "Il bundle Famous Beats completo ha 31 volumi: questi sono i primi cinque"],
    },
  },
  {
    name: "t119", text: "t120", cover: "bonus2-starters", preview: "starters",
    inside: {
      en: ["355 MIDI files in 7 packs", "Chord progressions, pianos, guitars, melodies, strings and plucks", "371 MP3 previews"],
      it: ["355 file MIDI in 7 pack", "Progressioni di accordi, piani, chitarre, melodie, archi e pluck", "371 anteprime MP3"],
    },
  },
  {
    name: "t122", text: "t123", cover: "bonus2-drums", preview: "pads",
    inside: {
      en: ["281 WAV one-shots", "113 snares, 87 hi-hats, 38 kicks, 22 claps, 17 percs, 4 rims"],
      it: ["281 one-shot WAV", "113 snare, 87 hi-hat, 38 kick, 22 clap, 17 percussioni, 4 rim"],
    },
  },
  {
    name: "t263", text: "t264", cover: "bonus2-grooves", preview: "dsg",
    inside: {
      en: ["160 drum grooves", "31 groove templates", "20 neo soul keys MIDI files", "PDF guide"],
      it: ["160 groove di batteria", "31 groove template", "20 file MIDI di neo soul keys", "Guida PDF"],
    },
  },
  {
    name: "t266", text: "t267", cover: "bonus2-hooks", preview: "hooks",
    inside: { en: ["17 WAV hooks", "From 86 to 160 BPM"], it: ["17 hook WAV", "Da 86 a 160 BPM"] },
  },
  { name: "t269", text: "t270", cover: "bonus2-guide", preview: null, inside: { en: ["PDF, 5 pages"], it: ["PDF, 5 pagine"] } },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;|[\u00a0\u200b\u200c]/g, " ").replace(/\s+/g, " ").trim();
const TICK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

type Words = (key: string) => string;
type Ctx = { lang: L; w: Record<string, string>; words: Words; currency: Currency; order: string; j: JazzCtx };

const folderName = (f: (typeof FOLDERS)[number], c: Ctx) => (f.name ? plain(c.words(f.name)) : c.w.base);

function player(c: Ctx): string {
  const { w } = c;
  const chips = FOLDERS.map((f, i) => `<button class="dkp-chip" type="button" role="tab" aria-selected="${i === 0}" data-f="${i}">${folderName(f, c)}</button>`).join("");
  const tempos = [0, ...TEMPOS].map((t) => `<button class="dkp-chip" type="button" aria-pressed="${t === 0}" data-tempo="${t}">${t || esc(w.auto)}</button>`).join("");
  return `<div class="dkp-sec" id="player"><div class="dkp-wrap">
<h2 class="dkp-h2">${esc(w.h2)}</h2>
<p class="dkp-sub">${esc(w.sub)}</p>
<div class="dkp-panel dk-foil" id="dkp">
<div class="dkp-chips" role="tablist" data-row="folders">${chips}</div>
<div class="dkp-chips" role="tablist" data-row="groups" hidden></div>
<div class="dkp-head"><div class="dkp-title">&nbsp;</div><div class="dkp-meta">&nbsp;</div></div>
<canvas class="dkp-roll" aria-hidden="true"></canvas>
<div class="dkp-bar"><button class="dkp-step" type="button" data-step="-1">‹ ${esc(w.prev)}</button><button class="dk-play dkp-play" type="button" data-state="stopped" aria-label="${esc(w.play)}">${PLAY}</button><button class="dkp-step" type="button" data-step="1">${esc(w.next)} ›</button></div>
<div class="dkp-beatbox" hidden>
<div class="dkp-seg" role="group"><button type="button" data-beat="1" aria-pressed="true">${esc(w.inBeat)}</button><button type="button" data-beat="0" aria-pressed="false">${esc(w.alone)}</button></div>
<p class="dkp-legend"><span><i class="sel"></i>${esc(w.legendFile)}</span><span><i></i>${esc(w.legendBeat)}</span></p>
<p class="dkp-explain">${esc(w.explain)}</p>
<div class="dkp-opt"><span class="dkp-optl">${esc(w.beatLabel)}</span><div class="dkp-chips" data-row="styles"></div></div>
<div class="dkp-opt"><span class="dkp-optl">${esc(w.tempoLabel)}</span><div class="dkp-chips" data-row="tempos">${tempos}</div></div>
</div>
<p class="dkp-filesl">&nbsp;</p>
<div class="dkp-grid" data-row="files"></div>
<div class="dkp-file"><b>${esc(w.inKit.toUpperCase())}</b>MIDI Drum Kit / <span></span></div>
</div>
<div class="jz dkp-keywrap"><div class="jz-ctaBlock">${key(c.j)}</div></div>
</div></div>
`;
}

const FOLDER = '<svg viewBox="0 0 16 16" class="f" aria-hidden="true"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.2l1.6 1.8H13a1.5 1.5 0 0 1 1.5 1.5v6.2A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5z" fill="currentColor"/></svg>';
const CHEVRON = '<svg viewBox="0 0 10 10" class="c" aria-hidden="true"><path d="M3 1.5L7 5 3 8.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const dirOf = (id: string) => tree.find((t) => t.id === id);

/**
 * The kit's folders, a card each: box, name, the old panel's line, its files, the folder's real name with
 * its subfolders, and the old panel's examples with their moving piano rolls. Pictures only: the player
 * further up is where the files are heard ("remove demos from the folder showcase, we already have it. but
 * make the box image bigger"). Shorter than the old page's ten panels, with what they showed.
 */
function folders(c: Ctx): string {
  const cards = FOLDERS.map((f) => {
    const name = folderName(f, c);
    const text = f.text ? c.words(f.text).replace(/[\u200b\u200c]/g, " ") : esc(c.w.baseText);
    const dir = dirOf(f.id);
    const subs = dir && dir.groups.length > 1 ? dir.groups.map((g) => `<span>${esc(g.dir.replace(/^\d+\. /, ""))}<i>${g.n}</i></span>`).join("") : "";
    const ex = EXAMPLES[f.id] ?? [];
    const items = ex.map((e) => {
      const label = e.label ? plain(c.words(e.label)) : esc(c.w.baseEx);
      const pics = e.pics.map((pic) => {
        const still = STILLS[pic];
        return still ? `<img src="${IMG}${pic}.webp" width="${still[0]}" height="${still[1]}" alt="" loading="lazy" decoding="async">` : `<img class="roll" src="${IMG}${pic}.webp" width="600" height="150" alt="" loading="lazy" decoding="async">`;
      }).join("");
      return `<li><div class="dkf-ex"><span class="dkf-exl">${label}</span>${pics}</div></li>`;
    }).join("");
    return `<li><div class="dkf-top"><img src="${IMG}box3-${f.box}.webp" width="132" height="132" alt="" loading="lazy" decoding="async"><div><h3>${name}</h3><p>${text}</p><span class="dkf-n">${f.n} <small>${esc(c.w.files)}</small></span></div></div>
<p class="dkf-path">${FOLDER}<b>${esc(dir?.dir ?? "")}</b>${subs}</p>
<ul class="dkf-subs${ex.length < 2 ? " one" : ""}">${items}</ul></li>`;
  }).join("\n");
  const more = MORE.map((m) => `<li><b>${esc(m.dir.replace(" (Multi-Track)", ""))}</b><span>${esc(m.text[c.lang])}</span><i>${thousands(m.n, c.lang)}</i></li>`).join("");
  return `<ul class="dkf">\n${cards}\n<li class="dkf-more"><h3>${esc(c.w.moreTitle)}</h3><p>${esc(c.w.moreText)}</p><ul>${more}</ul></li>\n</ul>\n`;
}

/** "Folder Structure Breakdown" as the tree it is: the zip's folders by their names, their files counted, a file name or two each; then the bonuses' folders. */
function folderTree(c: Ctx): string {
  const { w } = c;
  const count = (n: number | string) => `<b>${n}</b>`;
  const file = (names: string[], n: number) => names.slice(0, 1).map((x) => `<li class="dkt-file">${esc(x)}${n > 1 ? `<i>+ ${n - 1} ${esc(w.more)}</i>` : ""}</li>`).join("");
  const kit = tree.map((t) => {
    const inner = t.groups.length > 1
      ? t.groups.map((g) => `<li><div class="dkt-row"><span></span>${FOLDER}<span>${esc(g.dir)}</span>${count(g.n)}</div><ul>${file(g.ex, g.n)}</ul></li>`).join("")
      : file(t.groups[0].ex, t.n);
    return `<li><details${t.id === "808" ? " open" : ""}><summary class="dkt-row">${CHEVRON}${FOLDER}<span>${esc(t.dir)}</span>${count(t.n)}</summary><ul>${inner}</ul></details></li>`;
  }).join("\n");
  const bonus = TREE_BONUSES.map((b) => {
    const head = `${FOLDER}<span>${esc(b.dir)}</span>${count(b.n)}`;
    if (!b.subs) return `<li><div class="dkt-row"><span></span>${head}</div></li>`;
    const subs = b.subs.map((x) => { const [dir, n] = x.split("|"); return `<li><div class="dkt-row"><span></span>${FOLDER}<span>${esc(dir)}</span>${n ? count(n) : "<b></b>"}</div></li>`; }).join("");
    return `<li><details><summary class="dkt-row">${CHEVRON}${head}</summary><ul>${subs}</ul></details></li>`;
  }).join("\n");
  const facts = w.facts.split("|").map((x) => `<li>${TICK}<span>${esc(x).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")}</span></li>`).join("");
  return `<div class="dkt-sec" id="folders"><div class="dkt-wrap">
<h2 class="dkp-h2">${c.words("t171")}</h2>
<p class="dkp-sub">${esc(w.treeSub)}</p>
<div class="dkt-grid">
<div class="dkt-win dk-foil"><div class="dkt-bar"><i></i><i></i><i></i><span>${esc(w.treeWin)}</span></div>
<ul class="dkt-tree">
<li><div class="dkt-row"><span></span>${FOLDER}<span>1 - MIDI Drum Kit</span><b></b></div><ul>
${kit}
${MORE.map((m) => `<li><div class="dkt-row"><span></span>${FOLDER}<span>${esc(m.dir)}</span>${count(m.n)}</div></li>`).join("\n")}
<li class="dkt-file">READ ME - Meaning of words and labels.txt</li>
<li class="dkt-file">READ ME - The new folders (12 to 17).txt</li>
</ul></li>
</ul>
<p class="dkt-label">${esc(w.treeBonus)}</p>
<ul class="dkt-tree">
${bonus}
</ul></div>
<div class="dkt-side"><ul class="dkt-facts">${facts}</ul><div class="jz"><div class="jz-ctaBlock">${key(c.j)}</div></div></div>
</div>
</div></div>
`;
}

/** "NO BOUNCE VS BOUNCE": where the page says what bounce is, a switch to hear it (./landingNewClient.ts, player/v5/bounce.json). */
function bounce(c: Ctx): string {
  const { w } = c;
  return `<div class="dkn dk-foil" id="dkn">
<p class="dkn-tag">${esc(w.bnTag)}</p>
<h3>${esc(w.bnTitle)}</h3>
<p class="dkn-sub">${esc(w.bnSub)}</p>
<div class="dkn-sw" role="group"><button type="button" data-bounce="0" aria-pressed="true">${esc(w.bnOff)}</button><button type="button" data-bounce="1" aria-pressed="false">${esc(w.bnOn)}</button></div>
<canvas class="dkn-roll" aria-hidden="true"></canvas>
<div class="dkn-bar"><button class="dk-play" type="button" data-state="stopped" aria-label="${esc(w.play)}">${PLAY}</button><p class="dkn-what"><b>${esc(w.bnOff)}</b><span>${esc(w.bnOffWhat)}</span><small></small></p></div>
</div>
`;
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
<div class="dkb-cover"><img src="${IMG}${b.cover}.webp" width="640" height="952" alt="" loading="lazy" decoding="async"></div>
<div class="dkb-info"><p class="dkb-label"><span>${esc(c.w.bonus)} ${i + 1}</span><span class="dkb-price"><s>${money(STACK_VALUES.bonuses[i], c)}</s> ${esc(c.w.free)}</span></p>
<h3>${name}</h3>
<p class="dkb-text">${c.words(b.text)}</p>
<ul class="dkb-inside">${inside}</ul></div>
${pre ? `<div class="dkb-preview">${pre}</div>` : ""}
</li>`;
  }).join("\n");
  return `<ol class="dkb">\n${items}\n</ol>\n`;
}

// The new landing's own video, where it has one: English since 2026-11-12, the cold-traffic VSL ("make a new high
// converting (cold traffic) VSL for the product and publish it too": vsl/script-en.md, tools/drum_kit_vsl.py, on
// Wistia), with its poster. Italian keeps the old page's video re-voiced.
const NEW_VSL: Partial<Record<L, { id: string; poster: string }>> = { en: { id: "c66xeecqeg", poster: "vsl-en-cold" } };

// Where things go in the old page's HTML.
/** Where a top-level section of the old page starts (its SectionContainer, by its id class); -1 if it isn't there. */
const at = (html: string, id: string) => html.search(new RegExp(`<div data-page-element="SectionContainer/V1" class="container fullContainer[^"]*\\b${id}(?=[ "])`));
/** The old page from one top-level section up to another, replaced. */
function cut(html: string, fromId: string, toId: string, by: string): string {
  const a = at(html, fromId);
  const b = at(html, toId);
  return a < 0 || b < a ? html : html.slice(0, a) + by + html.slice(b);
}
function before(html: string, id: string, add: string): string {
  const a = at(html, id);
  return a < 0 ? html : html.slice(0, a) + add + html.slice(a);
}
// The old page's top-level sections, by their id class.
const SEC = {
  strip: "id-6Z-XnX8GG-213", // the producers' logos, right after the hero
  offer: "id-6Z-wzeml9-5288",
  steps: "id-6Z-kBro4X-73",
  daws: "id-6Z-dOX4QP-336",
  why: "id-6Z-kBro4X-185",
  folders: "id-6Z-dO4RNz-19", // "Folder Structure Breakdown"
  reviews: "id-6Z-dO4RNz-394",
  faq: "id-6Z-dO4RNz-787",
  guarantee: "id-6Z-dO4RNz-1879",
  last: "id-6Z-dO4RNz-1939",
};
// "So... How Do You Make Bounce?": the second half of the story. The switch to hear bounce goes right before it.
const BOUNCE_AT = '<div data-page-element="FlexContainer/V1" class=" elFlexNoWrapMobile elFlexNoWrap id-6Z-gYXZX5-1666"';
// The old page's button rows (the button, "Try It Risk-Free", the card logos): each becomes the key alone.
const BUTTON_ROWS = ["id-6Z-lLXzjA-1772", "id-6Z-nxNwoK-337"];
// The wordmark bar above the old hero: the new hero starts there (it has the wordmark in its own top bar).
const LOGO_BAR = '<div data-page-element="UniversalBlock/21784872" class="id-6Z-ALeVQA-41"';
const POSTER = /<div class="vsl-poster"[\s\S]*?<\/span><\/div>/;
// The player: right after the hero and its producers strip, before the story ("put the player earlier").
const STORY = /<div data-page-element="SectionContainer\/V1" class="container fullContainer id-6Z-DBR54N-480[^"]*"/;
// The ten folder panels: from the first to the bonuses' headline. The bonus panels: from the first to the button after them.
const FOLDERS_AT = '<div data-page-element="FlexContainer/V1" class=" elFlexNoWrapMobile elFlexNoWrap id-6Z-lLXzjA-44"';
const BONUS_HEAD = '<div data-page-element="Headline/V1" class="elHeadlineWrapper id-6Z-wzeml9-5058">';
const BONUS_AT = '<div data-page-element="FlexContainer/V1" class=" elFlexNoWrapMobile elFlexNoWrap id-6Z-lLXzjA-66"';
const BONUS_END = '<div data-page-element="UniversalBlock/21769640" class="id-6Z-lLXzjA-1786">';

/** Where the <div> that opens at `from` closes (the position after its closing tag); -1 if it never does. */
function closing(html: string, from: number): number {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = from;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[0] === "</div>" ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return -1;
}
/** Every row of the old page with this id class, replaced. */
function rows(html: string, id: string, by: string): string {
  const tag = `<div data-page-element="RowContainer/V1" class="row ${id}"`;
  let out = html;
  for (let a = out.indexOf(tag); a >= 0; a = out.indexOf(tag, a + by.length)) {
    const b = closing(out, a);
    if (b < 0) break;
    out = out.slice(0, a) + by + out.slice(b);
  }
  return out;
}
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
export function newLanding(html: string, lang: Lang, currency: Currency, order: string, words: Words, price: number, stack: Copy["order"]["stack"]): string {
  const l: L = lang === "it" ? "it" : "en";
  const j: JazzCtx = { lang, currency, words, order, price, stack };
  const c: Ctx = { lang: l, w: WORDS[l], words, currency, order, j };
  let out = html
    .replaceAll(`${IMG}kit-box.webp`, `${IMG}kit-box-v3.webp`)
    .replaceAll(`${IMG}boxes-all.webp`, `${IMG}boxes-all-v3.webp`)
    // "Patterns" and "Fragments": the box's glass cubes in place of the gold MIDI notes (Higgsfield, the kit's box as reference)
    .replaceAll(`${IMG}icon-patterns.webp`, `${IMG}icon-patterns-2.webp`)
    .replaceAll(`${IMG}icon-fragments.webp`, `${IMG}icon-fragments-2.webp`)
    .replaceAll(`${IMG}value-stack-6.webp`, `${IMG}value-stack-8.webp`)
    .replaceAll(`${IMG}value-stack-6-it.webp`, `${IMG}value-stack-8-it.webp`)
    // value-stack-8 (dark, the new boxes) is 1000 × 1214 (value-stack-6, 1000 × 1240).
    .replace(/(value-stack-8(?:-it)?\.webp"[^>]*?) height="1240"/g, '$1 height="1214"')
    // "Sciences PROVES that BOUNCE releases…": its words are glued with no-break spaces and ran out of the card.
    .replace(/(data-t="t063">)([\s\S]*?)(<\/span><\/span>)/, (_, a: string, b: string, c: string) => a + b.replaceAll("&nbsp;", " ") + c)
    // The video: its play button and Wistia's player in the page's orange (they were red).
    .replace('style="--vsl-play:#dd0000"', 'style="--vsl-play:#ec6a0c"')
    .replace("'&wmode=transparent'", "'&wmode=transparent&playerColor=ec6a0c'");
  const vsl = NEW_VSL[l];
  if (vsl) out = out.replace(/data-wistia="[a-z0-9]+"/, `data-wistia="${vsl.id}"`).replace(/\/funnels\/midi-drum-kit\/vsl-[a-z]+\.webp/g, `${IMG}${vsl.poster}.webp`);
  // The hero's headline at the Jazz page's weight (Poppins 800: the old page loads up to 700).
  out = out.replaceAll("Poppins:regular,bold,700,500,400", "Poppins:regular,bold,700,500,400,800");
  // The later one first: the positions before it don't move.
  out = swap(out, BONUS_AT, BONUS_END, bonuses(c) + license(j)); // the license card after the bonuses ("commercial license show it after the bonuses")
  out = swap(out, FOLDERS_AT, BONUS_HEAD, folders(c));
  // The sections from the folder tree down, each up to the next (which is still there for its own turn).
  out = cut(out, SEC.folders, SEC.reviews, folderTree(c));
  out = cut(out, SEC.reviews, SEC.faq, reviews(j));
  out = cut(out, SEC.faq, SEC.guarantee, faq(j));
  out = cut(out, SEC.guarantee, SEC.last, guarantee(j) + finale(j)); // the old last call, disclaimer and footer are hidden (CSS)
  out = cut(out, SEC.daws, SEC.why, ""); // "Works in any DAW": the hero has the logos now
  out = cut(out, SEC.offer, SEC.steps, compare(j) + summary(j));
  out = out.replace(BOUNCE_AT, () => bounce(c) + BOUNCE_AT);
  out = out.replace(STORY, (start) => player(c) + start);
  // One button everywhere: the key, at one width, with nothing under it ("check horizontal alignment of buttons",
  // "remove the card images from the landing page (visa mastercard etc)").
  for (const id of BUTTON_ROWS) out = rows(out, id, cta(j));
  // The hero: the old one's video (its poster, the player comes on the first tap) in the Jazz page's hero.
  const video = out.match(POSTER)?.[0];
  const from = out.indexOf(LOGO_BAR);
  const to = at(out, SEC.strip);
  if (video && from >= 0 && to > from) {
    out = out.slice(0, from) + hero(j, video) + out.slice(to);
    out = out.replace('<link rel="preload" as="image" href="/funnels/midi-drum-kit/hero-bg.webp" fetchpriority="high">\n', ""); // the old hero's background
  }
  const cfg = {
    play: c.w.play, stop: c.w.stop, loading: c.w.loading, of: c.w.of, all: c.w.all,
    bn: [[c.w.bnOff, c.w.bnOffWhat], [c.w.bnOn, c.w.bnOnWhat]],
    styles: STYLES[l],
    rows: c.w.rows.split(","),
    groups: GROUPS[l],
    folders: Object.fromEntries(FOLDERS.map((f) => [f.id, folderName(f, c).replace(/&amp;/g, "&")])),
  };
  return out
    .replace("</head>", () => `<style>${CSS}</style>\n</head>`)
    .replace("</body>", () => `<script type="application/json" id="dk-cfg">${JSON.stringify(cfg).replace(/</g, "\\u003c")}</script>\n<script>${CLIENT_JS}</script>\n</body>`);
}
