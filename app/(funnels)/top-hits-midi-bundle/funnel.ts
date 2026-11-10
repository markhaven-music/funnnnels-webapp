// TOP HITS MIDI Bundle: a 1:1 copy of the ClickFunnels funnel
// thegrind.studio/top-hits-midi-bundle--2ff37 → /order-top-hits-midi-bundle,
// landing and order page, moved into our own checkout. Everything that isn't
// layout lives here: product, prices, the three order bumps, tracking, files.

export const funnel = {
  slug: "top-hits-midi-bundle",
  product: "TOP HITS MIDI Bundle",
  // The line under the name on the order form's product card (as on ClickFunnels).
  orderName: "TOP HITS MIDI Bundle (1000 Chord Progressions)",
  brand: "GRIND STUDIO",
  // Same accounts as the Jazz funnel and the Grind Studio landings.
  tracking: {
    metaPixelId: "1679148316291540",
    clarityId: "yum5a2rsel",
    neoSnippet: "https://t.thegrind.studio/api/s/3d5ba6a05e6bcaea",
  },
  // The ClickFunnels page's Wistia video (hero).
  wistiaId: "8s55snt7vw",
  // The v2 page's hero video (vsl/script-en.md, tools/top_hits_vsl.py, 2026-11-10, 4:05, voice
  // Aaron Sage), in Wistia's own player; its still is a frame of the video (116 s).
  vsl: { wistiaId: "47ic5iver0" as string },
  support: "support@thegrind.studio",
  guaranteeDays: 14,
  legal: {
    terms: "/terms-and-conditions",
    privacy: "/privacy-policy",
    refund: "/refund-policy",
  },
  tagline: "Bundle of 1000 Chord Progressions from Top Hits.",
  // ClickFunnels sells in euros only; dollars follow the €27 / $27 rule (lib/geo.ts).
  price: { eur: 27, usd: 27 },
  // The three tick-box offers on step 2, in ClickFunnels order. Ids double as
  // file keys and travel in PayPal's 127-character custom_id, so keep them short.
  bumps: [
    {
      id: "emotional-keys",
      name: "Emotional Keys MIDI Bundle",
      headline: "YES! Add Emotional Keys MIDI Bundle!",
      price: { eur: 7, usd: 7 },
      image: "/funnels/top-hits-midi-bundle/bump-emotional-keys.webp",
      pitch: "Emotional Keys Vol.1, Vol.2 and Vol.3, by pianist Orazio Saracino.",
    },
    {
      id: "hustle",
      name: "HUSTLE Bundle (31 MIDI Packs)",
      headline: "YES! I Also Want 31 Musical MIDI Packs !",
      price: { eur: 25, usd: 25 },
      image: "/funnels/top-hits-midi-bundle/bump-hustle.png",
      pitch: "31 professional MIDI packs: jazz, trap, hip-hop, lofi, pop and more.",
    },
    {
      id: "famous-beats",
      name: "Famous Beats Bundle (320 MIDI Beats)",
      headline: "YES! I want 320 Famous Beats!",
      price: { eur: 27, usd: 27 },
      image: "/funnels/top-hits-midi-bundle/bump-famous-beats.png",
      pitch: "32 packs, 320 MIDI transcriptions of famous drum beats.",
    },
    // The v2 order page's (2026-11-10, "crea nuovo funnel per TOP HITS MIDI Bundle con TUTTO"):
    // Drunk Swing Grooves as a tick box, as on the Jazz and Famous Beats order pages, and the
    // Expansions, which the order page gives free for 5 minutes (./fiveMinBonus.ts) and never
    // shows as a tick box. Sold only once dashboard → Products lists them (funnel_items).
    {
      id: "swing-grooves",
      name: "Drunk Swing Grooves (211 MIDI Files)",
      headline: "YES! Add the Drunk Swing Grooves!",
      price: { eur: 7, usd: 7 },
      image: "/funnels/jazz-midi-pack/bump-grooves.webp",
      pitch: "80 MIDI drum grooves with the drunk, J Dilla-style swing of lofi and neo soul, plus 31 groove templates.",
    },
    {
      id: "expansions",
      name: "MIDI Drum Kit Expansions (House, Lo-Fi, Afrobeat)",
      headline: "YES! Add the MIDI Drum Kit Expansions!",
      price: { eur: 7, usd: 7 },
      image: "/funnels/midi-drum-kit/bump-expansions.webp",
      pitch: "172 more MIDI drum files: Afrobeat, Lo-Fi and House.",
    },
  ],
  // Paid zips in Cloudflare R2 (lib/r2.ts; copied from the ClickFunnels
  // downloads), handed out as 10-minute links once the payment is confirmed.
  files: {
    pack: "top-hits-midi-bundle/TOP HITS MIDI Bundle.zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    hustle: "shared/HUSTLE MIDI Bundle.zip",
    "famous-beats": "shared/Famous Beats Bundle (320 MIDI Beats).zip",
    "swing-grooves": "jazz-midi-pack/Drunk Swing Grooves.zip",
    expansions: "midi-drum-kit/EXPLORER Expansions (House, Lofi, Afrobeat).zip",
    // The v2 page's six free bonuses: the zips the Jazz and Famous Beats funnels give.
    "essential-drums": "clickfunnels/ESSENTIAL MIDI Drum Patterns.zip",
    "chord-pack": "jazz-midi-pack/Jazz MIDI Chord Pack.zip",
    "drum-loops": "jazz-midi-pack/Drum Loops for Songwriting.zip",
    bible: "jazz-midi-pack/The Chord Progressions Bible.zip",
    "anime-pack": "jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip",
    // The Jazz MIDI Pack upsell (./jazz-offer) and the bonuses it comes with.
    "jazz-pack": "jazz-midi-pack/Jazz MIDI Pack.zip",
  },
  // What a purchase brings beyond its own zip. V2_LIVE: the bundle's six bonuses are the v2
  // page's promise, so they unlock once that page is the live one (BRIEF.md "To switch").
  includes: {
    pack: ["bible", "chord-pack", "anime-pack", "emotional-keys", "drum-loops", "essential-drums"],
    "jazz-pack": ["chord-pack", "bible", "anime-pack", "emotional-keys", "drum-loops"],
  } as Record<string, readonly string[]>,
  fileNames: {
    bible: "The Chord Progressions Bible",
    "chord-pack": "MIDI Chord Pack (Jazz Edition)",
    "anime-pack": "Anime & Video Games MIDI Pack",
    "emotional-keys": "Emotional Keys MIDI Bundle",
    "drum-loops": "Drum Loops for Songwriting",
    "essential-drums": "ESSENTIAL MIDI Drum Patterns",
    "swing-grooves": "Drunk Swing Grooves",
    expansions: "MIDI Drum Kit Expansions",
    "jazz-pack": "Jazz MIDI Pack",
  } as Record<string, string>,
  // One-click upsell after the order (lib/funnels.ts nextStep): the MIDI Drum
  // Kit's Famous Beats page (midi-drum-kit/upsell.ts), skipped when the buyer
  // already ticked it as an add-on.
  // v2 adds the Jazz MIDI Pack before it (./jazz-offer, its own one-click page, as after the
  // MIDI Drum Kit and Drunk Swing Grooves orders). Which upsells run, and in which order,
  // is dashboard → Products' (funnel_items): until a "jazz-pack" row exists there, only Famous Beats does.
  offers: [
    { id: "jazz-pack", path: "jazz-offer", name: "Jazz MIDI Pack", price: { eur: 27, usd: 27 } },
    { id: "famous-beats", path: "offer", name: "Famous Beats Bundle (320 MIDI Beats)", price: { eur: 27, usd: 27 } },
  ],
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer", "buyer-top-hits-midi-bundle"],
    thankYou: "/top-hits-midi-bundle/thank-you",
    orderPage: "/top-hits-midi-bundle/order",
  },
  counts: { progressions: 1000, artists: 496 },
} as const;

/** The v2 page (./v2) is the live one: false until the switch (BRIEF.md "To switch"). */
export const V2_LIVE = false;

/** What a purchase brings along today: the bundle's own bonuses only once v2 is live; an upsell's (the Jazz pack's) always. */
export const includes: Record<string, readonly string[]> = V2_LIVE ? funnel.includes : { "jazz-pack": funnel.includes["jazz-pack"] };

/** An order's files: what it bought, plus what those bring along (`includes`). */
export const unlocked = (items: readonly string[]) => [...new Set(items.flatMap((i) => [i, ...(includes[i] ?? [])]))];
