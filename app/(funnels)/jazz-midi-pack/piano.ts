// Plays a real file from the pack on a warm sine synth ("usa un sine synth
// invece del piano, è più warm"): two sines a few cents apart per note, soft
// attack, a slow fall to the sustain and a short release. Nothing to fetch, so
// a file plays the moment it's tapped; one file plays at a time. The scope
// element gets [data-state="playing"] and --dur (seconds) so CSS can run the
// playhead.
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

let ctx: AudioContext | undefined;
let out: AudioNode | undefined;
let current: { scope: HTMLElement; oscs: OscillatorNode[]; gains: GainNode[]; timer: number } | undefined;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

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

export function stop() {
  if (!current) return;
  const { scope, oscs, gains, timer } = current;
  const t = ctx!.currentTime;
  gains.forEach((g) => {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.setTargetAtTime(0, t, 0.05);
  });
  oscs.forEach((o) => {
    try {
      o.stop(t + 0.3);
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
// sines on the same pitch a few ms apart cancel and swell; play them as one
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

// Partials per note, [frequency ratio, level]: two sines 5 cents apart for the
// warmth, and under C3 a quiet 2nd and 3rd so a bass line still sounds on a
// phone speaker, which can't play a pure sine that low.
const UPPER = [[1, 0.5], [2 ** (5 / 1200), 0.5]];
const BASS = [[1, 0.42], [2 ** (5 / 1200), 0.42], [2, 0.12], [3, 0.04]];

function play(roll: Roll, scope: HTMLElement) {
  window.dispatchEvent(new Event("jazz:piano")); // a drum loop clip playing (LoopList) stops
  const ac = audio(); // created inside the click: required on iOS
  scope.querySelectorAll("[aria-pressed]").forEach((el) => el.setAttribute("aria-pressed", "true"));
  current = { scope, oscs: [], gains: [], timer: 0 };
  const spb = 60 / roll.bpm;
  const t0 = ac.currentTime + 0.06;
  const dur = roll.beats * spb;
  for (const [s, l, p] of unisons(roll.notes)) {
    const bass = p < 48;
    const g = ac.createGain();
    const start = t0 + s * spb;
    const end = start + Math.max(l * spb, 0.12);
    const vel = bass ? 0.3 : 0.2;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vel, start + 0.018);
    g.gain.setTargetAtTime(vel * 0.62, start + 0.018, 0.4);
    g.gain.setTargetAtTime(0, end, 0.11);
    g.connect(out!);
    for (const [ratio, level] of bass ? BASS : UPPER) {
      const o = ac.createOscillator();
      o.frequency.value = hz(p) * ratio;
      const lv = ac.createGain();
      lv.gain.value = level;
      o.connect(lv).connect(g);
      o.start(start);
      o.stop(end + 0.8);
      current.oscs.push(o);
    }
    current.gains.push(g);
  }
  scope.style.setProperty("--dur", `${dur.toFixed(2)}s`);
  scope.setAttribute("data-state", "playing");
  current.timer = window.setTimeout(() => current?.scope === scope && stop(), (dur + 0.9) * 1000);
}

/** Play/stop toggle for the scope element that holds a roll. */
export function toggle(id: RollId | Roll, scope: HTMLElement) {
  const same = current?.scope === scope;
  stop();
  if (!same) play(typeof id === "string" ? (rolls[id] as Roll) : id, scope);
}

/** Starts the audio inside a tap, for a play that waits on a fetch (iOS). */
export function unlock() {
  audio();
}

/** Plays a roll in a scope, stopping whatever plays (the pack player). */
export function start(roll: Roll, scope: HTMLElement) {
  stop();
  play(roll, scope);
}
