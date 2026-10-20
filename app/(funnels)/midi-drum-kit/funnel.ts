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
  // The ClickFunnels page's Wistia video (hero). It's in English; other
  // languages swap it in landing.ts (VIDEOS).
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
  // Paid zips in Cloudflare R2 (lib/r2.ts; copied from the ClickFunnels
  // downloads), handed out as 10-minute links once the payment is confirmed.
  // HUSTLE is the same zip the TOP HITS funnel sells; the Chord Progressions
  // Bundle is three zips the Jazz funnel also gives (its bonuses).
  files: {
    pack: "midi-drum-kit/MIDI Drum Kit - Bundle.zip",
    expansions: "midi-drum-kit/EXPLORER Expansions (House, Lofi, Afrobeat).zip",
    hustle: "shared/HUSTLE MIDI Bundle.zip",
    chords: "jazz-midi-pack/The Chord Progressions Bible.zip",
    "drum-loops": "jazz-midi-pack/Drum Loops for Songwriting.zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    "famous-beats": "shared/Famous Beats Bundle (320 MIDI Beats).zip",
    "top-hits": "top-hits-midi-bundle/TOP HITS MIDI Bundle.zip",
  },
  // One-click upsells after the order, in ClickFunnels order (its
  // /famous-beats-bundle and /last-offer-top-hits-midi-bundle): each its own
  // page (./upsell.ts) and its own charge on the card just used. `id` doubles
  // as the file key; `path` is the page after /midi-drum-kit/.
  offers: [
    { id: "famous-beats", path: "offer", name: "Famous Beats Bundle (320 MIDI Beats)", price: { eur: 27, usd: 27 } },
    { id: "top-hits", path: "last-offer", name: "TOP HITS MIDI Bundle (1000 Chord Progressions)", price: { eur: 27, usd: 27 } },
  ],
  // Files an add-on brings beyond its own (its key in `files`).
  includes: { chords: ["drum-loops", "emotional-keys"] } as Record<string, readonly string[]>,
  // Download labels for the files that aren't the pack or an add-on.
  fileNames: { "drum-loops": "Drum Loops for Songwriting", "emotional-keys": "Emotional Keys MIDI Bundle" } as Record<string, string>,
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer", "buyer-midi-drum-kit"],
    // English addresses; the other languages put /<lang> in front (./i18n.ts).
    thankYou: "/midi-drum-kit/thank-you",
    orderPage: "/midi-drum-kit/order",
  },
} as const;

/** Everything an order's items unlock: each item and the files it includes. */
export const unlocked = (items: readonly string[]) => [...new Set(items.flatMap((i) => [i, ...(funnel.includes[i] ?? [])]))];
