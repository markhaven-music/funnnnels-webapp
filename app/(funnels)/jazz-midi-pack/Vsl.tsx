"use client";
import { useState } from "react";
import { funnel } from "./funnel";
import s from "./jazz.module.css";

// The hero video (vsl/script-en.md, made with tools/jazz_vsl.py, on Wistia).
// Until the visitor taps play it's only the poster: Wistia's player costs a
// phone ≈760 ms of processor (docs/page-speed.md), so it loads on the tap,
// already playing.
const DIR = "/funnels/jazz-midi-pack";

export function Vsl() {
  const [on, setOn] = useState(false);
  const { wistiaId, poster } = funnel.vsl;
  return (
    <div className={s.vsl}>
      {on ? (
        <iframe
          src={`https://fast.wistia.net/embed/iframe/${wistiaId}?autoplay=1&playerColor=e2a93b`}
          title="Jazz MIDI Pack: same chords, played like a pianist"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className={s.vslPoster} onClick={() => setOn(true)} aria-label="Play the video" data-vsl>
          <img
            src={`${DIR}/${poster}-960.webp`}
            srcSet={`${DIR}/${poster}-960.webp 960w, ${DIR}/${poster}-1600.webp 1600w`}
            sizes="(min-width: 1000px) 920px, 92vw"
            width={1600}
            height={900}
            alt=""
            fetchPriority="high"
          />
          <span className={s.vslPlay} aria-hidden />
        </button>
      )}
    </div>
  );
}
