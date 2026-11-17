import type { Lang } from "./i18n";

// The pop-up add-on (2026-11-16, "mettiamolo come popup bump", then "il popup dovrebbe uscire quando
// cliccano sulla landing page non sull order page"): the kit's grooves as WAV loops, offered in a pop-up
// when a landing button is tapped, before the order page. Yes and No are the same size and both go on to
// the order page; Yes arrives there with the WAVs in the order (a line in the summary with a Remove link),
// No as before. A tap outside or Escape only closes it. "Checking availability…"
// is shown after the answer (lib/availability.ts window.__fvAvShow; 2026-11-17 "check availability dovrebbe apparire
// dopo qualsiasi bottone premuto e popup bump scomparsa").
//
// For the server it is a normal add-on (dashboard → Products, funnel_items role "bump", key below), priced
// and checked like any other (lib/funnels.ts pickedBumps); it never shows as a tick-box on the order page.
// No such row in Products: no pop-up, the landings keep "Checking availability…".
//
// The answer goes from the landing to the order page in localStorage (the order page is prerendered behind
// the pop-up at the same address, so not in the URL); an answer older than CHOICE_MS is ignored.
export const POPUP_BUMP = "wav";
export const POPUP_KEY = "fv_popup_dk";
export const CHOICE_MS = 30 * 60_000;
/** The pop-up's picture when the Products row has none: the kit's box. */
export const POPUP_IMAGE = "/funnels/midi-drum-kit/kit-box-v3-160.webp";

type Words = { title: string; body: string; yes: string; no: string; remove: string };

// English first; the others follow it line by line (translations are literal). {price}: the add-on's price.
export const POPUP_WORDS: Record<Lang, Words> = {
  en: {
    title: "Want the grooves as audio too?",
    body: "Add the WAV version: the kit's grooves as ready-to-play audio loops. Drag one into any DAW and it plays. No drum sampler, no MIDI routing.",
    yes: "Yes, add the WAVs · {price}",
    no: "No thanks, MIDI only",
    remove: "Remove",
  },
  fr: {
    title: "Tu veux aussi les grooves en audio ?",
    body: "Ajoute la version WAV : les grooves du kit en boucles audio prêtes à jouer. Glisse-en une dans n'importe quel DAW et elle joue. Pas de sampler de batterie, pas de routage MIDI.",
    yes: "Oui, ajoute les WAV · {price}",
    no: "Non merci, MIDI seulement",
    remove: "Retirer",
  },
  es: {
    title: "¿Quieres los grooves también en audio?",
    body: "Añade la versión WAV: los grooves del kit como loops de audio listos para sonar. Arrastra uno a cualquier DAW y suena. Sin sampler de batería, sin ruteo MIDI.",
    yes: "Sí, añade los WAV · {price}",
    no: "No, gracias, solo MIDI",
    remove: "Quitar",
  },
  de: {
    title: "Willst du die Grooves auch als Audio?",
    body: "Hol dir die WAV-Version: die Grooves des Kits als fertige Audio-Loops. Zieh einen in jede DAW und er spielt. Kein Drum-Sampler, kein MIDI-Routing.",
    yes: "Ja, WAVs dazu · {price}",
    no: "Nein danke, nur MIDI",
    remove: "Entfernen",
  },
  it: {
    title: "Vuoi i groove anche in audio?",
    body: "Aggiungi la versione WAV: i groove del kit come loop audio pronti da suonare. Trascinane uno in qualsiasi DAW e suona. Niente drum sampler, niente routing MIDI.",
    yes: "Sì, aggiungi i WAV · {price}",
    no: "No grazie, solo MIDI",
    remove: "Rimuovi",
  },
};

const CSS = `.fv-pb{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.8);opacity:0;transition:opacity .18s}
.fv-pb.on{opacity:1}
.fv-pb-box{width:100%;max-width:420px;max-height:calc(100dvh - 32px);overflow:auto;background:#111;color:#fff;border-radius:6px;padding:26px 22px 22px;text-align:center;font:400 16px/1.45 Inter,"Inter Fallback",system-ui,sans-serif;transform:translateY(10px) scale(.97);transition:transform .22s}
.fv-pb.on .fv-pb-box{transform:none}
.fv-pb-pic{display:block;width:120px;height:120px;margin:0 auto 14px;object-fit:contain}
.fv-pb-t{margin:0 0 10px;font:800 24px/1.15 Poppins,Inter,system-ui,sans-serif;letter-spacing:-.01em}
.fv-pb-p{margin:0 0 20px;color:rgba(255,255,255,.8)}
.fv-pb-b{display:block;width:100%;min-height:60px;margin-top:10px;padding:14px 16px;border:0;border-radius:12px;font:800 19px/1.2 Inter,system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
.fv-pb-y{background:linear-gradient(180deg,var(--ac-g1,#ffa13d) 0%,var(--ac-g2,#ec6a0c) 100%);color:var(--ac-ink,#fff);text-shadow:0 1px 2px rgba(0,0,0,.35);box-shadow:0 8px 28px rgba(var(--ac-rgbc,236,106,12),.4)}
.fv-pb-n{background:#2a2930;color:#fff}`;

/** The landing's script (in place of lib/availability.ts): taps on links to …/order open the pop-up. */
export function popupLandingJs(lang: Lang, price: string, image: string): string {
  const w = POPUP_WORDS[lang];
  const words = { t: w.title, p: w.body, y: w.yes.replace("{price}", price), n: w.no };
  return `(function(){if(window.__fvPb)return;window.__fvPb=1;
var W=${JSON.stringify(words)},IMG=${JSON.stringify(image)},K=${JSON.stringify(POPUP_KEY)},open=0;
function pre(h){try{if(HTMLScriptElement.supports&&HTMLScriptElement.supports('speculationrules')){var s=document.createElement('script');s.type='speculationrules';s.textContent=JSON.stringify({prerender:[{source:'list',urls:[h],eagerness:'immediate'}]});document.head.appendChild(s)}else{fetch(h,{credentials:'same-origin'}).catch(function(){})}}catch(x){}}
window.addEventListener('click',function(e){
if(open||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||a.target==='_blank')return;
var u;try{u=new URL(a.href,location.href)}catch(x){return}
if(u.origin!==location.origin||!/\\/order(\\/|$)/.test(u.pathname)||/\\/order(\\/|$)/.test(location.pathname))return;
e.preventDefault();open=1;pre(u.href);
if(!document.getElementById('fv-pb-css')){var c=document.createElement('style');c.id='fv-pb-css';c.textContent=${JSON.stringify(CSS)};document.head.appendChild(c)}
var d=document.createElement('div');d.className='fv-pb';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
d.innerHTML='<div class="fv-pb-box">'+(IMG?'<img class="fv-pb-pic" alt="" width="120" height="120">':'')+'<h2 class="fv-pb-t"></h2><p class="fv-pb-p"></p><button type="button" class="fv-pb-b fv-pb-y"></button><button type="button" class="fv-pb-b fv-pb-n"></button></div>';
if(IMG)d.querySelector('img').src=IMG;
d.querySelector('.fv-pb-t').textContent=W.t;d.querySelector('.fv-pb-p').textContent=W.p;
var y=d.querySelector('.fv-pb-y'),n=d.querySelector('.fv-pb-n');y.textContent=W.y;n.textContent=W.n;
function close(){open=0;document.removeEventListener('keydown',esc);d.remove()}
function esc(k){if(k.key==='Escape')close()}
function go(add){try{localStorage.setItem(K,JSON.stringify({add:add,at:Date.now()}))}catch(x){}y.disabled=n.disabled=true;d.remove();document.removeEventListener('keydown',esc);if(window.__fvAvShow)window.__fvAvShow(u.href);else location.href=u.href}
y.onclick=function(){go(true)};n.onclick=function(){go(false)};
d.addEventListener('click',function(k){if(k.target===d)close()});document.addEventListener('keydown',esc);
document.body.appendChild(d);requestAnimationFrame(function(){d.classList.add('on')});y.focus();
});
window.addEventListener('pageshow',function(e){if(e.persisted){open=0;var d=document.querySelector('.fv-pb');if(d)d.remove()}});
})();`;
}

/** The order page: the landing's answer, if fresh. true = add the WAVs. */
export function popupChoice(): boolean {
  try {
    const c = JSON.parse(localStorage.getItem(POPUP_KEY) ?? "null");
    return Boolean(c && c.add === true && Date.now() - Number(c.at) < CHOICE_MS);
  } catch {
    return false;
  }
}
