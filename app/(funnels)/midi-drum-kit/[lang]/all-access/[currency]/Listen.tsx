"use client";

import { useState, useRef } from "react";
import s from "../../../../jazz-midi-pack/roll.module.css";
import u from "./allAccess.module.css";

// "Press play" on the All Access page: real files from the packs, as audio, fetched only on a tap, one at a time.
// 2026-11-16 ("le demo Jazz MIDI Pack non mi piacciono, mostra i file migliori lofi, trap soul", "metti anche
// Jazz MIDI Pack Vol.2", "usa un suono che si sente meglio da mobile"): the Jazz, Vol. 2 and TOP HITS demos are
// mp3s rendered from the packs' own MIDI by tools/all_access_demos.py (piano, bass, Grind Studio drums, loud
// enough for a phone speaker) instead of the page's sine synth. Famous Beats: the pack's own drum previews.

const A = "/funnels/midi-drum-kit/all-access-audio";
const F = "/funnels/famous-beats-bundle/beats";
const GROUPS = [
  {
    name: "Jazz MIDI Pack",
    what: "Chords that make a loop sound expensive. These genre loops come with their own bass and drums.",
    tracks: [
      { src: `${A}/jazz-lofi.mp3`, name: "Lofi Hip Hop", sub: "Fly Me to the Moon type" },
      { src: `${A}/jazz-trapsoul.mp3`, name: "Trap Soul", sub: "Just the Two of Us type" },
    ],
  },
  {
    name: "Jazz MIDI Pack Vol. 2",
    what: "82 new progressions: late-night neo soul, gospel, blues, city pop.",
    tracks: [
      { src: `${A}/vol2-lofi.mp3`, name: "Lofi Hip Hop", sub: "Neo Soul ii-V-I" },
      { src: `${A}/vol2-trapsoul.mp3`, name: "Trap Soul", sub: "Late Night" },
    ],
  },
  {
    name: "TOP HITS MIDI Bundle",
    what: "The progressions under songs the whole world sang.",
    tracks: [
      { src: `${A}/tophits-blinding.mp3`, name: "The Weeknd", sub: "Blinding Lights" },
      { src: `${A}/tophits-killbill.mp3`, name: "SZA", sub: "Kill Bill" },
    ],
  },
  {
    name: "Famous Beats Bundle",
    what: "The drum grooves from records you know by heart.",
    tracks: [
      { src: `${F}/01-01154drakegodsplan.mp3`, name: "Drake", sub: "God’s Plan" },
      { src: `${F}/01-01202kendriklamarnotlikeus.mp3`, name: "Kendrick Lamar", sub: "Not Like Us" },
      { src: `${F}/15-15130travisscottgoosebumps.mp3`, name: "Travis Scott", sub: "goosebumps" },
    ],
  },
];

export function Listen() {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState<string | null>(null);

  const tap = (src: string) => {
    const a = audio.current;
    if (!a) return;
    if (on === src) {
      a.pause();
      setOn(null);
      return;
    }
    a.src = src;
    a.currentTime = 0;
    void a.play().catch(() => setOn(null));
    setOn(src);
  };

  return (
    <div className={u.listen}>
      {GROUPS.map((g) => (
        <div key={g.name} className={u.lBlock}>
          <p className={u.lName}>{g.name}</p>
          <p className={u.lWhat}>{g.what}</p>
          <ul className={u.beats}>
            {g.tracks.map((t) => (
              <li key={t.src} className={s.scope} data-state={on === t.src ? "playing" : undefined}>
                <button type="button" className={s.play} aria-pressed={on === t.src} onClick={() => tap(t.src)}>
                  <span className={s.ico} aria-hidden />
                  <span className={s.lPlay}>Play</span>
                  <span className={s.lStop}>Stop</span>
                </button>
                <span className={u.beatName}>
                  {t.name} <span className={u.beatSub}>· {t.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <audio ref={audio} preload="none" onEnded={() => setOn(null)} />
    </div>
  );
}
