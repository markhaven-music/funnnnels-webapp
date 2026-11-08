# Drunk Swing Grooves: product brief

Every claim on the pages must be in this file. Rules: `.claude/skills/grind-funnel-page`.

## Decisions (the user's words)
- 2026-11-08: made as a €7 order bump on the Jazz order page ("fai 1 e 2"), then "mi piacciono molto i groove
  drunk ... direi di creare un prodotto a parte di 7 euro e venderlo con upsell jazz kit etc".
- Angle: "that drunk feeling, the microtiming everybody wants but nobody knows how to make".
- "il rullante debba essere esattamente a tempo": every main snare (and its clap) exactly on the beat.
- "togliere la parte armonica lasciamo solo i grooves è un pacchetto di grooves / midi drum beats": the
  Jazz loops left; "il quintuplet swing suona molto bene... una versione con delle note come bonus" and
  "aggiungi anche quintuplets swings nei ritmi".
- Multitrack versions, "ogni traccia uno strumento ... per chi non usa drum racks".
- 2026-11-08: "la pagina drunk grooves dovrebbe sembrare più una pagina funnel d2c come le altre. VSL + social proof etc":
  added Introducing (the box beside the bullets), the ✓/✗ chart (swing knob / moving notes by hand / the pack),
  "Everything you get" (no money values, the price only), After you pay, the reviews after the guarantee. Reviews: the
  MIDI Drum Kit's eight, word for word (the user: "Drum Kit reviews"), on the landing (said to be the Drum Kit's) and
  on the order page.
- 2026-11-08: VSL script approved ("Yes, record it"): vsl/script-en.md, made with tools/grooves_vsl.py (Aaron Sage,
  eleven_v4, every part checked with speech-to-text), 4:54, Wistia tuqmnch1mn, above the A/B switch in the hero.
- 2026-11-08: "fai vedere immagini delle box etc etc anche su order page"; the box is the user's own artwork ("usa questa",
  sampler + vinyl, orange lettering, "MIDI PACK"), cut out: public/funnels/drunk-swing-grooves/pack-*.webp.
- "say J Dilla in the copy": the copy says "J Dilla-style swing"; the product is named "Drunk", not after
  a person.

## The product (counted from ~/Desktop/Drunk Swing Grooves, built by
## ~/Desktop/Jazz MIDI Pack Tools/make_swing_grooves.py, 2026-11-08)
- 211 MIDI files + a PDF guide, one zip (R2 `jazz-midi-pack/Drunk Swing Grooves.zip`, the Jazz bump's).
- 2026-11-08: the snare was on 3 only in every pattern (half-time, a generator mistake; the user heard it).
  "metti entrambi nel pack": each pattern now with the snare on 2 and 4 AND in half-time. "Half-Time Soul" → "Slow Soul".
- 2 Drum Grooves, 160 files = 80 grooves: 10 patterns (Dusty Boom Bap 88, Lazy Sunday 80, Late Night Lofi 76, Neo Soul
  Pocket 90, Sliding Kick 84, Slow Soul 72, Rimshot Shuffle 92, Broken Beat 86, Jazzy Hop 94, Tape Stop
  Groove 78 bpm) × 2 snare placements (2 and 4; half-time, snare on 3) × 4 feels (Light, Medium, Heavy Drunk;
  Quintuplet Swing), 4 bars each, in two versions (folders Drum Rack / Multitrack, each with both snare sets):
  - Drum Rack (GM map): one track, kick C1, rim C#1, snare D1, clap D#1, closed hat F#1, open hat A#1.
  - Multitrack: a track per sound (Kick, Snare, Clap, Rim, Closed Hat, Open Hat), every note on C3 (MIDI 60).
- 1 Groove Templates, 31 files: 2-bar 16th grids: swing 16ths 52-70% (9), swing 8ths 58/62/66%, septuplet
  (57%) and quintuplet (60%) swing, Drunk Light/Medium/Heavy 1-4 (12), Laid Back ×3, Pushed Hats, Rushed.
- Bonus, 20 files: 10 neo soul progressions of the Jazz MIDI Pack (Just the Two of Us Type, Royal Road, Sad
  Lofi vi-IV-I-V, Neo Soul 4-3-2-1, Minor Lofi Ballad, I-vi-ii-V, ii-V-I major and minor, Minor Turnaround,
  Neo Soul Minor Loop), keys + bass, re-timed to Quintuplet Swing.
- The guide (PDF): the templates in Ableton Live (Groove Pool) and Logic Pro (Make Groove Template); FL
  Studio and others use the ready grooves; which feel for what; the license.
- How it's made: a 16th grid, every hit moved by a fraction of a 16th per instrument (snare fixed; hats,
  kick, ghost notes moved, with fixed random variation); MPC-style swing percentages; quintuplet = every
  second 16th at 60% of the 8th. No samples, no copied MIDI.
- No tempo or time-signature events; bpm in the file names; 480 ticks a beat; any DAW that opens .mid.

## Offer
- €7 in Europe, $7 elsewhere. One payment, instant download. No fake urgency, no value stack.
- Add-on: Jazz Record Samples (122 WAV Loops) €7 / $7 (catalog `jazz-record-samples`).
- Upsell 1: Jazz MIDI Pack €27 / $27 (its own page here, ./offer). Facts from ../jazz-midi-pack/BRIEF.md.
  Since 2026-11-08 ("Sì, aggiungili") with its five bonus zips, as on the Jazz funnel and the Drum Kit's Jazz upsell:
  MIDI Chord Pack (Jazz Edition), The Chord Progressions Bible, Anime & Video Games MIDI Pack, Emotional Keys MIDI
  Bundle, Drum Loops for Songwriting (the PDF guide is inside the pack's zip). funnel.ts `includes`.
- Upsell 2: Famous Beats Bundle €27 / $27 (the MIDI Drum Kit's page, midi-drum-kit/upsell.ts).
- Guarantee: 14-day quality guarantee ("A file doesn't work ... we fix it. If we can't, you get a refund"; never "money back"). Royalty-free license
  (own music and commercial releases, no credit; no resale or sharing of the files).
- Proof: "2,847 producers have the GRIND STUDIO MIDI Drum Kit" (the Jazz order page's line). No reviews.

## Audio on the page
- public/funnels/drunk-swing-grooves/audio, made by ~/Desktop/Jazz MIDI Pack Tools/make_grooves_demos.py
  (fluidsynth + GeneralUser GS), in audio/v2 since 2026-11-08: the A/B (Neo Soul Pocket quantized vs Heavy Drunk
  with the Jazz pack's Royal Road keys + bass, same 8 bars; Dusty Boom Bap Medium was too subtle), the four feels
  (Neo Soul Pocket alone), the bonus (Royal Road
  neo soul keys + bass over Neo Soul Pocket, Quintuplet Swing).
