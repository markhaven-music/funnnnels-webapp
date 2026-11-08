// Drunk Swing Grooves: MIDI drum grooves with the drunk, laid-back feel of
// lofi and neo soul, sold on its own for €7 / $7 (2026-11-08, "creare un
// prodotto a parte di 7 euro e venderlo con upsell jazz kit etc"). First made
// as a Jazz order bump; the files come from
// ~/Desktop/Jazz MIDI Pack Tools/make_swing_grooves.py. Everything that isn't
// layout lives here: product, price, the add-on, the upsells, tracking, files.

export const funnel = {
  slug: "drunk-swing-grooves",
  product: "Drunk Swing Grooves",
  // The line under the name on the order form's product card.
  orderName: "Drunk Swing Grooves (211 MIDI Files)",
  brand: "GRIND STUDIO",
  // Same accounts as the other GRIND STUDIO funnels.
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
  tagline: "MIDI drum grooves with the drunk, laid-back feel of lofi and neo soul.",
  price: { eur: 7, usd: 7 },
  // Counted from the files (make_swing_grooves.py, 2026-11-08).
  // 80 grooves = 10 patterns × 2 snare placements (2 and 4, half-time) × 4 feels; 160 files with the multitrack copies.
  counts: { files: 211, grooves: 80, grooveFiles: 160, patterns: 10, feels: 4, templates: 31, bonus: 20 },
  // The tick-box add-on on step 2. Ids double as file keys and travel in
  // PayPal's 127-character custom_id, so keep them short.
  bumps: [
    {
      id: "record-samples",
      name: "Jazz Record Samples (122 WAV Loops)",
      headline: "YES! Add the Jazz Record Samples!",
      price: { eur: 7, usd: 7 },
      image: "/funnels/jazz-midi-pack/bump-records.webp",
      pitch: "122 WAV loops of jazz chord progressions in Rhodes and piano, made to sound like an old record. Chop them like a sample over your grooves, no clearance needed.",
    },
  ],
  // Paid zips in Cloudflare R2 (lib/r2.ts), handed out as 10-minute links once
  // the payment is confirmed. The grooves' zip is the Jazz bump's own.
  files: {
    pack: "jazz-midi-pack/Drunk Swing Grooves.zip",
    "record-samples": "jazz-midi-pack/Jazz Record Samples.zip",
    "jazz-pack": "jazz-midi-pack/Jazz MIDI Pack.zip",
    "famous-beats": "shared/Famous Beats Bundle (320 MIDI Beats).zip",
    // The Jazz MIDI Pack upsell's five bonuses, the zips its own funnel gives with it
    // (jazz-midi-pack/funnel.ts remoteFiles), as the MIDI Drum Kit's Jazz upsell does.
    "jazz-chords": "jazz-midi-pack/Jazz MIDI Chord Pack.zip",
    bible: "jazz-midi-pack/The Chord Progressions Bible.zip",
    "anime-pack": "jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    "drum-loops": "jazz-midi-pack/Drum Loops for Songwriting.zip",
  },
  // What a purchase brings beyond its own zip: the Jazz MIDI Pack upsell comes with
  // its five bonuses (2026-11-08, "Sì, aggiungili"), as on the Jazz funnel and the Drum Kit's upsell.
  includes: { "jazz-pack": ["jazz-chords", "bible", "anime-pack", "emotional-keys", "drum-loops"] } as Record<string, readonly string[]>,
  fileNames: {
    "jazz-chords": "MIDI Chord Pack (Jazz Edition)",
    bible: "The Chord Progressions Bible",
    "anime-pack": "Anime & Video Games MIDI Pack",
    "emotional-keys": "Emotional Keys MIDI Bundle",
    "drum-loops": "Drum Loops for Songwriting",
  } as Record<string, string>,
  // One-click upsells after the order (lib/funnels.ts nextStep), in order:
  // the Jazz MIDI Pack on this funnel's own page (./offer), then the Famous
  // Beats Bundle on the MIDI Drum Kit's page (midi-drum-kit/upsell.ts).
  offers: [
    { id: "jazz-pack", path: "offer", name: "Jazz MIDI Pack", price: { eur: 27, usd: 27 } },
    { id: "famous-beats", path: "offer-2", name: "Famous Beats Bundle (320 MIDI Beats)", price: { eur: 27, usd: 27 } },
  ],
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer", "buyer-drunk-swing-grooves"],
    thankYou: "/drunk-swing-grooves/thank-you",
    orderPage: "/drunk-swing-grooves/order",
  },
} as const;

/** An order's files: what it bought, plus what those bring along (`includes`). */
export const unlocked = (items: readonly string[]) => [...new Set(items.flatMap((i) => [i, ...(funnel.includes[i] ?? [])]))];
