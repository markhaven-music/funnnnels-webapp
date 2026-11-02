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
- €27 in Europe, $27 elsewhere. One payment, instant download. No fake urgency (no timer, no "sale ends").
- Value stack (the user's call, 2026-11-01: "prezzo sbarrato totale VALUE = TOT e offerta, come pagina MIDI Drum
  Kit"): each item shows what it's worth, the same number in € and $ (`funnel.ts` value / bonuses[].value):
  Jazz MIDI Pack 97, Chord Pack 47, Bible 37, Anime pack 47, Emotional Keys 27, Drum Loops 27. Total value 282,
  crossed out, "Today" 27, "You save" 255. It reads as the bundle's worth, never as an earlier price of the pack.
- Bundle total: 7,733 MIDI files = 3,536 (pack) + 2,304 + 150 + 1,548 + 195 (bonuses). The bonuses add 4,197 MIDI
  files, 305 WAV loops (258 Bible piano/e-piano loops + 47 drum loops) and a PDF. Counted 2026-11-01.
- Angle (2026-11-01): the jazz progressions everyone wants and nobody can write. Never say how many progressions.
- Five free bonuses with every pack (since 2026-10-16), on the same download page:
  1. MIDI Chord Pack (Jazz Edition): the Jazz MIDI Chord Pack, 2,304 MIDI files, 12 major/minor key pairs,
     six folders (best voicing, best voicing + smooth bass, sevenths, extended, altered & borrowed, progressions).
  2. The Chord Progressions Bible: "the 50 most used chord progressions of all time". Supplied by Mark; no
     other claims until we have the file.
  3. Anime & Video Games MIDI Pack: the Anime & Video Game MIDI Chord Pack, 1,548 MIDI files, 12 key pairs;
     add9, extended, colour & borrowed chords; anime progressions (royal road, Marusa, Komuro, Canon…) and
     video game ones (victory fanfare, Lydian wonder, boss phrygian, battle, dungeon…).
  4. Emotional Keys MIDI Bundle: Vol. 1–3, each 20 songstarters + 20 chord progressions + 20 melodies +
     5 bonus melodies = 195 MIDI files, each with an MP3 preview (+ a demo MP3 per volume).
  5. Drum Loops for Songwriting: 47 WAV loops (the source folder is called "50 Drum Loops" but holds 47; the
     page says 47) in four styles: modern pop & ballads, hip hop / trap / urban, dance & electronic, vintage & rock.
  Bible details (its READ ME): the 50 most used progressions, each as block chords, arpeggio and piano
  arrangement: 150 MIDI files, plus e-piano WAV loops and "The Ultimate Chord Progression - Cheat Sheet.pdf".
  Bonuses 2, 4, 5 come from ~/Desktop/midi jazz pack bonuses and are served from Cloudflare R2 (lib/r2.ts):
  the Bible zip alone is 1.07 GB.
  Each bonus card shows what's inside (`funnel.ts` bonuses[].inside) and previews to play: 5-6 real files per MIDI
  bonus on the piano (bonus-rolls.json from tools/extract_rolls.py BONUS: chord pack ii-V-I, Lady Bird, tritone sub,
  backdoor, Coltrane, line cliché; Bible I-V-vi-IV as block chords / arpeggio / arrangement + 2 more; anime Royal
  Road, Marusa, Komuro, sad anime, victory fanfare, final boss; 6 Emotional Keys songstarters; leading empty bars cut,
  8 bars at most), and four 8-second clips of real drum loops
  (public/funnels/jazz-midi-pack/loops: Modern Pop 90, Hip Hop 91, UK Garage 134, 70s Acoustic 104 bpm).
  Emotional Keys per volume: 20 songstarters, 20 chord progressions, 20 melodies, 5 bonus melodies.
- No checkout add-on since 2026-10-16: the Chord Pack (the old €9 add-on) became bonus 1. The server still
  knows the old add-on so orders that bought it keep verifying.
- EU withdrawal waiver: a notice under the pay button (clicking it is the consent), no tick box.
- Payment: a Card | PayPal choice, as on the ClickFunnels checkout. Card through Stripe, plus the methods
  Stripe shows (Link, Bancontact, EPS…). PayPal through our own PayPal account: the big button sends the
  buyer to PayPal's page and back.
- Order bump (not shown since 2026-10-16): copied from the ClickFunnels template (yellow box, red arrow, cover, red offer label). Its
  label says "ADD-ON OFFER", never "one-time offer": the Chord Pack isn't promised to disappear.
- Order page (since 2026-10-16): the checkout has its own page, /jazz-midi-pack/order, like the ClickFunnels
  funnels. Every CTA, the sticky bar and the FAQ links go there; the landing's offer section is a recap with
  one button. The order page shows no reviews (none exist yet) and no timer. Pixel: PageView + OrderPageView
  there, InitiateCheckout still at step 1 → 2, Purchase on the thank-you page.
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
- 4,700+ producers on the GRIND STUDIO email list (4,732 contacts in funnnnels on 2026-11-01).
- No Jazz-pack testimonials exist yet: none on the page until real ones arrive. The 8 reviews on the Drum Kit and
  Top Hits order pages are the same quotes and names with "patterns" swapped for "chords", so they are not used
  here. Social proof = the `Proof` strip (the two numbers above + the guarantee), under the hero and the checkout.
- Counts on the page: 3,536 = the pack; the bonuses add 4,197 MIDI; 7,733 only as "in total".

## Before / after (measured by `tools/extract_rolls.py` data, 2026-10-12)
- File pair: "02 Pads - 05 I-vi-ii-V Turnaround", Root Position vs Best Voicing (same 8 chords, same rhythm).
- Root Position top note moves [-4, 5, 5, 6, -4, -7, 5] semitones (up to 7). Best Voicing top note stays on
  B4/C5 (moves 0 or 1). Best Voicing bass plays the roots (C A D G). Upper voices move 139 vs 72 semitones.
- Guarantee line "every file is tested before release": every file was parsed back after generation
  (0 bad files, no hanging notes).

## Previews
- Real files from the pack, notes extracted by `tools/extract_rolls.py`, played on a warm sine synth (`piano.ts`:
  two sines 5 cents apart per note, under C3 a quiet 2nd and 3rd so bass lines sound on a phone speaker). Since
  2026-11-01, in place of the Salamander Grand Piano samples ("usa un sine synth invece del piano, è più warm");
  the VSL demos use the same synth (`tools/jazz_vsl.py`). Drums are not played.
- 2026-10-16: Neo Soul loops fixed in `make_pack.py`. The bass approach note on beat 4-and used to be a half
  step below the next root even when it rubbed against a chord note still ringing (C# under Am7 in loop 05).
  It now takes the first clean option: a half step below, a half step above, the next root's fifth, or the
  nearest ringing chord tone. 48 files changed (Bass + Full in 24 loops), 0 clashes left, zip rebuilt.
- The player merges unisons (bass + chord root on the same pitch at the same time) into one note.

## Sections added on 2026-11-01, taken out on 2026-11-02
"The secret", "Played by the greats" and "Why 13 voicings and 8 rhythms? Easy." (modelled on the Drum Kit page)
were on the page for a day. The user: "you replaced a lot of sections while i didnt ask u to do that"; asked
what to undo, they picked "Togli sezioni nuove" and "rimetti le sezioni di prima". The page is back to the 14
sections it had that morning, in the same order. The code is in git at 08e0c7a. The checks below stay for reuse.

### Greats research (2026-11-01)
"This section makes no sense i wanted a social proof section with logos + reviews": it replaced "Songs you know"
(each song beside its bundle file). Modelled on the Drum Kit's "Patterns used by the best producers of all time"
(producer logos) and its producer quotes. The names are set in type, not their logos (an artist's logo would read
as an endorsement). No customer reviews: none exist for this pack (see Brand proof).
- Every name has a record built on a progression in the download. The modern ones were checked on Hooktheory for
  the songs section, below; Miles Davis = So What (Modal So What), John Coltrane = Giant Steps (Coltrane Changes),
  Charlie Parker = Blues for Alice (Bird Blues in F), Duke Ellington = Take the "A" Train (II7#11).
- Quotes (checked word for word on the pages linked, 2026-11-01; a "…" marks a trim, never a changed word):
  Robert Glasper (NPR Jazz Night in America, 2017), Pharrell Williams (Interview Magazine, 2003, about the Isley
  Brothers, Donny Hathaway and Stevie Wonder), Terrace Martin (NPR Microphone Check, 2015), Masego (Dummy, 2018, on
  how "Trap House Jazz" started), Tom Misch (EARMILK, 2014; the "etc" is his), Jacob Collier (NPR TED Radio Hour,
  2022). Left out: Tyler, the Creator "I love chords" (only in press write-ups of Rick Rubin's podcast, no
  transcript), Thundercat (weak), Questlove (argues the other way). No checkable chord quote found for Kanye,
  J Dilla, Kendrick, SZA, Frank Ocean, Kenny Beats, Anderson .Paak, Bruno Mars, Quincy Jones, Madlib or Nujabes.
- Kill Bill: the cited analysis (The Mix Review) gives plain chords, ii-V-I-VI; the 7ths come from chord charts.
  Leave the Door Open: the progression is the verse loop, not the whole song.
- The song checks, from the old section:
- Kill Bill (SZA): Ab major, verse/chorus/bridge ii7 V7 I V7/ii = Bbm7 Eb7 Abmaj7 F7 (hooktheory.com/theorytab/view/sza/kill-bill).
  File: MIDI Chord Pack, 9 - Ab Major, "Major Prog 5 (ii-V-I-VI)" (Bbm9 Eb13 Abmaj9 F7b9).
- Say So (Doja Cat): D major, verse and chorus ii7 V11 I7 = Em7 A11 Dmaj7 (hooktheory.com/theorytab/view/doja-cat/say-so);
  chord sheets write A7, the page does too. File: MIDI Chord Pack, 3 - D Major, "Major Prog 1 (ii-V-I-I)" (Em9 A13 Dmaj9).
- Leave the Door Open (Silk Sonic): A minor, verse VI7 VII v7 i7, chorus VI7 VII v7 i = Fmaj7 G7 Em7 Am7, the "royal
  road" IV-V-iii-vi of C (hooktheory.com/theorytab/view/silk-sonic/leave-the-door-open).
  File: Anime & Video Games MIDI Pack, 1 - C Major, "Major Prog 1 (IV-V-iii-vi Royal Road)" (Fmaj9 G13 Em7 Am9).
- Just the Two of Us (Grover Washington Jr. & Bill Withers): F minor, VI7 V7 i7 = Dbmaj7 C7 Fm7
  (hooktheory.com/theorytab/view/grover-washington-jr-and-bill-withers/just-the-two-of-us). Wikipedia names the
  progression after it (also called Marusa). File: Anime & Video Games MIDI Pack, 9 - Ab Major, "Major Prog 3
  (IV-III7-vi-I7 Marusa)" (Dbmaj9 C7b9 Fm9 Ab9).
- The section's note says the names have records built on progressions from the download, the quotes are from
  linked interviews, and none of the artists is connected to GRIND STUDIO or endorses the pack.

## Palette and desktop layout (2026-11-02)
- "l'uso dei colori non mi piace è troppo pastello desaturato. la pagina deve spikare dopamina… Scegli una sola
  sfumatura di giallo": the Jazz pages (`.jazz` in jazz.module.css) use one yellow, the Drum Kit's #f5b800, with
  #ffe14d only as the gloss in gradients (button, price tags) and a darker shade for the button's underside. Text is
  white (body at 88 %, muted at 62 %), the bands are black (#111) instead of midnight blue, the glows yellow.
  `.page` keeps the old brass and cream for the shop and the launch kits, which share the file; the shared button,
  checkout, box and roll styles read `--y*` tokens with the old values as fallbacks. The VSL thumbnail (Wistia still
  wtda8c86j3) and the share image use the same yellow; the video's captions still have the old brass boxes.
- "you should use 2 columns layout on desktop" meant the Drum Kit landing's pattern ("intendevo 2 colonne come il
  layout della landing di midi drum kit"): copy beside a visual, in a centred container, sides alternating; the
  hero centred. On the Jazz page from 1000px: the letter beside the before/after rolls (`.pair` in
  [currency]/page.tsx and jazz.module.css: the rolls stacked on the right, sticky while the letter scrolls); the
  pack browser, the bonuses and the guarantee heading left, content right (`.two`, `.twoHead`, `.twoBody`,
  `.twoWide`). Intro (box | text), chart and offer already had their grids; the final section was already text
  left, image right. A first try had every text-only section as heading left + body right: the heading sat
  alone over a void ("ma che hai fatto"); after you pay and the FAQ stay one column.
- "togli sti titoli sopra le headlines": the eyebrow lines ("WHY YOUR CHORDS SOUND STIFF", "INTRODUCING"…) are
  no longer drawn. The text stays in the blocks' `eyebrow` props and in the editor's data, unused.
- "come synth usa semplicemente delle sinusoidi": piano.ts plays one plain sine per note (no detuned pair, no
  harmonics under C3); tools/jazz_vsl.py mirrors it for the next VSL render.
