"use client";

import { useEffect, useRef, useState } from "react";
import s from "./landing.module.css";

// The page's audio. Nothing loads before a tap (docs/page-speed.md): each
// <audio> has preload="none". One clip plays at a time across the page.
// v2 (2026-11-08): the snare on 2 and 4 and Neo Soul Pocket for more contrast; a new folder, since
// visitors keep /funnels/* for a week.
const AUDIO = "/funnels/drunk-swing-grooves/audio/v2";
const STOP_OTHERS = "dsg-play";

function useOnlyOne(id: string, stop: () => void) {
  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) stop();
    };
    window.addEventListener(STOP_OTHERS, on);
    return () => window.removeEventListener(STOP_OTHERS, on);
  }, [id, stop]);
}
const claim = (id: string) => window.dispatchEvent(new CustomEvent(STOP_OTHERS, { detail: id }));

function Disc({ playing }: { playing: boolean }) {
  return (
    <span className={s.disc} aria-hidden>
      {playing ? <span className={s.square} /> : <span className={s.triangle} />}
    </span>
  );
}

/** The same 8 bars, quantized and drunk, on one play button and a switch that swaps them at the same moment. */
export function AbPlayer({ words }: { words: { straight: string; drunk: string; caption: string; play: string } }) {
  const a = useRef<HTMLAudioElement>(null);
  const b = useRef<HTMLAudioElement>(null);
  const [drunk, setDrunk] = useState(true);
  const [playing, setPlaying] = useState(false);
  const current = () => (drunk ? b.current : a.current);
  const other = () => (drunk ? a.current : b.current);
  const stop = () => {
    a.current?.pause();
    b.current?.pause();
    setPlaying(false);
  };
  useOnlyOne("ab", stop);

  const toggle = () => {
    if (playing) return stop();
    claim("ab");
    const el = current();
    if (!el) return;
    el.loop = true;
    void el.play();
    setPlaying(true);
    // The other version loads now, so the first flip of the switch is instant.
    const o = other();
    if (o && o.preload !== "auto") {
      o.preload = "auto";
      o.load();
    }
  };
  const flip = (toDrunk: boolean) => {
    if (toDrunk === drunk) return;
    const from = current();
    const to = other();
    setDrunk(toDrunk);
    if (!playing || !from || !to) return;
    to.loop = true;
    to.currentTime = from.currentTime % (to.duration || from.duration || 1);
    void to.play();
    from.pause();
  };

  return (
    <div className={s.ab}>
      <audio ref={a} src={`${AUDIO}/ab-straight.mp3`} preload="none" />
      <audio ref={b} src={`${AUDIO}/ab-drunk.mp3`} preload="none" />
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
  const el = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const stop = () => {
    el.current?.pause();
    if (el.current) el.current.currentTime = 0;
    setPlaying(false);
  };
  useOnlyOne(file, stop);
  return (
    <button
      type="button"
      className={s.clip}
      onClick={() => {
        if (playing) return stop();
        claim(file);
        void el.current?.play();
        setPlaying(true);
      }}
    >
      <audio ref={el} src={`${AUDIO}/${file}.mp3`} preload="none" onEnded={() => setPlaying(false)} />
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

/** All 80 grooves: two switches (snare, feel) and the ten beats, each with a play disc. One <audio>;
 * flipping a switch while a beat plays swaps to the same beat in the new setting, at the same spot. */
export function GrooveBrowser({ words }: { words: { snare: string[]; feels: string[] } }) {
  const el = useRef<HTMLAudioElement>(null);
  const [snare, setSnare] = useState(0);
  const [feel, setFeel] = useState(2);
  const [beat, setBeat] = useState<number | null>(null);
  const src = (b: number, sn: number, f: number) => `${ALL}/${String(b + 1).padStart(2, "0")}-${SNARE_KEYS[sn]}-${FEEL_KEYS[f]}.mp3`;
  const stop = () => {
    el.current?.pause();
    setBeat(null);
  };
  useOnlyOne("browse", stop);

  const play = (b: number, sn = snare, f = feel, at = 0) => {
    const a = el.current;
    if (!a) return;
    claim("browse");
    a.src = src(b, sn, f);
    a.loop = true;
    if (at) a.addEventListener("loadedmetadata", () => (a.currentTime = at % (a.duration || 1)), { once: true });
    void a.play();
    setBeat(b);
  };
  const change = (sn: number, f: number) => {
    setSnare(sn);
    setFeel(f);
    if (beat !== null && el.current) play(beat, sn, f, el.current.currentTime);
  };

  return (
    <div className={s.browser}>
      <audio ref={el} preload="none" />
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
            <button type="button" className={s.beatBtn} onClick={() => (beat === i ? stop() : play(i))}>
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
