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
- 2026-11-10: "crea nuovo funnel per TOP HITS MIDI Bundle con TUTTO." Built as Famous Beats v2 was
  (../famous-beats-bundle/BRIEF.md), with everything that funnel got in several rounds done at once:
  the Jazz page's CSS and section order, a player of every file, renders from the real box, six
  bonuses, the value stack, the 5-minute bonus, the tick boxes, two one-click upsells, the bonuses on
  the thank-you page and in /account, a VSL. First put beside the live page at
  /top-hits-midi-bundle/v2, waiting for a switch. The offer below is my proposal on the Jazz /
  Famous Beats pattern, not yet confirmed line by line by the user.
- 2026-11-10, asked whether to make the v2 the live page: "crea un funnel a parte". So no switch:
  the v2 became this funnel, with a slug of its own (`top-hits-chords`, my choice: the headline's
  "the chords behind 1,000 hits"; the product's id in Products is already `top-hits`). The live
  funnel went back to exactly what it was before (its funnel.ts, downloads, thank-you page,
  /account shelf). /top-hits-midi-bundle/v2 and /v2/order redirect here (next.config.ts).

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
- Any DAW (FL Studio, Ableton Live, Logic Pro, Pro Tools, Studio One, Cubase, Reaper, Bitwig, GarageBand),
  Mac and Windows, mobile DAWs that read MIDI. Commercial license; the MIDI files can't be resold or shared.
- A transcriber charges €10–30 per song and takes 3–7 days (the live page's comparison). Price per
  progression = the price ÷ 1,000 (€0.10 at €97), worked out by the page.

### Known faults in the pack (the product, not the page)
- "LE SSERAFIM - Perfect Night (136 BPM - Dm)).mid" has no notes: 999 files play in the page's player.
- Duplicates: "Ed Sheeran - I Don't Care … copy.mid", "Starboy" twice (G and C), "Trevor Daniel - Falling"
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
  playable files, bullets, key, proof: 2,847 Drum Kit producers, 4,700+ list, 14 days), letter, product
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
- VSL in the hero: Wistia 47ic5iver0 (4:05, voice Aaron Sage on eleven_v4, every part checked with
  speech-to-text), script `./vsl/script-en.md`, made by `tools/top_hits_vsl.py voice|render` (the Jazz
  VSL's captions and synth; the demos are Blinding Lights, Kill Bill, Lucid Dreams and Someone Like You
  from `rolls.json`). No price amount in it. Still = the frame at 116 s (media z84gwhhsa9). A first
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
- €97 / $97 (dashboard → Products). Red "BLACK FRIDAY: 90% Sale Ends Soon" bar as on Jazz.
- Six bonuses in the price (`funnel.ts` includes.pack), values as the Jazz page has them (192 in all):
  The Chord Progressions Bible (€37; 150 MIDI + 258 WAV), MIDI Chord Pack (Jazz Edition) (€47; 2,304 MIDI),
  Anime & Video Games MIDI Pack (€47; 1,548 MIDI), Emotional Keys MIDI Bundle (€27; 195 MIDI),
  Drum Loops for Songwriting (€27; 47 WAV), ESSENTIAL MIDI Drum Patterns (€7; 163 MIDI).
  4,360 MIDI files and 305 WAV loops in the bonuses (counts from ../famous-beats-bundle/BRIEF.md).
- Value stack: the bundle at its own price + the bonuses' values; nothing else invented.
- 5-minute bonus (`./fiveMinBonus.ts`, cookie fv_bonus_th): MIDI Drum Kit Expansions free (172 MIDI
  files: Afrobeat 61 patterns, 7 fragments, 5 complete beats; Lo-Fi 87; House 12).
- Tick boxes: Drunk Swing Grooves €7, HUSTLE Bundle €25 (its price on the live TOP HITS funnel; Jazz
  and Famous Beats sell it at €27). Emotional Keys is a bonus here; Famous Beats is the second upsell,
  not a tick box.
- Upsells: Jazz MIDI Pack €27, then Famous Beats Bundle €27.
- Guarantee: 14-day quality guarantee; "we fix it or replace it. If we can't, you get a refund". Never "money back".

## Where it's registered (a code funnel, like Drunk Swing Grooves)
- `funnel_items` (dashboard → Products), funnel `top-hits-chords`, added 2026-11-10: main `pack`
  (top-hits, 9700/9700); add-ons `swing-grooves` (700), `hustle` (2500), `expansions` (700: the
  5-minute bonus, never a tick box); upsells `jazz-pack` (2700) then `famous-beats` (2700).
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

- 2026-11-10: the order page's 5-minute bonus is off ("direi di toglierlo", "ok quindi torniamo a B"; all four checkouts). On the Drum Kit nobody paid for an add-on with it (0 of 6 orders, 6 of 9 before) and every order was 27. The switch: `jazz-midi-pack/fiveMinBonus.ts` FIVE_MIN_BONUS_ON.
