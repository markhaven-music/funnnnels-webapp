// Plays a real file from the pack on a sine pluck or on a real piano, the
// visitor's pick ("dai possibilità di scegliere tra un pluck di sine o il
// suono di un piano", 2026-11-02): one sine per note that rings out from the
// hit, or Salamander Grand Piano samples (Alexander Holm, CC BY 3.0), one every
// 3 semitones, pitched with playbackRate, fetched only once the piano is
// chosen and only the ones a file needs. One file plays at a time. The scope
// element gets [data-state="loading" | "playing"] and --dur (seconds) so CSS
// can run the playhead.
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

const KEY = "jazz:sound";
const BASE = "/funnels/jazz-midi-pack/piano/";
const NAMES = ["C", "Ds", "Fs", "A"]; // C, D#, F#, A
const LOW = 21; // A0
const HIGH = 93; // A6

let sound: Sound | undefined;
let ctx: AudioContext | undefined;
let out: AudioNode | undefined;
const buffers = new Map<number, Promise<AudioBuffer>>();
let current: { scope: HTMLElement; roll: Roll; nodes: AudioScheduledSourceNode[]; gains: GainNode[]; timer: number } | undefined;
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
  const was = current && { scope: current.scope, roll: current.roll };
  if (was) {
    stop();
    void play(was.roll, was.scope);
  }
  window.dispatchEvent(new Event("jazz:sound"));
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
  scope.querySelectorAll("[aria-pressed]").forEach((el) => el.setAttribute("aria-pressed", "false"));
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

async function play(roll: Roll, scope: HTMLElement) {
  const my = ++token;
  window.dispatchEvent(new Event("jazz:piano")); // a drum loop clip playing (LoopList) stops
  const ac = audio(); // created inside the click: required on iOS
  scope.querySelectorAll("[aria-pressed]").forEach((el) => el.setAttribute("aria-pressed", "true"));
  current = { scope, roll, nodes: [], gains: [], timer: 0 };
  const spb = 60 / roll.bpm;
  const dur = roll.beats * spb;
  try {
    let bufs: Map<number, AudioBuffer> | undefined;
    if (getSound() === "piano") {
      scope.setAttribute("data-state", "loading");
      const needed = [...new Set(roll.notes.map((n) => sampleFor(n[2])))];
      bufs = new Map(await Promise.all(needed.map(async (m) => [m, await buffer(m)] as const)));
      if (my !== token || current?.scope !== scope) return; // another play started meanwhile
    }
    const t0 = ac.currentTime + 0.06;
    for (const [s, l, p] of unisons(roll.notes)) {
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
      current.nodes.push(src);
      current.gains.push(g);
    }
    scope.style.setProperty("--dur", `${dur.toFixed(2)}s`);
    scope.setAttribute("data-state", "playing");
    current.timer = window.setTimeout(() => current?.scope === scope && stop(), (dur + 0.8) * 1000);
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

/** Starts the audio inside a tap, for a play that waits on a fetch (iOS). */
export function unlock() {
  audio();
}

/** Plays a roll in a scope, stopping whatever plays (the pack player). */
export function start(roll: Roll, scope: HTMLElement) {
  stop();
  void play(roll, scope);
}
