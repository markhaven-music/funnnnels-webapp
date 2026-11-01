"use client";

import bonusRolls from "./bonus-rolls.json";
import { PlayableRoll } from "./PlayableRoll";
import type { Roll } from "./piano";
import bn from "./bonus.module.css";

type BonusRoll = Roll & { title: string };
const BONUSES = bonusRolls as unknown as BonusRoll[][];

// A MIDI bonus's previews: 5-6 of its real files (bonus-rolls.json, written by
// tools/extract_rolls.py), one under the other, each with its own Play ("metti
// tutti i midi uno dietro l'altro"). Files with chord names show them.
export function BonusPlayer({ bonus }: { bonus: number }) {
  const files = BONUSES[bonus] ?? [];
  return (
    <ol className={bn.rolls}>
      {files.map((f) => (
        <li key={f.file}>
          <PlayableRoll roll={f} title={f.title} variant="short" playLabel="Play" />
        </li>
      ))}
    </ol>
  );
}
