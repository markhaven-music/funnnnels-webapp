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
  tagline: "The most used jazz progressions, 13 voicings × 8 rhythms, all 12 keys",
  price: { eur: 27, usd: 27 },
  // The hero video: Wistia media, in Wistia's player (Vsl.tsx). Its thumbnail
  // is a frame of the video itself (84.5 s, "Watch the top note.", Wistia still
  // 5uwmgd0ifh; "no custom image", 2026-11-02), also saved as
  // public/funnels/jazz-midi-pack/vsl-en-1600.webp for link previews. Script: vsl/script-en.md.
  // lh4kzjb92h since 2026-11-01: voice Aaron on eleven_v4 and the demos on the
  // sine synth (the old cut mnet4ow8rz sounded "robotic and weird").
  vsl: { wistiaId: "lh4kzjb92h" },
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
  bumps: [
    {
      id: "top-hits",
      name: "TOP HITS MIDI Bundle",
      price: { eur: 27, usd: 27 },
      image: "/funnels/home/top-hits-box.webp",
      pitch: "1000 chord progressions from top hits: chords for pop, R&B, trap and more, beside your jazz ones.",
    },
    {
      id: "drum-kit",
      name: "MIDI Drum Kit",
      price: { eur: 27, usd: 27 },
      image: "/funnels/famous-beats-bundle/bump-drum-kit.webp",
      pitch: "1050 MIDI drum patterns modeled after Billboard producers: complete beats, patterns and fragments to put under your chords.",
    },
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
  ],
  value: { pack: 97 },
  // Paid downloads, served from /private only after Stripe confirms payment.
  files: {
    pack: "private/jazz-midi-pack/Jazz MIDI Pack.zip",
    "chord-pack": "private/jazz-midi-pack/Jazz MIDI Chord Pack.zip",
    "anime-pack": "private/jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip",
  } as Record<string, string>,
  // Too big for the deployment: objects in the R2 bucket (lib/r2.ts), uploaded from
  // ~/Desktop/midi jazz pack bonuses. Served through a 10-minute presigned link.
  remoteFiles: {
    bible: "jazz-midi-pack/The Chord Progressions Bible.zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    "drum-loops": "jazz-midi-pack/Drum Loops for Songwriting.zip",
  } as Record<string, string>,
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
  // Counted from ~/Desktop/Jazz MIDI Pack on 2026-11-05, after progressions 27-46
  // (minor and melancholic ones, and long forms up to 32 bars) were added: was 3,536 files, 26 progressions.
  counts: {
    files: 6256,
    // the pack + the bonuses' MIDI (6,256 + 2,304 + 150 + 1,548 + 195)
    total: 10453,
    progressions: 46,
    voicings: 13,
    rhythms: 8,
    genres: 4,
  },
  folders: [
    { name: "Chords in Original Key", files: 4784, what: "Every progression × 13 voicings × 8 rhythms, best-sounding first." },
    { name: "All 12 Keys", files: 552, what: "Every progression transposed to every key, voice-led pads." },
    { name: "Bass Lines", files: 138, what: "Walking, two-feel and bossa nova bass for each progression." },
    { name: "Combo Loops", files: 46, what: "Drop-2 comping + walking bass + ride, two choruses." },
    { name: "Genre Loops", files: 736, what: "Lofi, neo soul, trap soul and deep house — chords, bass, drums split." },
  ],
  progressions: [
    "ii-V-I Major", "ii-V-i Minor", "ii-V-I Short", "ii-V-I Down Whole Steps",
    "I-vi-ii-V Turnaround", "I-VI7-ii-V Secondary Dominant", "iii-vi-ii-V-I",
    "Tritone Substitution", "Tritone Turnaround", "Backdoor ii-V",
    "Cycle of Dominants", "Lady Bird Turnaround", "Tadd Dameron Turnaround",
    "Passing Diminished", "Autumn Leaves type", "Jazz Blues in F",
    "Minor Blues in C", "Bird Blues in F", "Rhythm Changes A", "Rhythm Changes Bridge",
    "Coltrane Changes", "Countdown ii-V Substitution", "Modal So What",
    "Minor Line Cliché", "II7#11 (A Train)", "Sus Dominant ii-V",
    "Minor Turnaround", "Minor ii-V Chain", "Jazz Andalusian Cadence", "Dorian Vamp",
    "Phrygian Vamp", "Neapolitan Minor", "Minor Circle of Fifths", "Lament Bass",
    "Minor Plagal", "Neo Soul Minor Loop", "Minor Deceptive Cadence", "Minor Lofi Ballad (8 bars)",
    "Minor Ending Tag", "Neo Soul 8-Bar", "Minor 12-Bar (Solar type)", "Minor Bossa 16-Bar (Blue Bossa type)",
    "Minor Ballad 16-Bar (Summertime type)", "32-Bar Minor Ballad", "32-Bar Ballad", "Rhythm Changes (32 bars)",
  ],
} as const;

/** The download keys an order unlocks: what it paid for, plus every bonus that has a file. */
export function unlocked(items: readonly string[]): string[] {
  const bonuses = items.includes("pack")
    ? funnel.bonuses.map((b) => b.id).filter((id) => funnel.files[id] || funnel.remoteFiles[id])
    : [];
  return [...new Set([...items, ...bonuses])];
}
