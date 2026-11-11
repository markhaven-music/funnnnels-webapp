import type { Currency } from "@/lib/geo";
import { beaconScript, PREVIEW_JS } from "@/lib/beacon";
import { AVAILABILITY_JS } from "@/lib/availability";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { restate } from "@/lib/restate";
import { applySections, imageOrigins, swapImages } from "@/lib/cfSections";
import type { Layout } from "@/lib/pageLayout";
import { AB, AB_LANDING_CSS, AB_SCRIPT, fixedScript, isVariant } from "./abtest";
import { TEMPLATE } from "./cf/template";
import de from "./copy/landing/de.json";
import en from "./copy/landing/en.json";
import es from "./copy/landing/es.json";
import fr from "./copy/landing/fr.json";
import it from "./copy/landing/it.json";
import { copyWith } from "./copy";
import type { PageEdits } from "@/lib/pageTexts";
import { copyEdits, markupEdits } from "./texts";
import { funnel } from "./funnel";
import { paths, type Lang } from "./i18n";

// The sales page: ClickFunnels' own HTML and CSS (./cf/template.ts, made by
// tools/cf_clone.mjs), so it looks exactly like the ClickFunnels page on every
// screen, with the words of the visitor's language (./copy/landing/<lang>.json,
// same keys as en.json; a missing key falls back to English), our order page
// behind every button, our tracking, the visitor count (lib/beacon.ts) and the
// button-colour test (./abtest.ts).

const STRINGS: Record<Lang, Record<string, string>> = { en, fr, es, de, it };

// Images with words baked in, swapped per language (the code's name → that
// language's). The editor's layout keys pictures by the src the page shows,
// so a layout copied to another language maps them through this
// (app/api/funnels/[id]/layout).
// The guarantee seal says "quality guarantee" in each language (tools/quality_badges.js;
// ClickFunnels' badge-dont-overthink said "100% money back", 11-06). The value
// stacks' "-w" files have a pure white background, as the card around them
// (tools/value_stack_white.js).
// value-stack-6*: the offer box's picture with six bonuses (tools/value_stack.py, 2026-11-12); value-stack*-w were the three-bonus ones.
export const LANG_IMAGES: Partial<Record<Lang, Record<string, string>>> = {
  en: { "value-stack": "value-stack-6", "badge-dont-overthink": "badge-quality" },
  fr: { "value-stack": "value-stack-6-fr", "badge-dont-overthink": "badge-quality-fr" },
  es: { "value-stack": "value-stack-6-es", "badge-dont-overthink": "badge-quality-es" },
  de: { "value-stack": "value-stack-6-de", "badge-dont-overthink": "badge-quality-de" },
  it: { "value-stack": "value-stack-6-it", "badge-dont-overthink": "badge-quality-it" },
};

// The hero video (Wistia) per language: English is ClickFunnels' (funnel.wistiaId);
// French and Italian are the same VSL re-voiced with captions in their language
// (vsl/script-fr.md, vsl/script-it.md, made with tools/vsl_captions.py). poster = its Wistia
// thumbnail saved in public/funnels/midi-drum-kit, shown until the player loads.
// Spanish and German have no VSL of their own yet: they play the English one.
const VIDEOS: Record<Lang, { id: string; poster: string }> = {
  en: { id: funnel.wistiaId, poster: "vsl-en" },
  fr: { id: "3774byed1i", poster: "vsl-fr" },
  es: { id: funnel.wistiaId, poster: "vsl-en" },
  de: { id: funnel.wistiaId, poster: "vsl-en" },
  it: { id: "xmzaw2vmu8", poster: "vsl-it" },
};

// French: the space before : ; ! ? » % and after « stays on the line with the
// mark, and "glisser-déposer" never splits at its hyphen.
export const frenchSpaces = (text: string) =>
  text
    .replace(/ (?=[:;!?»%€$])/g, " ")
    .replace(/« /g, "« ")
    .replace(/glisser-dépos/g, "glisser‑dépos");

// Spanish, German and Italian: "27 €" and "90 %" stay on one line. Spanish dollar
// visitors are in Latin America, where the sign goes first: "27 €" becomes
// "$27", not "27 $" (German keeps "27 $", as German writes it).
export const unitSpaces = (text: string) => text.replace(/ (?=[€%])/g, " ");
// German and Italian: "drag & drop" never splits across lines.
const dragDropTogether = (text: string) => text.replace(/(drag) (&amp;|&) (drop)/gi, "$1\u00a0$2\u00a0$3");
export const dollarFirst = (text: string) => text.replace(/(\d[\d.,]*)(?:\s|&nbsp;)€/g, "$$$1");

/** Apply fn to the text between tags only, never to tags or attributes. */
export const mapText = (html: string, fn: (t: string) => string) => html.replace(/(^|>)([^<]+)/g, (_, gt, text) => gt + fn(text));

export const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Who just opted in for a free pack lands here with ?free=<pack>
// (app/free/packs.ts next): a yellow bar under the red banner's line says the pack is
// on its way, ClickFunnels' "WAIT!! Your Free Pack Is Secured…" step. Without
// it they took "GET THE PACK" for their download and left at the card fields.
// Hidden in the HTML (the page stays one static document for everyone); the
// script right after it shows it while the page is still being read, before
// anything below is drawn, so nothing moves. English only: the opt-ins go there.
const FREE_PACKS = { rolls: "Rolls", bounce: "Bounce", hooks: "Mystery Hooks" };
// Inside the red banner's section, as its last child: a section of its own would
// count in LATER_CSS's nth-child and put the hero among the sections drawn late.
const FREE_BAR_AT = '</div><div data-page-element="UniversalBlock/21784872" class="id-6Z-ALeVQA-41"';
const FREE_BAR = `<style>.fv-free{background:#f5b800;color:#000;text-align:center;padding:14px 16px 15px}
.fv-free b{display:block;font:800 22px/1.2 Poppins,"Poppins Fallback",sans-serif}
.fv-free span{display:block;margin-top:5px;font:500 15px/1.35 Inter,"Inter Fallback",sans-serif}
@media (min-width:768px){.fv-free b{font-size:28px}.fv-free span{font-size:17px}}</style>
<div class="fv-free" role="status" hidden><b>WAIT!! Your Free <i style="font-style:normal" id="fv-free-pack"></i> Pack Is Secured…</b><span>It's on its way to your inbox.</span></div>
<script>(function(){var n=${JSON.stringify(FREE_PACKS)},m=/[?&]free=([a-z]+)/.exec(location.search),k=m&&m[1];if(!k||!Object.prototype.hasOwnProperty.call(n,k))return;document.getElementById('fv-free-pack').textContent=n[k];document.querySelector('.fv-free').hidden=false})()</script>
`;

// Six bonuses since 2026-11-12 ("Sì, aggiornale": the landing and the emails say what the order
// page and the download give): Drunk Swing Grooves, the MYSTERY Hooks Pack and the PDF guide, as
// three more panels after Hit-Maker Drums' (a copy of its markup, so they look the same, without
// its folder-tree picture) and three more rows in the offer box. Done here, not in cf/template.ts,
// which tools/cf_clone.mjs writes. Texts: copy/landing/<lang>.json t263-t274.
const PANEL_AT = '<div data-page-element="FlexContainer/V1" class=" elFlexNoWrapMobile elFlexNoWrap id-6Z-lLXzjA-111"';
const PANEL_END = '<div data-page-element="UniversalBlock/21769640" class="id-6Z-lLXzjA-1786">';
const PANEL2_AT = '<div data-page-element="FlexContainer/V1" class=" elFlexNoWrapMobile elFlexNoWrap id-6Z-lLXzjA-84"';
const TREE2 = /<div data-page-element="Image\/V2"[^>]*><img class="elImage" src="\/funnels\/midi-drum-kit\/tree-starters\.webp"[^>]*><\/div>/;
const TREE = /<div data-page-element="Image\/V2"[^>]*><img class="elImage" src="\/funnels\/midi-drum-kit\/tree-drums\.webp"[^>]*><\/div>/;
const VALUE_ROW = /<li class="id-6Z-WOaYBj-1745">[\s\S]*?<\/li>/;
const MORE_BONUSES = [
  { cover: "bonus-grooves.webp", keys: ["t263", "t264", "t265"], row: "t272" },
  { cover: "bonus-hooks.webp", keys: ["t266", "t267", "t268"], row: "t273" },
  { cover: "bonus-guide.webp", keys: ["t269", "t270", "t271"], row: "t274" },
];
function sixBonuses(template: string): string {
  const from = template.indexOf(PANEL_AT);
  const to = template.indexOf(PANEL_END, from);
  const row = template.match(VALUE_ROW)?.[0];
  if (from < 0 || to < 0 || !row || !row.includes("{{t131}}")) return template;
  // The panels alternate the side of their cover (1 right, 2 left, 3 right): 4 and 6 copy the second
  // panel's markup (cover left), 5 the third's (cover right) ("to keep the patterns of orientations").
  const third = template.slice(from, to).replace(TREE, "");
  const secondAt = template.lastIndexOf(PANEL2_AT, from);
  const second = secondAt < 0 ? null : template.slice(secondAt, from).replace(TREE2, "");
  const panels = MORE_BONUSES.map((b, n) => {
    const left = n % 2 === 0 && second;
    const [base, keys, cover] = left ? [second, ["t119", "t120", "t121"], "bonus-starters.webp"] : [third, ["t122", "t123", "t124"], "bonus-drums.webp"];
    return keys.reduce((html, key, i) => html.replaceAll(`data-t="${key}">{{${key}}}`, `data-t="${b.keys[i]}">{{${b.keys[i]}}}`), base.replace(cover, `${b.cover}" width="900" height="900`));
  }).join("");
  const rows = MORE_BONUSES.map((b) => row.replace('data-t="t131">{{t131}}', `data-t="${b.row}">{{${b.row}}}`)).join("");
  // The value-stack picture is 1000 × 1240 since it shows six bonuses (tools/value_stack.py); it was a 1024 square.
  return (template.slice(0, to) + panels + template.slice(to))
    .replace(VALUE_ROW, row + rows)
    .replace(/(src="\/funnels\/midi-drum-kit\/value-stack\.webp"[^>]*?) width="1024" height="1024"/, '$1 width="1000" height="1240"');
}
const TEMPLATE6 = sixBonuses(TEMPLATE);

// price: the kit's in this currency, as dashboard → Products has it; the
// words that say the code's price ("Only €297 €27") say this one.
// edits: the texts changed in the dashboard (funnel map → Edit, ./texts.ts).
// marks: each text between <!--fx:tNNN--> and <!--/fx-->, every section and
// picture tagged, for the dashboard's editor on the page
// (app/api/funnels/[id]/texts/frame); never on a live page.
// layout: the page's sections hidden or moved, its pictures replaced and its
// button colour, as edited in the dashboard (lib/pageLayout.ts, lib/cfSections.ts).
export function landingHtml(lang: Lang, currency: Currency, price: number = funnel.price[currency], edits: PageEdits = {}, marks = false, layout: Layout = {}): string {
  const strings = { ...STRINGS.en, ...STRINGS[lang], ...markupEdits(edits, "landing") };
  const words = (key: string) => {
    let html = mapText(strings[key] ?? "", (t) => restate(t, funnel.price[currency], price, lang));
    if (lang === "es" || lang === "de" || lang === "it") html = mapText(html, unitSpaces);
    if (lang === "es" && currency === "usd") html = mapText(html, dollarFirst);
    if (currency === "usd") html = mapText(html, (t) => t.replaceAll("€", "$"));
    if (lang === "fr") html = mapText(html, frenchSpaces);
    if (lang === "de" || lang === "it") html = mapText(html, dragDropTogether);
    return html;
  };
  const meta = copyWith(lang, undefined, copyEdits(edits)).meta;
  // The button colour fixed in the dashboard ends the test on this page.
  const ab = isVariant(layout.button) ? fixedScript(layout.button) : AB_SCRIPT;

  let html = applySections(TEMPLATE6, layout, marks)
    .replace(/\{\{(t\d{3})\}\}/g, (_, key: string) => (marks ? `<!--fx:${key}-->${words(key)}<!--/fx-->` : words(key)))
    .replaceAll("{{ORDER}}", paths(lang).order)
    .replace("{{LANG}}", lang)
    .replace("{{TITLE}}", escapeAttr(meta.title))
    .replace("{{DESCRIPTION}}", escapeAttr(meta.description))
    .replace(
      "{{HEAD}}",
      `<script>${ORIGIN_BOUNCE_JS}</script>\n<script>${ab}</script>\n<style>${AB_LANDING_CSS}</style>\n<script>${beaconScript({ funnel: funnel.slug, page: "landing", lang, abCookie: AB.cookie })}</script>\n<script>${AVAILABILITY_JS}</script>\n${headScripts(currency, price)}`,
    )
    .replace("{{BODY}}", BODY_SCRIPT);
  if (lang === "en") html = html.replace(FREE_BAR_AT, (at) => FREE_BAR + at);
  const video = VIDEOS[lang];
  html = html.replaceAll(funnel.wistiaId, video.id);
  for (const [from, to] of Object.entries(LANG_IMAGES[lang] ?? {})) {
    html = html.replaceAll(`/funnels/midi-drum-kit/${from}.webp`, `/funnels/midi-drum-kit/${to}.webp`);
  }
  // The pictures replaced in the dashboard, keyed by the src the page shows in this language.
  const images = layout.images ?? {};
  html = faster(swapImages(html, images, marks), video.poster);
  const origins = imageOrigins(images);
  return origins ? html.replace("<head>", `<head>\n${origins}`) : html;
}

// Speed (PageSpeed scored the page 59 on mobile, LCP 9 s): the page is
// ClickFunnels' markup, which makes the browser wait for Font Awesome and
// Google Fonts before painting, asks for 13 ClickFunnels script chunks that
// don't exist here, finds the hero background late, and loads Wistia's player
// (≈320 KB of script plus video) before anything else. So:
//   - those stylesheets load without holding the first paint (fonts swap in);
//   - the dead chunk preloads go; the hero background and the video's
//     thumbnail are preloaded;
//   - the video shows its thumbnail and red play button (the same look) and
//     the real player loads on the tap (and plays), never on its own: the
//     English VSL's player alone cost ≈760 ms of a phone's processor on
//     PageSpeed when it loaded 2.5 s after the page (Spanish page 80–83);
//   - images below the video load as they scroll into view (ClickFunnels'
//     loading="true|false" meant nothing without its script).
// Then (Google's PageSpeed still 64–71, LCP 5.6 s: a phone's processor busy
// with the whole long page and with the trackers before the first screen):
//   - sections past the first screen are laid out only when they come near it;
//   - Font Awesome's few icons are drawn by the page itself (no ≈80 KB font);
//   - the trackers' scripts load once the page has shown (headScripts);
//   - every image has an alt (empty: they're pictures, the words are text).
const ASYNC_CSS = /<link([^>]*?) rel="stylesheet"([^>]*?) href="(https:\/\/(?:use\.fontawesome\.com|fonts\.googleapis\.com)\/[^"]+)"([^>]*)>/g;
const WISTIA_IFRAME = /<iframe class="wistia_embed"[^>]*src="\/\/fast\.wistia\.net\/embed\/iframe\/([a-z0-9]+)[^"]*"[^>]*><\/iframe>/;

const POSTER_CSS = `.vsl-poster{position:relative;display:block;width:100%;aspect-ratio:16/9;background:#000;cursor:pointer;border-radius:inherit;overflow:hidden}
.vsl-poster img{width:100%;height:100%;object-fit:cover;display:block}
.vsl-play{position:absolute;left:50%;top:50%;width:14.6%;aspect-ratio:125/80;transform:translate(-50%,-50%);background:var(--vsl-play,#dd0000);border-radius:4px}
.vsl-play::after{content:"";position:absolute;left:39%;top:27%;width:28%;height:46%;background:#fff;clip-path:polygon(0 0,100% 50%,0 100%)}
.vsl-poster iframe{position:absolute;inset:0;width:100%;height:100%;border:0}`;

// The web fonts arrive after the first paint (they don't hold it), and text
// drawn in the stand-in font wraps differently: the first screen jumped when
// Poppins swapped in (PageSpeed CLS 0.18 on the Spanish hero). The stand-in is
// Arial, or its metric twin Liberation Sans on Linux, resized to each web
// font's measurements (next/font's numbers: get-fallback-font-override-metrics),
// so lines break in the same places before and after.
const FALLBACK_FONTS: Record<string, { size: string; ascent: string; descent: string; lineGap: string }> = {
  Poppins: { size: "112.16%", ascent: "93.62%", descent: "31.21%", lineGap: "8.92%" },
  Inter: { size: "107.12%", ascent: "90.44%", descent: "22.52%", lineGap: "0%" },
  "Open Sans": { size: "105.15%", ascent: "101.65%", descent: "27.86%", lineGap: "0%" },
  // The upsells' headlines (2026-11-08: PageSpeed CLS 0.17, the video jumped when it
  // swapped in). Measured in Chrome: its capitals run 57.5 % of Arial's width, ascent 0.90, descent 0.30.
  "Bebas Neue": { size: "57.5%", ascent: "156.52%", descent: "52.17%", lineGap: "0%" },
};
const FALLBACK_CSS = Object.entries(FALLBACK_FONTS)
  .map(
    ([family, m]) =>
      `@font-face{font-family:"${family} Fallback";src:local("Arial"),local("ArialMT"),local("Liberation Sans"),local("LiberationSans"),local("Arimo");size-adjust:${m.size};ascent-override:${m.ascent};descent-override:${m.descent};line-gap-override:${m.lineGap}}`,
  )
  .join("\n");
const FALLBACK_STACK = new RegExp(`"(${Object.keys(FALLBACK_FONTS).join("|")})", sans-serif`, "g");

// The page is long (≈2,300 elements, 25 screens on a phone) and a phone works
// out every one of them before showing the first: the sections after the
// first screen are laid out when they come near it instead.
const LATER_CSS = `.pageRoot>.container:nth-child(n+4){content-visibility:auto;contain-intrinsic-size:auto 900px}`;

// Every section is black but the page under them was white: where two sections
// meet on a fraction of a pixel (desktop, 2x screens) it showed through as a
// thin white line across the page. html:root, because the page's own "html, :host"
// reset comes later and would win over a plain html rule.
const SEAM_CSS = `html:root{background:#000}`;

// Font Awesome's icons that ClickFunnels pages use, as masks of the same shapes
// (Font Awesome Free 5.15 solid, svgs/solid/*.svg): [width of the 512-high glyph, path].
const FA_ICONS: Record<string, [number, string]> = {
  check: [512, "M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"],
  times: [352, "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"],
  "angle-right": [256, "M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"],
  "cart-plus": [576, "M504.717 320H211.572l6.545 32h268.418c15.401 0 26.816 14.301 23.403 29.319l-5.517 24.276C523.112 414.668 536 433.828 536 456c0 31.202-25.519 56.444-56.824 55.994-29.823-.429-54.35-24.631-55.155-54.447-.44-16.287 6.085-31.049 16.803-41.548H231.176C241.553 426.165 248 440.326 248 456c0 31.813-26.528 57.431-58.67 55.938-28.54-1.325-51.751-24.385-53.251-52.917-1.158-22.034 10.436-41.455 28.051-51.586L93.883 64H24C10.745 64 0 53.255 0 40V24C0 10.745 10.745 0 24 0h102.529c11.401 0 21.228 8.021 23.513 19.19L159.208 64H551.99c15.401 0 26.816 14.301 23.403 29.319l-47.273 208C525.637 312.246 515.923 320 504.717 320zM408 168h-48v-40c0-8.837-7.163-16-16-16h-16c-8.837 0-16 7.163-16 16v40h-48c-8.837 0-16 7.163-16 16v16c0 8.837 7.163 16 16 16h48v40c0 8.837 7.163 16 16 16h16c8.837 0 16-7.163 16-16v-40h48c8.837 0 16-7.163 16-16v-16c0-8.837-7.163-16-16-16z"],
  download: [512, "M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"],
  spinner: [512, "M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"],
};
// Class names that size or move an icon rather than name one.
const FA_KEEP = new Set(["fw", "spin", "pulse", "lg", "xs", "sm", "1x", "2x", "3x", "li", "ul", "border", "pull-left", "pull-right"]);

function faCss(icons: string[]): string {
  const shape = (n: string) => {
    const [w, d] = FA_ICONS[n];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} 512'><path d='${d}'/></svg>`;
    return `.fa-${n}::before{width:${(w / 512).toFixed(4)}em;-webkit-mask-image:url("data:image/svg+xml,${encodeURIComponent(svg)}");mask-image:url("data:image/svg+xml,${encodeURIComponent(svg)}")}`;
  };
  return `.fa,.fas,.far{display:inline-block;font-style:normal;line-height:1}
.fa-fw{width:1.25em;text-align:center}
${icons.map((n) => `.fa-${n}::before`).join(",")}{content:"";display:inline-block;height:1em;vertical-align:-.125em;background:currentColor;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
${icons.map(shape).join("\n")}
.fa-spin{animation:fa-spin 2s linear infinite}@keyframes fa-spin{to{transform:rotate(360deg)}}`;
}

const POSTER_SCRIPT = `<script>
(function () {
  var p = document.querySelector('.vsl-poster');
  if (!p) return;
  var done = false;
  function load(play) {
    if (done) return;
    done = true;
    var f = document.createElement('iframe');
    f.className = 'wistia_embed';
    f.name = 'wistia_embed';
    f.title = 'Watch This!';
    f.allow = 'autoplay; fullscreen';
    f.setAttribute('allowfullscreen', '');
    f.src = 'https://fast.wistia.net/embed/iframe/' + p.getAttribute('data-wistia') + '?autoplay=' + (play ? 1 : 0) + '&wmode=transparent';
    p.style.cursor = 'default';
    p.appendChild(f);
  }
  p.addEventListener('click', function () { load(true); });
  p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(true); } });
})();
</script>`;

/**
 * The same speed-ups for any page cloned from ClickFunnels (the upsell pages
 * too, ./upsell.ts): poster = the Wistia thumbnail shown until the player
 * loads, preload = pictures above the fold (public/funnels/midi-drum-kit/<name>.webp),
 * playColor = the colour of that Wistia player's play button.
 */
export function faster(html: string, poster: string | null, preload: readonly string[] = ["hero-bg"], playColor = "#dd0000"): string {
  html = html.replace(/<link rel="modulepreload"[^>]*>\n?/g, "");
  // Font Awesome (its CSS and a ≈80 KB font) only for a few icons: drawn here
  // instead, when the page uses no others.
  const icons = new Set([...html.matchAll(/\bfa-([a-z0-9-]+)/g)].map((m) => m[1]).filter((n) => !FA_KEEP.has(n)));
  if ([...icons].every((n) => n in FA_ICONS)) {
    html = html.replace(/<link[^>]*href="https:\/\/use\.fontawesome\.com\/[^"]+"[^>]*>\n?/g, "");
    html = html.replace("</head>", `<style>${faCss([...icons])}</style>\n</head>`);
  }
  html = html.replace(/<img (?![^>]*\balt=)/g, '<img alt="" ');
  html = html.replace(FALLBACK_STACK, '"$1", "$1 Fallback", sans-serif');
  html = html.replace(ASYNC_CSS, (_, a: string, b: string, href: string, c: string) => {
    const url = href.includes("fonts.googleapis.com") && !href.includes("display=") ? `${href}&display=swap` : href;
    return `<link${a} rel="stylesheet"${b} href="${url}"${c} media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${url}"></noscript>`;
  });
  const img = poster ? `/funnels/midi-drum-kit/${poster}.webp` : null;
  const early = [...preload.map((n) => `/funnels/midi-drum-kit/${n}.webp`), ...(img ? [img] : [])];
  html = html.replace(
    "<head>",
    `<head>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${early.map((src) => `<link rel="preload" as="image" href="${src}" fetchpriority="high">`).join("\n")}
<style>${FALLBACK_CSS}\n${POSTER_CSS}\n${LATER_CSS}\n${SEAM_CSS}</style>`,
  );
  if (!img) return lazyBelow(html, html.indexOf("<wistia-player"));
  html = html.replace(
    WISTIA_IFRAME,
    (_, id: string) =>
      `<div class="vsl-poster" data-wistia="${id}" style="--vsl-play:${playColor}" role="button" tabindex="0" aria-label="Play the video"><img src="${img}" alt="" width="960" height="540" fetchpriority="high"><span class="vsl-play" aria-hidden="true"></span></div>`,
  );
  html = lazyBelow(html, html.indexOf('<span class="vsl-play"'));
  return html.replace("</body>", `${POSTER_SCRIPT}\n</body>`);
}

// ClickFunnels marks images loading="true" / "false" for its own lazy-loader
// (stripped), which browsers read as "load now": the ones under the video wait
// for the scroll, the logo and the thumbnail above it load at once.
function lazyBelow(html: string, at: number): string {
  if (at <= 0) return html;
  const lazy = (tag: string) => tag.replace(/\sloading="[^"]*"/, "").replace("<img ", '<img loading="lazy" decoding="async" ');
  return html.slice(0, at).replace(/\sloading="(true|false)"/g, "") + html.slice(at).replace(/<img [^>]*>/g, lazy);
}

// Meta Pixel + Clarity + Neo, as on the other funnels (their Tracking.tsx).
// Never on localhost, *.local or *.vercel.app, so tests don't reach the ad
// account. ViewContent here; InitiateCheckout and Purchase come from the order
// form and the thank-you page.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

function headScripts(currency: Currency, price: number): string {
  const { metaPixelId, clarityId, neoSnippet } = funnel.tracking;
  const params = JSON.stringify({ content_name: funnel.product, content_type: "product", value: price, currency: currency.toUpperCase() });
  return `<script>
(function () {
  if (${OFF}.test(location.hostname) || ${PREVIEW_JS}) return;
  window.clarity = window.clarity || function () { (clarity.q = clarity.q || []).push(arguments); };
  clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
  var params = ${params};
  params.ab_btn = window.__abBtn;
  if (!window.fbq) {
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
  }
  fbq('init', '${metaPixelId}');
  fbq('track', 'PageView');
  fbq('track', 'ViewContent', params);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-cta]')) {
      fbq('trackCustom', 'LandingCTAClick', params);
      clarity('event', 'cta_click');
    }
  }, { capture: true });
  ${AFTER_LOAD}(['https://connect.facebook.net/en_US/fbevents.js', '${neoSnippet}', 'https://www.clarity.ms/tag/${clarityId}']);
})();
</script>`;
}

// The trackers' scripts (≈1 s of a phone's processor, the Pixel and Clarity
// most) load once the page has shown: their calls above wait in their queues
// until then, so nothing is lost.
export const AFTER_LOAD = `(function (srcs) {
    function go() { srcs.forEach(function (src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }); }
    if (document.readyState === 'complete') go(); else addEventListener('load', function () { setTimeout(go, 0); });
  })`;

// The FAQ accordion, which ClickFunnels opens with its own scripts: a click on
// a question opens or closes its answer (same classes, so same look).
const BODY_SCRIPT = `<script>
document.addEventListener('click', function (e) {
  var head = e.target.closest && e.target.closest('.elAccordionItemHeader');
  if (!head) return;
  var item = head.closest('[data-page-element="AccordionItem"]');
  var body = item && item.querySelector('.elAccordionItemBody');
  if (!body) return;
  var open = item.classList.toggle('elAccordionItemOpen');
  body.style.display = open ? 'block' : 'none';
});
// The pictures below the first screen are lazy (they don't slow the first
// paint), and the sections they're in are only laid out near the screen
// (LATER_CSS), so a picture was asked for only once its section showed: a
// scroll found empty boxes ("why is the loading blocking"). Once the page has
// shown, they all load in the background, top to bottom, six at a time.
addEventListener('load', function () {
  var queue = [].slice.call(document.querySelectorAll('img[loading="lazy"]'));
  function next() {
    var img = queue.shift();
    if (!img) return;
    if (img.complete) return next();
    img.addEventListener('load', next, { once: true });
    img.addEventListener('error', next, { once: true });
    img.loading = 'eager';
  }
  setTimeout(function () { for (var i = 0; i < 6; i++) next(); }, 500);
});
</script>`;
