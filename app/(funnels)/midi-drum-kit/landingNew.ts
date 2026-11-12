import type { Lang } from "./i18n";

// The new MIDI Drum Kit landing (B of the landing test, ./landingTest.ts), made from the old page's
// HTML so the two differ only in what was asked (2026-11-12): "generare una nuova grafica per le
// boxes", "rendere la pagina più simile a Jazz MIDI Pack a livello di grandezze della headline",
// "implementare anche il player che ti fa sentire i midi", and the new box's iridescent light on the
// cards ("un piccolo sfondo in alto a destra di una card, o un bordo, una fascetta attorno").
//   - the boxes: kit-box-v3 (Marco's, Higgsfield GPT Image 2.6 Sunburst) and the ten folders' box3-*
//     in its style, boxes-all-v3 (all of them), value-stack-7 (the offer box's picture with it,
//     tools/value_stack.py v3);
//   - the headlines at the Jazz landing's sizes (app/(funnels)/jazz-midi-pack/jazz.module.css .heroHead, .h2);
//   - a player with the kit's real MIDI files (tools/drum_player_data.py → player/beats.json),
//     played with the Hit-Maker Drums bonus's sounds (player/*.m4a) and an 808 made in the browser.

const IMG = "/funnels/midi-drum-kit/";
const FOLDERS = ["808", "hats", "open-hats", "kick", "snare", "accents", "kick-snare", "kick-808", "complete-beats", "rolls"];

// The hero headline, and the section headlines (40–50px on the old page).
const HERO = ".id-6Z-Renrye-167";
const H2 = [
  "id-6Z-DBZeEl-6", "id-6Z-yxj4QX-14", "id-6Z-dOX4QP-356", "id-6Z-nx4Nj9-159", "id-6Z-wzeml9-858", "id-6Z-mRX4MN-452",
  "id-6Z-wzeml9-5058", "id-6Z-kBro4X-76", "id-6Z-jLXXba-312", "id-6Z-dO4RNz-22", "id-6Z-dO4RNz-397", "id-6Z-dO4RNz-1822",
  "id-6Z-jLXXba-658", "id-6Z-dO4RNz-1942",
].map((id) => `.${id}`);
// The dark cards that get the iridescent light: Introducing, the science box, the ten folders, the
// bonuses (4–6 are copies of 2 and 3, same classes), Patterns, Fragments, the folder tree.
const CARDS = [
  "id-6Z-WOaYBj-1502", "id-6Z-wzeml9-854", "id-6Z-lLXzjA-44", "id-6Z-gYXZX5-3116", "id-6Z-gYXZX5-3136", "id-6Z-gYXZX5-3225",
  "id-6Z-gYXZX5-3272", "id-6Z-gYXZX5-3314", "id-6Z-gYXZX5-3337", "id-6Z-gYXZX5-3355", "id-6Z-gYXZX5-3385", "id-6Z-lLXzjA-3",
  "id-6Z-lLXzjA-66", "id-6Z-lLXzjA-84", "id-6Z-lLXzjA-111", "id-6Z-lLXzjA-420", "id-6Z-lLXzjA-450", "id-6Z-lLXzjA-209",
].map((id) => `.${id}`);

// The new box's spine light: magenta, violet, cyan, a warm gold.
const IRIS = "#ff6ec7, #a97bff 22%, #5ad1ff 45%, #9dffd6 62%, #ffe58a 80%, #ff9a6e";

const CSS = `
${HERO} .elHeadline{font-family:Poppins,"Poppins Fallback",sans-serif!important;font-size:clamp(30px,6.4vw,52px)!important;font-weight:800!important;line-height:1.14!important;letter-spacing:-.015em!important;text-wrap:balance}
${HERO} .elHeadline *{font-family:inherit!important;letter-spacing:inherit!important}
${H2.map((s) => `${s} .elHeadline`).join(",")}{font-family:Poppins,"Poppins Fallback",sans-serif!important;font-size:clamp(29px,5.4vw,46px)!important;font-weight:700!important;line-height:1.14!important;letter-spacing:-.022em!important;text-wrap:balance}
${H2.map((s) => `${s} .elHeadline *`).join(",")}{font-family:inherit!important;letter-spacing:inherit!important}
${CARDS.join(",")},.dkp-panel{position:relative;isolation:isolate;overflow:hidden}
${CARDS.map((s) => `${s}::before`).join(",")},.dkp-panel::before{content:"";position:absolute;z-index:-1;top:-140px;right:-110px;width:min(460px,75%);height:340px;border-radius:50%;background:conic-gradient(from 200deg,rgba(255,110,199,.42),rgba(169,123,255,.38),rgba(90,209,255,.38),rgba(157,255,214,.3),rgba(255,229,138,.34),rgba(255,154,110,.38),rgba(255,110,199,.42));-webkit-mask:radial-gradient(closest-side,#000 20%,transparent);mask:radial-gradient(closest-side,#000 20%,transparent);filter:blur(28px);opacity:.75;pointer-events:none}
${CARDS.map((s) => `${s}::after`).join(",")},.dkp-panel::after{content:"";position:absolute;inset:0;z-index:1;border-radius:inherit;padding:1.5px;background:linear-gradient(125deg,transparent 0 40%,${IRIS},transparent 98%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.dkp-sec{background:#000;padding:72px 16px 80px;color:#fff;font-family:Inter,"Inter Fallback",sans-serif}
.dkp-wrap{max-width:1040px;margin:0 auto}
.dkp-kicker{font:600 13px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#f5b800;text-align:center}
.dkp-h2{margin:12px auto 0;max-width:820px;text-align:center;font-family:Poppins,"Poppins Fallback",sans-serif;font-size:clamp(29px,5.4vw,46px);font-weight:700;line-height:1.14;letter-spacing:-.022em;text-wrap:balance}
.dkp-sub{margin:16px auto 0;max-width:680px;text-align:center;font-size:clamp(16px,2vw,18px);line-height:1.5;color:rgba(255,255,255,.72)}
.dkp-panel{margin-top:36px;background:#0d0c10;border-radius:12px;padding:20px 20px 18px;text-align:left}
.dkp-tabs{display:flex;gap:22px;overflow-x:auto;scrollbar-width:none}
.dkp-tabs::-webkit-scrollbar{display:none}
.dkp-tab{flex:none;background:none;border:0;padding:4px 0 8px;color:rgba(255,255,255,.55);font:600 15px/1.2 Inter,"Inter Fallback",sans-serif;cursor:pointer;border-bottom:2px solid transparent}
.dkp-tab[aria-selected=true]{color:#fff;border-bottom-color:#f5b800}
.dkp-now{display:flex;align-items:center;gap:14px;margin-top:16px}
.dkp-now>*{margin:0!important}
.dkp-play{flex:none;width:48px;height:48px;border-radius:50%;border:0;background:#f5b800;color:#000;cursor:pointer;display:grid;place-items:center}
.dkp-play svg{width:18px;height:18px}
.dkp-play[data-state=loading]{opacity:.6;cursor:progress}
.dkp-title{font:700 17px/1.25 Poppins,"Poppins Fallback",sans-serif}
.dkp-meta{margin-top:3px;font:500 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(255,255,255,.55)}
.dkp-roll{display:block;width:100%;margin-top:16px;border-radius:8px;background:#08070a}
.dkp-file{margin-top:10px;font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(255,255,255,.45);overflow-wrap:anywhere}
.dkp-file b{color:#f5b800;font-weight:600;letter-spacing:.12em}
.dkp-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:4px;margin-top:16px;max-height:132px;overflow-y:auto}
.dkp-n{background:none;border:0;border-radius:6px;padding:9px 0;color:rgba(255,255,255,.6);font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;cursor:pointer}
.dkp-n:hover{color:#fff;background:rgba(255,255,255,.06)}
.dkp-n[aria-current=true]{color:#000;background:#f5b800}
.dkp-hint{margin-top:10px;font-size:13px;color:rgba(255,255,255,.5)}
.dkp-cta{display:block;width:fit-content;max-width:100%;margin:36px auto 0;padding:20px 40px;border-radius:999px;background:linear-gradient(180deg,#ffa13d,#ec6a0c);border:1px solid #b04c05;box-shadow:0 8px 28px rgba(236,106,12,.45),inset 0 1px 0 rgba(255,255,255,.45);color:#fff;font:800 clamp(17px,2.2vw,21px)/1.2 Poppins,"Poppins Fallback",sans-serif;text-align:center;text-decoration:none;text-shadow:0 1px 2px rgba(0,0,0,.35)}
@media (max-width:640px){.dkp-sec{padding:56px 16px 64px}.dkp-panel{padding:16px 14px 14px;margin-top:28px}.dkp-tabs{gap:18px}.dkp-cta{padding:18px 26px}}
`;

const WORDS: Record<"en" | "it", Record<string, string>> = {
  en: {
    kicker: "The real files",
    h2: "Press play. Hear the kit before you get it.",
    sub: "These are the kit’s own MIDI files: 155 multi-track grooves from 3 of its 10 folders, played here with the Hit-Maker Drums bonus sounds. In your DAW they play whatever drums you load.",
    play: "Play",
    stop: "Stop",
    loading: "Loading the sounds…",
    inPack: "In the kit",
    hint: "Tap a number to hear another file.",
    bars: "bars",
    cta: "Get The MIDI Drum Kit",
    rows: "808,Kick,Snare,Clap,Rim,Hat,Open hat,Perc",
  },
  it: {
    kicker: "I file veri",
    h2: "Premi play. Ascolta il kit prima di prenderlo.",
    sub: "Questi sono i file MIDI del kit: 155 groove multitraccia da 3 delle sue 10 cartelle, suonati qui con i suoni del bonus Hit-Maker Drums. Nella tua DAW suonano con la batteria che carichi tu.",
    play: "Play",
    stop: "Stop",
    loading: "Carico i suoni…",
    inPack: "Nel kit",
    hint: "Tocca un numero per sentire un altro file.",
    bars: "battute",
    cta: "Prendi il MIDI Drum Kit",
    rows: "808,Kick,Snare,Clap,Rim,Hat,Open hat,Perc",
  },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function section(lang: Lang, order: string): string {
  const w = WORDS[lang === "it" ? "it" : "en"];
  return `<div class="dkp-sec" id="player"><div class="dkp-wrap">
<p class="dkp-kicker">${esc(w.kicker)}</p>
<h2 class="dkp-h2">${esc(w.h2)}</h2>
<p class="dkp-sub">${esc(w.sub)}</p>
<div class="dkp-panel" id="dkp" data-words="${esc(JSON.stringify({ play: w.play, stop: w.stop, loading: w.loading, bars: w.bars, rows: w.rows.split(",") }))}">
<div class="dkp-tabs" role="tablist"></div>
<div class="dkp-now"><button class="dkp-play" type="button" aria-label="${esc(w.play)}" data-state="stopped"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg></button>
<div><div class="dkp-title">&nbsp;</div><div class="dkp-meta">&nbsp;</div></div></div>
<canvas class="dkp-roll" height="200" aria-hidden="true"></canvas>
<div class="dkp-file"><b>${esc(w.inPack.toUpperCase())}</b> · MIDI Drum Kit / <span></span></div>
<div class="dkp-list" role="list"></div>
<p class="dkp-hint">${esc(w.hint)}</p>
</div>
<a class="dkp-cta" href="${order}" data-cta>${esc(w.cta)}</a>
</div></div>
`;
}

// The player: fetches the files' notes when it comes near the screen, the sounds on the first
// press of play (a browser plays sound only after a tap). A small look-ahead scheduler loops the
// file at its tempo; the canvas draws its notes per sound and the playhead.
const SCRIPT = `<script>
(function () {
  var root = document.getElementById('dkp');
  if (!root) return;
  var W = JSON.parse(root.getAttribute('data-words'));
  var BASE = '/funnels/midi-drum-kit/player/';
  var FILES = [null, 'kick', 'snare', 'clap', 'rim', 'hat', 'ohat', 'perc'];
  var LEVEL = [0.9, 1, 0.8, 0.75, 0.7, 0.5, 0.45, 0.6];
  var data = null, folder = 0, idx = 0, ctx = null, bufs = null, out = null;
  var playing = false, t0 = 0, cursor = 0, timer = 0, raf = 0, openHat = null;
  var tabs = root.querySelector('.dkp-tabs'), list = root.querySelector('.dkp-list'), btn = root.querySelector('.dkp-play');
  var title = root.querySelector('.dkp-title'), meta = root.querySelector('.dkp-meta'), file = root.querySelector('.dkp-file span');
  var cv = root.querySelector('.dkp-roll'), g = cv.getContext('2d');
  var PLAY = btn.innerHTML, STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>';

  function beat() { return data.folders[folder].beats[idx]; }
  function spb() { return 60 / beat().bpm; }

  function render() {
    tabs.innerHTML = data.folders.map(function (f, i) {
      return '<button class="dkp-tab" role="tab" type="button" aria-selected="' + (i === folder) + '" data-f="' + i + '">' + f.name + '</button>';
    }).join('');
    list.innerHTML = data.folders[folder].beats.map(function (b, i) {
      return '<button class="dkp-n" type="button" role="listitem" aria-current="' + (i === idx) + '" data-i="' + i + '">' + (i < 9 ? '0' : '') + (i + 1) + '</button>';
    }).join('');
    var b = beat();
    title.textContent = b.name;
    meta.textContent = b.bpm + ' BPM · ' + (b.len / 4) + ' ' + W.bars;
    file.textContent = b.file;
    draw(-1);
  }

  function rows() {
    var used = {};
    beat().notes.forEach(function (n) { used[n[2]] = 1; });
    return [0, 1, 2, 3, 4, 5, 6, 7].filter(function (i) { return used[i]; });
  }

  function draw(pos) {
    var b = beat(), rs = rows(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var cssW = cv.clientWidth || 600, narrow = cssW < 520, rh = narrow ? 22 : 28, lab = narrow ? 50 : 72;
    var cssH = rs.length * rh + 8;
    if (cv.width !== Math.round(cssW * dpr) || cv.height !== Math.round(cssH * dpr)) {
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr); cv.style.height = cssH + 'px';
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cssW, cssH);
    var x0 = lab, w = cssW - lab - 8, per = w / b.len;
    for (var q = 0; q <= b.len * 4; q++) {
      g.fillStyle = q % 16 === 0 ? 'rgba(255,255,255,.22)' : q % 4 === 0 ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.035)';
      g.fillRect(Math.round(x0 + q * per / 4), 4, 1, cssH - 8);
    }
    g.font = (narrow ? '500 10px ' : '500 11px ') + 'ui-monospace,SFMono-Regular,Menlo,monospace';
    g.textBaseline = 'middle';
    rs.forEach(function (r, k) {
      g.fillStyle = 'rgba(255,255,255,.5)';
      g.fillText(W.rows[r], 8, 4 + k * rh + rh / 2);
      if (k) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x0, 4 + k * rh, w, 1); }
    });
    b.notes.forEach(function (n) {
      // A drum hit is drawn a sixteenth long at most (its MIDI length doesn't change the sound); the 808 its real length.
      var k = rs.indexOf(n[2]), x = x0 + n[0] * per, nw = Math.max(3, (n[2] ? Math.min(n[1], 0.25) : n[1]) * per - 1);
      var live = pos >= 0 && pos >= n[0] && pos < n[0] + Math.max(n[1], 0.12);
      g.globalAlpha = live ? 1 : 0.35 + 0.6 * (n[4] / 127);
      g.fillStyle = live ? '#ffffff' : '#f5b800';
      g.fillRect(x, 4 + k * rh + 5, nw, rh - 10);
    });
    g.globalAlpha = 1;
    if (pos >= 0) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x0 + pos * per), 2, 2, cssH - 4); }
  }

  function load() {
    if (data) return;
    data = 'loading';
    fetch(BASE + 'beats.json').then(function (r) { return r.json(); }).then(function (d) { data = d; render(); }).catch(function () { data = null; });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '800px' });
    io.observe(root);
  } else load();

  function decode(ab) {
    return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); });
  }
  function sounds() {
    if (bufs) return Promise.resolve();
    return Promise.all(FILES.map(function (f) {
      return f ? fetch(BASE + f + '.m4a').then(function (r) { return r.arrayBuffer(); }).then(decode) : null;
    })).then(function (b) { bufs = b; });
  }

  function fire(t, n) {
    var vel = n[4] / 127, ins = n[2], s = spb();
    if (ins === 0) {
      var o = ctx.createOscillator(), a = ctx.createGain(), f = 440 * Math.pow(2, (n[3] - 69 - 24) / 12);
      var len = Math.max(0.12, Math.min(n[1] * s, 1.6));
      o.type = 'sine';
      o.frequency.setValueAtTime(f * 1.9, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
      a.gain.setValueAtTime(0, t);
      a.gain.linearRampToValueAtTime(LEVEL[0] * vel, t + 0.004);
      a.gain.setValueAtTime(LEVEL[0] * vel, t + len * 0.7);
      a.gain.exponentialRampToValueAtTime(0.001, t + len + 0.06);
      o.connect(a); a.connect(out);
      o.start(t); o.stop(t + len + 0.08);
      return;
    }
    if (!bufs[ins]) return;
    if (ins === 5 && openHat) { try { openHat.g.gain.setTargetAtTime(0, t, 0.01); } catch (e) {} }
    var src = ctx.createBufferSource(), gn = ctx.createGain();
    src.buffer = bufs[ins];
    gn.gain.value = LEVEL[ins] * (0.35 + 0.65 * vel);
    src.connect(gn); gn.connect(out);
    src.start(t);
    if (ins === 6) openHat = { g: gn };
  }

  function pump() {
    var b = beat(), s = spb(), horizon = (ctx.currentTime + 0.15 - t0) / s;
    while (cursor < horizon) {
      var loop = Math.floor(cursor / b.len), base = loop * b.len, end = Math.min(horizon, base + b.len);
      var lo = cursor - base, hi = end - base;
      for (var i = 0; i < b.notes.length; i++) {
        var n = b.notes[i];
        if (n[0] >= lo && n[0] < hi) fire(t0 + (base + n[0]) * s, n);
      }
      cursor = end;
    }
  }
  function frame() {
    if (!playing) return;
    var b = beat(), pos = ((ctx.currentTime - t0) / spb()) % b.len;
    draw(pos < 0 ? 0 : pos);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    t0 = ctx.currentTime + 0.06; cursor = 0; openHat = null;
    out = ctx.createGain(); out.gain.value = 0.8; out.connect(ctx.destination);
    playing = true; pump(); timer = setInterval(pump, 25); raf = requestAnimationFrame(frame);
    btn.innerHTML = STOP; btn.setAttribute('aria-label', W.stop); btn.dataset.state = 'playing';
  }
  function stop() {
    playing = false; clearInterval(timer); cancelAnimationFrame(raf);
    if (out) { var o = out; o.gain.setTargetAtTime(0, ctx.currentTime, 0.02); setTimeout(function () { o.disconnect(); }, 200); out = null; }
    btn.innerHTML = PLAY; btn.setAttribute('aria-label', W.play); btn.dataset.state = 'stopped';
    if (data && data !== 'loading') draw(-1);
  }
  function play() {
    if (!data || data === 'loading') return;
    if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    btn.dataset.state = 'loading'; btn.setAttribute('aria-label', W.loading);
    sounds().then(start, function () { btn.dataset.state = 'stopped'; btn.setAttribute('aria-label', W.play); });
    try { window.clarity && clarity('event', 'player_play'); } catch (e) {}
  }

  btn.addEventListener('click', function () { if (btn.dataset.state === 'loading') return; playing ? stop() : play(); });
  tabs.addEventListener('click', function (e) {
    var t = e.target.closest('[data-f]'); if (!t || !data) return;
    var was = playing; stop(); folder = +t.dataset.f; idx = 0; render(); if (was) play();
  });
  list.addEventListener('click', function (e) {
    var t = e.target.closest('[data-i]'); if (!t || !data) return;
    stop(); idx = +t.dataset.i; render(); play();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && playing) stop(); });
  var rw = 0; addEventListener('resize', function () { if (!data || data === 'loading' || rw === innerWidth) return; rw = innerWidth; if (!playing) draw(-1); });
})();
</script>`;

// Where the player goes: after "So, What's Inside…" (the folders), before the offer, as on the Jazz page.
const PLAYER_AT = '<div data-page-element="SectionContainer/V1" class="container fullContainer id-6Z-wzeml9-5288"';

/** The new landing from the old one's finished HTML (after its words, images and speed-ups). */
export function newLanding(html: string, lang: Lang, order: string): string {
  let out = html
    .replaceAll(`${IMG}kit-box.webp`, `${IMG}kit-box-v3.webp`)
    .replaceAll(`${IMG}boxes-all.webp`, `${IMG}boxes-all-v3.webp`)
    .replaceAll(`${IMG}value-stack-6.webp`, `${IMG}value-stack-7.webp`)
    .replaceAll(`${IMG}value-stack-6-it.webp`, `${IMG}value-stack-7-it.webp`)
    // value-stack-7 is 1000 × 1214 (value-stack-6, 1000 × 1240).
    .replace(/(value-stack-7(?:-it)?\.webp"[^>]*?) height="1240"/g, '$1 height="1214"');
  for (const f of FOLDERS) out = out.replaceAll(`${IMG}box-${f}.webp`, `${IMG}box3-${f}.webp`);
  out = out.replace("</head>", `<style>${CSS}</style>\n</head>`);
  const at = out.indexOf(PLAYER_AT);
  if (at >= 0) out = out.slice(0, at) + section(lang, order) + out.slice(at);
  return out.replace("</body>", `${SCRIPT}\n</body>`);
}
