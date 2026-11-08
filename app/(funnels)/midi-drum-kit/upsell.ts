import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { beaconScript, PREVIEW_JS, type Step } from "@/lib/beacon";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { restate, restateEach } from "@/lib/restate";
import { PAY } from "./payTest";
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
import { applySections, imageOrigins, swapImages } from "@/lib/cfSections";
import { pageLayouts } from "@/lib/pageLayout";
import { pageEdits } from "@/lib/pageTexts";
import { markupEdits, type TextPage } from "./texts";
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
// The offer's price and its place after the order are dashboard → Products'
// (lib/funnels.ts resolveFunnel): every price the page states is that one.

// extra: words outside the tagged texts, English → this language.
type Copy = { [key: string]: string | Record<string, string> | undefined; extra?: Record<string, string> };

// poster: the Wistia thumbnail shown until the player loads (landing.ts faster),
// with that player's play-button colour; the TOP HITS page's player is Wistia's
// own web component, which needs none.
// videos: the page's video in other languages (Wistia id, and its poster when the page has
// one), re-voiced with captions in that language (vsl/script-upsell-*-<lang>.md, made with
// tools/upsell_vsl.py); the other languages play the English one.
const PAGES: Record<string, { template: string; copy: Record<Lang, Copy>; poster: string | null; play?: string; beacon: Step; title: string; wistia: string; videos: Partial<Record<Lang, { id: string; poster?: string }>> }> = {
  "famous-beats": { template: FAMOUS, copy: { en: famousEn, fr: famousFr, es: famousEs, de: famousDe, it: famousIt }, poster: "vsl-famous", play: "#60615e", beacon: "upsell-1", title: "Famous Beats Bundle", wistia: "t1dx0gv5tg", videos: { it: { id: "hjo7o7c8nm", poster: "vsl-famous-it" } } },
  "top-hits": { template: TOP_HITS, copy: { en: topHitsEn, fr: topHitsFr, es: topHitsEs, de: topHitsDe, it: topHitsIt }, poster: null, beacon: "upsell-2", title: "TOP HITS MIDI Bundle", wistia: "8s55snt7vw", videos: { it: { id: "fgwkqm6rvn" } } },
};

// The page's step in dashboard → Analytics: its place among the funnel's
// upsells (the Famous Beats Bundle shows TOP HITS first), else the page's own.
const beaconStep = (product: { offers?: readonly { id: string }[] }, offerId: string, fallback: Step): Step => {
  const at = product.offers?.findIndex((o) => o.id === offerId) ?? -1;
  return at === 0 ? "upsell-1" : at === 1 ? "upsell-2" : fallback;
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
// marks: each editable text (tNNN) between <!--fx:tNNN--> and <!--/fx-->, every
// section and picture tagged, for the dashboard's editor on the page
// (app/api/funnels/[id]/texts/frame).
export async function upsellHtml(offerId: string, lang: Lang, currency: Currency, slug: string = funnel.slug, marks = false): Promise<string | null> {
  const page = PAGES[offerId];
  const product = (await resolveFunnel(slug)) ?? getFunnel(slug);
  const offer = product?.offers?.find((o) => o.id === offerId);
  const was = getFunnel(slug)?.offers?.find((o) => o.id === offerId)?.price[currency];
  if (!page || !offer || !product) return null;

  // With the texts and the layout (sections hidden or moved, pictures replaced) changed in the
  // dashboard (funnel map → Edit, ./texts.ts, lib/pageLayout.ts); the Drum Kit's, also where TOP HITS shows the page.
  const [allEdits, layouts] = await Promise.all([pageEdits(funnel.slug, lang, true), pageLayouts(funnel.slug, lang, true)]);
  const edits = markupEdits(allEdits, offerId as TextPage);
  const layout = layouts[offerId] ?? {};
  const strings: Copy = { ...page.copy.en, ...page.copy[lang], ...edits };
  // "€0.08 per hit transcription" (Famous Beats, ÷ 320) and "€0.03 per chord progression" (TOP HITS, ÷ 1000) follow the price.
  const units = ({ "famous-beats": 320, "top-hits": 1000 } as Record<string, number>)[offerId];
  const base = was ?? offer.price[currency];
  const per = (t: string) => (units ? restateEach(t, base, offer.price[currency], units, lang) : t);
  const said = (key: string) =>
    typeof strings[key] === "string" ? per(restate(strings[key] as string, was ?? offer.price[currency], offer.price[currency], lang)) : "";
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

  let html = applySections(page.template, layout, marks)
    .replace(/\{\{([ts]\d{3})\}\}/g, (_, key: string) => (marks && key.startsWith("t") ? `<!--fx:${key}-->${text(key)}<!--/fx-->` : text(key)))
    .replaceAll("{{YES}}", "#yes")
    .replaceAll("{{NO}}", "#no")
    .replace("{{LANG}}", lang)
    .replace("{{TITLE}}", escapeAttr(page.title))
    .replace("{{DESCRIPTION}}", escapeAttr(page.title))
    .replace("{{HEAD}}", `<script>${ORIGIN_BOUNCE_JS}</script>\n<style>${FIXES}</style>\n<script>${beaconScript({ funnel: slug, page: beaconStep(product, offerId, page.beacon), lang, abCookie: PAY.cookie })}</script>\n${headScripts()}`)
    .replace("{{BODY}}", script(slug, offerId, lang, nextStep(product, lang, offerId)));

  // Words outside the tagged texts: the "reserved for" timer, the progress
  // bar, the tracklist's search box.
  const extra = page.copy[lang].extra ?? {};
  if (Object.keys(extra).length) {
    html = mapText(html, (t) => (extra[t.trim()] ? t.replace(t.trim(), extra[t.trim()]) : t));
    for (const [from, to] of Object.entries(extra)) html = html.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`).replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
  }
  const video = page.videos[lang];
  if (video) html = html.replaceAll(page.wistia, video.id);
  const images = layout.images ?? {};
  html = faster(swapImages(html, images, marks), page.poster && (video?.poster ?? page.poster), [], page.play);
  const origins = imageOrigins(images);
  return origins ? html.replace("<head>", `<head>\n${origins}`) : html;
}

// ClickFunnels fades its "fade-in" blocks in with its own script (stripped):
// without it they'd stay invisible, so they're simply shown.
// Its buttons are white with dark words and turn black on hover, words still dark
// (unreadable): on hover the words turn white.
const FIXES = `[data-animation-type]{opacity:1!important;visibility:visible!important}
.elButton:hover .elButtonText,.elButton.elButtonHovered .elButtonText{color:#fff!important}`;

// Meta Pixel PageView, Clarity and neo, as on the landing; never on test hosts.
// The Purchase of an upsell fires on the thank-you page, with the others.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

function headScripts(): string {
  const { metaPixelId, clarityId, neoSnippet } = funnel.tracking;
  return `<script>
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
  ${AFTER_LOAD}(['https://connect.facebook.net/en_US/fbevents.js', '${neoSnippet}', 'https://www.clarity.ms/tag/${clarityId}']);
})();
</script>`;
}

/** The buttons, the "reserved for" countdown. */
function script(slug: string, offerId: string, lang: Lang, next: string): string {
  const cfg = JSON.stringify({ funnel: slug, offer: offerId, lang, next, ui: UI[lang], ab: PAY.cookie });
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
  // Already ticked on the order form (OrderForm.tsx sets fv_owned): this offer is skipped.
  if (cookie('fv_owned').split(',').indexOf(C.offer) >= 0) { go(); return; }
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
