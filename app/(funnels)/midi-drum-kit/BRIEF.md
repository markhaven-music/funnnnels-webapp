# MIDI Drum Kit funnel: brief

Started 2026-11-23 with the Vol.2 upsell; the landing's own claims live in its code comments (landing.ts, funnel.ts).

## MIDI Drum Kit Vol.2 upsell ([lang]/vol2-offer)

Decided by the owner on 2026-11-23: "xkè poi lo mettiamo come oto upsell di midi drum kit vol1", then "Yes, make the OTO".
The first upsell after the order (funnel_items upsell position 0), before Famous Beats and TOP HITS. Price €27 / $27 (was €37 at launch; owner 2026-11-24: "Change it to €27")
(Claude's pick, changeable in dashboard → Products). English in every language, like the Jazz upsell.

Facts the page states, all checked on the built pack (T7 `02. All products/18. MIDI Drum Kit Vol.2/MIDI Drum Kit Vol.2`):
- 480 beats, 12 styles, 40 each: Trap, Atlanta Trap, Dark Trap, Melodic Trap, Drill, Rage and Plugg, Detroit, West Coast,
  Phonk, Boom Bap, RnB Trapsoul, Slow Bounce. 18,701 MIDI files. Zip in R2: midi-drum-kit/MIDI Drum Kit Vol.2.zip (MIDI only).
- Each beat: FULL SONG (72 or 80 bars), FULL SONG EXTENDED (96 or 104 bars), Intro/Verse/Hook/Bridge/Outro, More Sections
  (long intro, pre-hook, hook lift after 4, hook lift after 8, switch-up, breakdown, long outro), Parts (each drum of the
  verse and hook), Drum Rack (GM) copies.
- Tempo ranges per style are the min and max of the 40 beats' file names.
- "None of these beats are in your MIDI Drum Kit": no Vol.2 kick+snare pair repeats Vol.1 (dedupe.py, 0 of 960). Vol.2 beats
  are also in no MIDI DRUMS BIBLE or Vault beat (vol2.py: 0 of 480 against 7,680).
- Previews: beat 01 of each style, rendered on drum samples; the picture of a whole beat is Trap beat 01's EXTENDED song.
- 60-day quality guarantee, "you get a refund"; never "money back" (the old badge-guarantee.webp says it: not used).
