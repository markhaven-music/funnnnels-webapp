// MIDI Drum Kit: a 1:1 copy of the ClickFunnels funnel
// thegrind.studio/midi-drum-kit-47ad56 → /spot-available-midi-drum-kit-ad-15m30,
// landing and order page, moved into our own checkout, in several languages.
// Everything that isn't layout or words lives here: product, prices, the
// three order bumps, tracking, files. Words are in ./copy/<lang>.ts.

export const funnel = {
  slug: "midi-drum-kit",
  product: "MIDI Drum Kit",
  // The line on the order form's product card (as on ClickFunnels).
  orderName: "MIDI Drum Kit (27)",
  brand: "GRIND STUDIO",
  // Same accounts as the other Grind Studio funnels.
  tracking: {
    metaPixelId: "1679148316291540",
    clarityId: "yum5a2rsel",
    neoSnippet: "https://t.thegrind.studio/api/s/3d5ba6a05e6bcaea",
  },
  // The ClickFunnels page's Wistia video (hero). It's in English.
  wistiaId: "xeyd5v0tsm",
  support: "support@thegrind.studio",
  guaranteeDays: 14,
  legal: {
    terms: "https://www.thegrind.studio/terms-and-conditions",
    privacy: "https://www.thegrind.studio/privacy-policy",
    refund: "https://www.thegrind.studio/refund-policy",
  },
  tagline: "1050 MIDI Drum Patterns + 3 Bonuses.",
  // ClickFunnels sells in euros only; dollars follow the €27 / $27 rule (lib/geo.ts).
  price: { eur: 27, usd: 27 },
  // The three tick-box offers on step 2, in ClickFunnels order. Ids double as
  // file keys and travel in PayPal's 127-character custom_id, so keep them short.
  // Names stay English in every language: they're product names.
  bumps: [
    {
      id: "expansions",
      name: "MIDI Drum Kit Expansions (House, Lo-Fi, Afrobeat)",
      price: { eur: 7, usd: 7 },
      image: "/funnels/midi-drum-kit/bump-expansions.webp",
      pitch: "3 MIDI Drum Kit Expansions: Complete Beats for House, Lo-Fi and Afrobeat.",
    },
    {
      id: "hustle",
      name: "HUSTLE Bundle (31 MIDI Packs)",
      price: { eur: 25, usd: 25 },
      image: "/funnels/midi-drum-kit/bump-hustle.webp",
      pitch: "31 professional MIDI packs: jazz, trap, hip-hop, lofi, pop and more.",
    },
    {
      id: "chords",
      name: "Chord Progressions Bundle (750 Songs)",
      price: { eur: 25, usd: 25 },
      image: "/funnels/midi-drum-kit/bump-chords.webp",
      pitch: "The chord progressions of 750 of the best songs, plus the Chord Progressions Bible, Drum Loops and 3 Emotional Keys packs.",
    },
  ],
  // Paid zips in the private Supabase bucket "product-files" (lib/products.ts
  // BUCKET), handed out as 60-second signed links once the payment is confirmed.
  // HUSTLE is the same zip the TOP HITS funnel sells.
  files: {
    pack: "midi-drum-kit/MIDI Drum Kit.zip",
    expansions: "midi-drum-kit/MIDI Drum Kit Expansions.zip",
    hustle: "top-hits-midi-bundle/HUSTLE MIDI Bundle.zip",
    chords: "midi-drum-kit/Chord Progressions Bundle.zip",
  },
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer", "buyer-midi-drum-kit"],
    // English addresses; the other languages put /<lang> in front (./i18n.ts).
    thankYou: "/midi-drum-kit/thank-you",
    orderPage: "/midi-drum-kit/order",
  },
} as const;
