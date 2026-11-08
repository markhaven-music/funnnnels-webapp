// The step between a landing's button and its order page (the user,
// 2026-11-08: "a popup that loads and say something like 'Checking
// availability...' and then says 'A license is still available' and THEN goes
// to the order page"). Every funnel's buttons are plain links to its /order
// page, so one listener catches them: a click on a link to …/order shows the
// popup, ~1.5 s of a spinner, ~1.2 s of the yellow ✓, then the link opens.
// A click another script already handled (defaultPrevented), a new-tab click
// (⌘/ctrl/shift/middle) or a link to another site goes through untouched.
// Words in the page's language (<html lang>), English otherwise.

const WORDS: Record<string, [string, string]> = {
  en: ["Checking availability…", "A license is still available"],
  fr: ["Vérification de la disponibilité…", "Une licence est encore disponible"],
  es: ["Comprobando disponibilidad…", "Todavía queda una licencia disponible"],
  de: ["Verfügbarkeit wird geprüft…", "Eine Lizenz ist noch verfügbar"],
  it: ["Verifica della disponibilità…", "Una licenza è ancora disponibile"],
};

const CSS = `.fv-av{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.78);opacity:0;transition:opacity .18s}
.fv-av.on{opacity:1}
.fv-av-box{width:100%;max-width:360px;background:#111;color:#fff;border-radius:4px;padding:34px 24px 30px;text-align:center;font:600 19px/1.35 Inter,"Inter Fallback",system-ui,sans-serif;transform:translateY(8px) scale(.97);transition:transform .22s}
.fv-av.on .fv-av-box{transform:none}
.fv-av-ic{width:54px;height:54px;margin:0 auto 18px;position:relative}
.fv-av-spin{position:absolute;inset:0;border-radius:50%;border:4px solid rgba(255,255,255,.14);border-top-color:#f5b800;animation:fv-av-r .8s linear infinite}
.fv-av-ok{position:absolute;inset:0;border-radius:50%;background:#f5b800;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform .28s cubic-bezier(.3,1.6,.5,1)}
.fv-av.done .fv-av-spin{display:none}
.fv-av.done .fv-av-ok{transform:scale(1)}
.fv-av-t2{display:none}
.fv-av.done .fv-av-t1{display:none}
.fv-av.done .fv-av-t2{display:block}
@keyframes fv-av-r{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.fv-av-spin{animation-duration:2s}}`;

/** The script, for a page's own <script> (the HTML landings) or eval'd once by AvailabilityGate. */
export const AVAILABILITY_JS = `(function(){if(window.__fvAv)return;window.__fvAv=1;
var W=${JSON.stringify(WORDS)},busy=0;
window.addEventListener('click',function(e){
if(busy||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||a.target==='_blank')return;
var u;try{u=new URL(a.href,location.href)}catch(x){return}
if(u.origin!==location.origin||!/\\/order(\\/|$)/.test(u.pathname)||/\\/order(\\/|$)/.test(location.pathname))return;
e.preventDefault();busy=1;
var w=W[(document.documentElement.lang||'en').slice(0,2)]||W.en;
if(!document.getElementById('fv-av-css')){var s=document.createElement('style');s.id='fv-av-css';s.textContent=${JSON.stringify(CSS)};document.head.appendChild(s)}
var d=document.createElement('div');d.className='fv-av';d.setAttribute('role','status');d.setAttribute('aria-live','polite');
d.innerHTML='<div class="fv-av-box"><div class="fv-av-ic"><div class="fv-av-spin"></div><div class="fv-av-ok"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#000" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div><div class="fv-av-t1"></div><div class="fv-av-t2"></div></div>';
d.querySelector('.fv-av-t1').textContent=w[0];d.querySelector('.fv-av-t2').textContent=w[1];
document.body.appendChild(d);requestAnimationFrame(function(){d.classList.add('on')});
setTimeout(function(){d.classList.add('done')},1500);
setTimeout(function(){location.href=u.href},2700);
});
window.addEventListener('pageshow',function(e){if(e.persisted){busy=0;var d=document.querySelector('.fv-av');if(d)d.remove()}});
})();`;
