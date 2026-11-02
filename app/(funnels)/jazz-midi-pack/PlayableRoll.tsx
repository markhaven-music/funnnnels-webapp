"use client";

import { useRef } from "react";
import rolls from "./rolls.json";
import { toggle, type Roll, type RollId } from "./piano";
import s from "./roll.module.css";

// A real file from the pack, drawn as a piano roll (chord names on top) with
// a play button that plays its notes on the sine pluck or the piano (piano.ts). `roll` instead
// of `id`: a file from elsewhere (the bonuses, BonusPlayer.tsx).
export function PlayableRoll({
  id,
  roll: given,
  title,
  meta,
  variant = "full",
  tone = "brass",
  playLabel = "Play it",
}: {
  id?: RollId;
  roll?: Roll;
  title?: string;
  meta?: string;
  variant?: "full" | "mini" | "short";
  tone?: "brass" | "muted";
  playLabel?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const roll = given ?? (rolls[id!] as Roll);

  return (
    <div ref={scope} className={`${s.scope} ${s[variant]} ${s[tone]}`}>
      <div className={s.head}>
        <button
          type="button"
          className={s.play}
          aria-pressed="false"
          onClick={() => scope.current && toggle(given ?? id!, scope.current)}
        >
          <span className={s.ico} aria-hidden />
          <span className={s.lPlay}>{playLabel}</span>
          <span className={s.lStop}>Stop</span>
          <span className={s.lLoad}>Loading</span>
        </button>
        <span className={s.text}>
          {title && <span className={s.title}>{title}</span>}
          <span className={s.file}>{roll.file}</span>
        </span>
        {meta && <span className={s.meta}>{meta}</span>}
      </div>
      <Svg roll={roll} chordsRow={variant === "full" || (variant === "short" && roll.chords.length > 1)} />
    </div>
  );
}

// Drum-only files (the genre loops' Drums.mid) draw their hits, one row per drum.
export function Svg({ roll, chordsRow }: { roll: Roll; chordsRow: boolean }) {
  const W = 1000;
  const top = chordsRow ? 26 : 0;
  const H = (chordsRow ? 230 : 120) + top;
  const drumsOnly = roll.notes.length === 0;
  const hits = drumsOnly ? (roll.drums ?? []).map(([b, p]) => [b, 0.25, p]) : [];
  const pitches = (drumsOnly ? hits : roll.notes).map((n) => n[2]);
  const lo = Math.min(...pitches) - 1;
  const hi = Math.max(...pitches) + 1;
  const row = (H - top) / (hi - lo + 1);
  const x = (beat: number) => (beat / roll.beats) * W;
  const bassMax = Math.min(...pitches) + 11;
  return (
    <div className={s.svgWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={roll.file}>
        {Array.from({ length: roll.beats / 4 + 1 }, (_, i) => (
          <line key={i} x1={x(i * 4)} x2={x(i * 4)} y1={0} y2={H} className={s.bar} />
        ))}
        {(drumsOnly ? hits : roll.notes).map(([start, len, p], i) => (
          <rect
            key={i}
            x={x(start) + 1.5}
            y={top + (hi - p) * row + 1}
            width={Math.max(3, x(len) - 3)}
            height={Math.max(2.5, row - 2)}
            rx={Math.min(3, row / 3)}
            className={drumsOnly ? s.drum : p <= bassMax && p < 52 ? s.bass : s.note}
          />
        ))}
      </svg>
      {chordsRow && (
        <div className={s.chords} aria-hidden>
          {roll.chords.map(([beat, name]) => (
            <span key={`${beat}${name}`} style={{ left: `${((beat as number) / roll.beats) * 100}%` }}>
              {name}
            </span>
          ))}
        </div>
      )}
      <span className={s.playhead} aria-hidden />
    </div>
  );
}
