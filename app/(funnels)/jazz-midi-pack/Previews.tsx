"use client";

import { useEffect, useRef, useState } from "react";
import s from "./jazz.module.css";

type Item = { slug: string; title: string; meta: string; file: string };
type Roll = {
  beats: number;
  seconds_per_loop: number;
  notes: [number, number, number, "b" | "c"][];
};

const BASE = "/funnels/jazz-midi-pack/audio/";

// One audio element for the whole list; the piano roll above it draws the
// notes of whichever loop is selected and sweeps a playhead across them.
export function Previews({ items }: { items: Item[] }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [active, setActive] = useState(items[0]?.slug);
  const [playing, setPlaying] = useState(false);
  const [rolls, setRolls] = useState<Record<string, Roll>>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active || rolls[active]) return;
    fetch(`${BASE}${active}.json`)
      .then((r) => r.json())
      .then((roll: Roll) => setRolls((m) => ({ ...m, [active]: roll })))
      .catch(() => {});
  }, [active, rolls]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = audio.current;
      const roll = active ? rolls[active] : undefined;
      if (el && roll) setProgress((el.currentTime / roll.seconds_per_loop) % 1);
      raf = requestAnimationFrame(tick);
    };
    if (playing) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, active, rolls]);

  function toggle(slug: string) {
    const el = audio.current;
    if (!el) return;
    if (slug === active && playing) {
      el.pause();
      return;
    }
    if (slug !== active) {
      setActive(slug);
      setProgress(0);
      el.src = `${BASE}${slug}.mp3`;
    }
    el.play().catch(() => setPlaying(false));
  }

  const roll = active ? rolls[active] : undefined;

  return (
    <div className={s.previews}>
      <PianoRoll roll={roll} progress={progress} playing={playing} />
      <ul className={s.tracks}>
        {items.map((it) => {
          const on = it.slug === active;
          return (
            <li key={it.slug}>
              <button
                className={`${s.track} ${on ? s.trackOn : ""}`}
                onClick={() => toggle(it.slug)}
                aria-pressed={on && playing}
              >
                <span className={s.playIcon} aria-hidden>
                  {on && playing ? <PauseGlyph /> : <PlayGlyph />}
                </span>
                <span className={s.trackText}>
                  <span className={s.trackTitle}>{it.title}</span>
                  <span className={s.trackFile}>{it.file}</span>
                </span>
                <span className={s.trackMeta}>{it.meta}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <audio
        ref={audio}
        src={items[0] ? `${BASE}${items[0].slug}.mp3` : undefined}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
    </div>
  );
}

function PianoRoll({ roll, progress, playing }: { roll?: Roll; progress: number; playing: boolean }) {
  const W = 1000;
  const H = 260;
  if (!roll) return <div className={s.roll} aria-hidden />;
  const pitches = roll.notes.map((n) => n[2]);
  const lo = Math.min(...pitches) - 2;
  const hi = Math.max(...pitches) + 2;
  const row = H / (hi - lo + 1);
  const x = (beat: number) => (beat / roll.beats) * W;
  const head = progress * roll.beats;
  return (
    <div className={s.roll} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {Array.from({ length: Math.ceil(roll.beats / 4) + 1 }, (_, i) => (
          <line key={i} x1={x(i * 4)} x2={x(i * 4)} y1={0} y2={H} className={s.barLine} />
        ))}
        {roll.notes.map(([start, dur, pitch, kind], i) => {
          const lit = playing && head >= start && head < start + dur;
          return (
            <rect
              key={i}
              x={x(start) + 1}
              y={(hi - pitch) * row + 1}
              width={Math.max(2, x(dur) - 2)}
              height={Math.max(2, row - 2)}
              rx={Math.min(3, row / 3)}
              className={`${kind === "b" ? s.noteBass : s.noteChord} ${lit ? s.noteLit : ""}`}
            />
          );
        })}
        {playing && <line x1={x(head)} x2={x(head)} y1={0} y2={H} className={s.playhead} />}
      </svg>
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />
    </svg>
  );
}
