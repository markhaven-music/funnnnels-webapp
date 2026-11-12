"use client";

import { useEffect, useRef, useState } from "react";
import { playClip, stopClip, loadClip, type Playing } from "../webAudioClip";
import s from "./landing.module.css";

// The page's audio. Nothing loads before a tap (docs/page-speed.md). One clip plays at a time across the page.
// Since 2026-11-12 through Web Audio (../webAudioClip.ts), not <audio>: on an iPhone the <audio> clips stayed silent
// (the CDN answered them with a 2-byte partial file).
// v2 (2026-11-08): the snare on 2 and 4 and Neo Soul Pocket for more contrast; a new folder, since
// visitors keep /funnels/* for a week.
const AUDIO = "/funnels/drunk-swing-grooves/audio/v2";

function Disc({ playing }: { playing: boolean }) {
  return (
    <span className={s.disc} aria-hidden>
      {playing ? <span className={s.square} /> : <span className={s.triangle} />}
    </span>
  );
}

/** The same 8 bars, on tempo and drunk (on tempo first: the user, 2026-11-08), on one play button and a switch that swaps them at the same moment. */
export function AbPlayer({ words }: { words: { straight: string; drunk: string; caption: string; play: string } }) {
  const [drunk, setDrunk] = useState(false);
  const [playing, setPlaying] = useState(false);
  // the play in progress (a token: a clip being replaced must not switch the new one off) and its handle
  const turn = useRef<object | null>(null);
  const now = useRef<Playing | null>(null);
  const file = (d: boolean) => `${AUDIO}/${d ? "ab-drunk" : "ab-straight"}.mp3`;
  const start = async (d: boolean, offset = 0) => {
    const mine = {};
    turn.current = mine;
    setPlaying(true);
    const h = await playClip(file(d), { loop: true, offset, onEnd: () => { if (turn.current === mine) setPlaying(false); } });
    if (turn.current !== mine) return;
    now.current = h;
    if (!h) setPlaying(false);
    else void loadClip(file(!d)); // the other version loads now, so the first flip of the switch is instant
  };
  const toggle = () => {
    if (playing) {
      turn.current = null;
      stopClip();
      return setPlaying(false);
    }
    void start(drunk);
  };
  const flip = (toDrunk: boolean) => {
    if (toDrunk === drunk) return;
    setDrunk(toDrunk);
    if (playing && now.current) void start(toDrunk, now.current.position());
  };

  return (
    <div className={s.ab}>
      <div className={s.abRow}>
        <button type="button" className={s.abPlay} onClick={toggle}>
          <Disc playing={playing} />
          <span className={s.srOnly}>{playing ? "Stop" : words.play}</span>
        </button>
        <div className={s.switch} role="radiogroup" aria-label={`${words.straight} or ${words.drunk}`}>
          <button type="button" role="radio" aria-checked={!drunk} className={!drunk ? s.on : ""} onClick={() => flip(false)}>
            {words.straight}
          </button>
          <button type="button" role="radio" aria-checked={drunk} className={drunk ? s.on : ""} onClick={() => flip(true)}>
            {words.drunk}
          </button>
        </div>
      </div>
      <p className={s.abCaption}>{words.caption}</p>
    </div>
  );
}

/** One clip with the round yellow play disc. */
export function Clip({ file, label }: { file: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      className={s.clip}
      onClick={() => {
        if (playing) {
          stopClip();
          return setPlaying(false);
        }
        setPlaying(true);
        void playClip(`${AUDIO}/${file}.mp3`, { onEnd: () => setPlaying(false) });
      }}
    >
      <Disc playing={playing} />
      <span className={s.srOnly}>
        {playing ? "Stop" : "Play"} {label}
      </span>
    </button>
  );
}

// The ten beats of the pack, in its order (2 Drum Grooves, file names: "01 Dusty Boom Bap - … - 88bpm.mid").
const BEATS: [string, number][] = [
  ["Dusty Boom Bap", 88],
  ["Lazy Sunday", 80],
  ["Late Night Lofi", 76],
  ["Neo Soul Pocket", 90],
  ["Sliding Kick", 84],
  ["Slow Soul", 72],
  ["Rimshot Shuffle", 92],
  ["Broken Beat", 86],
  ["Jazzy Hop", 94],
  ["Tape Stop Groove", 78],
];
const SNARE_KEYS = ["24", "ht"];
const FEEL_KEYS = ["light", "medium", "heavy", "quintuplet"];
const ALL = "/funnels/drunk-swing-grooves/audio/all";

/** All 80 grooves: two switches (snare, feel) and the ten beats, each with a play disc. One plays at a time;
 * flipping a switch while a beat plays swaps to the same beat in the new setting, at the same spot. */
export function GrooveBrowser({ words }: { words: { snare: string[]; feels: string[] } }) {
  const [snare, setSnare] = useState(0);
  const [feel, setFeel] = useState(2);
  const [beat, setBeat] = useState<number | null>(null);
  const turn = useRef<object | null>(null);
  const now = useRef<Playing | null>(null);
  const src = (b: number, sn: number, f: number) => `${ALL}/${String(b + 1).padStart(2, "0")}-${SNARE_KEYS[sn]}-${FEEL_KEYS[f]}.mp3`;
  const stop = () => {
    turn.current = null;
    stopClip();
    setBeat(null);
  };
  useEffect(() => () => stopClip(), []);

  const play = async (b: number, sn = snare, f = feel, at = 0) => {
    const mine = {};
    turn.current = mine;
    setBeat(b);
    const h = await playClip(src(b, sn, f), { loop: true, offset: at, onEnd: () => { if (turn.current === mine) setBeat(null); } });
    if (turn.current !== mine) return;
    now.current = h;
    if (!h) setBeat(null);
  };
  const change = (sn: number, f: number) => {
    setSnare(sn);
    setFeel(f);
    if (beat !== null && now.current) void play(beat, sn, f, now.current.position());
  };

  return (
    <div className={s.browser}>
      <div className={s.switch} role="radiogroup" aria-label="Snare">
        {words.snare.map((label, i) => (
          <button key={label} type="button" role="radio" aria-checked={snare === i} className={snare === i ? s.on : ""} onClick={() => change(i, feel)}>
            {label}
          </button>
        ))}
      </div>
      <div className={`${s.switch} ${s.switch4}`} role="radiogroup" aria-label="Feel">
        {words.feels.map((label, i) => (
          <button key={label} type="button" role="radio" aria-checked={feel === i} className={feel === i ? s.on : ""} onClick={() => change(snare, i)}>
            {label}
          </button>
        ))}
      </div>
      <ol className={s.beats}>
        {BEATS.map(([name, bpm], i) => (
          <li key={name}>
            <button type="button" className={s.beatBtn} onClick={() => (beat === i ? stop() : void play(i))}>
              <span className={s.clip}>
                <Disc playing={beat === i} />
              </span>
              <span className={s.beatName}>
                <b>{name}</b>
                <span>{bpm} bpm</span>
              </span>
              <span className={s.srOnly}>{beat === i ? "Stop" : "Play"}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
