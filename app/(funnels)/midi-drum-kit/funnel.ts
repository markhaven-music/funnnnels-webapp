// MIDI Drum Kit: a 1:1 copy of the ClickFunnels funnel
// thegrind.studio/midi-drum-kit-47ad56 → /spot-available-midi-drum-kit-ad-15m30,
// landing and order page, moved into our own checkout, in several languages.
// Everything that isn't layout or words lives here: product, prices, the
// three order bumps, tracking, files. Words are in ./copy/<lang>.ts.

export const funnel = {
  slug: "midi-drum-kit",
  product: "MIDI Drum Kit",
  // The line on the order form's product card, as on the box (was ClickFunnels'
  // "MIDI Drum Kit (27)" until 11-06), and the price it's shown crossed out from.
  orderName: "MIDI Drum Kit Bundle",
  // What test A of the step-2 test (./payTest.ts) shows instead, as before 11-06.
  orderNameBefore: "MIDI Drum Kit (27)",
  wasPrice: 297,
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
    terms: "/terms-and-conditions",
    privacy: "/privacy-policy",
    refund: "/refund-policy",
  },
  tagline: "1050 MIDI Drum Patterns + 6 Bonuses.",
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
      // 11-06: in place of "chords" on the order form, at $97 ("voglio testare");
      // whoever ticks it skips the TOP HITS upsell page (./upsell.ts).
      id: "top-hits",
      name: "TOP HITS MIDI Bundle (1000 Chord Progressions)",
      price: { eur: 97, usd: 97 },
      image: "/funnels/midi-drum-kit/bump-top-hits.webp",
      pitch: "1000 chord progressions from the biggest hits, as drag-and-drop MIDI files.",
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
    // The Jazz MIDI Pack upsell (offers below) and the bonuses its own funnel gives
    // with it, the same zips (jazz-midi-pack/funnel.ts remoteFiles).
    jazz: "jazz-midi-pack/Jazz MIDI Pack.zip",
    "jazz-chords": "jazz-midi-pack/Jazz MIDI Chord Pack.zip",
    "anime-pack": "jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip",
    bible: "jazz-midi-pack/The Chord Progressions Bible.zip",
    // Three more bonuses with the kit since 2026-11-12 ("rendiamola come jazz, aggiungi i bonus":
    // the MYSTERY Hooks Pack, Drunk Swing Grooves, and a PDF guide like the Jazz pack's), each its
    // own download beside the bundle's zip (`includes.pack`). The guide: tools/drum_kit_guide.py.
    "swing-grooves": "jazz-midi-pack/Drunk Swing Grooves.zip",
    hooks: "clickfunnels/MYSTERY Hooks Pack.zip",
    guide: "midi-drum-kit/MIDI Drum Kit - Guide.pdf",
  },
  // One-click upsells after the order, in ClickFunnels order (its
  // /famous-beats-bundle and /last-offer-top-hits-midi-bundle): each its own
  // page (./upsell.ts) and its own charge on the card just used. `id` doubles
  // as the file key; `path` is the page after /midi-drum-kit/.
  // 2026-11-08 ("metti MIDI Jazz Pack come oto upsell in MIDI Drum Kit", first,
  // €27): the Jazz MIDI Pack with its five bonus zips, on its own page in the Jazz
  // look ([lang]/jazz-offer), before Famous Beats.
  offers: [
    { id: "jazz", path: "jazz-offer", name: "Jazz MIDI Pack", price: { eur: 27, usd: 27 } },
    { id: "famous-beats", path: "offer", name: "Famous Beats Bundle (320 MIDI Beats)", price: { eur: 27, usd: 27 } },
    { id: "top-hits", path: "last-offer", name: "TOP HITS MIDI Bundle (1000 Chord Progressions)", price: { eur: 27, usd: 27 } },
  ],
  // Files an add-on brings beyond its own (its key in `files`).
  // `pack`: every buyer of the kit, those before 2026-11-12 too (their /account shelf shows them).
  includes: { pack: ["swing-grooves", "hooks", "guide"], chords: ["drum-loops", "emotional-keys"], jazz: ["jazz-chords", "bible", "anime-pack", "emotional-keys", "drum-loops"] } as Record<string, readonly string[]>,
  // Download labels for the files that aren't the pack or an add-on.
  fileNames: {
    "drum-loops": "Drum Loops for Songwriting",
    "emotional-keys": "Emotional Keys MIDI Bundle",
    "jazz-chords": "MIDI Chord Pack (Jazz Edition)",
    bible: "The Chord Progressions Bible",
    "anime-pack": "Anime & Video Games MIDI Pack",
    "swing-grooves": "Bonus: Drunk Swing Grooves (211 MIDI Files)",
    hooks: "Bonus: MYSTERY Hooks Pack (17 WAV Hooks)",
    guide: "Bonus: MIDI Drum Kit Guide (PDF)",
  } as Record<string, string>,
  checkout: {
    leadTags: ["checkout-started"],
    // buyer-midi-drum-kit starts the after-purchase emails; owns-midi-drum-kit
    // (also on ClickFunnels' Drum Kit buyers, 2026-11-02) starts nothing: it's
    // what the Drum Kit broadcasts leave out.
    buyerTags: ["buyer", "buyer-midi-drum-kit", "owns-midi-drum-kit"],
    // English addresses; the other languages put /<lang> in front (./i18n.ts).
    thankYou: "/midi-drum-kit/thank-you",
    orderPage: "/midi-drum-kit/order",
  },
} as const;

/** Everything an order's items unlock: each item and the files it includes. */
export const unlocked = (items: readonly string[]) => [...new Set(items.flatMap((i) => [i, ...(funnel.includes[i] ?? [])]))];
