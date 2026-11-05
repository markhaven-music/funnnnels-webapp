// A/B/C test of the button colour on the MIDI Drum Kit landing and order page
// ("proviamo a cambiare colore al bottone: verde, giallo e arancione").
//
// Each visitor gets one colour at random on the first page they open and keeps
// it in a cookie (both pages, return visits). The pages are cached HTML, the
// same for everyone: a tiny script in the page sets <html data-ab-btn="…">
// before anything paints, and the CSS below colours the buttons from it.
// The colour travels with the order (Stripe metadata.variant, PayPal
// custom_id "v") and with the Pixel events (ab_btn), so sales can be counted
// per colour. ?ab=green|yellow|orange forces one. With ?preview=1 too (the
// funnel map's lanes) it's only shown: the visitor's own colour stays in the
// cookie, the tab keeps the shown one (sessionStorage ab_preview) for the
// order page, and nothing is counted (lib/beacon.ts PREVIEW_JS).

export const AB = {
  cookie: "ab_btn",
  variants: ["green", "yellow", "orange"] as const,
};
export type Variant = (typeof AB.variants)[number];
export const isVariant = (v: unknown): v is Variant => (AB.variants as readonly string[]).includes(v as string);

const LIST = AB.variants.join("|");

/**
 * One colour for every visitor of a page (dashboard → Edit → Button colour,
 * lib/pageLayout.ts), in AB_SCRIPT's place: it ends the test on that page. The
 * cookie is set too, so the order page shows the same colour, and the colour
 * still travels with the order and the Pixel events: the sales keep saying
 * which colour sold.
 */
export const fixedScript = (v: Variant) =>
  `(function(){try{document.cookie='${AB.cookie}=${v}; path=/; max-age=15552000; samesite=lax';document.documentElement.setAttribute('data-ab-btn','${v}');window.__abBtn='${v}';}catch(e){}})();`;

/** Runs first thing in <head> / at the top of the page. */
export const AB_SCRIPT = `(function(){try{
var re=/(?:^|; )${AB.cookie}=(${LIST})(?:;|$)/,q=(location.search.match(/[?&]ab=(${LIST})(?:&|$)/)||[])[1];
var pre=/[?&]preview=1(?:&|$)/.test(location.search),v=null;
try{if(/[?&]preview=0(?:&|$)/.test(location.search))sessionStorage.removeItem('ab_preview');else if(pre&&q)sessionStorage.setItem('ab_preview',q);v=sessionStorage.getItem('ab_preview');}catch(e){if(pre)v=q;}
if(v&&!/^(${LIST})$/.test(v))v=null;
if(!v){v=q||(document.cookie.match(re)||[])[1];
if(!v){var all=${JSON.stringify(AB.variants)};v=all[Math.floor(Math.random()*all.length)];}
document.cookie='${AB.cookie}='+v+'; path=/; max-age=15552000; samesite=lax';}
document.documentElement.setAttribute('data-ab-btn',v);window.__abBtn=v;
}catch(e){}})();`;

/** The visitor's colour, in the browser (null before the script ran). */
export function readVariant(): Variant | null {
  if (typeof document === "undefined") return null;
  // A preview's colour (see AB_SCRIPT).
  const shown = (window as unknown as { __abBtn?: string }).__abBtn;
  if (shown && (AB.variants as readonly string[]).includes(shown)) return shown as Variant;
  const m = document.cookie.match(new RegExp(`(?:^|; )${AB.cookie}=(${LIST})(?:;|$)`));
  return (m?.[1] as Variant) ?? null;
}

/** A variant name the server accepts from the browser ("" if none). */
export const cleanVariant = (v: unknown) => (typeof v === "string" && /^[a-z0-9-]{1,20}$/.test(v) ? v : "");

// The colours: button face (gradient), edge, glow, text.
export const COLORS: Record<Variant, { from: string; to: string; edge: string; glow: string; text: string }> = {
  green: { from: "#3fd468", to: "#16a34a", edge: "#0f7a35", glow: "rgba(22, 163, 74, 0.45)", text: "#ffffff" },
  yellow: { from: "#ffe14d", to: "#f5b800", edge: "#b98900", glow: "rgba(245, 184, 0, 0.45)", text: "#1a1400" },
  orange: { from: "#ffa13d", to: "#ec6a0c", edge: "#b04c05", glow: "rgba(236, 106, 12, 0.45)", text: "#ffffff" },
};

/** Landing (ClickFunnels markup): the gold glass buttons and the value-box button. */
export const AB_LANDING_CSS = AB.variants
  .map((v) => {
    const c = COLORS[v];
    const html = `html[data-ab-btn="${v}"]`;
    const shadow = c.text === "#ffffff" ? "0 1px 2px rgba(0,0,0,.35)" : "none";
    return `
${html} #glass-btn.elBTN a.elButton,${html} #glass-btn.elBTN a.elButton:hover{background:linear-gradient(180deg,${c.from} 0%,${c.to} 100%)!important;border:1px solid ${c.edge}!important;box-shadow:0 8px 28px ${c.glow},inset 0 1px 0 rgba(255,255,255,.45)!important;backdrop-filter:none!important}
${html} #glass-btn-white.elBTN a.elButton::before{background:linear-gradient(90deg,${c.edge} 0%,${c.from} 25%,#fff 50%,${c.from} 75%,${c.edge} 100%)!important;background-size:200% auto!important}
${html} #glass-btn-white.elBTN a.elButton::after{background:linear-gradient(180deg,${c.from} 0%,${c.to} 100%)!important}
${html} #glass-btn-white.elBTN a.elButton,${html} #glass-btn-white.elBTN a.elButton:hover{box-shadow:0 10px 30px ${c.glow}!important}
${html} #glass-btn.elBTN a.elButton,${html} #glass-btn.elBTN a.elButton *,${html} #glass-btn-white.elBTN a.elButton span,${html} #glass-btn-white.elBTN a.elButton i{color:${c.text}!important;text-shadow:${shadow}!important}`;
  })
  .join("");
