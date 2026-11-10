"use client";

import { PlayableRoll } from "../jazz-midi-pack/PlayableRoll";
import { SoundPicker } from "../jazz-midi-pack/SoundPicker";
import type { Roll } from "../jazz-midi-pack/piano";
import first from "./rolls.json";
import t from "./th.module.css";

// Real files from the bundle on the page itself (./rolls.json, read from the pack by
// tools/extract_top_hits.py: the first 8 bars of each), drawn as piano rolls and played on
// the page's synth, sine or piano (../../jazz-midi-pack/piano.ts). The round yellow play
// button is the Jazz page's.

type Id = keyof typeof first;
const KEYS: Record<Id, string> = { blinding: "Fm", killbill: "Ab", lucid: "F#m", someone: "A" };
const roll = (id: Id) => first[id] as unknown as Roll;
const title = (id: Id) => `${first[id].song} · ${first[id].artist}`;
const meta = (id: Id) => `${first[id].bpm} BPM · ${KEYS[id]}`;

/** Under the hero video: four of the 1,000, small. */
export function HeroRolls({ lead }: { lead: string }) {
  return (
    <div className={t.heroPlay}>
      <div className={t.heroPlayHead}>
        <p>{lead}</p>
        <SoundPicker />
      </div>
      <div className={t.heroRolls}>
        {(Object.keys(first) as Id[]).map((id) => (
          <PlayableRoll key={id} roll={roll(id)} title={title(id)} meta={meta(id)} variant="mini" playLabel={`Play ${first[id].song}`} />
        ))}
      </div>
    </div>
  );
}

/** One file, large, beside the letter's steps. */
export function BigRoll({ id = "killbill", caption }: { id?: Id; caption: string }) {
  return (
    <figure className={t.big}>
      <div className={t.bigSound}>
        <SoundPicker />
      </div>
      <PlayableRoll roll={roll(id)} title={title(id)} meta={meta(id)} variant="short" playLabel={`Play ${first[id].song}`} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
