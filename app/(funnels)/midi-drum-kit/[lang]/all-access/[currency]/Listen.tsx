"use client";

import { useEffect, useRef, useState } from "react";
import { PlayableRoll } from "../../../../jazz-midi-pack/PlayableRoll";
import { SoundPicker } from "../../../../jazz-midi-pack/SoundPicker";
import { stop, type Roll } from "../../../../jazz-midi-pack/piano";
import s from "../../../../jazz-midi-pack/roll.module.css";
import th from "../../../../top-hits-chords/rolls.json";
import u from "./allAccess.module.css";

// "Listen first" on the All Access page (2026-11-16, "una pagina da scrollare, ascoltare, che convinca"):
// real files from three of the packs. Jazz and TOP HITS: the pack's own MIDI drawn and played on the
// Jazz page's synth (sine or piano). Famous Beats: the pack's own drum previews (the same mp3s its
// pattern player plays), fetched only on a tap. One thing plays at a time.

const BEATS = [
  { file: "01-01154drakegodsplan", name: "Drake - God’s Plan" },
  { file: "01-01202kendriklamarnotlikeus", name: "Kendrick Lamar - Not Like Us" },
  { file: "15-15130travisscottgoosebumps", name: "Travis Scott - goosebumps" },
];
const DIR = "/funnels/famous-beats-bundle/beats";
const hit = (r: { artist: string; song: string }) => `${r.artist} - ${r.song}`;

export function Listen() {
  return (
    <div className={u.listen}>
      <div className={u.lBlock}>
        <p className={u.lName}>Jazz MIDI Pack</p>
        <p className={u.lWhat}>The chords that make a loop sound expensive. Pick the sound, press play.</p>
        <SoundPicker className={u.picker} />
        <PlayableRoll id="neosoul" title="Neo Soul loop" variant="short" lazy />
        <PlayableRoll id="ballad" title="Ballad arpeggios" variant="short" lazy />
      </div>
      <div className={u.lBlock}>
        <p className={u.lName}>TOP HITS MIDI Bundle</p>
        <p className={u.lWhat}>The progressions under songs the whole world sang.</p>
        <PlayableRoll roll={th.blinding as Roll} title={hit(th.blinding)} variant="short" lazy />
        <PlayableRoll roll={th.killbill as Roll} title={hit(th.killbill)} variant="short" lazy />
      </div>
      <div className={u.lBlock}>
        <p className={u.lName}>Famous Beats Bundle</p>
        <p className={u.lWhat}>The drum grooves from records you know by heart, rendered from the MIDI in the pack.</p>
        <Beats />
      </div>
    </div>
  );
}

function Beats() {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState<string | null>(null);

  // A roll's play button stops the beat (the rolls stop each other in piano.ts).
  useEffect(() => {
    const off = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.("[data-play]") && !t.closest("[data-beat]")) {
        audio.current?.pause();
        setOn(null);
      }
    };
    document.addEventListener("click", off, true);
    return () => document.removeEventListener("click", off, true);
  }, []);

  const tap = (file: string) => {
    const a = audio.current;
    if (!a) return;
    stop();
    if (on === file) {
      a.pause();
      setOn(null);
      return;
    }
    a.src = `${DIR}/${file}.mp3`;
    a.currentTime = 0;
    void a.play().catch(() => setOn(null));
    setOn(file);
  };

  return (
    <ul className={u.beats}>
      {BEATS.map((b) => (
        <li key={b.file} className={s.scope} data-state={on === b.file ? "playing" : undefined} data-beat>
          <button type="button" className={s.play} data-play aria-pressed={on === b.file} onClick={() => tap(b.file)}>
            <span className={s.ico} aria-hidden />
            <span className={s.lPlay}>Play</span>
            <span className={s.lStop}>Stop</span>
          </button>
          <span className={u.beatName}>{b.name}</span>
        </li>
      ))}
      <audio ref={audio} preload="none" onEnded={() => setOn(null)} />
    </ul>
  );
}
