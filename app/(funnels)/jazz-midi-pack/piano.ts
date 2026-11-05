// Plays a real file from the pack on a sine pluck or on a real piano, the
// visitor's pick ("dai possibilità di scegliere tra un pluck di sine o il
// suono di un piano", 2026-11-02): one sine per note that rings out from the
// hit, or Salamander Grand Piano samples (Alexander Holm, CC BY 3.0), one every
// 3 semitones, pitched with playbackRate, fetched only once the piano is
// chosen and only the ones a file needs. One file plays at a time. The scope
// element gets [data-state="loading" | "playing"] and --dur (seconds) so CSS
// can run the playhead; only its [data-play] button shows the playing state.
//
// The pack player (PackBrowser) plays with { loop, beat } (2026-11-05: "fai loopare di default";
// "swing comping / anticipations / reverse charleston senza battito non si capisce"): the file loops
// until stopped, and a soft drum kit plays under it, synthesised here: the file's own drums when it
// has them (genre loops), else kick on 1 and 3, rim on 2 and 4, hats on the 8ths, swung when the
// rhythm swings. The beat is a per-browser choice like the sound.
import rolls from "./rolls.json";

export type RollId = keyof typeof rolls;
export type Roll = {
  file: string;
  bpm: number;
  beats: number;
  notes: number[][];
  chords: (number | string)[][];
  drums?: number[][]; // [beat, pitch]: drawn, not played
};
export type Sound = "sine" | "piano";
export type PlayOpts = { loop?: boolean; beat?: boolean };

const KEY = "jazz:sound";
const BEAT_KEY = "jazz:beat";
const BASE = "/funnels/jazz-midi-pack/piano/";
const NAMES = ["C", "Ds", "Fs", "A"]; // C, D#, F#, A
const LOW = 21; // A0
const HIGH = 93; // A6

let sound: Sound | undefined;
let beatOn: boolean | undefined;
let noise: AudioBuffer | undefined;
let ctx: AudioContext | undefined;
let out: AudioNode | undefined;
const buffers = new Map<number, Promise<AudioBuffer>>();
let current:
  | { scope: HTMLElement; roll: Roll; opts: PlayOpts; nodes: AudioScheduledSourceNode[]; gains: GainNode[]; timer: number }
  | undefined;
let token = 0;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const sampleFor = (midi: number) => LOW + Math.round((Math.min(HIGH, Math.max(LOW, midi)) - LOW) / 3) * 3;
const nameOf = (midi: number) => `${NAMES[[0, 3, 6, 9].indexOf(midi % 12)]}${Math.floor(midi / 12) - 1}`;

/** The visitor's pick: the sine until they choose, then what they chose, remembered per browser. */
export function getSound(): Sound {
  if (!sound) {
    try {
      sound = localStorage.getItem(KEY) === "piano" ? "piano" : "sine";
    } catch {
      sound = "sine";
    }
  }
  return sound;
}

/** Sets the pick, tells every picker (SoundPicker.tsx) and restarts the file playing, so the change is heard at once. */
export function setSound(s: Sound) {
  if (s === getSound()) return;
  sound = s;
  try {
    localStorage.setItem(KEY, s);
  } catch {
    /* private mode */
  }
  restart();
  window.dispatchEvent(new Event("jazz:sound"));
}

/** The soft beat under the pack player: on until the visitor turns it off, remembered per browser. */
export function getBeat(): boolean {
  if (beatOn === undefined) {
    try {
      beatOn = localStorage.getItem(BEAT_KEY) !== "off";
    } catch {
      beatOn = true;
    }
  }
  return beatOn;
}

export function setBeat(on: boolean) {
  if (on === getBeat()) return;
  beatOn = on;
  try {
    localStorage.setItem(BEAT_KEY, on ? "on" : "off");
  } catch {
    /* private mode */
  }
  restart();
  window.dispatchEvent(new Event("jazz:beat"));
}

/** Plays what is playing again, so a changed setting is heard at once. */
function restart() {
  const was = current && { scope: current.scope, roll: current.roll, opts: current.opts };
  if (was) {
    stop();
    void play(was.roll, was.scope, was.opts);
  }
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    comp.connect(gain).connect(ctx.destination);
    out = comp;
  }
  if (ctx.state === "suspended") void ctx.resume();
  // iOS: play through the ringer switch (Safari 16.4+), otherwise silent mode mutes Web Audio
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = "playback";
  return ctx;
}

function buffer(midi: number) {
  let p = buffers.get(midi);
  if (!p) {
    p = fetch(`${BASE}${nameOf(midi)}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((b) => audio().decodeAudioData(b));
    buffers.set(midi, p);
    p.catch(() => buffers.delete(midi));
  }
  return p;
}

export function stop() {
  if (!current) return;
  const { scope, nodes, gains, timer } = current;
  const t = ctx!.currentTime;
  gains.forEach((g) => {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.setTargetAtTime(0, t, 0.05);
  });
  nodes.forEach((n) => {
    try {
      n.stop(t + 0.3);
    } catch {
      /* already stopped */
    }
  });
  clearTimeout(timer);
  scope.removeAttribute("data-state");
  scope.querySelectorAll("[data-play]").forEach((el) => el.setAttribute("aria-pressed", "false"));
  current = undefined;
}

// Genre loops are Full files: the bass track doubles the chord's root. Two
// strikes on the same pitch a few ms apart flam or cancel; play them as one
// (the longer).
function unisons(notes: number[][]) {
  const out: number[][] = [];
  for (const n of notes) {
    const twin = out.find((m) => m[2] === n[2] && Math.abs(m[0] - n[0]) < 0.06);
    if (twin) twin[1] = Math.max(twin[1], n[1]);
    else out.push([...n]);
  }
  return out;
}

// The beat's drums, synthesised: a short pitch-dropping sine for the kick, filtered noise for the rest.
function drum(ac: AudioContext, kind: "kick" | "rim" | "hat" | "open", t: number, level: number, keep: (n: AudioScheduledSourceNode, g: GainNode) => void) {
  const g = ac.createGain();
  if (kind === "kick") {
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * level, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g).connect(out!);
    o.start(t);
    o.stop(t + 0.3);
    keep(o, g);
    return;
  }
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noise;
  const f = ac.createBiquadFilter();
  f.type = kind === "rim" ? "bandpass" : "highpass";
  f.frequency.value = kind === "rim" ? 1900 : 7500;
  const len = kind === "rim" ? 0.07 : kind === "open" ? 0.22 : 0.035;
  const vol = (kind === "rim" ? 0.32 : kind === "open" ? 0.1 : 0.09) * level;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f).connect(g).connect(out!);
  src.start(t);
  src.stop(t + len + 0.02);
  keep(src, g);
}

// The rhythms that swing their 8ths (make_pack.py RHYTHMS; the combo loops swing too).
const SWUNG = /Charleston|Anticipations|Freddie Green|Swing Comping|Combo|Walking|Two-Feel/;
const GM: Record<number, "kick" | "rim" | "hat" | "open"> = { 35: "kick", 36: "kick", 37: "rim", 38: "rim", 39: "rim", 40: "rim", 42: "hat", 44: "hat", 46: "open" };

/** The beat for one pass of a roll: the file's drums, or kick / rim / 8th hats. [beat, kind, level]. */
function beatHits(roll: Roll): [number, "kick" | "rim" | "hat" | "open", number][] {
  if (roll.drums?.length) return roll.drums.filter(([, p]) => GM[p]).map(([b, p]) => [b, GM[p], 1]);
  const swing = SWUNG.test(roll.file);
  const out: [number, "kick" | "rim" | "hat" | "open", number][] = [];
  for (let b = 0; b < roll.beats; b++) {
    const inBar = b % 4;
    if (inBar === 0 || inBar === 2) out.push([b, "kick", inBar === 0 ? 1 : 0.8]);
    else out.push([b, "rim", 0.8]);
    out.push([b, "hat", 1]);
    out.push([b + (swing ? 2 / 3 : 0.5), "hat", 0.6]);
  }
  return out;
}

async function play(roll: Roll, scope: HTMLElement, opts: PlayOpts = {}) {
  const my = ++token;
  window.dispatchEvent(new Event("jazz:piano")); // a drum loop clip playing (LoopList) stops
  const ac = audio(); // created inside the click: required on iOS
  scope.querySelectorAll("[data-play]").forEach((el) => el.setAttribute("aria-pressed", "true"));
  const me = { scope, roll, opts, nodes: [] as AudioScheduledSourceNode[], gains: [] as GainNode[], timer: 0 };
  current = me;
  const spb = 60 / roll.bpm;
  const dur = roll.beats * spb;
  try {
    let bufs: Map<number, AudioBuffer> | undefined;
    if (getSound() === "piano") {
      scope.setAttribute("data-state", "loading");
      const needed = [...new Set(roll.notes.map((n) => sampleFor(n[2])))];
      bufs = new Map(await Promise.all(needed.map(async (m) => [m, await buffer(m)] as const)));
      if (my !== token || current !== me) return; // another play started meanwhile
    }
    const notes = unisons(roll.notes);
    const hits = opts.beat && getBeat() ? beatHits(roll) : [];
    const keep = (n: AudioScheduledSourceNode, g: GainNode) => {
      me.nodes.push(n);
      me.gains.push(g);
    };
    // One pass of the file from t0; a loop schedules the next pass just before this one ends.
    const pass = (t0: number) => {
      const mark = me.nodes.length; // where this pass's nodes start
      for (const [s, l, p] of notes) {
        const bass = p < 48;
        const start = t0 + s * spb;
        const end = start + Math.max(l * spb, 0.12);
        const g = ac.createGain();
        let src: AudioScheduledSourceNode;
        if (bufs) {
          const base = sampleFor(p);
          const node = ac.createBufferSource();
          node.buffer = bufs.get(base)!;
          node.playbackRate.value = 2 ** ((p - base) / 12);
          const vel = bass ? 0.4 : 0.28;
          g.gain.setValueAtTime(vel, start);
          g.gain.setValueAtTime(vel, end);
          g.gain.setTargetAtTime(0, end, 0.09);
          src = node;
        } else {
          // the pluck: hit, then a ring-out that the note's end cuts short
          const node = ac.createOscillator(); // a sine, the default wave
          node.frequency.value = hz(p);
          const vel = bass ? 0.34 : 0.24;
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(vel, start + 0.006);
          g.gain.setTargetAtTime(0, start + 0.006, bass ? 0.5 : 0.32);
          g.gain.setTargetAtTime(0, end, 0.06);
          src = node;
        }
        src.connect(g).connect(out!);
        src.start(start);
        src.stop(end + 0.8);
        keep(src, g);
      }
      for (const [b, kind, level] of hits) if (b < roll.beats) drum(ac, kind, t0 + b * spb, level, keep);
      // the playhead starts over with each pass
      window.setTimeout(() => {
        if (current !== me) return;
        scope.removeAttribute("data-state");
        void scope.offsetWidth;
        scope.setAttribute("data-state", "playing");
      }, Math.max(0, (t0 - ac.currentTime) * 1000));
      const next = t0 + dur;
      me.timer = window.setTimeout(
        () => {
          if (current !== me) return;
          if (!opts.loop) return stop();
          // forget the passes before this one (long finished), then the next pass, seamless
          me.nodes.splice(0, mark);
          me.gains.splice(0, mark);
          pass(next);
        },
        Math.max(0, (next - ac.currentTime - (opts.loop ? 0.25 : -0.8)) * 1000),
      );
    };
    scope.style.setProperty("--dur", `${dur.toFixed(2)}s`);
    pass(ac.currentTime + 0.06);
  } catch {
    if (current === me) stop();
  }
}

/** Play/stop toggle for the scope element that holds a roll. */
export function toggle(id: RollId | Roll, scope: HTMLElement, opts?: PlayOpts) {
  const same = current?.scope === scope;
  stop();
  if (!same) void play(typeof id === "string" ? (rolls[id] as Roll) : id, scope, opts);
}

/** Starts the audio inside a tap, for a play that waits on a fetch (iOS). */
export function unlock() {
  audio();
}

/** Plays a roll in a scope, stopping whatever plays (the pack player). */
export function start(roll: Roll, scope: HTMLElement, opts?: PlayOpts) {
  stop();
  void play(roll, scope, opts);
}

/** Whether a scope is the one playing (or loading) now. */
export function playingIn(scope: HTMLElement | null) {
  return !!scope && current?.scope === scope;
}
