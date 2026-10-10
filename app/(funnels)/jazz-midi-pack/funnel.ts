// Everything about this funnel that isn't layout: the product, the prices,
// what the opt-in tags a contact with. Funnel #2 starts as a copy of this folder.

export const funnel = {
  slug: "jazz-midi-pack",
  product: "Jazz MIDI Pack",
  price: { eur: 27, usd: 27 },
  checkoutOpen: false, // Phase 2 turns the Buy button on
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
