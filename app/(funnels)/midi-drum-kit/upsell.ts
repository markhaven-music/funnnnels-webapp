import { checkoutPages, getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import type { Currency } from "@/lib/geo";
import { beaconScript, PREVIEW_JS, type Step } from "@/lib/beacon";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { restate, restateEach } from "@/lib/restate";
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
const PAGES: Record<string, { template: string; copy: Record<Lang, Copy>; poster: string | null; play?: string; beacon: Step; title: string; wistia: string; videos: Partial<Record<Lang, { id: string; poster?: string }>>; quickNo?: string }> = {
  "famous-beats": { template: FAMOUS, copy: { en: famousEn, fr: famousFr, es: famousEs, de: famousDe, it: famousIt }, poster: "vsl-famous", play: "#60615e", beacon: "upsell-1", title: "Famous Beats Bundle", wistia: "t1dx0gv5tg", videos: { it: { id: "hjo7o7c8nm", poster: "vsl-famous-it" } }, quickNo: "t028" },
  "top-hits": { template: TOP_HITS, copy: { en: topHitsEn, fr: topHitsFr, es: topHitsEs, de: topHitsDe, it: topHitsIt }, poster: null, beacon: "upsell-2", title: "TOP HITS MIDI Bundle", wistia: "8s55snt7vw", videos: { it: { id: "fgwkqm6rvn" } }, quickNo: "t028" },
};

// The page's step in dashboard → Analytics: its place among the funnel's
// upsells (the Famous Beats Bundle shows TOP HITS first), else the page's own.
export const beaconStep = (product: { offers?: readonly { id: string }[] }, offerId: string, fallback: Step): Step => {
  const at = product.offers?.findIndex((o) => o.id === offerId) ?? -1;
  return at === 0 ? "upsell-1" : at === 1 ? "upsell-2" : at === 2 ? "upsell-3" : fallback;
};

// What the buttons say while they work, per language.
// done: the bar on top of the page: the payment went through, and the downloads
// are a step further, so closing the page means missing them (2026-11-08: about
// 1 in 4 buyers closed this page; "dire order complete non chiude il loop
// mentale?": no mention of the email, which told them they could leave).
// yes / yesSub: the Yes button put under the video with the No (quickChoice).
const UI: Record<Lang, { busy: string; failed: string; noOrder: string; done: string; doneLater: string; yes: string; yesSub: string }> = {
  en: {
    yes: "Yes, add it to my order",
    yesSub: "{price} · one tap, paid the way you just paid",
    done: "Payment received. Your downloads are on the next page.",
    doneLater: "Payment received. Your downloads are waiting right after these offers.",
    busy: "Adding it to your order…",
    failed: "The payment didn't go through. Try again, or skip this offer: your order is safe.",
    noOrder: "We couldn't find your order on this page. Your purchase is safe: continue to get your downloads.",
  },
  fr: {
    yes: "Oui, ajoute-le à ma commande",
    yesSub: "{price} · un clic, payé comme tu viens de payer",
    done: "Paiement reçu. Tes téléchargements sont sur la page suivante.",
    doneLater: "Paiement reçu. Tes téléchargements t'attendent juste après ces offres.",
    busy: "Ajout à ta commande…",
    failed: "Le paiement n'est pas passé. Réessaie, ou passe cette offre : ta commande est en sécurité.",
    noOrder: "On ne retrouve pas ta commande sur cette page. Ton achat est en sécurité : continue pour tes téléchargements.",
  },
  es: {
    yes: "Sí, añádelo a mi pedido",
    yesSub: "{price} · un toque, pagado como acabas de pagar",
    done: "Pago recibido. Tus descargas están en la página siguiente.",
    doneLater: "Pago recibido. Tus descargas te esperan justo después de estas ofertas.",
    busy: "Añadiéndolo a tu pedido…",
    failed: "El pago no se completó. Inténtalo de nuevo o salta esta oferta: tu pedido está a salvo.",
    noOrder: "No encontramos tu pedido en esta página. Tu compra está a salvo: continúa para ver tus descargas.",
  },
  de: {
    yes: "Ja, zu meiner Bestellung hinzufügen",
    yesSub: "{price} · ein Klick, bezahlt wie eben",
    done: "Zahlung erhalten. Deine Downloads sind auf der nächsten Seite.",
    doneLater: "Zahlung erhalten. Deine Downloads warten direkt nach diesen Angeboten.",
    busy: "Wird zu deiner Bestellung hinzugefügt…",
    failed: "Die Zahlung ist nicht durchgegangen. Versuch es noch einmal oder überspring dieses Angebot: Deine Bestellung ist sicher.",
    noOrder: "Wir finden deine Bestellung auf dieser Seite nicht. Dein Kauf ist sicher: Mach weiter zu deinen Downloads.",
  },
  it: {
    yes: "Sì, aggiungilo al mio ordine",
    yesSub: "{price} · un tocco, pagato come hai appena pagato",
    done: "Pagamento ricevuto. I tuoi download sono nella pagina successiva.",
    doneLater: "Pagamento ricevuto. I tuoi download ti aspettano subito dopo queste offerte.",
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
    .replace("{{HEAD}}", `<script>${ORIGIN_BOUNCE_JS}</script>\n<style>${FIXES}</style>\n<script>${beaconScript({ funnel: slug, page: beaconStep(product, offerId, page.beacon), lang, abCookie: AB.cookie })}</script>\n${headScripts()}`)
    .replace("{{BODY}}", script(slug, offerId, lang, nextStep(product, lang, offerId)));

  // Words outside the tagged texts: the "reserved for" timer, the progress
  // bar, the tracklist's search box.
  const extra = page.copy[lang].extra ?? {};
  if (Object.keys(extra).length) {
    html = mapText(html, (t) => (extra[t.trim()] ? t.replace(t.trim(), extra[t.trim()]) : t));
    for (const [from, to] of Object.entries(extra)) html = html.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`).replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
  }
  html = html.replace(/<body[^>]*>/, (tag) => `${tag}<style>${HIDE_CF_BAR}</style>${stepsBar(product, offerId, lang)}`);
  if (page.quickNo) html = quickChoice(html, UI[lang], priceTag(offer.price[currency], currency, lang), marks ? `<!--fx:${page.quickNo}-->${text(page.quickNo)}<!--/fx-->` : text(page.quickNo));
  const video = page.videos[lang];
  if (video) html = html.replaceAll(page.wistia, video.id);
  const images = layout.images ?? {};
  html = faster(swapImages(html, images, marks), page.poster && (video?.poster ?? page.poster), [], page.play);
  const origins = imageOrigins(images);
  return origins ? html.replace("<head>", `<head>\n${origins}`) : html;
}

// The choice, where a buyer looks first: right under the video, Yes then No.
// 2026-11-08, "Sì, fallo": about 1 in 4 buyers closed the first upsell, whose first
// "No thanks" sat 3 phone screens down, so the page's own No (quickNo: its text) went
// under the video; then "fallo piu chiaro con bottoni piu chiari soprattutto su
// mobile": a Yes goes with it (the first one sat 3 screens down too), and every Yes /
// No on the page is a clear button (CHOICE_CSS).
function quickChoice(html: string, ui: (typeof UI)[Lang], price: string, no: string): string {
  let cut = -1;
  const at = html.indexOf('data-page-element="Video/V1"');
  if (at >= 0) {
    const end = html.indexOf("</iframe></div></div>", at);
    if (end >= 0) cut = end + "</iframe></div></div>".length;
  }
  if (cut < 0) {
    // TOP HITS: Wistia's web component in a custom-code block.
    const end = html.indexOf("</wistia-player></span></div></div>");
    if (end >= 0) cut = end + "</wistia-player></span></div></div>".length;
  }
  if (cut < 0) return html;
  const sub = ui.yesSub.replace("{price}", price);
  const block = `<div id="oto-choice"><a href="#yes" data-oto="yes" class="elButton"><span class="elButtonMain"><span class="elButtonMainText">${ui.yes}<i class="oto-arrow" aria-hidden="true"></i></span></span><span class="oto-sub">${sub}</span></a><a href="#no" data-oto="no" class="elButton"><span class="elButtonMain"><span class="elButtonMainText elButtonText">${no}</span></span></a></div>`;
  return html.slice(0, cut) + block + html.slice(cut);
}

// "$27", "€27", "27 €" as the page writes prices in that language.
function priceTag(amount: number, currency: Currency, lang: Lang): string {
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  if (currency === "usd") return `$${n}`;
  return lang === "en" ? `€${n}` : `${n}\u00a0€`;
}

// ClickFunnels' own bar on top ("ONE TIME OFFER...", a fixed 73 % / 90 %): its section, replaced by stepsBar.
// And the GRIND STUDIO logo above the headline keeps its place while it loads (it had no
// aspect ratio, so the video and everything under it jumped: CLS 0.18 on PageSpeed).
const HIDE_CF_BAR = '.id-6Z-8MQNDX-8{display:none!important}img[src^="/funnels/midi-drum-kit/up-19479683"]{aspect-ratio:2118/242;height:auto!important}';

// Where the buyer is (2026-11-08, "metti una barra progress in linea con lo step in
// cui siamo. fai capire che ci sono altri steps"): on top of every upsell page,
// "✓ Payment received" and where the downloads are, then one segment per step of
// this funnel: paid, each upsell in its order (funnel.offers), the downloads.
// Steps behind are yellow, this one yellow and bold, the rest grey. Also on
// ./[lang]/jazz-offer. Inline styles: the ClickFunnels pages have no stylesheet of ours.
const STEPS_UI: Record<Lang, { paid: string; offer: string; downloads: string; step: string }> = {
  en: { paid: "Paid", offer: "Offer {n}", downloads: "Downloads", step: "Step {i} of {n}" },
  fr: { paid: "Payé", offer: "Offre {n}", downloads: "Téléchargements", step: "Étape {i} sur {n}" },
  es: { paid: "Pagado", offer: "Oferta {n}", downloads: "Descargas", step: "Paso {i} de {n}" },
  de: { paid: "Bezahlt", offer: "Angebot {n}", downloads: "Downloads", step: "Schritt {i} von {n}" },
  it: { paid: "Pagato", offer: "Offerta {n}", downloads: "Download", step: "Passo {i} di {n}" },
};

export function stepsBar(product: { offers?: readonly { id: string }[] } & Parameters<typeof nextStep>[0], offerId: string, lang: Lang): string {
  const ui = STEPS_UI[lang] ?? STEPS_UI.en;
  const offers = product.offers ?? [];
  const at = Math.max(0, offers.findIndex((o) => o.id === offerId));
  const labels = [`✓ ${ui.paid}`, ...offers.map((_, i) => ui.offer.replace("{n}", String(i + 1))), ui.downloads];
  const here = at + 1;
  // "on the next page" only where the next page is the downloads (the Drum Kit shows Famous Beats second of three).
  const last = nextStep(product, lang, offerId) === checkoutPages(product, lang).thankYou;
  const done = last ? UI[lang].done : UI[lang].doneLater;
  const cells = labels
    .map((label, i) => {
      const bar = i <= here ? "#f5b800" : "rgba(255,255,255,.18)";
      const color = i === here ? "#fff" : i < here ? "rgba(255,255,255,.62)" : "rgba(255,255,255,.4)";
      return `<li style="flex:1;min-width:0;list-style:none;margin:0;padding:0"${i === here ? ' aria-current="step"' : ""}><span style="display:block;height:6px;border-radius:3px;background:${bar}${i === here ? ";box-shadow:0 0 10px rgba(245,184,0,.55)" : ""}"></span><span style="display:block;margin-top:7px;font-size:12px;line-height:1.2;font-weight:${i === here ? 700 : 500};color:${color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</span></li>`;
    })
    .join("");
  const step = ui.step.replace("{i}", String(here + 1)).replace("{n}", String(labels.length));
  return `<div id="oto-steps" style="background:#111;padding:12px 16px 14px;font-family:Inter,system-ui,sans-serif;text-align:center"><p style="margin:0 auto;max-width:560px;color:rgba(255,255,255,.88);font-size:15px;line-height:1.4;font-weight:500"><span aria-hidden="true" style="color:#f5b800;font-weight:800;margin-right:6px">✓</span>${done}</p><ol aria-label="${step}" style="display:flex;gap:5px;max-width:560px;margin:12px auto 0;padding:0">${cells}</ol></div>`;
}

// Every Yes and No on the ClickFunnels pages (2026-11-08, "fallo piu chiaro con bottoni
// piu chiari soprattutto su mobile"; then "these buttons are not super juicy. they need
// to be high converting"): Yes = the funnel's yellow as a big physical key, the same
// as the landings' CTA (jazz-midi-pack/btn.module.css): a solid lip underneath, a
// gloss on the top half, a light sweep, a pulsing glow, gentle breathing, an arrow
// that nudges; it sinks onto its lip when pressed. No = a plain dark button as wide
// as Yes, white words: two buttons that read as a choice, Yes by far the louder.
// The arrow is drawn here (ClickFunnels' Font Awesome arrow came out as a box: the
// button's font is forced to Inter, which has no such glyph).
const ARROW = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20448%20512%27%3E%3Cpath%20d%3D%27M190.5%2066.9l22.2-22.2c9.4-9.4%2024.6-9.4%2033.9%200L441%20239c9.4%209.4%209.4%2024.6%200%2033.9L246.6%20467.3c-9.4%209.4-24.6%209.4-33.9%200l-22.2-22.2c-9.5-9.5-9.3-25%20.4-34.3L311.4%20296H24c-13.3%200-24-10.7-24-24v-32c0-13.3%2010.7-24%2024-24h287.4L190.9%20101.2c-9.8-9.3-10-24.8-.4-34.3z%27%2F%3E%3C%2Fsvg%3E")`;
const CHOICE_CSS = `#oto-choice{display:flex;flex-direction:column;align-items:center;gap:16px;max-width:480px;margin:24px auto 8px;padding:0 16px}
a.elButton[href="#yes"]{position:relative!important;isolation:isolate;overflow:hidden;display:flex!important;flex-direction:column;align-items:center;justify-content:center;width:100%!important;max-width:480px!important;min-height:88px;box-sizing:border-box;margin:0 auto 8px!important;padding:16px 20px!important;border:0!important;border-radius:20px!important;background:linear-gradient(180deg,#ffd633 0%,#f5b800 50%,#e6a800 100%)!important;box-shadow:inset 0 2px 0 rgba(255,255,255,.65),inset 0 -4px 0 rgba(0,0,0,.14),0 8px 0 #8a6400,0 22px 48px -10px rgba(245,184,0,.6)!important;text-decoration:none!important;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;transition:translate 90ms ease-out,box-shadow 90ms ease-out,filter 160ms ease;animation:oto-breathe 2.8s ease-in-out infinite,oto-glow 2.6s ease-in-out infinite}
a.elButton[href="#yes"]::before{content:""!important;position:absolute;left:4%;right:4%;top:3px;height:46%;z-index:-1;border-radius:16px 16px 50% 50%/16px 16px 12px 12px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0));opacity:.45;pointer-events:none}
a.elButton[href="#yes"]::after{content:""!important;position:absolute;top:0;bottom:0;left:0;width:45%;z-index:-1;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);transform:translateX(-120%) skewX(-12deg);animation:oto-sweep 3.4s ease-in-out infinite;pointer-events:none}
a.elButton[href="#yes"] .elButtonMain{display:block;width:100%;text-align:center!important}
a.elButton[href="#yes"] .elButtonMainText{display:block;text-align:center!important}
a.elButton[href="#yes"] .elButtonMainText,a.elButton[href="#yes"] .elButtonMainText *{color:#140f00!important;font-family:Inter,system-ui,sans-serif!important;font-size:clamp(18px,5.2vw,24px)!important;font-weight:900!important;line-height:1.1!important;text-transform:uppercase!important;letter-spacing:-.01em!important;text-wrap:balance}
a.elButton[href="#yes"]:hover{filter:brightness(1.06) saturate(1.08)}
a.elButton[href="#yes"]:hover .elButtonText,a.elButton[href="#yes"]:hover .elButtonMainText{color:#140f00!important}
a.elButton[href="#yes"]:active{translate:0 6px;animation-play-state:paused;box-shadow:inset 0 2px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.12),0 2px 0 #8a6400,0 8px 22px -10px rgba(245,184,0,.6)!important}
a.elButton[href="#yes"] i.fa-arrow-right,a.elButton[href="#yes"] .oto-arrow{display:inline-block!important;width:.9em!important;height:.9em;margin-left:.35em;margin-right:-.2em;vertical-align:-.08em;background:currentColor;-webkit-mask:${ARROW} center/contain no-repeat;mask:${ARROW} center/contain no-repeat;animation:oto-nudge 1.4s ease-in-out infinite}
a.elButton[href="#yes"] i.fa-arrow-right::before{content:none!important;display:none!important}
a.elButton[href="#yes"] .elButtonSub,a.elButton[href="#yes"] .oto-sub{display:block;margin-top:6px;color:rgba(20,15,0,.78)!important;font:700 14px/1.3 Inter,system-ui,sans-serif!important;text-transform:none!important}
a.elButton[href="#no"]{display:flex!important;align-items:center;justify-content:center;width:100%!important;max-width:480px!important;min-height:54px;box-sizing:border-box;margin:0 auto!important;padding:12px 18px!important;border:0!important;border-radius:14px!important;background:rgba(0,0,0,.55)!important;box-shadow:none!important;text-decoration:none!important}
a.elButton[href="#no"] .elButtonMainText,a.elButton[href="#no"] .elButtonMainText *{color:#fff!important;font-family:Inter,system-ui,sans-serif!important;font-size:15px!important;font-weight:600!important;line-height:1.35!important;text-decoration:none!important;text-transform:none!important;letter-spacing:0!important}
a.elButton[href="#no"]:hover{background:rgba(0,0,0,.75)!important}
@keyframes oto-breathe{0%,100%{scale:1}50%{scale:1.025}}
@keyframes oto-glow{0%,100%{filter:drop-shadow(0 0 0 rgba(245,184,0,0))}50%{filter:drop-shadow(0 0 18px rgba(255,200,40,.75))}}
@keyframes oto-sweep{0%,55%{transform:translateX(-120%) skewX(-12deg)}85%,100%{transform:translateX(260%) skewX(-12deg)}}
@keyframes oto-nudge{0%,100%{translate:0 0}50%{translate:5px 0}}
@media (min-width:900px){a.elButton[href="#yes"]{min-height:98px}a.elButton[href="#yes"] .elButtonMainText,a.elButton[href="#yes"] .elButtonMainText *{font-size:28px!important}}
@media (prefers-reduced-motion:reduce){a.elButton[href="#yes"],a.elButton[href="#yes"]::after,a.elButton[href="#yes"] i.fa-arrow-right,a.elButton[href="#yes"] .oto-arrow{animation:none}}`;

// ClickFunnels fades its "fade-in" blocks in with its own script (stripped):
// without it they'd stay invisible, so they're simply shown.
// Its buttons are white with dark words and turn black on hover, words still dark
// (unreadable): on hover the words turn white.
const FIXES = `[data-animation-type]{opacity:1!important;visibility:visible!important}
.elButton:hover .elButtonText,.elButton.elButtonHovered .elButtonText{color:#fff!important}
${CHOICE_CSS}`;

// Meta Pixel PageView, Clarity and neo, as on the landing; never on test hosts.
// The Purchase of an upsell fires on the thank-you page, with the others.
export const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

export function headScripts(): string {
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

/** The buttons, the "reserved for" countdown (also on ./[lang]/jazz-offer: its links with data-oto). */
export function script(slug: string, offerId: string, lang: Lang, next: string): string {
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
  // Already ticked on the order form (OrderForm.tsx sets fv_owned): this offer is skipped.
  if (cookie('fv_owned').split(',').indexOf(C.offer) >= 0) { go(); return; }
  // Bought before (any order of this email, or ClickFunnels): skipped too (/api/checkout/owned).
  if (main) fetch('/api/checkout/owned', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ funnel: C.funnel, offer: C.offer, order: main[1] }) })
    .then(function (r) { return r.json(); }).then(function (r) { if (r && r.owned) go(); }).catch(function () {});
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
      if (r.status === 'owned') return go(null);
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
