// The landing pop-up add-on, as a plain script for any landing (HTML-string pages and React pages
// alike): a tap on a link to …/order opens a pop-up that offers one add-on, Yes and No the same size,
// both going on to the order page. The answer travels in localStorage under `key` (the order page is
// prerendered behind the pop-up at the same address, so not in the URL); the order form reads it and
// puts the add-on in the order with a Remove link (jazz-midi-pack/CheckoutWidget.tsx `popup`,
// midi-drum-kit/OrderForm.tsx). A tap outside or Escape only closes it.
// "Checking availability…" (lib/availability.ts) waits while the pop-up owns the click (window.__fvPb)
// and shows after the answer (window.__fvAvShow), as on the Drum Kit since 2026-11-17.
// Counted: the tap on a button, Yes, No and a close with no answer (lib/beacon.ts __fvTap, landing_taps).
// First built for the MIDI Drum Kit's WAV pop-up (midi-drum-kit/popupBump.ts); the Famous Beats
// landings use it too (famous-beats-bundle/popupOffer.ts).

export type LandingPopup = {
  /** localStorage key of the answer, read by the order form. */
  key: string;
  /** The landing test's cookie, whose letter goes with every tap. */
  abCookie: string;
  image?: string;
  title: string;
  body: string;
  /** Short lines under the body, ticked. */
  list?: readonly string[];
  /** The full price, struck, and today's, on a line of their own (only numbers our pages already state). */
  was?: string;
  now?: string;
  /** Words after today's price on that line. */
  nowNote?: string;
  yes: string;
  no: string;
  /** CSS custom properties for the Yes button (--ac-g1, --ac-g2, --ac-ink, --ac-rgbc), e.g. the page's own yellow. */
  vars?: string;
};

const CSS = `.fv-pb{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.8);opacity:0;transition:opacity .18s}
.fv-pb.on{opacity:1}
.fv-pb-box{width:100%;max-width:420px;max-height:calc(100dvh - 32px);overflow:auto;background:#111;color:#fff;border-radius:6px;padding:26px 22px 22px;text-align:center;font:400 16px/1.45 Inter,"Inter Fallback",system-ui,sans-serif;transform:translateY(10px) scale(.97);transition:transform .22s}
.fv-pb.on .fv-pb-box{transform:none}
.fv-pb-pic{display:block;width:120px;height:120px;margin:0 auto 14px;object-fit:contain}
.fv-pb-t{margin:0 0 10px;font:800 24px/1.15 Poppins,Inter,system-ui,sans-serif;letter-spacing:-.01em;color:#fff}
.fv-pb-p{margin:0 0 20px;color:rgba(255,255,255,.8)}
.fv-pb-l{list-style:none;margin:-8px 0 18px;padding:0;text-align:left;display:grid;gap:6px;color:rgba(255,255,255,.88);font-size:15px}
.fv-pb-l li{position:relative;padding-left:24px}
.fv-pb-l li:before{content:"";position:absolute;left:4px;top:5px;width:6px;height:11px;border:solid var(--ac-g2,#ec6a0c);border-width:0 3px 3px 0;transform:rotate(45deg)}
.fv-pb-pr{margin:0 0 6px;font:700 18px/1.3 Inter,system-ui,sans-serif;color:#fff}
.fv-pb-pr s{color:rgba(255,255,255,.55);font-weight:600;margin-right:6px}
.fv-pb-pr b{color:#3ddc84;font-weight:800}
.fv-pb-b{display:block;width:100%;min-height:60px;margin-top:10px;padding:14px 16px;border:0;border-radius:12px;font:800 19px/1.2 Inter,system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
.fv-pb-y{background:linear-gradient(180deg,var(--ac-g1,#ffa13d) 0%,var(--ac-g2,#ec6a0c) 100%);color:var(--ac-ink,#fff);text-shadow:var(--ac-ts,0 1px 2px rgba(0,0,0,.35));box-shadow:0 8px 28px rgba(var(--ac-rgbc,236,106,12),.4)}
.fv-pb-n{background:#2a2930;color:#fff}`;

/** The landing's script, before lib/availability.ts: taps on links to …/order open the pop-up. */
export function landingPopupJs(p: LandingPopup): string {
  const W = { t: p.title, p: p.body, l: p.list ?? [], was: p.was ?? "", now: p.now ?? "", nn: p.nowNote ?? "", y: p.yes, n: p.no, v: p.vars ?? "" };
  const ab = new RegExp(`(?:^|; )${p.abCookie}=([a-z0-9-]+)`).source;
  return `(function(){if(window.__fvPb)return;window.__fvPb=1;
var W=${JSON.stringify(W)},IMG=${JSON.stringify(p.image ?? "")},K=${JSON.stringify(p.key)},AB=new RegExp(${JSON.stringify(ab)}),open=0;
function tap(e,n){try{if(window.__fvTap)window.__fvTap(e,n,(document.cookie.match(AB)||[])[1])}catch(x){}}
function pre(h){try{if(HTMLScriptElement.supports&&HTMLScriptElement.supports('speculationrules')){var s=document.createElement('script');s.type='speculationrules';s.textContent=JSON.stringify({prerender:[{source:'list',urls:[h],eagerness:'immediate'}]});document.head.appendChild(s)}else{fetch(h,{credentials:'same-origin'}).catch(function(){})}}catch(x){}}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e}
window.addEventListener('click',function(e){
if(open||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||a.target==='_blank')return;
var u;try{u=new URL(a.href,location.href)}catch(x){return}
if(u.origin!==location.origin||!/\\/order(\\/|$)/.test(u.pathname)||/\\/order(\\/|$)/.test(location.pathname))return;
e.preventDefault();open=1;pre(u.href);tap('cta',[].indexOf.call(document.querySelectorAll('a[href*="/order"]'),a)+1);
if(!document.getElementById('fv-pb-css')){var c=document.createElement('style');c.id='fv-pb-css';c.textContent=${JSON.stringify(CSS)};document.head.appendChild(c)}
var d=el('div','fv-pb');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');if(W.v)d.setAttribute('style',W.v);
var box=el('div','fv-pb-box');d.appendChild(box);
if(IMG){var im=el('img','fv-pb-pic');im.alt='';im.width=120;im.height=120;im.src=IMG;box.appendChild(im)}
box.appendChild(el('h2','fv-pb-t',W.t));box.appendChild(el('p','fv-pb-p',W.p));
if(W.l.length){var ul=el('ul','fv-pb-l');W.l.forEach(function(x){ul.appendChild(el('li','',x))});box.appendChild(ul)}
if(W.now){var pr=el('p','fv-pb-pr');if(W.was)pr.appendChild(el('s','',W.was));pr.appendChild(el('b','',W.now));if(W.nn)pr.appendChild(document.createTextNode(' '+W.nn));box.appendChild(pr)}
var y=el('button','fv-pb-b fv-pb-y',W.y),n=el('button','fv-pb-b fv-pb-n',W.n);y.type=n.type='button';box.appendChild(y);box.appendChild(n);
function close(){tap('close');open=0;document.removeEventListener('keydown',esc);d.remove()}
function esc(k){if(k.key==='Escape')close()}
function go(add){tap(add?'yes':'no');try{localStorage.setItem(K,JSON.stringify({add:add,at:Date.now()}))}catch(x){}y.disabled=n.disabled=true;d.remove();document.removeEventListener('keydown',esc);if(window.__fvAvShow)window.__fvAvShow(u.href);else location.href=u.href}
y.onclick=function(){go(true)};n.onclick=function(){go(false)};
d.addEventListener('click',function(k){if(k.target===d)close()});document.addEventListener('keydown',esc);
document.body.appendChild(d);requestAnimationFrame(function(){d.classList.add('on')});y.focus();
});
window.addEventListener('pageshow',function(e){if(e.persisted){open=0;var d=document.querySelector('.fv-pb');if(d)d.remove()}});
})();`;
}
