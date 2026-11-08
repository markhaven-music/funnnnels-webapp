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
