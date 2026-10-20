import type { Currency } from "@/lib/geo";
import { AB_LANDING_CSS, AB_SCRIPT } from "./abtest";
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
// behind every button, our tracking and the button-colour test (./abtest.ts).

const STRINGS: Record<Lang, Record<string, string>> = { en, fr };

// Images with words baked in, swapped per language.
const IMAGES: Partial<Record<Lang, Record<string, string>>> = {
  fr: { "value-stack": "value-stack-fr" },
};

// French: the space before : ; ! ? » % and after « stays on the line with the
// mark, and "glisser-déposer" never splits at its hyphen.
const frenchSpaces = (text: string) =>
  text
    .replace(/ (?=[:;!?»%€$])/g, " ")
    .replace(/« /g, "« ")
    .replace(/glisser-dépos/g, "glisser‑dépos");

/** Apply fn to the text between tags only, never to tags or attributes. */
const mapText = (html: string, fn: (t: string) => string) => html.replace(/(^|>)([^<]+)/g, (_, gt, text) => gt + fn(text));

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

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
    .replace("{{HEAD}}", `<script>${AB_SCRIPT}</script>\n<style>${AB_LANDING_CSS}</style>\n${headScripts(currency)}`)
    .replace("{{BODY}}", BODY_SCRIPT);
  for (const [from, to] of Object.entries(IMAGES[lang] ?? {})) {
    html = html.replaceAll(`/funnels/midi-drum-kit/${from}.webp`, `/funnels/midi-drum-kit/${to}.webp`);
  }
  return html;
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
