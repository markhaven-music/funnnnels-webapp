import type { Currency } from "@/lib/geo";
import { beaconScript } from "@/lib/beacon";
import { AB, AB_LANDING_CSS, AB_SCRIPT } from "./abtest";
import { TEMPLATE } from "./cf/template";
import en from "./copy/landing/en.json";
import fr from "./copy/landing/fr.json";
import { copyFor } from "./copy";
import { funnel } from "./funnel";
import { paths, type Lang } from "./i18n";

// The sales page: ClickFunnels' own HTML and CSS (./cf/template.ts, made by
// tools/cf_clone.mjs), so it looks exactly like the ClickFunnels page on every
// screen, with the words of the visitor's language (./copy/landing/<lang>.json,
// same keys as en.json; a missing key falls back to English), our order page
// behind every button, our tracking, the visitor count (lib/beacon.ts) and the
// button-colour test (./abtest.ts).

const STRINGS: Record<Lang, Record<string, string>> = { en, fr };

// Images with words baked in, swapped per language.
const IMAGES: Partial<Record<Lang, Record<string, string>>> = {
  fr: { "value-stack": "value-stack-fr" },
};

// The hero video (Wistia) per language: English is ClickFunnels' (funnel.wistiaId);
// French is the same VSL re-voiced in French with French captions
// (vsl/script-fr.md, made with tools/vsl_captions.py). poster = its Wistia
// thumbnail saved in public/funnels/midi-drum-kit, shown until the player loads.
const VIDEOS: Record<Lang, { id: string; poster: string }> = {
  en: { id: funnel.wistiaId, poster: "vsl-en" },
  fr: { id: "3774byed1i", poster: "vsl-fr" },
};

// French: the space before : ; ! ? » % and after « stays on the line with the
// mark, and "glisser-déposer" never splits at its hyphen.
export const frenchSpaces = (text: string) =>
  text
    .replace(/ (?=[:;!?»%€$])/g, " ")
    .replace(/« /g, "« ")
    .replace(/glisser-dépos/g, "glisser‑dépos");

/** Apply fn to the text between tags only, never to tags or attributes. */
export const mapText = (html: string, fn: (t: string) => string) => html.replace(/(^|>)([^<]+)/g, (_, gt, text) => gt + fn(text));

export const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function landingHtml(lang: Lang, currency: Currency): string {
  const strings = { ...STRINGS.en, ...STRINGS[lang] };
  const words = (key: string) => {
    let html = strings[key] ?? "";
    if (currency === "usd") html = mapText(html, (t) => t.replaceAll("€", "$"));
    if (lang === "fr") html = mapText(html, frenchSpaces);
    return html;
  };
  const meta = copyFor(lang).meta;

  let html = TEMPLATE.replace(/\{\{(t\d{3})\}\}/g, (_, key: string) => words(key))
    .replaceAll("{{ORDER}}", paths(lang).order)
    .replace("{{LANG}}", lang)
    .replace("{{TITLE}}", escapeAttr(meta.title))
    .replace("{{DESCRIPTION}}", escapeAttr(meta.description))
    .replace(
      "{{HEAD}}",
      `<script>${AB_SCRIPT}</script>\n<style>${AB_LANDING_CSS}</style>\n<script>${beaconScript({ funnel: funnel.slug, page: "landing", lang, abCookie: AB.cookie })}</script>\n${headScripts(currency)}`,
    )
    .replace("{{BODY}}", BODY_SCRIPT);
  const video = VIDEOS[lang];
  html = html.replaceAll(funnel.wistiaId, video.id);
  for (const [from, to] of Object.entries(IMAGES[lang] ?? {})) {
    html = html.replaceAll(`/funnels/midi-drum-kit/${from}.webp`, `/funnels/midi-drum-kit/${to}.webp`);
  }
  return faster(html, video.poster);
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
//     the real player loads on the first tap (and plays) or 2.5 s after the
//     page has loaded;
//   - images below the video load as they scroll into view (ClickFunnels'
//     loading="true|false" meant nothing without its script).
const ASYNC_CSS = /<link([^>]*?) rel="stylesheet"([^>]*?) href="(https:\/\/(?:use\.fontawesome\.com|fonts\.googleapis\.com)\/[^"]+)"([^>]*)>/g;
const WISTIA_IFRAME = /<iframe class="wistia_embed"[^>]*src="\/\/fast\.wistia\.net\/embed\/iframe\/([a-z0-9]+)[^"]*"[^>]*><\/iframe>/;

const POSTER_CSS = `.vsl-poster{position:relative;display:block;width:100%;aspect-ratio:16/9;background:#000;cursor:pointer;border-radius:inherit;overflow:hidden}
.vsl-poster img{width:100%;height:100%;object-fit:cover;display:block}
.vsl-play{position:absolute;left:50%;top:50%;width:14.6%;aspect-ratio:125/80;transform:translate(-50%,-50%);background:var(--vsl-play,#dd0000);border-radius:4px}
.vsl-play::after{content:"";position:absolute;left:39%;top:27%;width:28%;height:46%;background:#fff;clip-path:polygon(0 0,100% 50%,0 100%)}
.vsl-poster iframe{position:absolute;inset:0;width:100%;height:100%;border:0}`;

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
  window.addEventListener('load', function () { setTimeout(function () { load(false); }, 2500); });
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
<style>${POSTER_CSS}</style>`,
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

function headScripts(currency: Currency): string {
  const { metaPixelId, clarityId, neoSnippet } = funnel.tracking;
  const params = JSON.stringify({ content_name: funnel.product, content_type: "product", value: funnel.price[currency], currency: currency.toUpperCase() });
  return `<script>
(function () {
  if (${OFF}.test(location.hostname)) return;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', '${clarityId}');
  clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
  var params = ${params};
  params.ab_btn = window.__abBtn;
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${metaPixelId}');
  fbq('track', 'PageView');
  fbq('track', 'ViewContent', params);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-cta]')) {
      fbq('trackCustom', 'LandingCTAClick', params);
      clarity('event', 'cta_click');
    }
  }, { capture: true });
  var s = document.createElement('script'); s.async = true; s.src = '${neoSnippet}';
  document.head.appendChild(s);
})();
</script>`;
}

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
</script>`;
