// Turns a ClickFunnels page into a funnnnels template, 1:1: ClickFunnels' own
// HTML and CSS, minus its scripts, with
//   - images served from /public (optimized webp, see IMAGES below),
//   - every "GET THE PACK!" link pointing at {{ORDER}},
//   - every piece of text tagged data-t="tNNN" and written to <copy>/en.json,
//     so each language only needs its own JSON (same keys, translated HTML).
//
//   node tools/cf_clone.mjs <cf page url> <out dir> <copy dir>
//
// Needs puppeteer-core and Chrome (the DOM work runs in a headless browser on
// the page's server HTML, with ClickFunnels' scripts stripped first). Used for
// app/(funnels)/midi-drum-kit: out = app/(funnels)/midi-drum-kit/cf (writes template.ts),
// copy = app/(funnels)/midi-drum-kit/copy/landing.

import { mkdirSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const [url, outDir, copyDir] = process.argv.slice(2);
if (!url || !outDir || !copyDir) throw new Error("usage: node tools/cf_clone.mjs <url> <outDir> <copyDir>");
const ORIGIN = new URL(url).origin;

// ClickFunnels image id → our file in /public/funnels/midi-drum-kit (made by
// the same session's converter: webp, animated webp for the GIFs).
const IMG = "/funnels/midi-drum-kit/";
const IMAGES = {
  17405638: "logo", 19337161: "logo-dark", 19200652: "favicon", 19322135: "hero-bg", 19161970: "quotes-bg", 19160180: "paylogos",
  19323882: "logo-southside", 19323881: "logo-lex-luger", 19323890: "logo-zaytoven", 19323880: "logo-pharrell", 19323883: "logo-mustard",
  19323926: "secret", 19323954: "scientist", 19324002: "kit-box",
  19146399: "p-mike-will", 17503529: "p-metro", 19146485: "p-tay-keith", 19146453: "p-timbaland", 17503371: "p-tm88", 19146570: "p-pharrell",
  19200432: "studies", 19147501: "boxes-all",
  19160873: "box-complete-beats", 19160857: "box-kick", 19160757: "box-hats", 19160756: "box-snare", 19160762: "box-808",
  19160761: "box-accents", 19160759: "box-open-hats", 19160881: "box-kick-snare", 19160877: "box-kick-808", 19160880: "box-rolls",
  19188199: "cb-1", 19188200: "cb-2", 19188198: "cb-3", 19188203: "cb-4", 19188197: "cb-5",
  19187596: "ks-1", 19187597: "ks-2", 19187599: "ks-3", 19187706: "ks-4",
  19187810: "k8-1", 19187809: "k8-2", 19187825: "k8-3", 19187855: "k8-4",
  19161123: "bonus-famous", 19188327: "tree-famous", 19161291: "bonus-starters", 19188335: "tree-starters", 19160879: "bonus-drums", 19188350: "tree-drums",
  19312868: "value-stack", 19146933: "daws", 17519307: "icon-patterns", 17519212: "icon-fragments", 19114092: "folders",
  17480750: "stars", 17403918: "avatar-a", 17403919: "avatar-b", 17403916: "avatar-c", 19162061: "badge-dont-overthink",
  19162630: "g-kick-patterns", 19162682: "g-kick-fragments", 19185989: "g-hat-basic", 19185991: "g-hat-complex", 19185993: "g-hat-hyper",
  19185995: "g-hatf-basic", 19185996: "g-hatf-complex", 19185997: "g-hatf-hyper", 19185998: "g-hat-rollups", 19186001: "g-hat-rolldowns",
  19186002: "g-snare-patterns", 19186550: "g-snare-fragments", 19186513: "g-808-patterns", 19186555: "g-808-fragments", 19187304: "g-accents",
  19188156: "g-rolls", 19190853: "g-step-1", 19199715: "g-step-2", 19199767: "g-step-3",
};

let html = await (await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } })).text();

// ── text-level cleanup, before the DOM ──
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/g, "");
html = html.replace(/\sintegrity="[^"]*"/g, "");
// ClickFunnels' own stylesheets: fetched now, inlined below (no request to their servers at runtime).
// In place of their <link>s: the order of the stylesheets decides which rule wins.
for (const m of [...html.matchAll(/<link[^>]+href="(\/assets\/[^"]+\.css)"[^>]*>/g)]) {
  const css = await (await fetch(ORIGIN + m[1])).text();
  html = html.replace(m[0], () => `<style data-cf-sheet="${m[1].split("/").pop()}">${css}</style>`);
}
// video.js is for ClickFunnels' own player; the Wistia iframe doesn't need it.
html = html.replace(/<link[^>]+video-js[^>]*>/g, "");
// Every image URL (plain or through ClickFunnels' resizer) → ours.
html = html.replace(
  /(?:https:\/\/images\.clickfunnels\.com\/cdn-cgi\/image\/[^/]+\/)?https:\/\/statics\.myclickfunnels\.com\/workspace\/[^/]+\/image\/(\d+)\/file\/[0-9a-f]+\.(?:png|jpe?g|webp|gif)/g,
  (whole, id) => {
    if (!IMAGES[id]) throw new Error(`no local image for ClickFunnels image ${id}`);
    return `${IMG}${IMAGES[id]}.webp`;
  },
);
const left = html.match(/https?:\/\/[^"' )]*(clickfunnels|myclickfunnels)[^"' )]*/g) ?? [];
if (left.length) console.warn("still pointing at ClickFunnels:", [...new Set(left)].slice(0, 10));

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
await page.setJavaScriptEnabled(false);
await page.setContent(html, { waitUntil: "domcontentloaded" });

const { template, strings, stray } = await page.evaluate(() => {
  const d = document;
  // Things that only work with ClickFunnels' scripts, or carry their tracking.
  d.querySelectorAll('[data-page-element="Modal/V1"], .otoloading, img[src*="facebook.com/tr"], link[rel="preload"], link[rel="prefetch"], meta[name="csrf-token"], meta[name="csrf-param"]').forEach((e) => e.remove());
  // lazysizes: real src straight away.
  d.querySelectorAll("img[data-src]").forEach((i) => { i.setAttribute("src", i.getAttribute("data-src")); i.removeAttribute("data-src"); i.classList.remove("lazyload"); i.setAttribute("loading", "lazy"); });
  // The CTAs → our order page.
  d.querySelectorAll('a[href*="next_funnel_step"]').forEach((a) => { a.setAttribute("href", "{{ORDER}}"); a.setAttribute("data-cta", ""); });

  // Text containers, in page order.
  const sel = [
    '[data-page-element="ContentEditableNode"]:not(ul *)',
    ".elBulletListTextWrapper",
    ".elButtonMainText",
    ".elButtonSub",
    ".price-wrap",
  ].join(",");
  const strings = {};
  let n = 0;
  for (const el of d.querySelectorAll(sel)) {
    if (el.parentElement.closest("[data-t]")) continue;
    if (!el.textContent.trim()) continue;
    const key = `t${String(++n).padStart(3, "0")}`;
    el.setAttribute("data-t", key);
    strings[key] = el.innerHTML.trim();
    el.innerHTML = `{{${key}}}`;
  }
  // Text left outside any container: reported, so nothing English slips through.
  const stray = [];
  const walk = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = walk.nextNode()); ) {
    if (t.textContent.trim() && !t.parentElement.closest("[data-t], style, script")) stray.push(t.textContent.trim().slice(0, 80));
  }
  d.title = "{{TITLE}}";
  d.documentElement.setAttribute("lang", "{{LANG}}");
  let desc = d.querySelector('meta[name="description"]');
  if (!desc) { desc = d.createElement("meta"); desc.setAttribute("name", "description"); d.head.appendChild(desc); }
  desc.setAttribute("content", "{{DESCRIPTION}}");
  d.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach((e) => e.remove());
  return { template: "<!DOCTYPE html>\n" + d.documentElement.outerHTML, strings, stray };
});
await browser.close();

// Inline ClickFunnels' stylesheets, then our fixes and hooks.
const FIXES = `
/* funnnnels: without ClickFunnels' scripts the Wistia iframe keeps its 640x360
   attributes; give it the full width at 16:9 as their fitvids did. */
.elVideo iframe.wistia_embed{width:100%;height:auto;aspect-ratio:16/9;display:block}
/* funnnnels, fixes over ClickFunnels' own layout (it has the same faults):
   buttons have 100px side padding and text that never wraps, so on tablet
   widths and with longer translations they stick out of their box. */
.elButton{max-width:100%;box-sizing:border-box}
.elButton .elButtonMainText,.elButton .elButtonSub{white-space:normal}
@media (max-width:1100px){#glass-btn.elBTN a.elButton,#glass-btn-white.elBTN a.elButton,.elBTN a.elButton{padding-left:24px!important;padding-right:24px!important}}
/* The desktop row of producer logos: each logo is a percentage of a narrow
   column, so they shrink to a few pixels below ~1200px. Fixed size instead,
   and room for the label on the left. */
.id-6Z-XnX8GG-357 .elImageWrapper{width:min(140px,8vw)!important;flex:none}
.id-6Z-XnX8GG-357 .elImageWrapper img{width:100%!important;height:auto!important}
@media (max-width:1000px){.id-6Z-XnX8GG-357>*{flex:1 1 0!important;min-width:0!important;width:auto!important;padding-left:4px!important;padding-right:4px!important}.id-6Z-XnX8GG-357>:first-child{flex:0 0 110px!important}.id-6Z-XnX8GG-357 .elImageWrapper{margin:0 auto}}
.id-6Z-XnX8GG-357 [data-page-element="Headline/V1"],.id-6Z-XnX8GG-357 [data-page-element="SubHeadline/V1"],.id-6Z-XnX8GG-357 [data-page-element="Paragraph/V1"]{min-width:120px}
`;
let out = template.replace("</head>", `<style>${FIXES}</style>\n{{HEAD}}\n</head>`);
out = out.replace("</body>", "{{BODY}}\n</body>");

mkdirSync(outDir, { recursive: true });
mkdirSync(copyDir, { recursive: true });
writeFileSync(
  `${outDir}/template.ts`,
  `// Generated by tools/cf_clone.mjs from ${url}. Don't edit by hand: re-run the\n` +
    `// tool. ClickFunnels' page with its scripts stripped; {{tNNN}} are the texts\n` +
    `// (copy/landing/<lang>.json), {{ORDER}} the order page, the rest in ../page.ts.\n` +
    `export const TEMPLATE = ${JSON.stringify(out)};\n`,
);
writeFileSync(`${copyDir}/en.json`, JSON.stringify(strings, null, 2) + "\n");
console.log(`template ${Math.round(out.length / 1024)} KB, ${Object.keys(strings).length} strings`);
if (stray.length) console.log("stray text:", stray);
