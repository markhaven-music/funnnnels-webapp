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
// Keep them in step.

export const BEACON_URL = "/api/checkout/view";
export const STEPS = ["landing", "order", "checkout", "thank-you"] as const;
export type Step = (typeof STEPS)[number];

export type BeaconOptions = {
  funnel: string;
  page: Step;
  lang?: string;
  /** The cookie holding the visitor's A/B variant, for funnels running a test. */
  abCookie?: string;
};

const readCookie = (name: string) =>
  (document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`)) ?? [])[1] ?? "";

export function track({ funnel, page, lang = "en", abCookie }: BeaconOptions): void {
  try {
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
var o=${o},k='fv:'+o.f+':'+o.l+':'+o.p,d=new Date().toDateString();
try{if(localStorage.getItem(k)===d)return;localStorage.setItem(k,d);}catch(e){}
var c=function(n){return(document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'))||[])[1]||'';};
o.v=${abCookie ? `c(${JSON.stringify(abCookie)})` : "''"};o.c=c('visitor_country');o.h=location.hostname;
var b=JSON.stringify(o),u=${JSON.stringify(BEACON_URL)};
if(!(navigator.sendBeacon&&navigator.sendBeacon(u,b)))fetch(u,{method:'POST',body:b,keepalive:true}).catch(function(){});
}catch(e){}})();`;
}
