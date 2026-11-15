"use client";

import { useEffect, useState } from "react";
import t from "./th.module.css";

// The launch's clock: the time left to `ends` (funnel.ts `launch.ends`, a real moment: the launch
// price ends then, db/top-hits-launch-close.sql). The page is cached, so the server never
// writes the numbers: they appear in the browser, on dashes of the same width, and tick there.
// At zero it goes away (`big`) or says so (the bar's).

const two = (n: number) => String(n).padStart(2, "0");

function left(ends: number) {
  const s = Math.max(0, Math.floor((ends - Date.now()) / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, over: s <= 0 };
}

function useLeft(ends: number) {
  const [now, setNow] = useState<ReturnType<typeof left> | null>(null);
  useEffect(() => {
    const tick = () => setNow(left(ends));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ends]);
  return now;
}

/** "6d 14h 22m 09s", in a line of text (the red bar, the line over a button). */
export function Clock({ ends }: { ends: number }) {
  const n = useLeft(ends);
  if (n?.over) return <span className={t.clockText}>a moment</span>;
  return (
    <span className={t.clockText} role="timer" aria-live="off">
      {n ? `${n.d}d ${two(n.h)}h ${two(n.m)}m ${two(n.s)}s` : "–d ––h ––m ––s"}
    </span>
  );
}

/** The four big numbers under the headline: days, hours, minutes, seconds. */
export function BigClock({ ends, title, note }: { ends: number; title: string; note: React.ReactNode }) {
  const n = useLeft(ends);
  if (n?.over) return null;
  const cells: [string, string][] = [
    [n ? two(n.d) : "––", "days"],
    [n ? two(n.h) : "––", "hours"],
    [n ? two(n.m) : "––", "min"],
    [n ? two(n.s) : "––", "sec"],
  ];
  return (
    <div className={t.launch}>
      <p className={t.launchTitle}>{title}</p>
      <div className={t.clock} role="timer" aria-live="off">
        {cells.map(([num, unit]) => (
          <span key={unit}>
            <b>{num}</b>
            <i>{unit}</i>
          </span>
        ))}
      </div>
      <p className={t.launchNote}>{note}</p>
    </div>
  );
}
