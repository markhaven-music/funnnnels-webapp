// The visitor count behind dashboard → Analytics: each funnel page tells
// /api/checkout/view "someone is here", at most once per page per day per
// browser (remembered in localStorage), so a row in page_views is a unique
// visitor that day. No id, no cookie of its own: the country and the A/B
// variant come from the cookies the funnel already sets.
//
// The URL sits under /api/checkout/ because m.thegrind.studio already
// forwards that path here (grind-studio-landing-pages/vercel.json), and it
// avoids "track" in the name, which ad blockers drop.
//
// Two copies of the same few lines: track() for the React pages and forms,
// beaconScript() for the static HTML landing (midi-drum-kit/landing.ts).
// Keep them in step. Both also run LIVE_JS, the live presence (below).
//
// Previews aren't counted: a page opened with ?preview=1 (the dashboard's
// links, e.g. a colour of the A/B/C test from the funnel map) sends nothing,
// and the funnels' trackers (Pixel, Clarity, neo) check PREVIEW_JS too. The tab
// remembers it (sessionStorage), so the order page, upsells and thank-you page
// it leads to aren't counted either; ?preview=0 ends it.

export const BEACON_URL = "/api/checkout/view";
export const STEPS = ["landing", "order", "checkout", "upsell-1", "upsell-2", "thank-you"] as const;
export type Step = (typeof STEPS)[number];

export type BeaconOptions = {
  funnel: string;
  page: Step;
  lang?: string;
  /** The cookie holding the visitor's A/B variant, for funnels running a test. */
  abCookie?: string;
};

const PREVIEW_KEY = "fv:preview";

/** An expression for inline scripts: true on a preview (see above). */
export const PREVIEW_JS = `(function(){try{var s=location.search;if(/[?&]preview=0(?:&|$)/.test(s)){sessionStorage.removeItem('${PREVIEW_KEY}');sessionStorage.removeItem('ab_preview');return false;}if(/[?&]preview=1(?:&|$)/.test(s)){sessionStorage.setItem('${PREVIEW_KEY}','1');return true;}return sessionStorage.getItem('${PREVIEW_KEY}')==='1';}catch(e){return /[?&]preview=1(?:&|$)/.test(location.search);}})()`;

/** The same, from React code. */
export function isPreview(): boolean {
  const s = location.search;
  try {
    if (/[?&]preview=0(?:&|$)/.test(s)) {
      sessionStorage.removeItem(PREVIEW_KEY);
      sessionStorage.removeItem("ab_preview");
      return false;
    }
    if (/[?&]preview=1(?:&|$)/.test(s)) {
      sessionStorage.setItem(PREVIEW_KEY, "1");
      return true;
    }
    return sessionStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return /[?&]preview=1(?:&|$)/.test(s);
  }
}

// A small tag on previewed pages, so it's clear the visit isn't counted.
const BADGE_JS = `(function(){var go=function(){if(document.getElementById('fv-preview'))return;var d=document.createElement('div');d.id='fv-preview';d.textContent='Preview · not counted';d.style.cssText='position:fixed;left:10px;bottom:10px;z-index:2147483647;font:600 12px/1 system-ui,sans-serif;color:#fff;background:rgba(17,17,17,.82);padding:7px 10px;border-radius:3px;pointer-events:none';document.body.appendChild(d);};if(document.body)go();else document.addEventListener('DOMContentLoaded',go);})();`;

// Dashboard → Live: who is on a page right now. Unlike the daily count, every
// page opened says so ("view", with where the visitor came from on the first
// page of the tab), the tab then pings every 20 s while it's in front ("beat",
// at most 30 minutes in a row) and says when it goes to the background
// ("leave"). The visitor is a random id kept in localStorage, nothing more.
// One copy for both kinds of page: the body of a function of o = {f, p, l}.
export const LIVE_URL = "/api/checkout/here";
const LIVE_JS = `try{
var w=window,L=w.__fvLive,u='${LIVE_URL}',s=L&&L.s,id=function(){return(Math.random().toString(36).slice(2,10)+Date.now().toString(36)).slice(0,20);};
if(!s){try{s=localStorage.getItem('fv:sid')||'';if(!/^[a-z0-9]{8,24}$/.test(s)){s=id();localStorage.setItem('fv:sid',s);}}catch(e){s=id();}}
var send=function(b){b.i=s;var j=JSON.stringify(b);if(!(navigator.sendBeacon&&navigator.sendBeacon(u,j)))fetch(u,{method:'POST',body:j,keepalive:true}).catch(function(){});};
var v={k:'view',f:o.f,p:o.p,l:o.l,h:location.hostname,u:location.pathname,r:'='};
if(!L){var q=new URLSearchParams(location.search),n=['utm_source','utm_medium','utm_campaign','utm_content'],r='';
for(var x=0;x<4;x++){var y=q.get(n[x]);if(y)v['smca'.charAt(x)]=y.slice(0,120);}
if(q.get('fbclid'))v.fb=1;if(q.get('gclid'))v.g=1;
try{r=document.referrer?new URL(document.referrer).hostname:'';}catch(e){}
v.r=r===location.hostname?'=':r;}
if(navigator.webdriver)v.w=1;
send(v);
if(L)return;
L=w.__fvLive={s:s,n:0};
setInterval(function(){if(document.visibilityState==='visible'&&L.n++<90)send({k:'beat'});},20000);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')send({k:'leave'});else{L.n=0;send({k:'beat'});}});
}catch(e){}`;

const readCookie = (name: string) =>
  (document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`)) ?? [])[1] ?? "";

export function track({ funnel, page, lang = "en", abCookie }: BeaconOptions): void {
  try {
    if (isPreview()) {
      new Function(BADGE_JS)();
      return;
    }
    new Function("o", LIVE_JS)({ f: funnel, p: page, l: lang });
    const key = `fv:${funnel}:${lang}:${page}`;
    const today = new Date().toDateString();
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {
      // no storage (private mode): count every view instead
    }
    const body = JSON.stringify({
      f: funnel,
      p: page,
      l: lang,
      v: abCookie ? readCookie(abCookie) : "",
      c: readCookie("visitor_country"),
      h: location.hostname,
      ...(navigator.webdriver ? { w: 1 } : {}),
    });
    if (!navigator.sendBeacon?.(BEACON_URL, body)) {
      fetch(BEACON_URL, { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // never break a page over a visitor count
  }
}

/** The same as track(), as an inline script for static HTML. */
export function beaconScript({ funnel, page, lang = "en", abCookie }: BeaconOptions): string {
  const o = JSON.stringify({ f: funnel, p: page, l: lang });
  return `(function(){try{
if(${PREVIEW_JS}){${BADGE_JS}return;}
var o=${o},k='fv:'+o.f+':'+o.l+':'+o.p,d=new Date().toDateString();
(function(o){${LIVE_JS}})(o);
try{if(localStorage.getItem(k)===d)return;localStorage.setItem(k,d);}catch(e){}
var c=function(n){return(document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'))||[])[1]||'';};
o.v=${abCookie ? `c(${JSON.stringify(abCookie)})` : "''"};o.c=c('visitor_country');o.h=location.hostname;if(navigator.webdriver)o.w=1;
var b=JSON.stringify(o),u=${JSON.stringify(BEACON_URL)};
if(!(navigator.sendBeacon&&navigator.sendBeacon(u,b)))fetch(u,{method:'POST',body:b,keepalive:true}).catch(function(){});
}catch(e){}})();`;
}
