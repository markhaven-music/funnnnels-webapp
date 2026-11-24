"use client";

import { useRef, useState } from "react";
import v from "./vol2Offer.module.css";

// One whole Vol.2 beat per style (beat 01 of each, public/funnels/midi-drum-kit/vol2/<slug>.mp3), played on tap only:
// nothing is fetched before (docs/page-speed.md). One beat at a time; the round yellow disc, a square while playing.
export type Preview = { slug: string; name: string; bpm: number; secs: number };

export function Previews({ items }: { items: Preview[] }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState<string | null>(null);

  const toggle = (slug: string) => {
    let a = audio.current;
    if (!a) {
      a = new Audio();
      a.preload = "none";
      a.onended = () => setOn(null);
      audio.current = a;
    }
    if (on === slug) {
      a.pause();
      setOn(null);
      return;
    }
    a.src = `/funnels/midi-drum-kit/vol2/${slug}.mp3`;
    a.currentTime = 0;
    a.play().catch(() => setOn(null));
    setOn(slug);
  };

  return (
    <ul className={v.previews}>
      {items.map((p) => (
        <li key={p.slug} className={v.preview}>
          <button type="button" className={v.disc} data-on={on === p.slug || undefined} onClick={() => toggle(p.slug)} aria-pressed={on === p.slug}>
            <span className={v.sr}>{on === p.slug ? "Stop" : "Play"} {p.name}</span>
            <span aria-hidden className={on === p.slug ? v.square : v.triangle} />
          </button>
          <span className={v.pName}>{p.name}</span>
          <span className={v.pMeta}>
            {p.bpm} bpm · {Math.floor(p.secs / 60)}:{String(Math.round(p.secs % 60)).padStart(2, "0")}
          </span>
        </li>
      ))}
    </ul>
  );
}
