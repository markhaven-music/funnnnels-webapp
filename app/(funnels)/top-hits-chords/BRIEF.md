# TOP HITS MIDI Bundle, the new funnel (/top-hits-chords): product brief

Every claim on the pages must be in this file. Rules: `.claude/skills/grind-funnel-page`.
The older brief (2026-10-07, in Italian, with the list of ClickFunnels claims not to repeat) is
`grind-studio-landing-pages/docs/top-hits-brief.md`; what's here replaces it for this funnel's pages.

Two funnels sell this product. `../top-hits-midi-bundle` is the 1:1 ClickFunnels copy at
m.thegrind.studio/top-hits-midi-bundle: live, and not changed by anything here. This one is
m.thegrind.studio/top-hits-chords, with its own rows in dashboard → Products, its own numbers
in Analytics and its own card on the funnel list ("TOP HITS MIDI Bundle (new funnel)").

## Decisions (the user's words)
- 2026-10-21: the ClickFunnels funnel copied 1:1 (./[currency], ./order): still the live page.
- 2026-11-08: price set to €97 / $97 in dashboard → Products (was 27).
- 2026-11-15, the day before the launch email ("TOP HITS MIDI Bundle is live", 11-16 08:00 UTC, then
  daily to 11-30, funnnnels Broadcasts): the price is €27 / $27 again, everywhere TOP HITS is sold
  ("okay lets' keep 27 then", after "Yes, €27 everywhere"). The pre-launch emails (ClickFunnels, 11-02
  to 11-15) announce "the launch price is €27, limited to the first 100 copies"; the pages said 97.
  funnel_items rows of product `top-hits` set to 2700: main on this funnel and on
  top-hits-midi-bundle, the bump on Jazz and the Drum Kit, the upsell on the Drum Kit and Famous
  Beats. Nothing on the site counts the 100 copies or puts the price back up: a real end to the
  launch price is still to decide. The same day: "let's follow the PRODUCT LAUNCH FORMULA playbook
  for this launch".
- 2026-11-15, the launch by the playbook (Jeff Walker's "Launch"; the summary the user linked:
  cdn.bookey.app/files/pdf/book/en/launch.pdf): open cart 11-16 08:00 UTC, one offer, a real end.
  Asked when the €27 ends: "Sun 22 Nov, midnight". Taken as midnight Pacific time (2026-11-23
  08:00 UTC), so nobody in the Americas is cut off early; after it the bundle is €97 / $97 again.
  - The end is enforced in the database, not by hand: `public.top_hits_launch_close()`
    (db/top-hits-launch-close.sql), run every 5 minutes by pg_cron job `top-hits-launch-close`.
    It puts every funnel_items row of product `top-hits` back to 9700 at 2026-11-23 08:00 UTC, or
    as soon as 100 copies are sold since the launch email (orders of the two TOP HITS funnels plus
    the add-on and upsell on the other funnels), then removes its own job. The pages follow within
    the hour (revalidate 3600); a card payment from a page still showing the old price is refused
    with "The price just changed" (api/checkout/intent).
  - Emails (funnnnels Broadcasts), all to /top-hits-chords: 16 open ("€27 for the first 100 copies,
    or until Sunday at midnight Pacific time, whichever comes first. After that it's €97."), 17
    questions, 18 five-minute workflow, 19 voicings, 20 song list, 21 five songs test, each with the
    same PS; 22 three closing emails and 23 "closed" written as DRAFTS for the user to read. The
    Drum Kit and Famous Beats emails moved after the close (24 to 30) with the kit's present numbers
    (10,296 MIDI files, 6 bonuses); "Try a genre you never make" and "Last note on TOP HITS" are
    drafts again.
  - "si fai tutto e poi mostrami la pagina" (2026-11-15): the three closing emails and "closed" are
    scheduled as written; the red bar of the landing and the order page says "LAUNCH PRICE: €27
    until Sunday midnight PT, then €97" while the launch price is the one in force (`launchOn` in
    funnel.ts: before the end and the Products price still 27), and "BLACK FRIDAY: …" again after.
  - The buyers' zip has the right Blinding Lights since 2026-11-15 15:41 CET: the R2 object
    `top-hits-midi-bundle/TOP HITS MIDI Bundle.zip` is the old zip with that one file replaced by the
    T7's (E3 → F3, four bytes; 1,449 entries, nothing else changed), read back through a buyer's
    link. The zip of 2026-10-20 is kept at `top-hits-midi-bundle/backup/`.
  - "Sì, rifallo" (2026-11-15): the hero VSL rendered again with Blinding Lights' right chord. The
    cached voice files were gone, so the voice is a new ElevenLabs take (same voice, model and
    script; all 20 parts checked with speech-to-text). Wistia x8jj158ddq, still = the frame at
    117.3 s (media 3exn59wcek). The 2026-11-10 render (47ic5iver0) is still in Wistia, not on the page.
- 2026-11-15 evening, the page as a launch page (the user's words, in order):
  - "i dont like the headline": of four offered he picked the ClickFunnels page's own, "We Copied The
    Chord Progressions Of Top Hits So You Can Use Them." (words.ts hero.title, the share title too).
  - "it doesnt look like a launch page... there's no countdown", "THE PAGE...IT HAS TO LOOK AND
    SOUND LIKE A BIG DEAL": while the launch price is in force (`launchOn`) the red bar has the
    clock to its end, the pre-title says "NEW RELEASE · LAUNCH WEEK", four big numbers (days, hours,
    min, sec) sit under the sub with "€27 instead of €97 for the first 100 copies, or until Sunday
    at midnight PT", every button has "Launch price €27 · ends in … · then €97" over it and
    "€27 instead of €97" inside it (Countdown.tsx; the clock is the browser's, the end is real:
    funnel.ts `launch.ends`). After the end all of it goes and the page is as before.
  - "27 value? should be more... the sum of everything before any discount": in the value stack the
    bundle is worth its regular price (97) while the launch price runs, so Total value €289,
    Today €27, You save €262; the order page shows "Total value €289" beside "Today €27".
  - "there should be a box for every folder inside the bundle otherwise what bundle is it": a
    section "One bundle. Four folders of hits." before the player, a box per folder (GPT Image 2.6
    from the bundle's box, his short prompt; names and counts checked on the pictures:
    folder-pop / -hiphop / -dance / -vintage), with its count, its files in 12 keys and the
    artists with the most songs in it (funnel.ts `folders`).
  - "trascribe them in any key so they become 12000 MIDI Files": tools/top_hits_keys.py writes every
    file of the pack that has notes in all 12 keys (the notes moved -5 to +6 semitones, the rest
    byte for byte; 150 songs checked note by note). 998 of the 1,000 files: "LE SSERAFIM - Perfect
    Night" has no notes and "Ed Sheeran - I Don't Care … copy" is the same file twice. 998 × 12 =
    **11,976 MIDI files**, the number the pages say (not 12,000: two more real transcriptions would
    make it). They are the folder "3. All 12 Keys" (genre / song / 12 files) of the buyers' zip
    since 16:20 CET, beside the pack as it was; on the T7 "5. All 12 Keys (11,976 MIDI)". The zip
    before it is in R2 `top-hits-midi-bundle/backup/`. The launch emails still say "1,000 chord
    progressions" (true) and don't mention the keys.
  - "fix the notes of the 2 midi files and lets do 12000" (2026-11-15): the two files that kept the
    count at 11,976 are replaced in the pack (T7), the zip and the page's player (browse-v2).
    "LE SSERAFIM - Perfect Night (136 BPM - Dm)" has notes now: Bbmaj7 Am7 Gm7 Am7 D7sus4 from
    Hooktheory, checked against the iTunes preview with the TOP HITS 2 tools (key best of 12 by
    0.245, every chord agrees); the passing Am7 of bar 1 is 1 beat long as the best fit, 2 beats
    is nearly as likely (rhythm gap 0.003), so the tools' batch rule alone would have left it out:
    it is in on the user's order to fix it. "Ed Sheeran - I Don't Care … copy" (the same file
    twice) is now "Ed Sheeran - South of the Border (98 BPM - Dm)" (Dm F Bb Am7, the top Ultimate
    Guitar tab, passed every check; not in Vol. 2). Both are one 8-bar loop, as Vol. 2's files.
    The old files, the old list and an MP3 of each new file over the record's preview are on the
    T7 in "6. Replaced 2026-11-15 …". So 1,000 songs × 12 keys = **12,000 MIDI files** exactly; the
    pages, the FAQ and the launch email say 12,000.
  - Not done: no proof email (no reviews); no paid test order.
- 2026-11-18, the upgrade after the launch ("we should give the TOP HITS MIDI Bundle progressions in
  various rhythms, not just the ones in the song or in blocks", "and in all 12 keys too", "i wanna
  upgrade it now that it's launched and update the landing page too"): tools/top_hits_rhythms.py
  reads each of the 1,000 transcriptions, takes every chord WITH THE NOTES THE FILE PLAYS (its own
  voicing, bass and inversion; nothing re-harmonised), moves the changes to the beat and writes the
  song in 12 rhythms: Held Chords, Pop Eighths, Ballad Arpeggio, Trap Stabs, House Offbeat, Piano
  House, Reggaeton, Lo-Fi Lazy, Funk Stabs, Dotted Plucks, Synth Arp, Soul Push. Each rhythm in the
  12 keys: 1,000 × 12 × 12 = **144,000 MIDI files**, so with the 12,000 of All 12 Keys the pages
  say **156,000 MIDI files** (funnel.ts counts.files; per folder songs × 156). Songs at 140 BPM or
  more (138 of them) are written in half time. Chords shorter than a beat are left out of the
  rhythm versions; about 30 files are riffs or bass lines, whose "chords" are the line's notes.
  Checked by reading all 144,000 back: 12 keys × 12 files per song, every note is a note of that
  song's transcription (moved to the key), the key in each name is the folder's. Not checked by
  ear by the user. On the T7: "7. 12 Rhythms x 12 Keys (144,000 MIDI)"; in the buyers' zip the
  folder "4. 12 Rhythms x 12 Keys". The launch emails still say 12,000 (true for the keys).
- 2026-11-10: "crea nuovo funnel per TOP HITS MIDI Bundle con TUTTO." Built as Famous Beats v2 was
  (../famous-beats-bundle/BRIEF.md), with everything that funnel got in several rounds done at once:
  the Jazz page's CSS and section order, a player of every file, renders from the real box, six
  bonuses, the value stack, the 5-minute bonus, the tick boxes, two one-click upsells, the bonuses on
  the thank-you page and in /account, a VSL. First put beside the live page at
  /top-hits-midi-bundle/v2, waiting for a switch. The offer below is my proposal on the Jazz /
  Famous Beats pattern, not yet confirmed line by line by the user.
- 2026-11-10, asked whether to make the v2 the live page: "crea un funnel a parte". So no switch:
  the v2 became this funnel, with a slug of its own (`top-hits-chords`, my choice, confirmed by the user the same evening,
  "Sì, va bene": the headline's
  "the chords behind 1,000 hits"; the product's id in Products is already `top-hits`). The live
  funnel went back to exactly what it was before (its funnel.ts, downloads, thank-you page,
  /account shelf). /top-hits-midi-bundle/v2 and /v2/order redirect here (next.config.ts).
- 2026-11-10 evening (decided in the checkout-AOV session): the order page's 5-minute bonus is off
  ("direi di toglierlo", "ok quindi torniamo a B"; all four checkouts). On the Drum Kit nobody paid
  for an add-on with it (0 of 6 orders, 6 of 9 before) and every order was 27. The switch:
  `jazz-midi-pack/fiveMinBonus.ts` FIVE_MIN_BONUS_ON. So this funnel opened without it.

## The product (counted from the pack on the T7 drive, 2026-11-10)
Source: `…/02. All products/11. TOP HITS MIDI Bundle/1. Hitmaker MIDI Pack`, read by
`tools/extract_top_hits.py` (notes) and `grind-studio-landing-pages/scripts/top-hits-extract.mjs`
(the song list from the file names).
- **1,000 MIDI files** (.mid / .midi) in 4 folders: Modern Pop & Ballads 556, Hiphop, Trap & Urban 190,
  Dance & Electronic 146, Vintage Classics, Rock & Country 108.
- Chord progressions of hit songs, transcribed by hand and by ear, note for note: chords, voicings,
  inversions, passing changes. Pure MIDI: no audio, no samples, nothing taken from the recordings.
- File name = artist, song, BPM, key ("The Weeknd - Blinding Lights (172 BPM - Fm).mid").
- **478 artist credits** after merging typos (the ClickFunnels page said 496): the page says "470+ artists".
  Most files: Taylor Swift 29, The Weeknd 25, Sabrina Carpenter 15, SZA 14, Drake 13, Doja Cat 13,
  Ariana Grande 12, Dua Lipa 10, Bad Bunny 10, Billie Eilish 6.
- Keys: 495 files major, 500 minor (of the 995 with a key in the name). BPM in the names: 57 to 188.
- Length: median 16 bars (10 % are 4 bars or less, 90 % are 36 or less).
- Genres as the live page names them: Pop, Trap, R&B, Country, EDM, Afrobeats, K-pop, Latin.
- The zip (R2 `top-hits-midi-bundle/TOP HITS MIDI Bundle.zip`) also holds The Chord Progressions Bible
  (150 MIDI + 258 WAV), which is bonus 1 on the page.
- Since 2026-11-18 also in 12 rhythms × 12 keys: folder "4. 12 Rhythms x 12 Keys" of the zip (genre /
  song / key / 12 files), 144,000 MIDI files; 156,000 MIDI files in the bundle in all.
- Since 2026-11-15 also in all 12 keys: folder "3. All 12 Keys" of the zip, 1,000 songs × 12 = 12,000
  MIDI files (11,976 until the two files were replaced; Modern Pop & Ballads 6,672, Hiphop, Trap & Urban 2,280, Dance & Electronic 1,752,
  Vintage Classics, Rock & Country 1,296); the original key is one of the twelve.
- Any DAW (FL Studio, Ableton Live, Logic Pro, Pro Tools, Studio One, Cubase, Reaper, Bitwig, GarageBand),
  Mac and Windows, mobile DAWs that read MIDI. Commercial license; the MIDI files can't be resold or shared.
- A transcriber charges €10–30 per song and takes 3–7 days (the live page's comparison). Price per
  progression = the price ÷ 1,000 (€0.03 at €27), worked out by the page.

### Known faults in the pack (the product, not the page)
- (Fixed 2026-11-15.) "LE SSERAFIM - Perfect Night (136 BPM - Dm)).mid" had no notes: 999 files played in the page's player; 1,000 do now.
- Duplicates: "Ed Sheeran - I Don't Care … copy.mid" (replaced 2026-11-15 by South of the Border), "Starboy" twice (G and C), "Trevor Daniel - Falling"
  twice (A#m and Bbm), "SZA - Kill Bill" in two folders. 996 or so different songs in 1,000 files.
- No key in the name: Toni Braxton - Let It Flow, Kendrick Lamar - N95, Lil Durk - Free Jamell,
  Nadia Ali - Starkillers & Alex Kenji. No BPM: Stars On 45. No artist: "Incomplete", "One More Try".
  So the page says "in the file name", never "in every file name".
- Typos in file names (the page shows the names corrected, the path line shows the real file name):
  The Weekend, Adelle, Rhianna, Beyonc‚, Ti统to, Expresso…

## Not on these pages (from the ClickFunnels copy)
"Undetectable, unprovable, unstoppable", "zero copyright landmines, zero risk", "they sound identical
to the originals", "a collective of platinum-certified producers", "limited to 1,250 licenses", the
stock bar and the reserved-copy timer, "total real value €20,000", "free updates", the Wistia video
8s55snt7vw (it's the Drum Kit's after-purchase upsell video), the eight order-page reviews (two share
one title word for word; reviews are the user's call).

## The pages
- Landing `./[currency]` (words `./words.ts`): red bar, hero (video when there is one, four
  playable files, bullets, key, proof: 2,847 Drum Kit producers, 4,700+ list, 60 days), letter, product
  panel, what you get beside a playable roll, the player, how it works beside the folder path, what's
  inside, ✓/✗ chart, six bonuses, value stack, seal + license, after you pay, FAQ, final key.
- The player (`./SongPlayer.tsx`): the four folders, Prev / menu / Next, search by artist, song, key
  or BPM. It plays **the first 8 bars** of each file (the whole file when shorter) on the page's sine or
  piano; data in `public/funnels/top-hits-midi-bundle/browse-v1` (songs.json + 20 chunks, ~920 KB in all,
  fetched as needed). A new pack: a new folder name. The pictures and the player's data stay in the
  product's folder (`public/funnels/top-hits-midi-bundle`); `public/funnels/top-hits-chords` holds
  only the dashboard's screenshots (preview.webp, order.webp).
- Pictures: gpt_image_2_6 on Higgsfield from the real box (2026-11-10): `box3d-*` (cutout), `hero-*`
  (the box, a piano roll of chords, four real file names, checked letter by letter), `daw-*`, `stage-*`.
- VSL in the hero: Wistia x8jj158ddq since 2026-11-15 (47ic5iver0 before; 4:05, voice Aaron Sage on eleven_v4, every part checked with
  speech-to-text), script `./vsl/script-en.md`, made by `tools/top_hits_vsl.py voice|render` (the Jazz
  VSL's captions and synth; the demos are Blinding Lights, Kill Bill, Lucid Dreams and Someone Like You
  from `rolls.json`). No price amount in it. Still = the frame at 117.3 s (media 3exn59wcek). A first
  take with a black box around one picture is in Wistia as "OLD RENDER, not used" (pl1r8oioox,
  jfnydgc3hb): to delete.
- Order `./order/[currency]`: the Jazz order page as Famous Beats has it.
- Upsell 1 `./offer/[currency]`: the Jazz MIDI Pack, one click (the Drunk Swing Grooves page's
  twin; the Jazz bonuses and value stack are left out, a TOP HITS buyer has five of the six).
  Upsell 2 `./offer-2`: Famous Beats, the Drum Kit's page (midi-drum-kit/upsell.ts).
- Thank-you `./thank-you`: the live funnel's thank-you page (its words, shared) with this funnel's
  downloads: the bundle, the six bonuses, the add-ons, the upsells. `./download`: the zips from R2.
- The words of the sales, order and thank-you pages can be edited in the dashboard (funnel map →
  Edit; lib/editablePages.ts).

## Offer
- €27 / $27, the launch price (dashboard → Products, 2026-11-15; 97 from 11-08 to 11-15). Red "BLACK FRIDAY: 90% Sale Ends Soon" bar as on Jazz.
- Six bonuses in the price (`funnel.ts` includes.pack), values as the Jazz page has them (192 in all):
  The Chord Progressions Bible (€37; 150 MIDI + 258 WAV), MIDI Chord Pack (Jazz Edition) (€47; 2,304 MIDI),
  Anime & Video Games MIDI Pack (€47; 1,548 MIDI), Emotional Keys MIDI Bundle (€27; 195 MIDI),
  Drum Loops for Songwriting (€27; 47 WAV), ESSENTIAL MIDI Drum Patterns (€7; 163 MIDI).
  4,360 MIDI files and 305 WAV loops in the bonuses (counts from ../famous-beats-bundle/BRIEF.md).
- Value stack: the bundle at its own price + the bonuses' values; nothing else invented.
- 5-minute bonus: **off** since 2026-11-10 (see Decisions): no banner, no free add-on, and the
  Expansions aren't a tick box either. When FIVE_MIN_BONUS_ON is true again (`./fiveMinBonus.ts`,
  cookie fv_bonus_th): MIDI Drum Kit Expansions free (172 MIDI
  files: Afrobeat 61 patterns, 7 fragments, 5 complete beats; Lo-Fi 87; House 12).
- Tick boxes: Drunk Swing Grooves €7, HUSTLE Bundle €25 (its price on the live TOP HITS funnel; Jazz
  and Famous Beats sell it at €27). Emotional Keys is a bonus here; Famous Beats is the second upsell,
  not a tick box.
- Upsells: Jazz MIDI Pack €27, then Famous Beats Bundle €27.
- Guarantee: 60-day quality guarantee; "we fix it or replace it. If we can't, you get a refund". Never "money back".

## Where it's registered (a code funnel, like Drunk Swing Grooves)
- `funnel_items` (dashboard → Products), funnel `top-hits-chords`, added 2026-11-10: main `pack`
  (top-hits, 2700/2700 since 2026-11-15; 9700 before); add-ons `swing-grooves` (700), `hustle` (2500), `expansions` (700: the
  5-minute bonus's, never a tick box, so not sold while the bonus is off); upsells `jazz-pack` (2700) then `famous-beats` (2700).
  Seed: db/catalog.sql.
- lib/funnels.ts (CODE, with `label` for the dashboard's name), lib/catalog.ts (CODE_FUNNELS,
  CODE_UPSELLS), lib/account.ts (shelf), lib/bonusClock.ts, lib/codeFunnels.ts (card),
  lib/funnelMap.ts (SHOTS), lib/liveUrl.ts, lib/products.ts (RESERVED_SLUGS), proxy.ts
  (FUNNEL_HOME, CURRENCY_PAGES, APP_SEGMENTS, PUBLIC), lib/editablePages.ts + lib/editableIndex.ts,
  tools/funnel-previews.sh, and four rewrites for /top-hits-chords in
  grind-studio-landing-pages/vercel.json (the brand domain).
- Buyers get the product's own tag (`buyer-top-hits-midi-bundle`, as on the live funnel) and
  `owns-top-hits`; the six bonuses count as owned (lib/catalog.ts).

## Not done
- No paid test order yet: prices, add-ons, the 5-minute bonus and the downloads list were checked
  with the checkout's dry run and the thank-you page's preview; a real card or PayPal order through
  both upsells is still to make (a Preview deployment has Stripe's test keys).
- No Meta ads point here. A new ad: the bare link https://m.thegrind.studio/top-hits-chords and
  the standard string in URL parameters.
- No reviews on the pages (see above). The pack's faults are the product's, fixed apart.

## Numbers to compare with (the ClickFunnels copy, /top-hits-midi-bundle)
Both funnels run side by side: Analytics has each one's visitors, order page, checkout starts and sales.
