"use client";

import { useEffect, useRef, useState } from "react";
import { stop as stopPiano } from "./piano";
import s from "./bonus.module.css";

// Bonus 5's preview: four of its 47 WAV loops, one per style, as 8-second MP3
// clips (public/funnels/jazz-midi-pack/loops, cut with ffmpeg from the bonus
// folder). Nothing loads until a tap. `peaks` draw each clip's waveform.
const LOOPS = [
  { name: "Modern Pop", bpm: 90, peaks: [100,38,18,99,93,63,20,99,29,12,7,95,95,40,94,18,8,63,96,95,21,8,98,90,27,95,97,19,8,3,95,54,95,51,14,18,53,95,56,8,75,100,74,23,98,59,13,22,15,99,28,100,39,9,27,11] },
  { name: "Hip Hop", bpm: 91, peaks: [97,13,16,2,100,55,2,25,81,78,14,66,53,91,64,3,30,78,89,55,22,8,0,92,12,32,82,89,79,7,88,6,78,18,30,5,83,85,3,25,1,80,66,21,20,82,82,15,80,55,85,65,3,18,26,17] },
  { name: "UK Garage", bpm: 134, peaks: [100,5,3,73,5,7,52,1,70,11,68,3,8,0,66,6,2,55,3,8,53,1,69,7,54,2,59,19,98,5,4,71,4,7,52,1,70,14,65,3,8,0,67,4,3,60,4,7,56,1,70,10,53,3,59,19] },
  { name: "70s Acoustic", bpm: 104, peaks: [99,5,89,5,80,84,10,23,90,21,10,84,84,19,9,24,94,10,88,5,81,84,9,29,93,16,11,91,91,22,25,32,100,11,92,9,78,81,13,15,87,19,7,89,85,24,14,38,86,25,89,17,71,65,12,4] },
];

export function LoopList() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // a piano preview starting (piano.ts) stops the clip
  useEffect(() => {
    const quiet = () => {
      audio.current?.pause();
      setOn(null);
    };
    window.addEventListener("jazz:piano", quiet);
    return () => {
      window.removeEventListener("jazz:piano", quiet);
      audio.current?.pause();
    };
  }, []);

  function toggle(i: number) {
    if (!audio.current) {
      const a = new Audio();
      a.preload = "none";
      a.addEventListener("timeupdate", () => setProgress(a.duration ? a.currentTime / a.duration : 0));
      a.addEventListener("ended", () => setOn(null));
      audio.current = a;
    }
    const a = audio.current;
    if (on === i) {
      a.pause();
      setOn(null);
      return;
    }
    stopPiano();
    a.src = `/funnels/jazz-midi-pack/loops/loop-${i + 1}.mp3`;
    setProgress(0);
    setOn(i);
    void a.play().catch(() => setOn(null));
  }

  return (
    <ul className={s.loops}>
      {LOOPS.map((l, i) => (
        <li key={l.name}>
          <button type="button" className={s.loopBtn} aria-pressed={on === i} onClick={() => toggle(i)}>
            <span className={on === i ? s.icoStop : s.icoPlay} aria-hidden />
            <span className={s.loopName}>{l.name}</span>
            <span className={s.loopBpm}>{l.bpm} bpm</span>
            <svg className={s.wave} viewBox={`0 0 ${l.peaks.length * 4} 40`} preserveAspectRatio="none" aria-hidden>
              {l.peaks.map((p, k) => {
                const h = Math.max(2, (p / 100) * 36);
                const lit = on === i && k / l.peaks.length <= progress;
                return <rect key={k} x={k * 4} y={20 - h / 2} width="2.4" height={h} rx="1" className={lit ? s.waveOn : undefined} />;
              })}
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
