// "John from United States got the MIDI Drum Kit · 2 hours ago ✓ verified by Grind Studio":
// the recent-buyer pop-up on the funnels' landings, built from real paid orders only
// (app/api/checkout/recent). Asked for 2026-11-16 from a ClickFunnels/Proof checkout
// ("riusciamo a mettere una icona a sinistra come quella su desktop? verified by Grind
// Studio"); on a phone it's a slim pill ("su mobile non abbiamo spazio"). Built off, then
// switched on for the landings only ("ok attiviamolo e mettiamolo solo sulla landing magari").
//
// One plain script (salesPopJs) for every kind of landing: the React ones run it from
// app/(funnels)/Beacon.tsx, the HTML ones (MIDI Drum Kit, the Astro copies) carry it in
// their <head>. Bottom left; on a computer a card with the box, on a phone a pill. Starts
// 8 s after the page opens, shows a buyer for 5 s every 20 s, 3 at most per page view;
// nothing is fetched before then, so the page's speed score doesn't see it.
// SALES_POP_ON = false switches it off everywhere (?pop=1 still shows it, for a look).
export const SALES_POP_ON = true;

// The product's box, left of the line (the 160px versions, ~10 KB each).
export const POP_ICON: Record<string, string> = {
  "midi-drum-kit": "/funnels/midi-drum-kit/kit-box-v3-160.webp",
  "jazz-midi-pack": "/funnels/jazz-midi-pack/box-160.webp",
  "famous-beats-bundle": "/funnels/famous-beats-bundle/box3d-160.webp",
  "top-hits-midi-bundle": "/funnels/top-hits-midi-bundle/box3d-160.webp?v=2",
  "top-hits-chords": "/funnels/top-hits-midi-bundle/box3d-160.webp?v=2",
  "drunk-swing-grooves": "/funnels/drunk-swing-grooves/pack-160.webp",
};

// The product's name in the line ("got the MIDI Drum Kit").
export const POP_PRODUCT: Record<string, string> = {
  "midi-drum-kit": "MIDI Drum Kit",
  "jazz-midi-pack": "Jazz MIDI Pack",
  "famous-beats-bundle": "Famous Beats Bundle",
  "top-hits-midi-bundle": "TOP HITS MIDI Bundle",
  "top-hits-chords": "TOP HITS MIDI Bundle",
  "drunk-swing-grooves": "Drunk Swing Grooves",
};

export type RecentBuyer = { name: string; country: string; ago: number /* minutes */ };

// [from, got the, verified by, minutes, hours, days] per language; "X" is the number.
const WORDS: Record<string, readonly string[]> = {
  en: ["from", "got the {p}", "verified by Grind Studio", "X min ago", "X h ago", "X d ago"],
  it: ["da", "ha preso {p}", "verificato da Grind Studio", "X min fa", "X h fa", "X g fa"],
  fr: ["de", "a pris {p}", "vérifié par Grind Studio", "il y a X min", "il y a X h", "il y a X j"],
  es: ["de", "compró {p}", "verificado por Grind Studio", "hace X min", "hace X h", "hace X d"],
  de: ["aus", "hat {p} gekauft", "verifiziert von Grind Studio", "vor X Min.", "vor X Std.", "vor X T."],
};

const CSS = `
.gsp{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;gap:12px;
  width:min(340px,calc(100vw - 32px));box-sizing:border-box;padding:10px 16px 10px 10px;background:#fff;color:#111;border-radius:999px;
  box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;
  opacity:0;transform:translateY(16px);pointer-events:none;transition:opacity .35s ease,transform .35s ease}
.gsp.gsp-open{opacity:1;transform:none}
.gsp .gsp-icon{width:56px;height:56px;max-width:none;flex:none;object-fit:contain;border-radius:12px;background:#f2f2f2}
.gsp *{margin:0;padding:0;text-align:left;letter-spacing:normal;text-transform:none}
.gsp-text{flex:1;min-width:0}
.gsp-who,.gsp-meta{justify-content:flex-start}
.gsp-who{display:flex;align-items:center;gap:4px;font-weight:700;min-width:0}
.gsp-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gsp-tick{display:none}
.gsp-what{color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gsp-meta{display:flex;gap:8px;margin-top:2px;font-size:12px;color:#666;white-space:nowrap}
.gsp-by{display:inline-flex;align-items:center;gap:4px;color:#1d9bf0;font-weight:600}
.gsp-by svg{flex:none}
@media (max-width:640px){
  .gsp{left:8px;right:8px;width:auto;bottom:calc(8px + env(safe-area-inset-bottom));padding:5px 14px 5px 5px;gap:10px;font-size:13px;line-height:1.25}
  .gsp .gsp-icon{width:38px;height:38px;border-radius:999px}
  .gsp-meta{display:none}
  .gsp-tick{display:block;flex:none;width:13px;height:13px;border-radius:50%;background:#1d9bf0 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 8.2l2.2 2.2 4.8-4.8' fill='none' stroke='%23fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/100% no-repeat}
}
@media (prefers-reduced-motion:reduce){.gsp{transition:opacity .2s}}
`;

const TICK =
  '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#1d9bf0"/><path d="M4.5 8.2l2.2 2.2 4.8-4.8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** The pop-up as a self-running script for a landing of this funnel, or "" for none. */
export function salesPopJs(funnel: string, lang = "en"): string {
  const icon = POP_ICON[funnel];
  if (!icon) return "";
  const w = WORDS[lang] ?? WORDS.en;
  const cfg = { on: SALES_POP_ON, f: funnel, l: WORDS[lang] ? lang : "en", icon, product: POP_PRODUCT[funnel] ?? "", w, css: CSS, tick: TICK };
  return `(function(c){try{
if(window.__gsp)return;window.__gsp=1;
if(!c.on&&!/[?&]pop=1\\b/.test(location.search))return;
var esc=function(s){return String(s).replace(/[&<>"]/g,function(ch){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]})};
var ago=function(m){var t=m<60?[m,3]:m<1440?[Math.round(m/60),4]:[Math.round(m/1440),5];return c.w[t[1]].replace("X",t[0])};
setTimeout(function(){fetch("/api/checkout/recent?f="+encodeURIComponent(c.f)+"&l="+c.l).then(function(r){return r.json()}).then(function(d){
var list=(d&&d.buyers)||[];if(!list.length)return;
var st=document.createElement("style");st.textContent=c.css;document.head.appendChild(st);
var el=document.createElement("div");el.className="gsp";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.appendChild(el);
var n=0,max=Math.min(3,list.length);
(function next(){if(n>=max)return;var b=list[n++];
var who=b.country?b.name+" "+c.w[0]+" "+b.country:b.name;
el.innerHTML='<img class="gsp-icon" src="'+c.icon+'" alt="" width="160" height="160" decoding="async"><div class="gsp-text"><div class="gsp-who"><span class="gsp-name">'+esc(who)+'</span><i class="gsp-tick" aria-label="'+esc(c.w[2])+'"></i></div><div class="gsp-what">'+esc(c.w[1].replace("{p}",c.product))+'</div><div class="gsp-meta"><span>'+esc(ago(b.ago))+'</span><span class="gsp-by">'+c.tick+esc(c.w[2])+'</span></div></div>';
requestAnimationFrame(function(){el.classList.add("gsp-open")});
setTimeout(function(){el.classList.remove("gsp-open")},5000);
setTimeout(next,20000);})();
}).catch(function(){})},8000);
}catch(e){}})(${JSON.stringify(cfg).replace(/</g, "\\u003c")});`;
}
