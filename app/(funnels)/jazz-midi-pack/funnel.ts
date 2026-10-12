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
    terms: "https://www.thegrind.studio/terms-and-conditions",
    privacy: "https://www.thegrind.studio/privacy-policy",
    refund: "https://www.thegrind.studio/refund-policy",
  },
  tagline: "26 progressions × 13 voicings × 8 rhythms, all 12 keys",
  price: { eur: 27, usd: 27 },
  // The tick-box offer inside the checkout (ClickFunnels calls it an order bump).
  bump: {
    id: "chord-pack",
    name: "Jazz MIDI Chord Pack",
    price: { eur: 9, usd: 9 },
    pitch:
      "All 12 major/minor key pairs in six folders: best voicing, best voicing with a smooth bass, sevenths, extended, altered & borrowed chords, and progressions. Same voice-leading as the main pack.",
  },
  // Paid downloads, served from /private only after Stripe confirms payment.
  files: {
    pack: "private/jazz-midi-pack/Jazz MIDI Pack.zip",
    "chord-pack": "private/jazz-midi-pack/Jazz MIDI Chord Pack.zip",
  },
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer"],
    thankYou: "/jazz-midi-pack/thank-you",
  },
  optin: {
    source: "jazz-midi-pack",
    tags: ["lead", "free-sample"],
    download: "/funnels/jazz-midi-pack/free-sample.zip",
  },
  // Counted from ~/Desktop/Jazz MIDI Pack on 2026-10-10.
  counts: {
    files: 3536,
    progressions: 26,
    voicings: 13,
    rhythms: 8,
    genres: 4,
  },
  folders: [
    { name: "Chords in Original Key", files: 2704, what: "Every progression × 13 voicings × 8 rhythms, best-sounding first." },
    { name: "All 12 Keys", files: 312, what: "Every progression transposed to every key, voice-led pads." },
    { name: "Bass Lines", files: 78, what: "Walking, two-feel and bossa nova bass for each progression." },
    { name: "Combo Loops", files: 26, what: "Drop-2 comping + walking bass + ride, two choruses." },
    { name: "Genre Loops", files: 416, what: "Lofi, neo soul, trap soul and deep house — chords, bass, drums split." },
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
  ],
} as const;
