# Famous Beats Bundle: product brief

Every claim on the pages must be in this file. Rules: `.claude/skills/grind-funnel-page`.

## Decisions (the user's words)
- 2026-11-03: the Astro landing cloned 1:1 (./astro), the ClickFunnels order page rebuilt on TOP HITS' template (./order).
- 2026-11-09: "Ne crei uno più simile a quello jazz per famous beats bundle? Offerta + simile e stile pagina più
  simile." Proposal (offer + sections) answered "poi vediamo gli oto": the rest approved, the upsells left as they
  are (TOP HITS) for now.
- 2026-11-09: first build copied the Drunk Swing Grooves page; the user: "sembra la pagina di Drunk Swing Grooves
  non MIDI Jazz". Rebuilt on the Jazz page's own CSS (jazz/bonus/value/shot modules) and section order: topbar +
  tag, centred hero, DAW strip, proof numbers, letter, product panel, letter beside the roll, browser, how it works
  beside the folder path, ✓/✗ chart, bonus panels with covers, value stack, seal + license, after you pay beside the
  download list, FAQ, final key. Proof numbers (2,847 Drum Kit producers, 4,700+ list) as on the Jazz page.
- 2026-11-09: "add player that lets you hear every pattern": v2/PatternPlayer.tsx, the Jazz browser's look (pack
  Prev/menu/Next, song chips, search), each file's first bar drawn from its .mid (beats/rolls.json, 317 of 320: three
  file names differ from their previews) and its preview playing.
- 2026-11-09: "use higgsfield for images": gpt_image_2_6 from the real box: box3d (cutout with remove_background),
  hero (box + KICK/SNARE/HI-HAT lanes + four real file names; a first take had invented names and was redone),
  daw, stage, bonus-essential cover. public/funnels/famous-beats-bundle.
- 2026-11-09: "add more bonuses just like midi jazz pack": six, as Jazz: + MIDI Chord Pack (Jazz Edition) (2,304 MIDI,
  €47) and Emotional Keys MIDI Bundle (195 MIDI, €27), counts and values from jazz-midi-pack/funnel.ts. Emotional
  Keys is therefore no longer a tick box (bumps: Drunk Swing Grooves €7, HUSTLE €27).
- 2026-11-09: "come possiamo moltiplicare il numero di midi files" → "Sì, costruiscili": every song also as single
  drum parts (03 - Single Drum Parts, 1,427 files, notes untouched, the tempo track kept) and as one track on General
  MIDI drum notes (04 - One Track (GM Drum Map), 320 files: kick 36, snare 38, clap 39, closed hat 42, open hat 46,
  cymbal 49, tambourine 54, tom 45, perc 37/75/76/77). 320 + 1,427 + 320 = 2,067 MIDI files, all parsed back, every
  song's parts = its multi-track file note for note. Made by ~/Desktop/Famous Beats Tools/make_parts.py into the
  same R2 key (shared/Famous Beats Bundle (320 MIDI Beats).zip; the old zip backed up first). The page says
  "320 hit drum grooves in 2,067 MIDI files" + "4,360 more MIDI files and 305 WAV loops" in the bonuses
  (163 + 2,304 + 195 + 150 + 1,548 MIDI; 47 + 258 WAV).
- Value stack: the bundle at its own price ($27) + the bonuses' Jazz values; nothing else invented. Built beside the live page at /famous-beats-bundle/v2 (+ /v2/order) until the user
  switches. No VSL yet (the Jazz page has one; a Famous Beats one is a separate job). No reviews (the user's call).
- Numbers before (11-02 → 11-09, own visits and bots out): 99 landing visitors, 14 on the order page, 3 checkout
  starts, 2 paid ($27, $54 with the Drum Kit add-on), 0 TOP HITS upsells; Meta €40.29.

## The product (counted from the zip, 2026-11-09)
- 320 multi-track MIDI drum transcriptions, 32 packs (Famous Beats Vol.1-32) of 10 songs, 76 artists
  (the zip's Song List.txt, names as the live page has them). File names: FamousBeatsNN_<bpm>_<Artist>_<Song>.mid.
- Tracks are named per drum: KICK (320 files), CLOSE HIHAT / HH, SNARE/RIM/CLAP, CLAP, OPEN HIHAT, PERC, CYMBAL,
  TAMBOURINE, TOM. **808 is a track in only 3 files**: the page says "kick, snare, hats and percussion", not
  "and 808" as the Astro page did.
- Every pack has audio previews of the drums (Vol.1-5 MP3, Vol.6-32 WAV), drum renders only, no audio from the
  songs (checked by spectrogram, 2026-11-09).
- The page's previews: those renders, first 12 s, mono 64 kbps, public/funnels/famous-beats-bundle/beats
  (+ beats.json), made by the session scratchpad script fbb_previews.py from the zip on the T7 drive.
- The roll beside the letter: one bar of Polo G "Martin And Gina" (94 BPM) read from its .mid (v2/roll.json).
- Claims kept from the live page: transcribed by hand and by ear; any DAW; commercial license (no resale of the
  MIDI files); a transcriber charges €10–30 per song, 3–7 days; €0.08 per groove (27 / 320); producer quotes
  (Metro Boomin, Tay Keith, Mike WiLL Made-It) as public statements for commentary, not an endorsement.

## Offer (v2)
- €27 / $27 (dashboard → Products). Red "BLACK FRIDAY: 90% Sale Ends Soon" bar as on Jazz.
- Six bonuses in the price (2026-11-09; first four) (`funnel.ts` includes.pack), values as the Jazz page has them:
  1. ESSENTIAL MIDI Drum Patterns (€7, its ClickFunnels price €6.99): 158 one-part patterns (808 33, Hihat Closed 66,
     Hihat Open 7, Kick 18, Snare or Clap 17, Accents 7, Kick and Snare 5, Kick and 808 5 .mid) + 5 complete multi-track
     beats = 163 MIDI files. R2 `clickfunnels/ESSENTIAL MIDI Drum Patterns.zip` (also holds a Famous Beats Vol.1 and an
     Emotional Piano bonus folder).
  2. Drum Loops for Songwriting (€27): 47 WAV loops.
  3. The Chord Progressions Bible (€37): 50 progressions × 3 ways, 150 MIDI + 258 WAV loops.
  4. Anime & Video Games MIDI Pack (€47): 1,548 MIDI files.
- 5-minute bonus (./fiveMinBonus.ts, cookie fv_bonus_fbb): MIDI Drum Kit Expansions free (172 MIDI files: Afrobeat
  61 patterns, 7 fragments, 5 complete beats; Lo-Fi 87; House 12). Needs "expansions" as an add-on in Products.
- Tick boxes: Drunk Swing Grooves €7, Emotional Keys €7, HUSTLE €27. The MIDI Drum Kit add-on (€27) leaves the
  order page (it's the upsell candidate, "poi vediamo gli oto").
- Upsell: TOP HITS as now.
- Guarantee: 14-day quality guarantee; "we fix it or replace it. If we can't, you get a refund". Never "money back".

## Switch (done 2026-11-10, "Sì, passa alla v2" → "Yes, change and switch")
- Live at /famous-beats-bundle (+ /order) since 2026-11-10 (3430584); /v2 and /v2/order redirect there (next.config.ts).
- funnel_items: swing-grooves €7 and expansions €7 (the 5-minute bonus) added. The old drum-kit and emotional-keys
  rows are still in the table (the user declined the delete); the order page shows only ORDER_BUMPS (swing-grooves,
  hustle), so they don't appear.
- thank-you + download use `unlocked()`, so the six bonuses download.
- Lighthouse mobile on the live URL (PageSpeed API quota out): landing 97, order 91.
