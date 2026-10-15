# Jazz MIDI Pack: product brief

Every claim on the landing page must be in this file. Rules: the Grind Studio
landing rules (`grind-studio-landing-pages/AGENTS.md`, `docs/landing-principles.md`,
`docs/copy-style.md`, "Diretto" voice).

## The product (counted from `~/Desktop/Jazz MIDI Pack` on 2026-10-10)
- Brand: GRIND STUDIO. Sold at m.thegrind.studio/jazz-midi-pack.
- 3,536 MIDI files (.mid) in 5 folders, numbered best-sounding first.
  1. Chords in Original Key: 2,704 files. 26 progressions × 13 voicings × 8 rhythms.
  2. All 12 Keys: 312 files. Every progression in every key, voice-led close voicings as sustained pads.
  3. Bass Lines: 78 files. Walking (swing), two-feel (half notes) and bossa nova bass for each progression.
  4. Combo Loops: 26 files. Drop-2 swing comping + walking bass + ride cymbal, two choruses, 150 bpm.
  5. Genre Loops: 416 files. Every progression as Lofi Hip Hop (82 bpm), Neo Soul (88 bpm), Trap Soul and
     Deep House. Separate Chords / Bass / Drums MIDI + a Full multitrack file. Key and BPM in every file
     name. GM drum map (kick C1, snare D1, hat F#1).
- Chord symbols written into every file as MIDI markers (most DAWs show them on the timeline).
- 13 voicings: Best Voicing, Best Voicing + Smooth Bass, Rootless (Bill Evans A-B), Spread (Two-Hand),
  Drop 2, Voice-Led Close, Quartal (So What), Shell (Bud Powell), Drop 3, Root Position, 1st / 2nd / 3rd
  Inversion.
- Best Voicing: always 4 voices + root bass, each moving like a melodic line. Common tones held, steps,
  sevenths resolving down, no parallel fifths/octaves, seamless loop.
- 8 rhythms: Ballad Arpeggios 70 bpm, Pads 90, Bossa Nova 135, Swing Comping 150, Charleston 130,
  Anticipations 130, Reverse Charleston 130, Freddie Green 4 to the Bar 140.
- 26 progressions: ii-V-I major and minor, turnarounds, tritone subs, backdoor, Lady Bird, Tadd Dameron,
  passing diminished, Autumn Leaves type, jazz/minor/Bird blues, rhythm changes A + bridge, Coltrane
  changes, Countdown, So What, minor line cliché, A Train, sus ii-V. Full list in `funnel.ts`.
- Works in any DAW that opens .mid (Ableton Live, Logic, FL Studio, Cubase, Studio One, Reaper, Bitwig,
  GarageBand).

## Offer
- €27 in Europe, $27 elsewhere. One payment, instant download. No strike-through price: the pack was never
  sold higher, so none is shown (no fake urgency, no "worth $997").
- Checkout add-on: Jazz MIDI Chord Pack, €9 / $9 (12 major/minor key pairs, six folders).
- EU withdrawal waiver: a notice under the pay button (clicking it is the consent), no tick box.
- Payment: a Card | PayPal choice, as on the ClickFunnels checkout. Card through Stripe, plus the methods
  Stripe shows (Link, Bancontact, EPS…). PayPal through our own PayPal account: the big button sends the
  buyer to PayPal's page and back.
- Order bump: copied from the ClickFunnels template (yellow box, red arrow, cover, red offer label). Its
  label says "ADD-ON OFFER", never "one-time offer": the Chord Pack isn't promised to disappear.
- Delivery: download buttons on the thank-you page right after payment; Stripe emails the receipt.

## Guarantee and legal (same as the Grind Studio store)
- 14-Day Satisfaction Guarantee, never "money-back": if anything's wrong with your files, email
  support@thegrind.studio within 14 days and we make it right: a fresh download, a replacement, or a refund
  if we can't fix it.
- License: use them in your own music, commercial releases included, no royalties. Don't resell or share
  the files themselves.
- Legal pages: thegrind.studio/terms-and-conditions, /privacy-policy, /refund-policy.

## Brand proof
- GRIND STUDIO's MIDI Drum Kit is in the sessions of 2,847 producers (same claim as the Grind landings,
  `site.ts` → `producers`).
- No Jazz-pack testimonials exist yet: none on the page until real ones arrive.

## Before / after (measured by `tools/extract_rolls.py` data, 2026-10-12)
- File pair: "02 Pads - 05 I-vi-ii-V Turnaround", Root Position vs Best Voicing (same 8 chords, same rhythm).
- Root Position top note moves [-4, 5, 5, 6, -4, -7, 5] semitones (up to 7). Best Voicing top note stays on
  B4/C5 (moves 0 or 1). Best Voicing bass plays the roots (C A D G). Upper voices move 139 vs 72 semitones.
- Guarantee line "every file is tested before release": every file was parsed back after generation
  (0 bad files, no hanging notes).

## Previews
- Real files from the pack, notes extracted by `tools/extract_rolls.py`, played on Salamander Grand Piano
  samples (Alexander Holm, CC BY 3.0, credited in the footer). Drums are not played.
