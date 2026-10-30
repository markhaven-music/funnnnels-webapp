"use client";
import { useRef, useState } from "react";
import { funnel } from "./funnel";
import s from "./jazz.module.css";

// The hero video (vsl/script-en.md, made with tools/jazz_vsl.py, hosted on
// Wistia). It plays Wistia's MP4 files in a plain <video>: Wistia's own player
// took too long to start on the tap, and costs a phone ≈760 ms of processor
// (docs/page-speed.md). preload="none" keeps the page from downloading any of
// the video until the visitor taps play; the poster on top is the LCP image.
const DIR = "/funnels/jazz-midi-pack";

export function Vsl() {
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const { poster, mp4 } = funnel.vsl;

  // play() inside the tap itself, so iOS lets it start with sound.
  function play() {
    setOn(true);
    video.current?.play().catch(() => {});
  }

  return (
    <div className={s.vsl}>
      <video
        ref={video}
        controls={on}
        playsInline
        preload="none"
        title="Jazz MIDI Pack: same chords, played like a pianist"
      >
        <source src={mp4.p1080} type="video/mp4" media="(min-width: 1000px)" />
        <source src={mp4.p720} type="video/mp4" />
      </video>
      {!on && (
        <button type="button" className={s.vslPoster} onClick={play} aria-label="Play the video" data-vsl>
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
