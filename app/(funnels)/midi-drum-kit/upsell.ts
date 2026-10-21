import { getFunnel, nextStep } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { beaconScript, type Step } from "@/lib/beacon";
import { AB } from "./abtest";
import { TEMPLATE as FAMOUS } from "./cf/upsell-famous";
import { TEMPLATE as TOP_HITS } from "./cf/upsell-tophits";
import famousDe from "./copy/upsell-famous/de.json";
import famousEn from "./copy/upsell-famous/en.json";
import famousEs from "./copy/upsell-famous/es.json";
import famousFr from "./copy/upsell-famous/fr.json";
import famousIt from "./copy/upsell-famous/it.json";
import topHitsDe from "./copy/upsell-tophits/de.json";
import topHitsEn from "./copy/upsell-tophits/en.json";
import topHitsEs from "./copy/upsell-tophits/es.json";
import topHitsFr from "./copy/upsell-tophits/fr.json";
import topHitsIt from "./copy/upsell-tophits/it.json";
import { funnel } from "./funnel";
import type { Lang } from "./i18n";
import { AFTER_LOAD, dollarFirst, escapeAttr, faster, frenchSpaces, mapText, unitSpaces } from "./landing";

// The one-click upsell pages after the order (funnel.offers): ClickFunnels'
// own pages, 1:1 (./cf/upsell-*.ts, made by tools/cf_clone.mjs --oto), with
// the words of the buyer's language (./copy/upsell-*/<lang>.json: {{tNNN}}
// texts and {{sNNN}} the page's own scripts) and our buttons:
//   Okay, add to my order → /api/checkout/upsell charges the card the order
//     was paid with (or sends a PayPal buyer to PayPal to confirm), then the
//     next step; No thanks → the next step.
// The order travels in the address from page to page: ?payment_intent=pi_…
// (Stripe) or ?paypal_order=… (PayPal), plus u=<the upsells bought so far>,
// up to the thank-you page, which checks every one with Stripe or PayPal.

// extra: words outside the tagged texts, English → this language.
type Copy = { [key: string]: string | Record<string, string> | undefined; extra?: Record<string, string> };

// poster: the Wistia thumbnail shown until the player loads (landing.ts faster),
// with that player's play-button colour; the TOP HITS page's player is Wistia's
// own web component, which needs none.
const PAGES: Record<string, { template: string; copy: Record<Lang, Copy>; poster: string | null; play?: string; beacon: Step; title: string }> = {
  "famous-beats": { template: FAMOUS, copy: { en: famousEn, fr: famousFr, es: famousEs, de: famousDe, it: famousIt }, poster: "vsl-famous", play: "#60615e", beacon: "upsell-1", title: "Famous Beats Bundle" },
  "top-hits": { template: TOP_HITS, copy: { en: topHitsEn, fr: topHitsFr, es: topHitsEs, de: topHitsDe, it: topHitsIt }, poster: null, beacon: "upsell-2", title: "TOP HITS MIDI Bundle" },
};

// What the buttons say while they work, per language.
const UI: Record<Lang, { busy: string; failed: string; noOrder: string }> = {
  en: {
    busy: "Adding it to your order…",
    failed: "The payment didn't go through. Try again, or skip this offer: your order is safe.",
    noOrder: "We couldn't find your order on this page. Your purchase is safe: continue to get your downloads.",
  },
  fr: {
    busy: "Ajout à ta commande…",
    failed: "Le paiement n'est pas passé. Réessaie, ou passe cette offre : ta commande est en sécurité.",
    noOrder: "On ne retrouve pas ta commande sur cette page. Ton achat est en sécurité : continue pour tes téléchargements.",
  },
  es: {
    busy: "Añadiéndolo a tu pedido…",
    failed: "El pago no se completó. Inténtalo de nuevo o salta esta oferta: tu pedido está a salvo.",
    noOrder: "No encontramos tu pedido en esta página. Tu compra está a salvo: continúa para ver tus descargas.",
  },
  de: {
    busy: "Wird zu deiner Bestellung hinzugefügt…",
    failed: "Die Zahlung ist nicht durchgegangen. Versuch es noch einmal oder überspring dieses Angebot: Deine Bestellung ist sicher.",
    noOrder: "Wir finden deine Bestellung auf dieser Seite nicht. Dein Kauf ist sicher: Mach weiter zu deinen Downloads.",
  },
  it: {
    busy: "Lo aggiungo al tuo ordine…",
    failed: "Il pagamento non è andato a buon fine. Riprova, oppure salta questa offerta: il tuo ordine è al sicuro.",
    noOrder: "Non troviamo il tuo ordine su questa pagina. Il tuo acquisto è al sicuro: continua per i tuoi download.",
  },
};

export const offerIds = () => funnel.offers.map((o) => o.id);

// slug: the funnel the page sells for. The TOP HITS MIDI Bundle shows the
// Famous Beats page too, after its own order (same pixel, Clarity and neo).
export function upsellHtml(offerId: string, lang: Lang, currency: Currency, slug: string = funnel.slug): string | null {
  const page = PAGES[offerId];
  const product = getFunnel(slug);
  const offer = product?.offers?.find((o) => o.id === offerId);
  if (!page || !offer || !product) return null;

  const strings: Copy = { ...page.copy.en, ...page.copy[lang] };
  const said = (key: string) => (typeof strings[key] === "string" ? (strings[key] as string) : "");
  const dollars = (t: string) => (currency === "usd" ? t.replaceAll("€", "$") : t);
  const text = (key: string) => {
    let html = said(key);
    // Spanish writes "27 €"; its dollar visitors (Latin America) read "$27".
    if (lang === "es" && currency === "usd") html = key.startsWith("s") ? dollarFirst(html) : mapText(html, dollarFirst);
    if (key.startsWith("s")) return dollars(html); // a script: only its prices change
    html = mapText(html, dollars);
    if (lang === "fr") html = mapText(html, frenchSpaces);
    if (lang === "es" || lang === "de" || lang === "it") html = mapText(html, unitSpaces);
    return html;
  };

  let html = page.template
    .replace(/\{\{([ts]\d{3})\}\}/g, (_, key: string) => text(key))
    .replaceAll("{{YES}}", "#yes")
    .replaceAll("{{NO}}", "#no")
    .replace("{{LANG}}", lang)
    .replace("{{TITLE}}", escapeAttr(page.title))
    .replace("{{DESCRIPTION}}", escapeAttr(page.title))
    .replace("{{HEAD}}", `<style>${FIXES}</style>\n<script>${beaconScript({ funnel: slug, page: page.beacon, lang, abCookie: AB.cookie })}</script>\n${headScripts()}`)
    .replace("{{BODY}}", script(slug, offerId, lang, nextStep(product, lang, offerId)));

  // Words outside the tagged texts: the "reserved for" timer, the progress
  // bar, the tracklist's search box.
  const extra = page.copy[lang].extra ?? {};
  if (Object.keys(extra).length) {
    html = mapText(html, (t) => (extra[t.trim()] ? t.replace(t.trim(), extra[t.trim()]) : t));
    for (const [from, to] of Object.entries(extra)) html = html.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`).replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
  }
  return faster(html, page.poster, [], page.play);
}

// ClickFunnels fades its "fade-in" blocks in with its own script (stripped):
// without it they'd stay invisible, so they're simply shown.
const FIXES = `[data-animation-type]{opacity:1!important;visibility:visible!important}`;

// Meta Pixel PageView, Clarity and neo, as on the landing; never on test hosts.
// The Purchase of an upsell fires on the thank-you page, with the others.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

function headScripts(): string {
  const { metaPixelId, clarityId, neoSnippet } = funnel.tracking;
  return `<script>
(function () {
  if (${OFF}.test(location.hostname)) return;
  window.clarity = window.clarity || function () { (clarity.q = clarity.q || []).push(arguments); };
  clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
  if (!window.fbq) {
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
  }
  fbq('init', '${metaPixelId}');
  fbq('track', 'PageView');
  ${AFTER_LOAD}(['https://connect.facebook.net/en_US/fbevents.js', '${neoSnippet}', 'https://www.clarity.ms/tag/${clarityId}']);
})();
</script>`;
}

/** The buttons, the "reserved for" countdown. */
function script(slug: string, offerId: string, lang: Lang, next: string): string {
  const cfg = JSON.stringify({ funnel: slug, offer: offerId, lang, next, ui: UI[lang], ab: AB.cookie });
  return `<script>
(function () {
  var C = ${cfg};
  var q = new URLSearchParams(location.search);
  var main = q.get('payment_intent') ? ['payment_intent', q.get('payment_intent')] : q.get('paypal_order') ? ['paypal_order', q.get('paypal_order')] : null;
  var bought = (q.get('u') || '').split(',').filter(Boolean);
  function go(extra) {
    var p = new URLSearchParams();
    if (main) p.set(main[0], main[1]);
    var u = bought.concat(extra ? [extra] : []);
    if (u.length) p.set('u', u.join(','));
    location.href = C.next + (p.toString() ? '?' + p.toString() : '');
  }
  function cookie(n) { var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }
  var busy = false;
  function say(btn, t) {
    var box = btn.closest('[data-page-element="Button/V1"]') || btn.parentElement;
    var n = box.querySelector('.oto-note');
    if (!n) { n = document.createElement('p'); n.className = 'oto-note'; n.style.cssText = 'margin:10px auto 0;max-width:420px;font:500 14px/1.4 Inter,sans-serif;color:#fff;text-align:center'; box.appendChild(n); }
    n.textContent = t;
  }
  function label(btn, t) { var m = btn.querySelector('.elButtonMainText'); if (m) { if (!m.dataset.orig) m.dataset.orig = m.innerHTML; m.textContent = t; } }
  function reset(btn) { var m = btn.querySelector('.elButtonMainText'); if (m && m.dataset.orig) m.innerHTML = m.dataset.orig; busy = false; }
  function stripeAction(r, btn) {
    var s = document.createElement('script'); s.src = 'https://js.stripe.com/v3';
    s.onload = function () {
      Stripe(r.publishableKey).confirmCardPayment(r.clientSecret, { payment_method: r.paymentMethod }).then(function (x) {
        if (x.paymentIntent && x.paymentIntent.status === 'succeeded') go(x.paymentIntent.id);
        else { reset(btn); say(btn, C.ui.failed); }
      });
    };
    document.head.appendChild(s);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-oto]');
    if (!a) return;
    e.preventDefault();
    if (a.getAttribute('data-oto') === 'no') return go(null);
    if (busy) return;
    if (!main) return say(a, C.ui.noOrder);
    busy = true; label(a, C.ui.busy);
    fetch('/api/checkout/upsell', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ funnel: C.funnel, offer: C.offer, order: main[1], lang: C.lang, bought: bought, variant: cookie(C.ab), ft_vid: cookie('ft_vid') })
    }).then(function (res) { return res.json().catch(function () { return {}; }).then(function (r) { r.code = res.status; return r; }); }).then(function (r) {
      if (r.status === 'paid') return go(r.id);
      if (r.status === 'action') return stripeAction(r, a);
      if (r.status === 'paypal') return (location.href = r.url);
      // The server's words are English (Stripe's reason for a declined card too).
      reset(a); say(a, C.lang === 'en' && r.error ? r.error : r.code === 400 ? C.ui.noOrder : C.ui.failed);
    }).catch(function () { reset(a); say(a, C.ui.failed); });
  }, true);

  // "Your copy is reserved for 05:00": short, so it's decided on impulse; counts
  // down from this order's first visit of this page (a reload doesn't restart it).
  var key = 'oto-' + C.offer + '-' + (main ? main[1] : ''), start = Date.now();
  try { start = Number(sessionStorage.getItem(key)) || start; sessionStorage.setItem(key, String(start)); } catch (e) {}
  var mins = document.getElementById('cf-mins'), secs = document.getElementById('cf-secs'), ms = document.getElementById('cf-ms');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var left = Math.max(0, 5 * 60 * 1000 - (Date.now() - start));
    if (mins) mins.textContent = pad(Math.floor(left / 60000));
    if (secs) secs.textContent = pad(Math.floor(left / 1000) % 60);
    if (ms) ms.textContent = pad(Math.floor(left / 10) % 100);
    if (left > 0) requestAnimationFrame(tick);
  }
  tick();
})();
</script>`;
}
