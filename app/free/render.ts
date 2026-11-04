import { AFTER_LOAD, faster } from "@/app/(funnels)/midi-drum-kit/landing";
import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { PREVIEW_JS } from "@/lib/beacon";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { TEMPLATE as bounceMidiPack } from "./cf/bounce-midi-pack";
import { TEMPLATE as bounce } from "./cf/bounce";
import { TEMPLATE as freeStoreAccess } from "./cf/free-store-access";
import { TEMPLATE as freeStore } from "./cf/free-store";
import { TEMPLATE as mysteryDopaspaceHooks } from "./cf/mystery-dopaspace-hooks";
import { TEMPLATE as mysteryHooks } from "./cf/mystery-hooks";
import { TEMPLATE as rolls } from "./cf/rolls";
import { TEMPLATE as hooks } from "./hooks";
import { PAGE_OPTIN, type PageName } from "./packs";

// A free lead magnet's page as visitors get it: ClickFunnels' page (./cf, made
// by tools/cf_clone_free.mjs) with what its scripts did done by ours (the
// opt-in form, the Free Store's pop-up, the phone menu), ClickFunnels' Meta
// Pixel (plus Clarity and neo, as on every funnel) after the page has shown,
// and the speed rules of docs/page-speed.md (faster(), the icons drawn here,
// pictures below the first screen loaded late).

const TEMPLATES: Record<PageName, string> = {
  rolls,
  bounce,
  hooks,
  "mystery-hooks": mysteryHooks,
  "free-store": freeStore,
  "free-store-access": freeStoreAccess,
  "bounce-midi-pack": bounceMidiPack,
  "mystery-dopaspace-hooks": mysteryDopaspaceHooks,
};

// How many pictures from the top are on the first screen (the logo, the
// pack's box; the store's two boxes): loaded at once, the last one preloaded.
const FIRST_SCREEN: Partial<Record<PageName, number>> = { "free-store": 3, "free-store-access": 3 };

// Font Awesome Free 5.15 (solid) for the few icons these pages use, drawn as
// masks: [width of the 512-high glyph, path]. No ≈80 KB icon font.
const ICONS: Record<string, [number, string]> = {
  check: [512, "M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"],
  times: [352, "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"],
  exclamation: [192, "M176 432c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80zM25.26 25.199l13.6 272C39.499 309.972 50.041 320 62.83 320h66.34c12.789 0 23.331-10.028 23.97-22.801l13.6-272C167.425 11.49 156.496 0 142.77 0H49.23C35.504 0 24.575 11.49 25.26 25.199z"],
  spinner: [512, "M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"],
  download: [512, "M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"],
  "arrow-right": [448, "M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"],
  "cart-plus": [576, "M504.717 320H211.572l6.545 32h268.418c15.401 0 26.816 14.301 23.403 29.319l-5.517 24.276C523.112 414.668 536 433.828 536 456c0 31.202-25.519 56.444-56.824 55.994-29.823-.429-54.35-24.631-55.155-54.447-.44-16.287 6.085-31.049 16.803-41.548H231.176C241.553 426.165 248 440.326 248 456c0 31.813-26.528 57.431-58.67 55.938-28.54-1.325-51.751-24.385-53.251-52.917-1.158-22.034 10.436-41.455 28.051-51.586L93.883 64H24C10.745 64 0 53.255 0 40V24C0 10.745 10.745 0 24 0h102.529c11.401 0 21.228 8.021 23.513 19.19L159.208 64H551.99c15.401 0 26.816 14.301 23.403 29.319l-47.273 208C525.637 312.246 515.923 320 504.717 320zM408 168h-48v-40c0-8.837-7.163-16-16-16h-16c-8.837 0-16 7.163-16 16v40h-48c-8.837 0-16 7.163-16 16v16c0 8.837 7.163 16 16 16h48v40c0 8.837 7.163 16 16 16h16c8.837 0 16-7.163 16-16v-40h48c8.837 0 16-7.163 16-16v-16c0-8.837-7.163-16-16-16z"],
  "shopping-bag": [448, "M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zm-192-32c0-35.29 28.71-64 64-64s64 28.71 64 64v32H160v-32zm160 120c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm-192 0c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z"],
};

const mask = ([w, d]: [number, string]) => {
  const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} 512'><path d='${d}'/></svg>`);
  return `width:${(w / 512).toFixed(4)}em;-webkit-mask-image:url("data:image/svg+xml,${svg}");mask-image:url("data:image/svg+xml,${svg}")`;
};
const ICON_CSS = `.fa,.fas,.far{display:inline-block;font-style:normal;line-height:1}
.fa-fw{width:1.25em;text-align:center}
${Object.keys(ICONS).map((n) => `.fa-${n}::before`).join(",")}{content:"";display:inline-block;height:1em;vertical-align:-.125em;background:currentColor;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}
${Object.entries(ICONS).map(([n, i]) => `.fa-${n}::before{${mask(i)}}`).join("\n")}
.fa-spin{animation:fa-spin 2s linear infinite}@keyframes fa-spin{to{transform:rotate(360deg)}}
.fv-error{margin:10px 0 0;color:#ff4d4d;font-size:14px;text-align:center}
img[width][height]{height:auto}
@media (max-width:770px){[data-page-element="Image/V2"].elImageWrapper{width:100%}}
@font-face{font-family:"Archivo Fallback";src:local("Arial"),local("ArialMT"),local("Liberation Sans"),local("LiberationSans"),local("Arimo");size-adjust:98.7%;ascent-override:88.96%;descent-override:21.28%;line-gap-override:0%}`;

// The web fonts arrive after the first paint, and text in the stand-in font
// wraps differently (CLS, docs/page-speed.md rule 13): each family gets its
// "<font> Fallback", sized like it (faster() has Poppins, Inter and Open Sans;
// Archivo, the store's, is above). ClickFunnels' CSS names them unquoted.
const withFallbacks = (html: string) =>
  html.replace(/(font-family:\s*)(Archivo|Poppins|Inter), sans-serif/g, '$1$2, "$2 Fallback", sans-serif');

// ClickFunnels' page had the Meta Pixel, the OpenAI pixel, neo and Google
// Analytics; here the Pixel, the OpenAI pixel and neo, plus Clarity as on every
// funnel (no Google Analytics: funnnnels has none). Never on local or preview
// hosts or the owner's devices (PREVIEW_JS); loaded once the page has shown.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);
const { metaPixelId, clarityId, neoSnippet } = drumKit.tracking;
const OPENAI_PIXEL = "5mRtfB9FENm47qEAXjp8di"; // ClickFunnels' pages' oaiq("init")
const TRACKING = `<script>
(function () {
  if (${OFF}.test(location.hostname) || ${PREVIEW_JS}) return;
  window.clarity = window.clarity || function () { (clarity.q = clarity.q || []).push(arguments); };
  clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
  if (!window.fbq) {
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
  }
  fbq('init', '${metaPixelId}');
  fbq('track', 'PageView');
  if (!window.oaiq) { var q = window.oaiq = function () { q.q.push(arguments); }; q.q = []; }
  oaiq('init', { pixelId: '${OPENAI_PIXEL}' });
  ${AFTER_LOAD}(['https://connect.facebook.net/en_US/fbevents.js', 'https://bzrcdn.openai.com/sdk/oaiq.min.js', '${neoSnippet}', 'https://www.clarity.ms/tag/${clarityId}']);
})();
</script>`;

// What ClickFunnels' scripts did:
//   - the opt-in button (data-optin) sends the email and name to /api/optin
//     and goes where it says ("Submitting..." meanwhile, as ClickFunnels);
//   - the Free Store's "Access Store" buttons open its opt-in pop-up (also on
//     arrival with #access, where the product pages' "Add To Cart" leads);
//   - the phone menu (☰) opens the links; ✕ or a click beside closes;
//   - the store's product cards get their box picture, zoomed, as background
//     (the page's own script on ClickFunnels).
// The phone number isn't kept: funnnnels sends no SMS.
const BODY = (optin: string | undefined) => `<script>
(function () {
  var OPTIN = ${JSON.stringify(optin ?? null)};
  function show(m) { if (!m) return; m.style.display = 'flex'; var w = m.closest('.modal-wrapper') || m; w.style.opacity = '1'; w.style.top = '0'; }
  function hide(m) { if (m) m.style.display = 'none'; }
  var popup = document.querySelector('[data-page-element="ModalContainer/V1"] [data-page-element="Modal/V1"]');
  var menu = document.querySelector('[data-page-element="Navigation/V1"] [data-page-element="Modal/V1"]');
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-open-popup]')) { e.preventDefault(); show(popup); return; }
    if (t.closest('.elNavigatorButton')) { e.preventDefault(); show(menu); return; }
    var modal = t.closest('[data-page-element="Modal/V1"]');
    if (modal && (t === modal || t.closest('.elModalClose'))) { hide(modal); return; }
    var btn = t.closest('[data-optin]');
    if (btn) { e.preventDefault(); send(btn); }
  });
  if (location.hash === '#access') show(popup);
  [].forEach.call(document.querySelectorAll('[data-role="product-card"]'), function (card) {
    var img = card.querySelector('img');
    if (!img) return;
    function bg() { card.style.backgroundImage = 'url(' + img.currentSrc + ')'; card.style.backgroundPosition = 'center'; card.style.backgroundRepeat = 'no-repeat'; card.style.backgroundSize = '210%'; }
    if (img.complete && img.naturalWidth) bg(); else img.addEventListener('load', bg);
  });

  function send(btn) {
    if (!OPTIN || btn.getAttribute('aria-busy') === 'true') return;
    var box = btn.closest('.containerModal') || document;
    var email = box.querySelector('input[name="email"]');
    var name = box.querySelector('input[name="name"]');
    var label = btn.querySelector('.elButtonMainText') || btn;
    var was = label.innerHTML;
    var err = box.querySelector('.fv-error');
    if (!err) {
      var at = btn.closest('[data-page-element="Button/V1"]') || btn;
      err = document.createElement('p'); err.className = 'fv-error'; err.setAttribute('role', 'alert');
      at.parentNode.insertBefore(err, at.nextSibling);
    }
    err.textContent = '';
    var value = (email && email.value || '').trim();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(value)) {
      err.textContent = "That email doesn't look right.";
      if (email) email.focus();
      return;
    }
    btn.setAttribute('aria-busy', 'true');
    label.textContent = 'Submitting...';
    var vid = (document.cookie.match(/(?:^|; )ft_vid=([^;]*)/) || [])[1] || '';
    var q = new URLSearchParams(location.search), src = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ad_id'].forEach(function (k) { if (q.get(k)) src[k] = q.get(k); });
    fetch('/api/optin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ funnel: OPTIN, email: value, name: name ? name.value : '', vid: vid, page: location.pathname, src: src }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.j && res.j.error);
        // neo sends Meta the same Lead from its server (event_id lead_<ft_vid>_<UTC day>):
        // the same id here, so Meta counts the opt-in once.
        if (window.fbq) { if (vid) fbq('track', 'Lead', {}, { eventID: 'lead_' + vid + '_' + new Date().toISOString().slice(0, 10) }); else fbq('track', 'Lead'); }
        location.href = res.j.next || '/';
      })
      .catch(function (e) {
        btn.removeAttribute('aria-busy');
        label.innerHTML = was;
        err.textContent = (e && e.message) || 'Something went wrong. Please try again.';
      });
  }
})();
</script>`;

/** Pictures: the first screen's at once (the last of them preloaded), the rest when scrolled near. */
function pictures(html: string, first: number): string {
  let n = 0;
  let hero = "";
  html = html.replace(/<img\b[^>]*>/g, (tag) => {
    tag = tag.replace(/\sloading="[^"]*"/, "").replace(/\sdecoding="[^"]*"/, "");
    // ClickFunnels' .elImage sets aspect-ratio:auto, which drops the width/height
    // ratio. Inline, the ratio wins; with the wrappers' full width on phones
    // (ICON_CSS), a picture keeps its room before it loads (the form jumped
    // 236 px on the first paint: CLS 0.24 on PageSpeed).
    const w = tag.match(/\swidth="(\d+)"/)?.[1];
    const h = tag.match(/\sheight="(\d+)"/)?.[1];
    if (w && h && !/\sstyle="/.test(tag)) tag = tag.replace("<img ", `<img style="aspect-ratio:${w}/${h}" `);
    n++;
    if (n < first) return tag;
    if (n === first) {
      hero = tag.match(/\ssrc="([^"]+)"/)?.[1] ?? "";
      return tag.replace("<img ", '<img fetchpriority="high" ');
    }
    return tag.replace("<img ", '<img loading="lazy" decoding="async" ');
  });
  return hero ? html.replace("<head>", `<head>\n<link rel="preload" as="image" href="${hero}" fetchpriority="high">`) : html;
}

export function freeHtml(page: PageName): string {
  let html = TEMPLATES[page]
    .replace("{{HEAD}}", `<script>${ORIGIN_BOUNCE_JS}</script>\n<style>${ICON_CSS}</style>\n${TRACKING}`)
    .replace("{{BODY}}", BODY(PAGE_OPTIN[page]));
  // Font Awesome's stylesheets: the icons are drawn above instead.
  html = html.replace(/<link[^>]*href="https:\/\/use\.fontawesome\.com\/[^"]+"[^>]*>\n?/g, "");
  html = withFallbacks(pictures(html, FIRST_SCREEN[page] ?? 2));
  return faster(html, null, []);
}
