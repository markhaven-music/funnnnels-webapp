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
  // The hero video (vsl/script-en.md, made with tools/grooves_vsl.py, 2026-11-08), in Wistia's own player;
  // its still is a frame of the video (the two grids, "Same drum sounds.").
  vsl: { wistiaId: "tuqmnch1mn" },
  tagline: "MIDI drum grooves with the drunk, laid-back feel of lofi and neo soul.",
  price: { eur: 7, usd: 7 },
  // Counted from the files (make_swing_grooves.py, 2026-11-08).
  // 80 grooves = 10 patterns × 2 snare placements (2 and 4, half-time) × 4 feels; 160 files with the multitrack copies.
  counts: { files: 211, grooves: 80, grooveFiles: 160, patterns: 10, feels: 4, templates: 31, bonus: 20 },
  // The tick-box add-ons on step 2. Ids double as file keys and travel in
  // PayPal's 127-character custom_id, so keep them short. Since 2026-11-08 ("metti
  // anche MIDI Drum Kit, Famous Beats e Jazz MIDI Pack come order bumps invece di
  // jazz record samples"): €27 each, never below what they sell for elsewhere.
  // "famous-beats" and "jazz-pack" are also the upsells' ids: ticked here, that
  // upsell page skips itself (OrderForm.tsx fv_owned).
  bumps: [
    {
      id: "drum-kit",
      name: "MIDI Drum Kit Bundle",
      headline: "YES! Add MIDI Drum Kit Bundle!",
      price: { eur: 27, usd: 27 },
      image: "/funnels/famous-beats-bundle/bump-drum-kit.webp",
      pitch: "1050 MIDI drum patterns modeled after Billboard producers: complete beats, patterns and fragments.",
    },
    {
      id: "famous-beats",
      name: "Famous Beats Bundle (320 MIDI Beats)",
      headline: "YES! I want 320 Famous Beats!",
      price: { eur: 27, usd: 27 },
      image: "/funnels/top-hits-midi-bundle/bump-famous-beats.png",
      pitch: "32 packs, 320 MIDI transcriptions of famous drum beats.",
    },
    {
      id: "jazz-pack",
      name: "Jazz MIDI Pack",
      headline: "YES! Add the Jazz MIDI Pack!",
      price: { eur: 27, usd: 27 },
      image: "/funnels/jazz-midi-pack/bump-jazz.webp",
      pitch: "10,496 MIDI files of jazz chord progressions, voiced like a pianist plays them, with its 6 bonuses.",
    },
  ],
  // Paid zips in Cloudflare R2 (lib/r2.ts), handed out as 10-minute links once
  // the payment is confirmed. The grooves' zip is the Jazz bump's own.
  files: {
    pack: "jazz-midi-pack/Drunk Swing Grooves.zip",
    "record-samples": "jazz-midi-pack/Jazz Record Samples.zip",
    "drum-kit": "midi-drum-kit/MIDI Drum Kit - Bundle.zip",
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
