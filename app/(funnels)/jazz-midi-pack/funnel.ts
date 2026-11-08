// Everything about this funnel that isn't layout: the product, the prices,
// what the opt-in tags a contact with. Funnel #2 starts as a copy of this folder.

export const funnel = {
  slug: "jazz-midi-pack",
  product: "Jazz MIDI Pack",
  brand: "GRIND STUDIO",
  // Same accounts as the Grind Studio landings (grind-studio-landing-pages/src/lib/site.ts).
  tracking: {
    metaPixelId: "1679148316291540",
    clarityId: "yum5a2rsel",
    neoSnippet: "https://t.thegrind.studio/api/s/3d5ba6a05e6bcaea",
  },
  support: "support@thegrind.studio",
  guaranteeDays: 14,
  legal: {
    terms: "/terms-and-conditions",
    privacy: "/privacy-policy",
    refund: "/refund-policy",
  },
  tagline: "The most used jazz progressions, 12 voicings × 8 rhythms, all 12 keys",
  price: { eur: 27, usd: 27 },
  // The hero video: Wistia media, in Wistia's player (Vsl.tsx). Its thumbnail
  // is a frame of the video itself (85.3 s, "Watch the top note.", Wistia still
  // kogs5rd7zh since 2026-11-05; "no custom image", 2026-11-02), also saved as
  // public/funnels/jazz-midi-pack/vsl-en-1600.webp for link previews. Script: vsl/script-en.md.
  // lh4kzjb92h since 2026-11-01: voice Aaron on eleven_v4 and the demos on the
  // sine synth (the old cut mnet4ow8rz sounded "robotic and weird").
  // u5f87ncaux since 2026-11-05: the same script with today's pack (10,496 files, 12 voicings, the lower
  // Best Voicing in the demos, six bonuses with the PDF guide, no "grand piano"), re-voiced with Aaron
  // ("cambia anche la VSL con il nuovo numero di files"). mvptgv9u24 was the cut with five bonuses.
  vsl: { wistiaId: "u5f87ncaux" },
  // The old €9 tick-box offer. Since 2026-10-16 the checkout no longer shows it
  // (the Chord Pack is bonus 1); it stays so orders that bought it still verify.
  bump: {
    id: "chord-pack",
    name: "Jazz MIDI Chord Pack",
    price: { eur: 9, usd: 9 },
    pitch:
      "All 12 major/minor key pairs in six folders: best voicing, best voicing with a smooth bass, sevenths, extended, altered & borrowed chords, and progressions. Same voice-leading as the main pack.",
  },
  // The order page's tick-box offers since 2026-11-05 ("aggiungi order bumps"):
  // products sold on their own elsewhere, none of them a bonus here, at the
  // price their own funnels ask (never below €27, the user's rule). Prices and
  // names as dashboard → Products has them (funnel_items) win; `id` is the
  // file key, and funnel_items.product the zip it hands out.
  // The two €7 / $7 add-ons first (2026-11-08, "fai 1 e 2"): made for this pack and sold
  // only here (the €27 floor is for products sold on their own elsewhere). Built by
  // ~/Desktop/Jazz MIDI Pack Tools/make_record_samples.py and make_swing_grooves.py,
  // zips in R2 under jazz-midi-pack/.
  bumps: [
    {
      id: "record-samples",
      name: "Jazz Record Samples (122 WAV Loops)",
      price: { eur: 7, usd: 7 },
      image: "/funnels/jazz-midi-pack/bump-records.webp",
      pitch: "This pack's progressions as 122 WAV loops in Rhodes and piano, made to sound like an old record. Chop them like a sample, no clearance needed.",
    },
    {
      id: "swing-grooves",
      name: "Drunk Swing Grooves (211 MIDI Files)",
      price: { eur: 7, usd: 7 },
      image: "/funnels/jazz-midi-pack/bump-grooves.webp",
      pitch: "The drunk, J Dilla-style swing of lofi and neo soul: 80 MIDI drum grooves (snare on 2 and 4 and half-time, 4 feels incl. quintuplet swing, drum rack and multitrack) and 31 groove templates for any MIDI. Snare on the beat, everything else laid back.",
    },
    {
      id: "top-hits",
      name: "TOP HITS MIDI Bundle",
      price: { eur: 27, usd: 27 },
      image: "/funnels/home/top-hits-box.webp",
      pitch: "1000 chord progressions from top hits: chords for pop, R&B, trap and more, beside your jazz ones.",
    },
    // The MIDI Drum Kit add-on left on 2026-11-08 ("è difficile che lo prendano"); no Jazz order had taken it.
    {
      id: "hustle",
      name: "HUSTLE Bundle (31 MIDI Packs)",
      price: { eur: 27, usd: 27 },
      image: "/funnels/midi-drum-kit/bump-hustle.webp",
      pitch: "31 professional MIDI packs: jazz, trap, hip-hop, lofi, pop and more.",
    },
  ],
  // Free with every pack. `id` is the download key in `files` or `remoteFiles`.
  // `midi`, `count` and `inside` are counted from the files (2026-11-01); the bonus
  // cards show `inside` and play the roll `bonus<n>` (rolls.json) or, for the
  // drum loops, the clips in public/funnels/jazz-midi-pack/loops.
  // `value`: what each item is worth in the offer summary's value stack, the
  // same number in € and $ (the user asked for a crossed-out total on
  // 2026-11-01, "come pagina MIDI Drum Kit").
  bonuses: [
    {
      id: "chord-pack",
      name: "MIDI Chord Pack (Jazz Edition)",
      count: "2,304 MIDI files",
      midi: 2304,
      value: 47,
      inside: ["2,304 MIDI files", "All 12 major/minor key pairs", "6 folders per key: best voicing, smooth bass, sevenths, extended, altered, progressions"],
    },
    {
      id: "bible",
      name: "The Chord Progressions Bible",
      count: "150 MIDI files + 258 WAV loops",
      midi: 150,
      value: 37,
      inside: ["150 MIDI files: 50 progressions × block chords, arpeggio, arrangement", "258 piano and e-piano WAV loops", "PDF cheat sheet"],
    },
    {
      id: "anime-pack",
      name: "Anime & Video Games MIDI Pack",
      count: "1,548 MIDI files",
      midi: 1548,
      value: 47,
      inside: ["1,548 MIDI files in all 12 keys", "Anime: royal road, Marusa, Komuro, Canon", "Video game: victory fanfare, Lydian wonder, boss battle, dungeon"],
    },
    {
      id: "emotional-keys",
      name: "Emotional Keys MIDI Bundle",
      count: "195 MIDI files",
      midi: 195,
      value: 27,
      inside: ["195 MIDI files in 3 volumes", "Each: 20 songstarters, 20 chord progressions, 25 melodies", "An MP3 preview of every file"],
    },
    {
      id: "drum-loops",
      name: "Drum Loops for Songwriting",
      count: "47 WAV loops",
      midi: 0,
      value: 27,
      inside: ["47 WAV drum loops, BPM in every name", "Pop & ballads, hip hop & trap, dance & electronic, vintage & rock"],
    },
    // The PDF guide inside the pack's zip (make_guide.py), a bonus since 2026-11-05 ("aggiungi la guida ai bonus").
    // No file of its own: it comes with the pack, so unlocked() skips it.
    {
      id: "guide",
      name: "The Jazz MIDI Pack Guide (PDF)",
      count: "PDF guide, every progression charted",
      midi: 0,
      value: 17,
      inside: ["How voice leading works, in one page", "The 12 voicings and 8 rhythms: what each is for", "Every progression with its key, length and chords, bar by bar"],
    },
  ],
  value: { pack: 97 },
  // None ship with the deployment any more: private/ is git-ignored, so a deploy
  // made anywhere but the main checkout left the zips out and every Jazz download
  // answered 503 (a buyer wrote in, 2026-11-08). All of them are in R2 now.
  files: {} as Record<string, string>,
  // Objects in the R2 bucket (lib/r2.ts): the pack and the small bonuses from
  // private/jazz-midi-pack, the big ones from ~/Desktop/midi jazz pack bonuses.
  // Served through a 10-minute presigned link. Re-upload here after a rebuild.
  remoteFiles: {
    pack: "jazz-midi-pack/Jazz MIDI Pack.zip",
    "chord-pack": "jazz-midi-pack/Jazz MIDI Chord Pack.zip",
    "anime-pack": "jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip",
    bible: "jazz-midi-pack/The Chord Progressions Bible.zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    "drum-loops": "jazz-midi-pack/Drum Loops for Songwriting.zip",
    // The one-click upsell's zip (offers below), the one the other funnels sell.
    "famous-beats": "shared/Famous Beats Bundle (320 MIDI Beats).zip",
  } as Record<string, string>,
  // One-click upsell after the order (2026-11-07, "Solo Famous Beats"): the
  // MIDI Drum Kit's Famous Beats page (midi-drum-kit/upsell.ts) selling for
  // this funnel, as after the TOP HITS order. Not a tick-box offer here, so
  // nobody sees it twice. Price and name: dashboard → Products (funnel_items).
  offers: [{ id: "famous-beats", path: "offer", name: "Famous Beats Bundle (320 MIDI Beats)", price: { eur: 27, usd: 27 } }],
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer"],
    thankYou: "/jazz-midi-pack/thank-you",
    // Its own page since 2026-10-16, like the ClickFunnels funnels: every CTA goes here.
    orderPage: "/jazz-midi-pack/order",
  },
  optin: {
    source: "jazz-midi-pack",
    tags: ["lead", "free-sample"],
    download: "/funnels/jazz-midi-pack/free-sample.zip",
  },
  // Counted from ~/Desktop/Jazz MIDI Pack on 2026-11-05: 3,536 files and 26 progressions until then; 27-46
  // (minor and melancholic, long forms) and 47-82 (standards' changes from a web search, neo soul / lofi
  // staples, reharmonisations) added that day, Best Voicing a fourth lower and repeated chords held.
  counts: {
    files: 10496,
    // the pack + the bonuses' MIDI (10,496 + 2,304 + 150 + 1,548 + 195)
    total: 14693,
    progressions: 82,
    voicings: 12,
    rhythms: 8,
    genres: 4,
  },
  folders: [
    { name: "Progressions", files: 7872, what: "Every progression in its usual key × 12 voicings × 8 rhythms, best-sounding first." },
    { name: "Progressions in Every Key", files: 984, what: "Every progression transposed to every key, voice-led pads." },
    { name: "Bass Lines", files: 246, what: "Walking, two-feel and bossa nova bass for each progression." },
    { name: "Combo Loops", files: 82, what: "Drop-2 comping + walking bass + ride, two choruses." },
    { name: "Genre Loops", files: 1312, what: "Lofi, neo soul, trap soul and deep house — chords, bass, drums split." },
  ],
  // In the pack's order since 2026-11-05: best first (make_pack.py GROUPS).
  progressions: [
    "Fly Me to the Moon Type", "Autumn Leaves Type (relative major-minor)", "Misty Type (32-bar ballad)",
    "Black Orpheus Type", "Minor Bossa 16-Bar (Blue Bossa Type)", "Minor Ballad 16-Bar (Summertime Type)",
    "Days of Wine and Roses Type", "All the Things You Are Type", "Satin Doll Type", "Girl from Ipanema Type",
    "Someday My Prince Will Come Type", "Just the Two of Us Type (IV-III7-vi)", "Royal Road (IV-V-iii-vi)",
    "Sad Lofi vi-IV-I-V", "Neo Soul 4-3-2-1", "Minor Circle of Fifths", "Minor Lofi Ballad (8 bars)",
    "I-vi-ii-V Turnaround", "ii-V-I Major", "ii-V-i Minor", "In a Sentimental Mood Type", "My Funny Valentine Type",
    "Stella by Starlight Type", "32-Bar Ballad (AABA)", "32-Bar Minor Ballad (AABA)", "How Insensitive Type",
    "Beautiful Love Type", "Here's That Rainy Day Type", "Lullaby of Birdland Type",
    "You Don't Know What Love Is Type", "Alone Together Type", "Blue in Green Type",
    "Body and Soul Type (A section)", "Round Midnight Type (A section)", "Meditation Type", "Night and Day Type",
    "Dindi Type", "Rhythm Changes (Full 32 Bars)", "Minor 12-Bar (Solar Type)", "Minor Turnaround (i-VI-ii-V)",
    "I-VI7-ii-V Secondary Dominant", "iii-vi-ii-V-I", "I-III7-IV-iv", "ii-iv-V-I", "Minor Plagal (iv minor)",
    "Neo Soul Minor Loop", "Lament Bass (descending minor)", "Jazz Andalusian Cadence", "Minor Deceptive Cadence",
    "Minor Ending Tag", "Minor Line Cliché", "Backdoor ii-V", "Tritone Substitution", "Tritone Turnaround",
    "ii-V-I Short (2 beats each)", "Passing Diminished", "Cycle of Dominants", "II7#11 (A Train)",
    "Sus Dominant ii-V", "Jazz Blues in F", "Minor Blues in C", "Bird Blues in F", "Rhythm Changes A Section",
    "Rhythm Changes Bridge", "Dorian Vamp (i-IV)", "Phrygian Vamp (i-bII)", "Neapolitan Minor",
    "Minor ii-V Chain (down whole steps)", "ii-V-I Down Whole Steps", "Lady Bird Turnaround",
    "Tadd Dameron Major Turnaround", "Chromatic Mediants I-bIII-bVI-V",
    "Major Thirds Cycle (Miss Jones Bridge Type)", "Cherokee Bridge Type",
    "Chromatic ii-V Side-Steps (Moment's Notice Type)", "Very Early Type", "Time Remembered Type", "Nardis Type",
    "Footprints Type", "Modal So What", "Coltrane ii-V Substitution (Countdown)", "Coltrane Changes (Giant Steps)",
  ],
} as const;

/** The download keys an order unlocks: what it paid for, plus every bonus that has a file. */
export function unlocked(items: readonly string[]): string[] {
  const bonuses = items.includes("pack")
    ? funnel.bonuses.map((b) => b.id).filter((id) => funnel.files[id] || funnel.remoteFiles[id])
    : [];
  return [...new Set([...items, ...bonuses])];
}

// The words of the order page's tick-box offers, by bump id (11-06: "le copy
// degli order bump falle meglio, le hai già in altri order bumps"): the Drum
// Kit order page's add-on copy (../midi-drum-kit/copy/en.ts) at this page's
// price. `{c}` is the currency sign, `**…**` bold. A bump without an entry
// shows "YES! Add the <name>!" and its `pitch`.
export const bumpCopy: Record<string, { headline: string; body: string[] }> = {
  "top-hits": {
    headline: "YES! Add the TOP HITS MIDI Bundle!",
    body: [
      "1000 chord progressions from the biggest hits (Drake, Kendrick Lamar, Travis Scott, Lil Baby, The Weeknd and more) as **drag-and-drop MIDI files**. Put one under your drums and your beat has a hit's harmony. Add it now for just {c}27.",
      "Once you complete your order this box is gone: tick it now and the bundle lands in the same download.",
    ],
  },
  "drum-kit": {
    headline: "YES! Add the MIDI Drum Kit Bundle!",
    body: [
      "1050 MIDI drum patterns modeled after Billboard producers: **complete beats, patterns and fragments**. Drag them under your jazz chords and the beat is done. Add it now for just {c}27.",
    ],
  },
  hustle: {
    headline: "YES! I Also Want 31 Musical MIDI Packs!",
    body: [
      "The 'HUSTLE' Bundle includes **31 Professional MIDI Packs** with Musical Ideas, Chord Progressions and Melodies. Jazz, Trap, Hiphop, Lofi, Pop and more. Each MIDI Pack is {c}29 (total {c}899) but you can get them all right now for just {c}27!!",
      "Limited to the first 150 orders.",
    ],
  },
};
