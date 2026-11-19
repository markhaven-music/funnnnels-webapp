// The advertorial's script (./stiffDrums.ts puts it at the end of <body>). Plain JS in a string, the
// page being a static document: no backticks or dollar-braces inside.
//   - "No bounce vs bounce" (#bn): the landing's switch (../landingNewClient.ts), cut down to what this
//     figure needs: the kit's own drum sounds (player/*.m4a), bounce01.json, a roll on a canvas, one switch.
//   - "One bar, two ways" (#race): its CSS animation starts when the figure comes on screen.
//   - Read depth: Read25 / Read50 / Read75 / Read100 once per visit to the Meta Pixel (custom events, to
//     build audiences of who read how far), to Clarity, and to neo (neoq 'read', its Read 75% column). Measured on the article, not the footer.
//   - The ad's tags ride along on every button to the order page (the drunk-swing-grooves CARRY list,
//     plus ChatGPT Ads' oppref), so neo credits the sale to the ad, ad set and campaign that sent it.
export const ARTICLE_JS = String.raw`
(function () {
  var W = JSON.parse((document.getElementById('art-cfg') || {}).textContent || '{}');
  // Clarity always; the Meta Pixel only for the read marks (extra given), so plays don't clutter the ad account.
  function ev(name, extra) {
    try { if (window.clarity) clarity('event', name); } catch (e) {}
    try { if (extra && window.fbq && !window.__fvMe) fbq('trackCustom', name, Object.assign({}, window.__artParams || {}, extra)); } catch (e) {}
  }

  // ---- carry the ad's tags to the order page ----
  var CARRY = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'campaign_id', 'adset_id', 'ad_id', 'fbclid', 'gclid', 'oppref'];
  document.addEventListener('click', function (e) {
    try {
      var a = e.target && e.target.closest && e.target.closest('a[data-cta]');
      if (!a) return;
      var u = new URL(a.getAttribute('href'), location.href);
      if (u.origin !== location.origin) return;
      var q = new URLSearchParams(location.search);
      CARRY.forEach(function (k) { var x = q.get(k); if (x && !u.searchParams.has(k)) u.searchParams.set(k, x); });
      var oc = document.cookie.match(/(?:^|; )__oppref=([^;]+)/);
      if (oc && !u.searchParams.has('oppref')) u.searchParams.set('oppref', decodeURIComponent(oc[1]));
      a.setAttribute('href', u.pathname + u.search + u.hash);
    } catch (err) {}
  }, true);

  // ---- read depth ----
  (function () {
    var art = document.getElementById('art'), end = document.getElementById('art-end');
    if (!art || !end) return;
    var marks = [25, 50, 75, 100], sent = {}, ticking = false;
    // neo's "Read 75%" per ad set (neo commit 9b35da0): 0 when the article opens is what the share is measured
    // against; the snippet loads after the page, so the marks wait in neoq until it's there. Not for previews.
    function neo(m) { if (!window.__fvMe) (window.neoq = window.neoq || []).push(['read', m]); }
    neo(0);
    function check() {
      ticking = false;
      var top = art.getBoundingClientRect().top + window.pageYOffset;
      var bottom = end.getBoundingClientRect().top + window.pageYOffset;
      var seen = window.pageYOffset + window.innerHeight - top, total = Math.max(1, bottom - top);
      var pct = Math.min(100, Math.max(0, (seen / total) * 100));
      marks.forEach(function (m) { if (pct >= m && !sent[m]) { sent[m] = 1; ev('Read' + m, { percent: m }); neo(m); } });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    addEventListener('load', check);
  })();

  function near(el, fn, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); } }, { rootMargin: margin || '600px' });
    io.observe(el);
  }

  // ---- "one bar, two ways": by hand, one hit every third of a second; one drag, the file drops and the
  // whole bar is there. A 9-second loop, started when the figure comes on screen. ----
  (function () {
    var race = document.getElementById('race');
    if (!race) return;
    var hand = [].slice.call(race.querySelectorAll('.hand i.on')).sort(function (a, b) { return a.getAttribute('data-k') - b.getAttribute('data-k'); });
    var drag = [].slice.call(race.querySelectorAll('.drag i.on')), lane = race.querySelector('.drag');
    function lit(list, v) { list.forEach(function (c) { c.classList.toggle('lit', v); }); }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { lit(hand, true); lit(drag, true); return; }
    var timers = [];
    function cycle() {
      timers.forEach(clearTimeout); timers = [];
      lit(hand, false); lit(drag, false);
      lane.classList.remove('drop'); void lane.offsetWidth; lane.classList.add('drop');
      timers.push(setTimeout(function () { lit(drag, true); }, 1600));
      hand.forEach(function (c, i) { timers.push(setTimeout(function () { c.classList.add('lit'); }, 400 + i * 330)); });
    }
    near(race, function () { cycle(); setInterval(cycle, 9000); }, '0px');
  })();

  // ---- "no bounce vs bounce" ----
  var el = document.getElementById('bn');
  if (!el) return;
  var BASE = '/funnels/midi-drum-kit/player/', DATA = BASE + 'v6/';
  var SOUND = [null, 'kick', 'snare', 'clap', 'rim', 'hat', 'ohat', 'perc'];
  var LEVEL = [0.9, 1, 0.8, 0.75, 0.7, 0.5, 0.45, 0.6];
  var YELLOW = '#f5b800';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';
  var STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>';
  var ctx = null, bufs = null, loading = null, now = null;

  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function decode(ab) { return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); }); }
  function fetchBuf(url) {
    return fetch(url).then(function (r) {
      if (r.status === 206 || !r.ok) return fetch(url + '?whole=1').then(function (r2) { return r2.arrayBuffer(); });
      return r.arrayBuffer();
    });
  }
  function sounds() {
    if (!loading) {
      loading = Promise.all(SOUND.map(function (f) { return f ? fetchBuf(BASE + f + '.m4a').then(decode) : null; })).then(function (b) { bufs = b; });
      loading.catch(function () { loading = null; });
    }
    return loading;
  }
  function unflat(flat) {
    var out = [];
    for (var i = 0; i < flat.length; i += 5) out.push([flat[i], flat[i + 1], flat[i + 2], flat[i + 3], flat[i + 4]]);
    return out;
  }
  function rowsOf(notes) {
    var used = {};
    notes.forEach(function (n) { used[n[2]] = 1; });
    return [0, 1, 2, 3, 4, 5, 6, 7].filter(function (i) { return used[i]; });
  }

  function startLoop(song, onPos) {
    var s = 60 / song.bpm, t0 = ctx.currentTime + 0.06, cursor = 0, open = null, alive = true;
    var out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(ctx.destination);
    function fire(t, n) {
      var vel = n[4] / 127, ins = n[2];
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
      var buf = bufs[ins];
      if (!buf) return;
      if (ins === 5 && open) { try { open.gain.setTargetAtTime(0, t, 0.01); } catch (e) {} }
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = buf;
      if (n[3]) src.playbackRate.value = Math.pow(2, Math.max(-30, Math.min(24, n[3])) / 12);
      g.gain.value = LEVEL[ins] * (0.35 + 0.65 * vel);
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
  function stopAll() { if (now) { var n = now; now = null; n.stop(); } }
  function playSong(song, onPos, onState) {
    stopAll();
    if (!audio()) return;
    var me = { dead: false, off: null, stop: function () { me.dead = true; if (me.off) me.off(); onState('stopped'); } };
    now = me;
    onState('loading');
    sounds().then(function () {
      if (me.dead) return;
      me.off = startLoop(song, onPos);
      onState('playing');
    }, function () { if (now === me) now = null; me.dead = true; onState('stopped'); });
  }

  function drawRoll(cv, song, pos, opts) {
    var g = cv.getContext('2d'), rs = song.rows, dpr = Math.min(2, window.devicePixelRatio || 1);
    var cssW = cv.clientWidth || cv.parentNode.clientWidth || 320, cssH = rs.length * opts.rh + 8;
    if (cv.width !== Math.round(cssW * dpr) || cv.height !== Math.round(cssH * dpr)) {
      cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr); cv.style.height = cssH + 'px';
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cssW, cssH);
    var x0 = opts.lab, w = cssW - opts.lab - 8, per = w / song.len;
    for (var q = 0; q <= song.len * 4; q++) {
      g.fillStyle = q % 16 === 0 ? 'rgba(255,255,255,.22)' : q % 4 === 0 ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.035)';
      g.fillRect(Math.round(x0 + q * per / 4), 4, 1, cssH - 8);
    }
    g.font = '500 ' + (opts.lab < 60 ? 10 : 11) + 'px ui-monospace,SFMono-Regular,Menlo,monospace';
    g.textBaseline = 'middle';
    rs.forEach(function (r, k) {
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(W.rows[r], 8, 4 + k * opts.rh + opts.rh / 2);
      if (k) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x0, 4 + k * opts.rh, w, 1); }
    });
    var pad = opts.rh > 18 ? 5 : 3;
    song.notes.forEach(function (n) {
      var k = rs.indexOf(n[2]), x = x0 + n[0] * per, nw = Math.max(2.5, (n[2] ? Math.min(n[1], 0.25) : n[1]) * per - 1);
      var live = pos >= 0 && pos >= n[0] && pos < n[0] + Math.max(n[1], 0.12);
      g.globalAlpha = live ? 1 : song.plain ? 0.62 : 0.4 + 0.6 * (n[4] / 127);
      g.fillStyle = live || song.plain ? '#ffffff' : YELLOW;
      g.fillRect(x, 4 + k * opts.rh + pad, nw, opts.rh - pad * 2);
    });
    g.globalAlpha = 1;
    if (pos >= 0) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x0 + pos * per), 2, 2, cssH - 4); }
  }

  var cv = el.querySelector('canvas'), btn = el.querySelector('.play'), sw = [].slice.call(el.querySelectorAll('[data-bounce]'));
  var what = el.querySelector('.what'), sets = null, song = null, on = 0, st = 'stopped', last = 0, loops = 0, wait = null;
  function opts() { var narrow = (cv.clientWidth || 600) < 520; return { lab: narrow ? 50 : 72, rh: narrow ? 16 : 20 }; }
  function paint(pos) {
    if (!song) return;
    if (pos >= 0 && pos < last && !on && ++loops === 1) sw[1].classList.add('nudge');
    last = pos;
    drawRoll(cv, song, pos, opts());
  }
  function setBtn(state) {
    btn.dataset.state = state;
    btn.innerHTML = state === 'playing' ? STOP : PLAY;
    btn.setAttribute('aria-label', state === 'playing' ? 'Stop' : state === 'loading' ? 'Loading the sounds' : 'Play');
  }
  function set(v) {
    on = v;
    sw.forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-bounce') === on); });
    sw[1].classList.remove('nudge');
    what.querySelector('b').textContent = W.bn[on][0];
    what.querySelector('span').textContent = W.bn[on][1];
    what.querySelector('small').textContent = on && sets ? 'MIDI Drum Kit / ' + sets.f.replace('/', ' / ') : '';
    if (song) { song.notes = sets.notes[on]; song.plain = !on; if (st === 'stopped') paint(-1); }
  }
  function load() {
    if (!wait) {
      wait = fetch(DATA + 'bounce01.json').then(function (r) { return r.json(); }).then(function (d) {
        var a = unflat(d.off), b = unflat(d.on);
        sets = { f: d.f, notes: [a, b] };
        song = { notes: a, len: d.len, bpm: d.bpm, rows: rowsOf(a.concat(b)), plain: true };
        set(on);
      });
      wait.catch(function () { wait = null; });
    }
    return wait;
  }
  function state(x) { st = x; setBtn(x); if (x === 'stopped') paint(-1); }
  function start() {
    audio();
    load().then(function () { last = 0; playSong(song, paint, state); ev('bounce_play'); });
  }
  near(el, load);
  btn.addEventListener('click', function () { if (st === 'loading') return; if (st === 'playing') return stopAll(); start(); });
  sw.forEach(function (b) {
    b.addEventListener('click', function () {
      set(+b.getAttribute('data-bounce'));
      if (st === 'stopped') start();
      ev(on ? 'bounce_on' : 'bounce_off');
    });
  });
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (st === 'stopped') paint(-1); }).observe(cv);
})();
`;
