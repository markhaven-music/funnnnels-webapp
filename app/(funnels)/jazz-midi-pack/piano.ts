// Plays a real file from the pack on a real piano: Salamander Grand Piano
// samples (Alexander Holm, CC BY 3.0), one every 3 semitones, pitched with
// playbackRate. Ported from grind-studio-landing-pages/src/scripts/th-player.ts.
// Only the samples a file needs are fetched; one file plays at a time. The
// scope element gets [data-state="loading" | "playing"] and --dur (seconds) so
// CSS can run the playhead.
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

const BASE = "/funnels/jazz-midi-pack/piano/";
const NAMES = ["C", "Ds", "Fs", "A"]; // C, D#, F#, A
const LOW = 21; // A0
const HIGH = 93; // A6

let ctx: AudioContext | undefined;
let out: AudioNode | undefined;
const buffers = new Map<number, Promise<AudioBuffer>>();
let current: { scope: HTMLElement; sources: AudioBufferSourceNode[]; gains: GainNode[]; timer: number } | undefined;
let token = 0;

const sampleFor = (midi: number) => LOW + Math.round((Math.min(HIGH, Math.max(LOW, midi)) - LOW) / 3) * 3;
const nameOf = (midi: number) => `${NAMES[[0, 3, 6, 9].indexOf(midi % 12)]}${Math.floor(midi / 12) - 1}`;

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
  const { scope, sources, gains, timer } = current;
  const t = ctx!.currentTime;
  gains.forEach((g) => {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.setTargetAtTime(0, t, 0.05);
  });
  sources.forEach((s) => {
    try {
      s.stop(t + 0.3);
    } catch {
      /* already stopped */
    }
  });
  clearTimeout(timer);
  scope.removeAttribute("data-state");
  scope.querySelectorAll("[aria-pressed]").forEach((el) => el.setAttribute("aria-pressed", "false"));
  current = undefined;
}

// Genre loops are Full files: the bass track doubles the chord's root. On one
// piano the two strikes, a few ms apart, flam; play them as one (the longer).
function unisons(notes: number[][]) {
  const out: number[][] = [];
  for (const n of notes) {
    const twin = out.find((m) => m[2] === n[2] && Math.abs(m[0] - n[0]) < 0.06);
    if (twin) twin[1] = Math.max(twin[1], n[1]);
    else out.push([...n]);
  }
  return out;
}

async function play(roll: Roll, scope: HTMLElement) {
  const my = ++token;
  const ac = audio(); // created inside the click: required on iOS
  scope.setAttribute("data-state", "loading");
  scope.querySelectorAll("[aria-pressed]").forEach((el) => el.setAttribute("aria-pressed", "true"));
  current = { scope, sources: [], gains: [], timer: 0 };
  try {
    const needed = [...new Set(roll.notes.map((n) => sampleFor(n[2])))];
    const bufs = new Map(await Promise.all(needed.map(async (m) => [m, await buffer(m)] as const)));
    if (my !== token || current?.scope !== scope) return; // another play started meanwhile
    const spb = 60 / roll.bpm;
    const t0 = ac.currentTime + 0.06;
    const dur = roll.beats * spb;
    for (const [s, l, p] of unisons(roll.notes)) {
      const base = sampleFor(p);
      const src = ac.createBufferSource();
      src.buffer = bufs.get(base)!;
      src.playbackRate.value = 2 ** ((p - base) / 12);
      const g = ac.createGain();
      const start = t0 + s * spb;
      const end = start + Math.max(l * spb, 0.12);
      const vel = p < 48 ? 0.4 : 0.28;
      g.gain.setValueAtTime(vel, start);
      g.gain.setValueAtTime(vel, end);
      g.gain.setTargetAtTime(0, end, 0.09);
      src.connect(g).connect(out!);
      src.start(start);
      src.stop(end + 0.6);
      current.sources.push(src);
      current.gains.push(g);
    }
    scope.style.setProperty("--dur", `${dur.toFixed(2)}s`);
    scope.setAttribute("data-state", "playing");
    current.timer = window.setTimeout(() => current?.scope === scope && stop(), (dur + 0.7) * 1000);
  } catch {
    if (current?.scope === scope) stop();
  }
}

/** Play/stop toggle for the scope element that holds a roll. */
export function toggle(id: RollId | Roll, scope: HTMLElement) {
  const same = current?.scope === scope;
  stop();
  if (!same) void play(typeof id === "string" ? (rolls[id] as Roll) : id, scope);
}

/** Plays a roll in a scope, stopping whatever plays (the pack browser's rows). */
export function start(roll: Roll, scope: HTMLElement) {
  stop();
  void play(roll, scope);
}
