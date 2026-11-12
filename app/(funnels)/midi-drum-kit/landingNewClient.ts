// The new MIDI Drum Kit landing's script (./landingNew.ts puts it at the end of <body>): one small
// sound engine for everything a visitor can press play on.
//   - the kit's player (#dkp): the 11 folders, their groups, every file as a small picture to tap,
//     Previous / Play / Next. A multi-track file plays as it is. A single part (a kick pattern, a hat
//     fragment, an 808…) plays "in a beat": over a kick, a snare and hats from the kit, so it is heard
//     where it will be used; a fragment sits at the end of a two-bar loop. The visitor picks the beat
//     (five of them, tools/drum_player_data.py STYLES) and the tempo, or hears the file alone. A kick,
//     snare or hat pattern they play takes that drum's place in the beat for what they try next.
//     ("find a clever way to also let the users audition the fragments and other files on the pack",
//     then "un browser che li fa vedere visivamente e spiega meglio il fatto beat on beat off e magari
//     lascia che l'utente possa scegliere tra varie velocità e stili di beats", 2026-11-12.)
//   - the folder cards' examples (a tap plays a file of that subfolder: they drive the same player);
//   - "No bounce vs bounce" (#dkn): a Complete Beat of the kit and a plain beat with the same sounds at
//     the same tempo, one switch between them while it plays ("una sezione che te lo fa sentire");
//   - the bonuses, as on the Jazz MIDI Pack page: real files of Famous Beats (each with its own set of
//     Hit-Maker Drums sounds and its own 808: "metti suoni diversi per ogni demo") and Drunk Swing
//     Grooves as rolls (the grooves with their own hip hop sound, a recording), the Beat Starters'
//     samples and the MYSTERY hooks whole, Hit-Maker Drums as pads.
// Nothing is fetched before it is near the screen, no sound before a tap. Plain JS in a string:
// the page is a static document outside React. No backticks or dollar-braces inside.
export const CLIENT_JS = String.raw`
(function () {
  var cfgEl = document.getElementById('dk-cfg');
  if (!cfgEl) return;
  var W = JSON.parse(cfgEl.textContent);
  var BASE = '/funnels/midi-drum-kit/player/', DATA = BASE + 'v5/';
  var SOUND = [null, 'kick', 'snare', 'clap', 'rim', 'hat', 'ohat', 'perc'];
  var LEVEL = [0.9, 1, 0.8, 0.75, 0.7, 0.5, 0.45, 0.6];
  var ORANGE = '#f5851f';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';
  var STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>';
  var ctx = null, bufs = null, loading = null, now = null, sets = {}, curves = {};
  // The 808 is made here, not sampled: the wave, how far above the note it starts and how fast it falls to it, how hard it is driven.
  var SUBS = [{ w: 'sine', m: 1.9, t: 0.035, d: 0 }, { w: 'sine', m: 1.5, t: 0.05, d: 3 }, { w: 'triangle', m: 2.2, t: 0.025, d: 0 }, { w: 'sine', m: 3, t: 0.06, d: 2 }, { w: 'triangle', m: 1.3, t: 0.02, d: 1.5 }];

  // ---- sound ----
  function playback() { try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} }
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      playback(); // iOS: play with the ringer switch off too (Safari 16.4+), or silent mode mutes it
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function decode(ab) { return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); }); }
  function fetchBuf(url) { return fetch(url).then(function (r) { return r.arrayBuffer(); }); }
  function sounds() {
    if (!loading) {
      loading = Promise.all(SOUND.map(function (f) { return f ? fetchBuf(BASE + f + '.m4a').then(decode) : null; })).then(function (b) { bufs = b; });
      loading.catch(function () { loading = null; });
    }
    return loading;
  }
  // A set of Hit-Maker Drums sounds of its own (player/v5/kits/k<n>-*.m4a), for a file that asks for one.
  function soundSet(k) {
    if (!sets[k]) {
      sets[k] = Promise.all(SOUND.map(function (f) { return f ? fetchBuf(DATA + 'kits/k' + k + '-' + f + '.m4a').then(decode) : null; }));
      sets[k].catch(function () { delete sets[k]; });
    }
    return sets[k];
  }
  function curve(d) {
    if (!curves[d]) {
      var c = new Float32Array(257), top = Math.tanh(d);
      for (var i = 0; i < 257; i++) c[i] = Math.tanh(d * (i / 128 - 1)) / top;
      curves[d] = c;
    }
    return curves[d];
  }
  function stopAll() { if (now) { var n = now; now = null; n.stop(); } }
  function unflat(flat, sel) {
    var out = [];
    for (var i = 0; i < flat.length; i += 5) out.push([flat[i], flat[i + 1], flat[i + 2], flat[i + 3], flat[i + 4], sel]);
    return out;
  }
  function rowsOf(notes) {
    var used = {};
    notes.forEach(function (n) { used[n[2]] = 1; });
    return [0, 1, 2, 3, 4, 5, 6, 7].filter(function (i) { return used[i]; });
  }

  // A song {notes, len, bpm} looping until stopped. onPos(beat) on every frame.
  function startLoop(song, onPos) {
    var s = 60 / song.bpm, t0 = ctx.currentTime + 0.06, cursor = 0, open = null, alive = true;
    var B = song.bufs || bufs, sub = SUBS[song.kit || 0] || SUBS[0];
    var out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(ctx.destination);
    function fire(t, n) {
      var vel = n[4] / 127, ins = n[2];
      if (ins === 0) {
        var o = ctx.createOscillator(), a = ctx.createGain(), f = 440 * Math.pow(2, (n[3] - 69 - 24) / 12);
        var len = Math.max(0.12, Math.min(n[1] * s, 1.6));
        o.type = sub.w;
        o.frequency.setValueAtTime(f * sub.m, t);
        o.frequency.exponentialRampToValueAtTime(f, t + sub.t);
        a.gain.setValueAtTime(0, t);
        a.gain.linearRampToValueAtTime(LEVEL[0] * vel, t + 0.004);
        a.gain.setValueAtTime(LEVEL[0] * vel, t + len * 0.7);
        a.gain.exponentialRampToValueAtTime(0.001, t + len + 0.06);
        o.connect(a);
        if (sub.d) {
          var sh = ctx.createWaveShaper(), trim = ctx.createGain();
          sh.curve = curve(sub.d); trim.gain.value = 0.7;
          a.connect(sh); sh.connect(trim); trim.connect(out);
        } else a.connect(out);
        o.start(t); o.stop(t + len + 0.08);
        return;
      }
      if (!B[ins]) return;
      if (ins === 5 && open) { try { open.gain.setTargetAtTime(0, t, 0.01); } catch (e) {} }
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = B[ins];
      if (n[3]) src.playbackRate.value = Math.pow(2, Math.max(-30, Math.min(24, n[3])) / 12);
      g.gain.value = LEVEL[ins] * (0.35 + 0.65 * vel) * (n[5] ? 1 : 0.8);
      src.connect(g); g.connect(out);
      src.start(t);
      if (ins === 6) open = g;
    }
    function pump() {
      var horizon = (ctx.currentTime + 0.15 - t0) / s;
      while (cursor < horizon) {
        var base = Math.floor(cursor / song.len) * song.len, end = Math.min(horizon, base + song.len);
        var lo = cursor - base, hi = end - base;
        for (var i = 0; i < song.notes.length; i++) {
          var n = song.notes[i];
          if (n[0] >= lo && n[0] < hi) fire(t0 + (base + n[0]) * s, n);
        }
        cursor = end;
      }
    }
    function frame() {
      if (!alive) return;
      var pos = ((ctx.currentTime - t0) / s) % song.len;
      onPos(pos < 0 ? 0 : pos);
      requestAnimationFrame(frame);
    }
    pump();
    var timer = setInterval(pump, 25);
    requestAnimationFrame(frame);
    return function () {
      alive = false;
      clearInterval(timer);
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(function () { out.disconnect(); }, 200);
    };
  }
  // Play a song; onState('loading' | 'playing' | 'stopped').
  function playSong(song, onPos, onState) {
    stopAll();
    if (!audio()) return;
    var me = { dead: false, off: null, stop: function () { me.dead = true; if (me.off) me.off(); onState('stopped'); } };
    now = me;
    onState('loading');
    (song.kit ? soundSet(song.kit).then(function (b) { song.bufs = b; }) : sounds()).then(function () {
      if (me.dead) return;
      me.off = startLoop(song, onPos);
      onState('playing');
    }, function () { if (now === me) now = null; me.dead = true; onState('stopped'); });
  }
  // Play a recording of a file once, the roll's line following it (the Drunk Swing Grooves, in their own sound).
  function playRecording(url, song, onPos, onState) {
    stopAll();
    playback();
    var a = new Audio(url), me = { dead: false, stop: function () { me.dead = true; a.pause(); onState('stopped'); } };
    now = me;
    onState('loading');
    function frame() {
      if (me.dead) return;
      onPos(Math.min(song.len - 0.01, a.currentTime * song.bpm / 60));
      requestAnimationFrame(frame);
    }
    a.addEventListener('playing', function () { if (!me.dead) { onState('playing'); requestAnimationFrame(frame); } }, { once: true });
    a.addEventListener('ended', function () { if (now === me) stopAll(); });
    var p = a.play();
    if (p && p.catch) p.catch(function () { if (now === me) stopAll(); });
  }

  // ---- the roll ----
  // opts: lab (label column, 0 = none), rh (row height)
  function drawRoll(cv, song, pos, opts) {
    var g = cv.getContext('2d'), rs = song.rows, dpr = Math.min(2, window.devicePixelRatio || 1);
    var cssW = cv.clientWidth || cv.parentNode.clientWidth || 320, cssH = rs.length * opts.rh + 8;
    if (cv.width !== Math.round(cssW * dpr) || cv.height !== Math.round(cssH * dpr)) {
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr); cv.style.height = cssH + 'px';
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cssW, cssH);
    var x0 = opts.lab, w = cssW - opts.lab - (opts.lab ? 8 : 0), per = w / song.len;
    for (var q = 0; q <= song.len * 4; q++) {
      g.fillStyle = q % 16 === 0 ? 'rgba(255,255,255,.22)' : q % 4 === 0 ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.035)';
      g.fillRect(Math.round(x0 + q * per / 4), 4, 1, cssH - 8);
    }
    g.font = '500 ' + (opts.lab < 60 ? 10 : 11) + 'px ui-monospace,SFMono-Regular,Menlo,monospace';
    g.textBaseline = 'middle';
    rs.forEach(function (r, k) {
      if (opts.lab) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(W.rows[r], 8, 4 + k * opts.rh + opts.rh / 2); }
      if (k) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x0, 4 + k * opts.rh, w, 1); }
    });
    var pad = opts.rh > 18 ? 5 : 3;
    song.notes.forEach(function (n) {
      // a drum hit is drawn a sixteenth long at most; the 808 its real length
      var k = rs.indexOf(n[2]), x = x0 + n[0] * per, nw = Math.max(2.5, (n[2] ? Math.min(n[1], 0.25) : n[1]) * per - 1);
      var live = pos >= 0 && pos >= n[0] && pos < n[0] + Math.max(n[1], 0.12);
      g.globalAlpha = live ? 1 : song.plain ? 0.62 : n[5] ? 0.4 + 0.6 * (n[4] / 127) : 0.26;
      g.fillStyle = live || !n[5] || song.plain ? '#ffffff' : ORANGE;
      g.fillRect(x, 4 + k * opts.rh + pad, nw, opts.rh - pad * 2);
    });
    g.globalAlpha = 1;
    if (pos >= 0) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x0 + pos * per), 2, 2, cssH - 4); }
  }
  // A file as a small picture: its notes only, each sound on its line.
  function drawThumb(cv, e) {
    var g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 92, h = 34;
    cv.width = w * dpr; cv.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var notes = unflat(e.n, 1), rs = rowsOf(notes), rh = (h - 6) / rs.length, per = (w - 4) / e.len;
    g.fillStyle = 'rgba(255,255,255,.1)';
    for (var b = 4; b < e.len; b += 4) g.fillRect(Math.round(2 + b * per), 2, 1, h - 4);
    g.fillStyle = ORANGE;
    notes.forEach(function (n) {
      g.globalAlpha = 0.45 + 0.55 * (n[4] / 127);
      g.fillRect(2 + n[0] * per, 3 + rs.indexOf(n[2]) * rh + (rh > 6 ? 1 : 0), Math.max(1.5, (n[2] ? Math.min(n[1], 0.25) : n[1]) * per - 0.5), Math.max(2, rh - (rh > 6 ? 2 : 0.5)));
    });
    g.globalAlpha = 1;
  }
  function setBtn(btn, state) {
    btn.dataset.state = state;
    btn.innerHTML = state === 'playing' ? STOP : PLAY;
    btn.setAttribute('aria-label', state === 'playing' ? W.stop : state === 'loading' ? W.loading : W.play);
  }
  function near(el, fn) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); } }, { rootMargin: '900px' });
    io.observe(el);
  }
  function clarityEvent(name) { try { window.clarity && clarity('event', name); } catch (e) {} }
  function centre(row, el) { if (el) row.scrollLeft = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2; }

  // ---- the kit's player ----
  var root = document.getElementById('dkp');
  var kit = null, kitWait = null, cache = {}, fi = 0, gi = 0, idx = 0, entries = null, song = null, state = 'stopped', seq = 0, shown = '';
  var beatOn = true, style = 0, tempo = 0, picks = null;
  var PART = { kick: 1, snare: 2, hat: 5 };
  var $ = function (s) { return root && root.querySelector(s); };
  var chips = $('[data-row=folders]'), subs = $('[data-row=groups]'), styles = $('[data-row=styles]'), tempos = $('[data-row=tempos]'), grid = $('[data-row=files]');
  var btn = $('.dkp-play'), title = $('.dkp-title'), meta = $('.dkp-meta'), file = $('.dkp-file span'), cv = $('.dkp-roll'), box = $('.dkp-beatbox'), filesL = $('.dkp-filesl');
  var rowBtns = [].slice.call(document.querySelectorAll('[data-dkf]'));

  function stylePicks() {
    var p = {}, parts = kit.styles[style].parts;
    Object.keys(PART).forEach(function (k) { p[k] = unflat(parts[k], 0); });
    return p;
  }
  function loadKit() {
    if (!kitWait) {
      kitWait = fetch(DATA + 'kit.json').then(function (r) { return r.json(); }).then(function (k) {
        kit = k; picks = stylePicks();
        styles.innerHTML = kit.styles.map(function (s, i) {
          return '<button class="dkp-chip" type="button" aria-pressed="' + (i === style) + '" data-style="' + i + '">' + (W.styles[s.name] || s.name) + '</button>';
        }).join('');
      });
      kitWait.catch(function () { kitWait = null; });
    }
    return kitWait;
  }
  function group(g) {
    if (!cache[g.id]) {
      cache[g.id] = fetch(DATA + g.id + '.json').then(function (r) { return r.json(); });
      cache[g.id].catch(function () { delete cache[g.id]; });
    }
    return cache[g.id];
  }
  function opts() { var narrow = (cv.clientWidth || 600) < 520; return { lab: narrow ? 50 : 72, rh: narrow ? 22 : 28 }; }
  function draw(pos) { if (song) drawRoll(cv, song, pos, opts()); }

  function compose() {
    var grp = kit.folders[fi].groups[gi], e = entries[idx], sel = unflat(e.n, 1), notes, len, bpm;
    if (grp.inst < 0) { notes = sel; len = e.len; bpm = e.bpm || 140; }
    else {
      var span = e.len, off;
      // in a beat a fragment closes a two-bar loop, where it would be used; alone it plays at once
      // ("can we make the rolls play sooner if auditioned alone?"): the loop is the file, two beats at least
      len = span >= 16 ? span : beatOn ? 8 : Math.max(span, 2);
      off = len - span;
      bpm = tempo || e.bpm || kit.styles[style].bpm;
      notes = [];
      if (beatOn) Object.keys(PART).forEach(function (k) {
        var same = PART[k] === grp.inst;
        if (same && span >= 16) return;
        picks[k].forEach(function (n) { if (n[0] < len && (!same || n[0] < off - 0.01)) notes.push([n[0], n[1], n[2], n[3], n[4], 0]); });
      });
      sel.forEach(function (n) { notes.push([n[0] + off, n[1], n[2], n[3], n[4], 1]); });
      notes.sort(function (a, b) { return a[0] - b[0]; });
      // a kick, snare or hat pattern the visitor plays takes that drum's place in the beat for what they try next
      if (span >= 16) Object.keys(PART).forEach(function (k) { if (PART[k] === grp.inst) picks[k] = unflat(e.n, 0); });
    }
    song = { notes: notes, len: len, bpm: bpm, rows: rowsOf(notes) };
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function pressed(row, attr, value) {
    [].forEach.call(row.children, function (c) { c.setAttribute('aria-pressed', String(c.getAttribute(attr)) === String(value)); });
  }
  function render() {
    var fo = kit.folders[fi], grp = fo.groups[gi], e = entries[idx], part = grp.inst >= 0;
    [].forEach.call(chips.children, function (c, i) { c.setAttribute('aria-selected', i === fi); if (i === fi) centre(chips, c); });
    subs.hidden = fo.groups.length < 2;
    subs.innerHTML = fo.groups.length < 2 ? '' : fo.groups.map(function (g, i) {
      return '<button class="dkp-chip" type="button" role="tab" aria-selected="' + (i === gi) + '" data-g="' + i + '">' + (W.groups[g.name] || g.name) + ' <i>' + g.n + '</i></button>';
    }).join('');
    title.textContent = W.folders[fo.id] + (grp.name ? ' · ' + (W.groups[grp.name] || grp.name) : '') + ' ' + two(idx + 1);
    meta.textContent = song.bpm + ' BPM · ' + (idx + 1) + ' ' + W.of + ' ' + entries.length;
    file.textContent = e.f;
    box.hidden = !part;
    pressed(box.querySelector('.dkp-seg'), 'data-beat', beatOn ? 1 : 0);
    pressed(styles, 'data-style', style);
    pressed(tempos, 'data-tempo', tempo);
    box.classList.toggle('off', !beatOn);
    // every file of the group as a small picture; built once per group
    if (shown !== grp.id) {
      shown = grp.id;
      filesL.textContent = W.all.replace('{n}', entries.length);
      grid.innerHTML = entries.map(function (x, i) {
        return '<button class="dkp-thumb" type="button" data-i="' + i + '" aria-label="' + two(i + 1) + '"><canvas aria-hidden="true"></canvas><span>' + two(i + 1) + '</span></button>';
      }).join('');
      [].forEach.call(grid.children, function (b, i) { drawThumb(b.firstChild, entries[i]); });
    }
    [].forEach.call(grid.children, function (b, i) { b.setAttribute('aria-current', i === idx); if (i === idx) centre(grid, b); });
  }
  function setState(s) {
    state = s;
    setBtn(btn, s);
    var id = kit ? kit.folders[fi].id : '';
    rowBtns.forEach(function (b) { b.setAttribute('data-state', b.getAttribute('data-dkf') === id && +b.getAttribute('data-dkg') === gi ? s : 'stopped'); });
    if (s === 'stopped') draw(-1);
  }
  function start() { playSong(song, draw, setState); clarityEvent('player_play'); }
  // Show a file (folder f, group g, file i), and play it when asked.
  function show(f, g, i, play) {
    var token = ++seq;
    if (play) audio();
    return loadKit().then(function () { return group(kit.folders[f].groups[g]); }).then(function (list) {
      if (token !== seq) return;
      fi = f; gi = g; entries = list; idx = ((i % list.length) + list.length) % list.length;
      compose();
      render();
      if (play) start(); else { if (state !== 'stopped') stopAll(); draw(-1); }
    });
  }
  // A setting changed: the same file again, as it now sounds.
  function again() {
    if (!entries) return;
    var was = state !== 'stopped';
    compose(); render();
    if (was) start(); else draw(-1);
  }
  if (root) {
    // unless the visitor already asked for a file (a folder's play button further down)
    near(root, function () { if (!seq) show(0, 0, 0, false); });
    btn.addEventListener('click', function () {
      if (state === 'loading') return;
      if (state === 'playing') return stopAll();
      if (song) start(); else show(0, 0, 0, true);
    });
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-f],[data-g],[data-step],[data-i],[data-beat],[data-style],[data-tempo]');
      if (!t) return;
      var has = function (a) { return t.hasAttribute(a); }, val = function (a) { return +t.getAttribute(a); };
      if (has('data-f')) return show(val('data-f'), 0, 0, true);
      if (!kit) return;
      if (has('data-g')) return show(fi, val('data-g'), 0, true);
      if (has('data-step')) return show(fi, gi, idx + val('data-step'), true);
      if (has('data-i')) return show(fi, gi, val('data-i'), true);
      if (has('data-beat')) { beatOn = !!val('data-beat'); return again(); }
      if (has('data-style')) { style = val('data-style'); picks = stylePicks(); beatOn = true; return again(); }
      if (has('data-tempo')) { tempo = val('data-tempo'); return again(); }
    });
    rowBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-dkf'), g = +b.getAttribute('data-dkg');
        if (b.getAttribute('data-state') !== 'stopped') return stopAll();
        audio();
        b.setAttribute('data-state', 'loading');
        loadKit().then(function () {
          for (var i = 0; i < kit.folders.length; i++) if (kit.folders[i].id === id) return show(i, g, 0, true);
        });
        clarityEvent('folder_play');
      });
    });
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (state === 'stopped') draw(-1); }).observe(cv);
  }

  // ---- no bounce vs bounce: two beats, same sounds and tempo; the switch swaps the notes while it plays ----
  (function () {
    var el = document.getElementById('dkn');
    if (!el) return;
    var cvB = el.querySelector('canvas'), btnB = el.querySelector('.dk-play'), sw = [].slice.call(el.querySelectorAll('[data-bounce]'));
    var what = el.querySelector('.dkn-what'), sets2 = null, songB = null, on = 0, st = 'stopped', last = 0, loops = 0, wait = null;
    function o() { var narrow = (cvB.clientWidth || 600) < 520; return { lab: narrow ? 50 : 72, rh: narrow ? 16 : 20 }; }
    function paint(pos) {
      if (!songB) return;
      // once round on "no bounce": point at the other side
      if (pos >= 0 && pos < last && !on && ++loops === 1) sw[1].classList.add('nudge');
      last = pos;
      drawRoll(cvB, songB, pos, o());
    }
    function set(v) {
      on = v;
      sw.forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-bounce') === on); });
      sw[1].classList.remove('nudge');
      what.querySelector('b').textContent = W.bn[on][0];
      what.querySelector('span').textContent = W.bn[on][1];
      what.querySelector('small').textContent = on && sets2 ? 'MIDI Drum Kit / ' + sets2.f.replace('/', ' / ') : '';
      if (songB) { songB.notes = sets2.notes[on]; songB.plain = !on; if (st === 'stopped') paint(-1); }
    }
    function load() {
      if (!wait) {
        wait = fetch(DATA + 'bounce2.json').then(function (r) { return r.json(); }).then(function (d) {
          var a = unflat(d.off, 1), b = unflat(d.on, 1);
          sets2 = { f: d.f, notes: [a, b] };
          songB = { notes: a, len: d.len, bpm: d.bpm, rows: rowsOf(a.concat(b)), plain: true };
          set(on);
        });
        wait.catch(function () { wait = null; });
      }
      return wait;
    }
    function state(x) { st = x; setBtn(btnB, x); if (x === 'stopped') paint(-1); }
    function start() {
      audio();
      load().then(function () { last = 0; playSong(songB, paint, state); clarityEvent('bounce_play'); });
    }
    near(el, load);
    btnB.addEventListener('click', function () { if (st === 'loading') return; if (st === 'playing') return stopAll(); start(); });
    sw.forEach(function (b) {
      b.addEventListener('click', function () {
        set(+b.getAttribute('data-bounce'));
        if (st === 'stopped') start();
        clarityEvent(on ? 'bounce_on' : 'bounce_off');
      });
    });
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (st === 'stopped') paint(-1); }).observe(cvB);
  })();

  // ---- the bonuses' MIDI files: a short roll each, with its own play ----
  var MINI = { lab: 0, rh: 14 };
  function bonusRolls() {
    var lists = [].slice.call(document.querySelectorAll('[data-rolls]'));
    if (!lists.length) return;
    fetch(DATA + 'bonus.json').then(function (r) { return r.json(); }).then(function (data) {
      lists.forEach(function (ol) {
        var files = data[ol.getAttribute('data-rolls')] || [];
        ol.innerHTML = '';
        files.forEach(function (e) {
          var notes = unflat(e.n, 1), s = { notes: notes, len: e.len, bpm: e.bpm || 100, rows: rowsOf(notes), kit: e.k || 0 };
          var li = document.createElement('li');
          li.className = 'dkr';
          li.innerHTML = '<div class="dkr-head"><button class="dk-play" type="button" data-state="stopped" aria-label="' + W.play + '">' + PLAY + '</button><div><b></b><span></span></div></div><canvas aria-hidden="true"></canvas>';
          li.querySelector('b').textContent = e.t;
          li.querySelector('span').textContent = (e.v ? e.v + ' · ' : '') + e.f.split('/').pop();
          ol.appendChild(li);
          var c = li.querySelector('canvas'), b = li.querySelector('button'), st = 'stopped';
          function paint(pos) { drawRoll(c, s, pos, MINI); }
          function on(x) { st = x; setBtn(b, x); if (x === 'stopped') paint(-1); }
          paint(-1);
          b.addEventListener('click', function () {
            if (st !== 'stopped') return stopAll();
            // e.a: a recording of the file in its own sound, where the Drum Kit's sounds would be the wrong ones
            if (e.a) playRecording(e.a, s, paint, on); else playSong(s, paint, on);
            clarityEvent('bonus_play');
          });
        });
      });
    }).catch(function () {});
  }
  // whichever list comes near first
  var rollsAsked = false;
  [].forEach.call(document.querySelectorAll('[data-rolls]'), function (ol) { near(ol, function () { if (!rollsAsked) { rollsAsked = true; bonusRolls(); } }); });

  // ---- the bonuses' audio clips (Beat Starters, MYSTERY hooks): one <audio>, nothing loads before a tap ----
  var clipAudio = null, clipOn = null;
  function clipPaint(b, p) {
    var rs = b.querySelectorAll('rect');
    for (var i = 0; i < rs.length; i++) rs[i].setAttribute('class', p > 0 && i / rs.length <= p ? 'on' : '');
  }
  function clipOff() {
    if (!clipOn) return;
    var b = clipOn;
    clipOn = null;
    clipAudio.pause();
    b.setAttribute('aria-pressed', 'false');
    clipPaint(b, 0);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.dkc');
    if (!b) return;
    if (clipOn === b) { stopAll(); return; }
    stopAll();
    if (!clipAudio) {
      clipAudio = new Audio();
      clipAudio.preload = 'none';
      clipAudio.addEventListener('timeupdate', function () { if (clipOn && clipAudio.duration) clipPaint(clipOn, clipAudio.currentTime / clipAudio.duration); });
      clipAudio.addEventListener('ended', function () { stopAll(); });
    }
    playback();
    clipAudio.src = b.getAttribute('data-src');
    clipOn = b;
    b.setAttribute('aria-pressed', 'true');
    now = { stop: clipOff };
    var p = clipAudio.play();
    if (p && p.catch) p.catch(function () { if (clipOn === b) stopAll(); });
    clarityEvent('bonus_play');
  });

  // ---- Hit-Maker Drums: pads. The files come when the pads are near, a tap plays at once ----
  var pads = [].slice.call(document.querySelectorAll('.dkpad')), padRaw = {}, padBuf = {};
  near(pads[0], function () { pads.forEach(function (p) { var s = p.getAttribute('data-src'); padRaw[s] = fetchBuf(s); padRaw[s].catch(function () {}); }); });
  pads.forEach(function (p) {
    p.addEventListener('click', function () {
      if (!audio()) return;
      var s = p.getAttribute('data-src');
      if (!padBuf[s]) padBuf[s] = (padRaw[s] || fetchBuf(s)).then(function (ab) { return decode(ab.slice(0)); });
      padBuf[s].then(function (buf) {
        var src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = buf; g.gain.value = 0.9;
        src.connect(g); g.connect(ctx.destination);
        src.start();
      }, function () { delete padBuf[s]; });
      p.classList.remove('hit');
      void p.offsetWidth;
      p.classList.add('hit');
    });
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) stopAll(); });
})();
`;
