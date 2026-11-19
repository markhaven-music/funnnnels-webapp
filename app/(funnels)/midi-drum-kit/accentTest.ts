// A/B/C test of the MIDI Drum Kit's accent colour (2026-11-17, "facciamo un ABC test voglio provare altri colori
// accent: Verde (stile FL Studio piano roll), Rosso, Giallo"): the new landing and the order page in one of three
// colours, everything the orange was (highlighted words, buttons, player, seal, video player, pay bar). Orange, the
// colour until now, is not in the draw: it is the baseline of the days before (the landing test's "New" column).
//
// The letter rides in the landing test's cookie (ab_lp, ./landingTest.ts): proxy.ts gives each English or Italian
// visitor one of the three on their first visit and keeps it, so the page views, the checkout and the order
// (Stripe metadata.variant, PayPal custom_id) carry it with no new plumbing, and Analytics counts each colour to
// the sale (lib/analytics.ts TESTS, "Accent colour"). The pages are cached HTML, the same for everyone: a tiny
// script in the page sets <html data-ac="…"> from the cookie before anything paints, and the CSS below swaps the
// colour. ?ac=green|red|yellow shows one without touching the cookie (with ?preview=1 nothing is counted).

export const ACCENT = {
  variants: ["ac-green", "ac-red", "ac-yellow"] as const,
  /** When the test went live (its deploy). */
  from: "2026-11-17T13:45:00Z",
  /** 2026-11-19 ("facciamo vincere il verde"): the test is over, green kept for everyone (LP.draw). */
  ended: "2026-11-19T21:45:00Z",
};
export type AccentVariant = (typeof ACCENT.variants)[number];
export const isAccent = (v: unknown): v is AccentVariant => (ACCENT.variants as readonly string[]).includes(v as string);

type Palette = {
  hi: string; g1: string; t: string; m: string; g2: string; d: string; dd: string;
  lip: string; edge: string; bg: string; ink: string; rgbc: string; rgbs: string; mrgbs: string;
};
/** The orange every token stands for in the page's CSS (the default, and what a page shows without the script). */
const ORANGE: Palette = {
  hi: "#ffb866", g1: "#ffa13d", t: "#ff9a2e", m: "#f5851f", g2: "#ec6a0c", d: "#dd6408", dd: "#c85a06",
  lip: "#7a3303", edge: "#b04c05", bg: "#2a1808", ink: "#1a0d00", rgbc: "236,106,12", rgbs: "236 106 12", mrgbs: "245 133 31",
};
export const PALETTES: Record<"green" | "red" | "yellow", Palette> = {
  // FL Studio's piano roll: its light green notes
  green: {
    hi: "#c6f5b0", g1: "#a6ec8a", t: "#9be57f", m: "#7fd667", g2: "#56b83f", d: "#46a032", dd: "#3a8a29",
    lip: "#1f4d14", edge: "#2f6e20", bg: "#12240c", ink: "#0b1a06", rgbc: "86,184,63", rgbs: "86 184 63", mrgbs: "127 214 103",
  },
  red: {
    hi: "#ff9a8f", g1: "#ff6b5e", t: "#ff5a4d", m: "#f03a2e", g2: "#d91f1f", d: "#c21818", dd: "#a51212",
    lip: "#5c0808", edge: "#8f1010", bg: "#2a0c0b", ink: "#ffffff", rgbc: "217,31,31", rgbs: "217 31 31", mrgbs: "240 58 46",
  },
  // the funnels' one yellow (#f5b800)
  yellow: {
    hi: "#fff0a0", g1: "#ffe14d", t: "#f5b800", m: "#f5b800", g2: "#e0a800", d: "#c99700", dd: "#b08400",
    lip: "#6b5000", edge: "#b98900", bg: "#2a2208", ink: "#1a1400", rgbc: "245,184,0", rgbs: "245 184 0", mrgbs: "245 184 0",
  },
};
const KEYS = Object.keys(ORANGE) as (keyof Palette)[];
const vars = (p: Palette) => KEYS.map((k) => `--ac-${k}:${p[k]}`).join(";");

/** The variables, orange by default, each colour under its html[data-ac]. */
export const ACCENT_VARS_CSS =
  `:root{${vars(ORANGE)}}` +
  Object.entries(PALETTES).map(([name, p]) => `html[data-ac="${name}"]{${vars(p)}}`).join("") +
  // the Jazz key's label is dark on any light colour; on red it's white
  `html[data-ac="red"] .jzb-btn{--ink:#fff}html[data-ac="red"] .jzb-btn *{text-shadow:0 1px 2px rgba(0,0,0,.3)}`;

/**
 * Runs first thing in the page: the visitor's colour on <html data-ac>. A look (?ac=) is kept for the tab
 * (sessionStorage ac_look), so the order page after it shows the same colour ("perchè order page n è dello stesso
 * colore della landing page?", 2026-11-17); ?preview=0 or ?ac=off drops it. Else the cookie's colour.
 */
export const ACCENT_SCRIPT = `(function(){try{
var s=location.search,q=(s.match(/[?&]ac=(green|red|yellow)(?:&|$)/)||[])[1];
try{if(/[?&](preview=0|ac=off)(?:&|$)/.test(s))sessionStorage.removeItem('ac_look');else if(q)sessionStorage.setItem('ac_look',q);else q=sessionStorage.getItem('ac_look');}catch(e){}
if(q&&!/^(green|red|yellow)$/.test(q))q=null;
var c=(document.cookie.match(/(?:^|; )ab_lp=ac-(green|red|yellow)(?:;|$)/)||[])[1];
var v=q||c||'green';if(v){document.documentElement.setAttribute('data-ac',v);window.__ac=v;}
}catch(e){}})();`;

/** After the hero's video: Wistia's player colour from the accent (the URL can't read CSS). */
export const ACCENT_VIDEO_JS = `(function(){try{var v=window.__ac;if(!v)return;var c=${JSON.stringify(Object.fromEntries(Object.entries(PALETTES).map(([k, p]) => [k, p.t.slice(1)])))}[v];
document.querySelectorAll('iframe[src*="fast.wistia.net"]').forEach(function(f){f.src=f.src.replace(/playerColor=[0-9a-f]{6}/i,'playerColor='+c);});}catch(e){}})();`;

/**
 * The page's CSS with every orange as its variable: the HTML outside <script> blocks (styles, style attributes,
 * the seal's SVG colours as style so var() works there). Scripts keep their literal colours.
 */
export function accentize(html: string): string {
  const parts = html.split(/(<script\b[\s\S]*?<\/script>)/i);
  return parts.map((part, i) => (i % 2 ? part : swapColours(part))).join("");
}
function swapColours(s: string): string {
  let out = s;
  // SVG presentation attributes don't take var(): make them style
  out = out.replace(/\b(stop-color|fill|stroke)="(#[0-9a-f]{6})"/gi, (m, attr: string, hex: string) => {
    const k = keyOf(hex);
    return k ? `style="${attr}:var(--ac-${k})"` : m;
  });
  for (const k of KEYS) {
    const v = ORANGE[k];
    if (k === "rgbc") out = out.replace(/236,\s?106,\s?12/g, "var(--ac-rgbc)");
    else if (k === "rgbs") out = out.replaceAll("236 106 12", "var(--ac-rgbs)");
    else if (k === "mrgbs") out = out.replaceAll("245 133 31", "var(--ac-mrgbs)");
    else out = out.replace(new RegExp(`${v}(?![0-9a-f])`, "gi"), `var(--ac-${k})`);
  }
  return out;
}
function keyOf(hex: string): keyof Palette | null {
  const h = hex.toLowerCase();
  return KEYS.find((k) => ORANGE[k] === h) ?? null;
}

/**
 * The order page (React, CSS modules: its hashed class names passed in): the Jazz order page's yellow variables,
 * the buttons and the phone's pay bar in the visitor's colour. After the button test's html[data-ab-btn] rules.
 */
export function orderAccentCss(c: { dk: string; cta: string; payBar: string; payBarBtn: string }): string {
  return Object.entries(PALETTES)
    .map(([name, p]) => {
      const h = `html[data-ac="${name}"]`;
      const shadow = p.ink === "#ffffff" ? "0 1px 2px rgba(0,0,0,.35)" : "none";
      return (
        `${h} .${c.dk}.${c.dk}.${c.dk}{--y:${p.m};--y-gloss:${p.g1};--y-deep:${p.d};--y-lip:${p.lip};--y-glow:rgb(${p.rgbs} / .55);--y-rgb:${p.mrgbs};--b-rgb:${p.mrgbs};--brass-hi:${p.t}}` +
        `${h} .${c.cta}.${c.cta}{background:linear-gradient(180deg,${p.g1} 0%,${p.g2} 100%);box-shadow:0 8px 28px rgba(${p.rgbc},.45),inset 0 1px 0 rgba(255,255,255,.45);color:${p.ink};text-shadow:${shadow}}` +
        `${h} .${c.cta}.${c.cta} *{color:inherit}` +
        `${h} .${c.payBar}.${c.payBar},${h} .${c.payBar}>.${c.payBarBtn}.${c.payBarBtn}{background:${p.g2};box-shadow:none}` +
        (name === "red" ? `${h} .${c.dk} .jzb-btn,${h} .${c.dk} [class*="btn"]{--ink:#fff}` : "")
      );
    })
    .join("");
}
