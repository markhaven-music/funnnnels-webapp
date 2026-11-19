import { SIGN, type Currency } from "@/lib/geo";
import { beaconScript, PREVIEW_JS } from "@/lib/beacon";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { AFTER_LOAD } from "../landing";
import { funnel } from "../funnel";
import { ARTICLE_JS } from "./articleClient";

// The MIDI Drum Kit's first advertorial (2026-11-19, "How would you use this strategy to sell MIDI Drum
// Kit?" → "Advertorial page"): an image ad that looks like content sends the click here, an article
// that does the selling, and its buttons go to the order page. It reads like a post on GRIND STUDIO's
// own journal, not a sales page, so it breaks the funnel pages' black-and-yellow rule on purpose: a
// light page, serif type, no sales pop-ups. The kit's yellow stays as the highlighter and the button.
//
// Structure (the "1-2" format): hook (a pain and a way out) → what you'll learn → why listen to us →
// problem 1 with a figure → problem 2 with a figure → the fix in two steps, the kit mentioned in
// passing → recap → one soft offer. Every fact is the kit's own (./copy/en.ts, ./landingNew.ts,
// player/v6/tree.json); the figure that plays is the landing's "No bounce vs bounce" (bounce01.json, Complete Beat 01).
//
// Read depth: Read25 / Read50 / Read75 / Read100 go to the Meta Pixel (custom events, to build
// audiences of the people who read far and retarget them) and to Clarity. ./articleClient.ts.

const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);
export const ARTICLE_SLUG = "why-your-drums-sound-stiff";

// One version of the article per audience (2026-11-19, "aggiusta tutto": the video rewrites the article for each
// micro-audience its ads target). Only the top changes: headline, dek, the opening and the closing line of the
// hook; the problem, the player, the fix and the offer are the same. Each version has its own address, which the
// matching ad set links to, and its own name in the Pixel's read events (params.article) and in Clarity.
// Never "drill" (owner, 11-19): trap and hip-hop.
export type Variant = { slug: string; kick: string; h1: [string, string]; dek: string; lead: string; second: string };
export const VARIANTS: Record<string, Variant> = {
  base: { slug: ARTICLE_SLUG, kick: "Drums", h1: ["Your drums sound stiff.", "It's not your sounds."],
    dek: "Why a beat with good samples can still feel dead, and how producers get drums that move without programming every hit.",
    lead: "You know the feeling. You find a loop you love at 2 AM. The chords hit, and you can already hear the whole song. Then you put the drums in, and everything goes flat.",
    second: "So you swap the kick. You try another snare. You download one more drum kit. The beat still sits there like a metronome with nice sounds." },
  trap: { slug: "why-your-trap-drums-sound-stiff", kick: "Trap", h1: ["Your trap drums sound stiff.", "It's not your sounds."],
    dek: "Why a trap beat with hard samples can still feel dead, and how producers get hats, 808s and snares that move without programming every hit.",
    lead: "You know the feeling. You find a dark loop at 2 AM and you can already hear someone rapping on it. Then you put the drums in: hats, snare, 808. And the whole thing goes flat.",
    second: "So you swap the 808. You try another snare. You add more hi-hat rolls. The beat still sits there like a metronome with expensive sounds." },
  hiphop: { slug: "why-your-hip-hop-drums-sound-stiff", kick: "Hip-hop", h1: ["Your hip-hop drums sound stiff.", "It's not your sounds."],
    dek: "Why a hip-hop beat can have the right samples and still not make anyone nod, and how producers get drums that move without programming every hit.",
    lead: "You know the feeling. You chop a sample you love and the loop already feels like a record. Then you put the drums in, and nobody's head moves. Not even yours.",
    second: "So you swap the kick. You try a dustier snare. You download one more drum kit. The beat still sits there like a metronome with nice sounds." },
  beginner: { slug: "why-your-first-beats-sound-stiff", kick: "Starting out", h1: ["Your beats sound off.", "It's not you. It's the grid."],
    dek: "If you're new to making beats and your drums never sound like the songs you love, this is why, and how to fix it without learning to program every hit.",
    lead: "You know the feeling. You watch the tutorials, you open the DAW, you make a loop you actually like. Then you add drums, and it sounds like a beginner made it.",
    second: "So you think you're not good enough yet. You download another drum kit. You watch another tutorial. The beat still sits there like a metronome." },
  typebeat: { slug: "why-type-beats-sound-the-same", kick: "Type beats", h1: ["Your type beats sound like everyone's.", "It's the drums."],
    dek: "Why so many type beats blend into each other, and how producers get drums that sound like theirs without programming every hit.",
    lead: "You know the feeling. You finish a beat, title it, upload it. Then you scroll the same tag and every beat sounds like yours. Same hats, same snare, same flat bounce.",
    second: "So you buy another drum kit. You chase another sound. Your beats still sound like the ones next to them." },
  stuck: { slug: "why-your-drums-still-sound-stiff", kick: "Drums", h1: ["Years of beats.", "Drums still stiff."],
    dek: "If you've been making beats for years and the drums still don't feel like the records, this is why, and how producers get drums that move without programming every hit.",
    lead: "You know the feeling. You've been doing this for years. The chords are good, the mix is fine. And the drums still sit there, stiff, no matter what you try.",
    second: "You've bought the kits. You've tried the plugins. You've redone the hats a hundred times. It was never the sounds." },
};
const IMG = "/funnels/midi-drum-kit/";

function money(price: number, currency: Currency): string {
  return `${SIGN[currency]}${price}`;
}

function head(currency: Currency, price: number, v: Variant): string {
  const PATH = `/midi-drum-kit/${v.slug}`;
  const { metaPixelId, clarityId, neoSnippet, googleAdsId } = funnel.tracking;
  const params = JSON.stringify({ content_name: funnel.product, content_type: "product", value: price, currency: currency.toUpperCase(), article: v.slug });
  return `<script>${ORIGIN_BOUNCE_JS};
window.__fvMe = ${PREVIEW_JS} || ${OFF}.test(location.hostname);
${beaconScript({ funnel: funnel.slug, page: "landing" })};
(function () {
  if (window.__fvMe) return;
  window.clarity = window.clarity || function () { (clarity.q = clarity.q || []).push(arguments); };
  clarity('set', 'landing', ${JSON.stringify(PATH)});
  var q = new URLSearchParams(location.search);
  ['utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (q.get(k)) clarity('set', k, q.get(k)); });
  var params = ${params};
  window.__artParams = params;
  if (!window.fbq) {
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
  }
  fbq('init', '${metaPixelId}');
  fbq('track', 'PageView');
  fbq('track', 'ViewContent', params);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-cta]')) {
      fbq('trackCustom', 'LandingCTAClick', params);
      clarity('event', 'cta_click');
    }
  }, { capture: true });
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', '${googleAdsId}');
  ${AFTER_LOAD}(['https://connect.facebook.net/en_US/fbevents.js', '${neoSnippet}', 'https://www.clarity.ms/tag/${clarityId}', 'https://www.googletagmanager.com/gtag/js?id=${googleAdsId}']);
})();</script>`;
}

const CSS = `
:root{--paper:#fbfaf7;--ink:#16151a;--ink2:#3a3840;--mute:#6b6873;--line:#d9d5cc;--y:#f5b800;--y2:#ffe14d;--yd:#a87e00;--panel:#0d0c10;
--serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:19px/1.65 var(--serif);overflow-x:hidden}
a{color:inherit}
.top{border-bottom:2px solid var(--ink);background:var(--paper)}
.top div{max-width:760px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.mast{display:flex;align-items:center;gap:10px;text-decoration:none}
.mast img{display:block;width:150px;height:auto}
.mast span{font:600 13px/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.top nav{font:600 13px/1 var(--sans);color:var(--mute)}
main{max-width:680px;margin:0 auto;padding:0 20px 40px}
.kick{margin:34px 0 0;font:700 13px/1 var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--ink2)}
.kick b{display:inline-block;margin-right:10px;padding:5px 8px;background:var(--ink);color:#fff;border-radius:3px}
h1{margin:16px 0 0;font:700 clamp(30px,8.2vw,56px)/1.08 var(--serif);letter-spacing:-.02em;text-wrap:balance}
h1 span{display:block}
.dek{margin:18px 0 0;font:400 21px/1.5 var(--serif);color:var(--ink2);text-wrap:pretty}
.by{display:flex;align-items:center;gap:12px;margin:24px 0 0;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font:500 14px/1.4 var(--sans);color:var(--mute)}
.gem{flex:none;width:40px;height:40px;border-radius:50%;background:var(--ink) center/22px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 20'%3E%3Cpath d='M5 1h14l5 6-12 13L0 7z' fill='%23f5b800'/%3E%3C/svg%3E")}
.by b{display:block;color:var(--ink);font-weight:700}
article p{margin:22px 0 0;text-wrap:pretty}
article .lead{font-size:21px}
article .lead::first-letter{float:left;margin:6px 10px 0 0;font:700 70px/.8 var(--serif)}
mark{background:linear-gradient(transparent 52%,#ffd84a 52%,#ffd84a 92%,transparent 92%);color:inherit;padding:0 2px}
h2{margin:56px 0 0;font:700 clamp(28px,6vw,36px)/1.15 var(--serif);letter-spacing:-.015em;text-wrap:balance}
h2 .n{display:block;margin-bottom:6px;font:800 14px/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--yd)}
.big{margin:30px 0 0;padding:4px 0 4px 18px;border-left:5px solid var(--y);font:700 clamp(24px,5.4vw,30px)/1.3 var(--serif);text-wrap:balance}
.box{margin:30px 0 0;padding:22px 22px 24px;background:#fff;border:2px solid var(--ink);border-radius:4px}
.box h3{margin:0;font:800 13px/1.2 var(--sans);letter-spacing:.12em;text-transform:uppercase}
.box ol{margin:14px 0 0;padding:0;list-style:none;counter-reset:k}
.box li{position:relative;margin:12px 0 0;padding-left:44px;font-weight:600;line-height:1.45}
.box li::before{counter-increment:k;content:counter(k);position:absolute;left:0;top:-1px;width:30px;height:30px;display:grid;place-items:center;background:var(--y);color:#000;font:800 15px/1 var(--sans);border-radius:3px}
.box p{margin:16px 0 0;font-size:17px;color:var(--ink2)}
.text-link{text-decoration-color:var(--y);text-decoration-thickness:3px;text-underline-offset:3px;font-weight:700}
.text-link:hover{background:#ffeaa0}
figure{margin:34px -20px 0;padding:22px 20px 20px;background:var(--panel);color:#fff;font-family:var(--sans)}
@media (min-width:720px){figure{margin:36px -40px 0;padding:26px 32px 24px;border-radius:12px}}
.fig-tag{margin:0;font:700 12px/1.2 var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--y)}
.fig-h{margin:8px 0 0;font:700 24px/1.2 var(--sans);letter-spacing:-.01em}
.fig-sub{margin:8px 0 0;font-size:15px;line-height:1.5;color:rgba(255,255,255,.72)}
figcaption{margin:16px 0 0;font:400 14px/1.5 var(--sans);color:rgba(255,255,255,.62)}
figcaption b{color:#fff}
/* figure 1: no bounce vs bounce */
.sw{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:18px;padding:6px;border-radius:10px;background:#08070a}
.sw button{min-height:56px;padding:0 6px;border:0;border-radius:7px;background:none;color:rgba(255,255,255,.6);font:800 16px/1.1 var(--sans);letter-spacing:.04em;text-transform:uppercase;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.sw button[aria-pressed=true]{background:#2a2932;color:#fff}
.sw button[data-bounce="1"][aria-pressed=true]{background:linear-gradient(180deg,var(--y2),var(--y));color:#000}
.sw button.nudge{animation:nudge 1.1s ease-in-out infinite}
@keyframes nudge{50%{box-shadow:inset 0 0 0 2px var(--y);color:#fff}}
.roll{display:block;width:100%;height:150px;margin-top:14px;border-radius:4px;background:#08070a}
.bar{display:grid;grid-template-columns:58px minmax(0,1fr);align-items:center;gap:14px;margin-top:14px}
.play{width:58px;height:58px;display:grid;place-items:center;border:0;border-radius:50%;background:var(--y);color:#000;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;box-shadow:0 0 0 6px rgba(245,184,0,.16)}
.play svg{width:22px;height:22px}
.play[data-state=loading]{opacity:.6}
.what{margin:0;font-size:14px;line-height:1.45;color:rgba(255,255,255,.82);overflow-wrap:anywhere}
.what b{display:block;margin-bottom:2px;font:700 11px/1.3 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--y)}
.what small{display:block;margin-top:3px;font:500 11px/1.4 var(--mono);color:rgba(255,255,255,.45)}
/* figure 2: by hand vs one drag */
.race{display:grid;gap:14px;margin-top:18px}
@media (min-width:620px){.race{grid-template-columns:1fr 1fr}}
.lane{padding:14px 14px 12px;border-radius:8px;background:#08070a}
.lane-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 0 10px;font:800 13px/1.2 var(--sans);letter-spacing:.06em;text-transform:uppercase}
.lane-h span{font:500 12px/1.2 var(--mono);letter-spacing:0;text-transform:none;color:rgba(255,255,255,.55)}
.grid{position:relative;display:grid;grid-template-columns:repeat(16,1fr);grid-template-rows:repeat(3,14px);gap:3px}
.grid i{background:rgba(255,255,255,.07);border-radius:2px}
.grid i.lit{background:var(--y)}
.lane-f{margin:10px 0 0;font:500 12px/1.4 var(--mono);color:rgba(255,255,255,.55)}
.file{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:6px 9px;border-radius:4px;background:var(--y);color:#000;font:700 11px/1 var(--mono);white-space:nowrap;opacity:0;pointer-events:none;box-shadow:0 8px 20px rgba(0,0,0,.5)}
.drop .file{animation:drop 2s ease forwards}
@keyframes drop{0%{opacity:0;transform:translate(-20%,-260%) rotate(-4deg)}20%{opacity:1}80%{opacity:1;transform:translate(-50%,-50%) rotate(0)}100%{opacity:0;transform:translate(-50%,-50%) scale(.9)}}
/* figure 3: the folders */
.tree{margin:18px 0 0;padding:12px 14px;border-radius:8px;background:#08070a;font:500 13px/1.45 var(--mono);list-style:none}
.tree li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.tree li:last-child{border-bottom:0}
.tree li span:first-child{color:#fff;overflow-wrap:anywhere}
.tree li span:first-child::before{content:"";display:inline-block;width:14px;height:11px;margin-right:9px;vertical-align:-1px;border-radius:2px;background:var(--y)}
.tree li span:last-child{flex:none;color:rgba(255,255,255,.55)}
.recap{margin:30px 0 0;padding:0;list-style:none}
.recap li{position:relative;margin:14px 0 0;padding-left:34px;font-weight:700;line-height:1.45}
.recap li::before{content:"";position:absolute;left:0;top:7px;width:20px;height:12px;border-left:4px solid var(--ink);border-bottom:4px solid var(--ink);transform:rotate(-45deg)}
/* the offer */
.offer{margin:56px -20px 0;padding:34px 20px 36px;background:#fff;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink);text-align:center}
@media (min-width:720px){.offer{margin:60px -40px 0;padding:40px 48px;border:2px solid var(--ink);border-radius:6px}}
.offer h2{margin:0}
.offer img{display:block;width:min(260px,70%);height:auto;margin:22px auto 0}
.offer p{margin:18px auto 0;max-width:520px;text-align:left}
.offer ul{margin:18px auto 0;max-width:520px;padding:0;list-style:none;text-align:left;font:500 17px/1.45 var(--sans)}
.offer li{position:relative;margin:10px 0 0;padding-left:30px}
.offer li::before{content:"";position:absolute;left:3px;top:4px;width:12px;height:7px;border-left:3px solid var(--yd);border-bottom:3px solid var(--yd);transform:rotate(-45deg)}
.price{margin:26px 0 0 !important;text-align:center !important;font:400 17px/1.4 var(--sans)}
.price s{color:var(--mute)}
.price b{font:800 34px/1 var(--sans);margin:0 4px}
.key{position:relative;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:min(100%,440px);min-height:76px;margin:18px auto 0;padding:14px 24px 16px;border-radius:10px;background:linear-gradient(180deg,var(--y2),var(--y) 55%,#e9a900);color:#000;text-decoration:none;font:900 21px/1.1 var(--sans);letter-spacing:.01em;box-shadow:0 6px 0 var(--yd),0 12px 26px rgba(168,126,0,.35);transition:transform .08s,box-shadow .08s;-webkit-tap-highlight-color:transparent}
.key small{margin-top:6px;font:600 13px/1 var(--sans);letter-spacing:.02em;opacity:.75}
.key:active{transform:translateY(5px);box-shadow:0 1px 0 var(--yd),0 4px 12px rgba(168,126,0,.3)}
.trust{margin:16px 0 0 !important;text-align:center !important;font:500 14px/1.5 var(--sans) !important;color:var(--mute)}
footer{max-width:680px;margin:0 auto;padding:30px 20px 60px;border-top:1px solid var(--line);font:400 12px/1.6 var(--sans);color:var(--mute)}
footer p{margin:10px 0 0}
footer nav{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:14px}
`;

// The hits of the "by hand vs one drag" picture: a trap bar on 16 steps (row 0 hats, 1 snare, 2 kick).
const HATS = [0, 2, 4, 6, 7, 8, 10, 12, 13, 14, 15];
const SNARE = [4, 12];
const KICK = [0, 3, 10];
function raceGrid(kind: "hand" | "drag"): string {
  let k = 0;
  const cells: string[] = [];
  [HATS, SNARE, KICK].forEach((row) => {
    for (let s = 0; s < 16; s++) {
      const on = row.includes(s);
      cells.push(on ? `<i class="on" data-k="${kind === "hand" ? k++ : 0}"></i>` : "<i></i>");
    }
  });
  return cells.join("");
}

// The kit's eleven hand-written folders and their files (player/v6/tree.json, 1,040 in all).
const FOLDERS: [string, number][] = [
  ["1. 808", 178], ["2. Hihat Closed", 263], ["3. Hihat Open", 42], ["4. Kick", 104], ["5. Snare or Clap", 120],
  ["6. Accents (clap, rim, perc)", 76], ["7. Kick and Snare (Multi-Track)", 50], ["8. Kick and 808 (Multi-Track)", 55],
  ["9. Complete Beats (Multi-Track)", 50], ["10. Rolls", 94], ["11. Base Rhythms", 8],
];

const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

export function articleHtml(currency: Currency, price: number, variant = "base"): string {
  const v = VARIANTS[variant] ?? VARIANTS.base;
  const order = funnel.checkout.orderPage;
  const p = money(price, currency);
  const was = money(funnel.wasPrice, currency);
  const cfg = JSON.stringify({
    rows: ["808", "Kick", "Snare", "Clap", "Rim", "Hat", "Open hat", "Perc"],
    bn: [
      ["No bounce", "A plain beat: kick and 808 on the one, and an 8th before the snare in bars 2 and 4; straight hi-hats."],
      ["Bounce", "Complete Beat 01 from the MIDI Drum Kit, exactly as it is in the zip."],
    ],
  });
  const title = v.h1.join(" ");
  const desc = v.dek;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title} · GRIND STUDIO</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#fbfaf7">
<meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="https://m.thegrind.studio${IMG}kit-box-v3-640.webp">
<link rel="icon" href="/favicon.ico">
${head(currency, price, v)}
<style>${CSS}</style></head><body>
<header class="top"><div><a class="mast" href="#"><img src="${IMG}logo-dark.webp" width="162" height="18" alt="GRIND STUDIO"><span>Journal</span></a><nav>Beatmaking</nav></div></header>
<main><article id="art">
<p class="kick"><b>${v.kick}</b>5 min read</p>
<h1><span>${v.h1[0]}</span><span>${v.h1[1]}</span></h1>
<p class="dek">${desc}</p>
<div class="by"><i class="gem" aria-hidden="true"></i><div><b>GRIND STUDIO</b>Beatmakers writing for beatmakers</div></div>

<p class="lead">${v.lead}</p>
<p>${v.second}</p>
<p><mark><b>Here's the hard part: no sample pack is going to fix it.</b></mark> Here's the good part: once you see what's actually wrong, the fix takes seconds.</p>

<div class="box"><h3>What you'll get from the next 5 minutes</h3>
<ol><li>Why drums that sit on the grid feel lifeless, even with the best sounds.</li><li>How to get drums that bounce in seconds, not after two hours of clicking.</li></ol>
<p>Read it to the end and you'll hear why the records you love feel the way they do, and how to get that feeling into your own beats while the idea is still fresh.</p></div>

<h2>Who's telling you this</h2>
<p>We're GRIND STUDIO. We make beats, and we spent 4 years pulling drum patterns out of the records that move people, one hit at a time. 2,847 producers use those patterns in their sessions today. Everything below comes from that work.</p>

<h2><span class="n">1.</span>Your drums are right on the grid. That's the problem.</h2>
<p>When you program drums from scratch, you do the logical thing. Kick on the one. Snare on 2 and 4. Hats on every 8th, all at the same velocity. Every hit lands exactly where it should.</p>
<p><b>And that's exactly why it feels dead.</b></p>
<p>The drums that make your head move do something else. A kick that slips in just before the snare. Hats that roll up into the next bar. Quiet hits you feel more than you hear. That push and pull is what producers call bounce.</p>
<p class="big">Bounce isn't a sound. It's where the hits go.</p>

<figure id="bn">
<p class="fig-tag">Hear it</p>
<p class="fig-h">No bounce vs bounce.</p>
<p class="fig-sub">Same sounds, same tempo, four bars. Only the pattern changes. Press play, then flip the switch.</p>
<div class="sw" role="group" aria-label="Pattern"><button type="button" data-bounce="0" aria-pressed="true">No bounce</button><button type="button" data-bounce="1" aria-pressed="false">Bounce</button></div>
<canvas class="roll" aria-hidden="true"></canvas>
<div class="bar"><button class="play" type="button" data-state="stopped" aria-label="Play">${PLAY}</button><p class="what"><b>No bounce</b><span>A plain beat: kick and 808 on the one, and an 8th before the snare in bars 2 and 4; straight hi-hats.</span><small></small></p></div>
<figcaption><b>Same kit both times.</b> No new samples, no plugin, no mixing. Only the placement of the hits changed.</figcaption>
</figure>

<p>That's the first half of the story. Most producers get there eventually. Then they hit the second wall.</p>

<h2><span class="n">2.</span>Programming every hit kills the idea before the beat exists.</h2>
<p>Say you know all this. You still have to click it in. Hat by hat, roll by roll, velocity by velocity.</p>
<p>Twenty minutes later the loop you loved has played on repeat so many times you can't hear it anymore. The feeling that made you open the DAW is gone. The beat goes into the folder with all the others.</p>
<p class="big">Most beats don't die because the producer isn't good enough. They die waiting for the drums.</p>

<figure id="race">
<p class="fig-tag">Watch it</p>
<p class="fig-h">One bar, two ways.</p>
<p class="fig-sub">The same pattern: once clicked in hit by hit, once dragged in from a MIDI file.</p>
<div class="race">
<div class="lane hand"><p class="lane-h">By hand <span>click, click, click…</span></p><div class="grid">${raceGrid("hand")}</div><p class="lane-f">hats · snare · kick</p></div>
<div class="lane drag"><p class="lane-h">One drag <span>done</span></p><div class="grid">${raceGrid("drag")}<b class="file">MDK_CompleteBeat01_164.mid</b></div><p class="lane-f">hats · snare · kick</p></div>
</div>
<figcaption><b>One bar.</b> A beat is dozens of them, and every bar you click in is time the idea is cooling down.</figcaption>
</figure>

<h2>So how do producers get bounce without the hours?</h2>
<p>They don't start from an empty grid. They start from a pattern that already moves, and make it theirs. Two steps.</p>

<h2><span class="n">Step 1.</span>Drag in a pattern that already bounces.</h2>
<p>Start from a full drum pattern instead of a blank piano roll. Because it's MIDI and not audio, it plays whatever kit you load: your kick, your snare, your 808. It sounds like you from the first bar.</p>
<p>That's exactly why we made the <a class="text-link" data-cta href="${order}">MIDI Drum Kit</a>: 1,040 drum patterns written by hand, as MIDI files you drag into FL Studio, Ableton, Logic or any DAW, on Mac or PC. No theory, no setup. If your DAW opens a .mid file, it works.</p>

<h2><span class="n">Step 2.</span>Make it yours with fills, rolls and 808s.</h2>
<p>A pattern gets the beat moving. The details make it yours. A hi-hat roll before the drop. A fill at the end of bar 8. A new 808 line when the chords change.</p>
<p>In the kit every drum has its own folder, the hi-hats go from Basic to Hyper-Complex, there are 250+ fills and rolls, and every 808 comes in all 12 keys, so it's always in key with your track.</p>

<figure>
<p class="fig-tag">Inside the zip</p>
<p class="fig-h">Every drum in its own folder.</p>
<p class="fig-sub">The 11 folders written by hand, and how many MIDI files are in each.</p>
<ul class="tree">${FOLDERS.map(([n, c]) => `<li><span>${n}</span><span>${c}</span></li>`).join("")}</ul>
<figcaption><b>Plus 6 more folders</b> with every pattern in all 12 keys and 6,000+ ready combinations: 10,296 MIDI files in total.</figcaption>
</figure>

<p>You stop building drums and start choosing them. <mark><b>The beat is done while the idea is still hot.</b></mark></p>

<h2>What to take with you</h2>
<ul class="recap"><li>Stiff drums are a pattern problem, not a sound problem.</li><li>Start from a pattern that already bounces, then make it yours with fills, rolls and 808s.</li></ul>
<p>Do that, and your beats start to feel like the records that made you want to make music in the first place.</p>

<section class="offer" id="offer">
<h2>Want the patterns ready to drag?</h2>
<img src="${IMG}kit-box-v3-480.webp" width="480" height="618" alt="MIDI Drum Kit by GRIND STUDIO" loading="lazy" decoding="async">
<p>The MIDI Drum Kit is everything in this article, done for you.</p>
<ul>
<li><b>1,040 drum patterns written by hand</b>, plus 6,000+ ready combinations: 10,296 MIDI files</li>
<li>250+ fills and rolls, every 808 in all 12 keys</li>
<li>Works in any DAW, Mac or PC. Drag, drop, done</li>
<li>Sell your beats and keep 100%, no royalties</li>
<li>6 bonuses, including the Famous Beats MIDI Bundle and Drunk Swing Grooves</li>
</ul>
<p class="price">Black Friday price: <s>${was}</s> <b>${p}</b> one payment</p>
<a class="key" data-cta href="${order}">Get the MIDI Drum Kit<small>${p} · instant download</small></a>
<p class="trust">60-day quality guarantee: a file doesn't work, we fix it. If we can't, you get a refund.<br>2,847 producers already have it in their sessions.</p>
</section>
<i id="art-end"></i>
</article></main>
<footer>
<p>MIDI DRUM KIT is designed to help you create professional-sounding beats and improve your music production workflow, but individual results may vary, and specific outcomes, income, or success are not guaranteed.</p>
<p>GRIND STUDIO is not a part of the Facebook website or Meta Platforms, Inc. This site is NOT endorsed by Facebook in any way. FACEBOOK and INSTAGRAM are trademarks of META PLATFORMS, Inc.</p>
<nav><a href="${funnel.legal.terms}">Terms and Conditions</a><a href="${funnel.legal.privacy}">Privacy Policy</a><a href="${funnel.legal.refund}">Refund Policy</a><a href="mailto:${funnel.support}">${funnel.support}</a></nav>
</footer>
<script type="application/json" id="art-cfg">${cfg}</script>
<script>${ARTICLE_JS}</script>
</body></html>`;
}
