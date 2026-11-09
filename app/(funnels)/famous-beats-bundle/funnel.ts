// Famous Beats Bundle: the Astro landing m.thegrind.studio/famous-beats-bundle
// (grind-studio-landing-pages, copied 1:1 by tools/astro_clone.mjs into
// ./astro/landing.ts), then a copy of ClickFunnels' /order-famous-beats-bundle
// on the TOP HITS order template (same ClickFunnels template), moved into our
// own checkout on 2026-11-02 so it's tracked here. Everything that isn't
// layout lives here: product, prices, the three order bumps, tracking, files.

export const funnel = {
  slug: "famous-beats-bundle",
  product: "Famous Beats Bundle",
  // The line under the name on the order form's product card (as on ClickFunnels).
  orderName: "Famous Beats Bundle",
  brand: "GRIND STUDIO",
  // Same accounts as the Astro page, TOP HITS and the Jazz funnel.
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
  tagline: "Bundle of 32 volumes of Famous Beats MIDI Pack.",
  // ClickFunnels sells in euros only; dollars follow the €27 / $27 rule (lib/geo.ts).
  price: { eur: 27, usd: 27 },
  // The three tick-box offers on step 2, in ClickFunnels order. Ids double as
  // file keys and travel in PayPal's 127-character custom_id, so keep them short.
  bumps: [
    // Since 2026-11-09 ("più simile a quello jazz"): Drunk Swing Grooves €7 as on the Jazz
    // order page, and the Expansions, which the order page gives free for 5 minutes
    // (./fiveMinBonus.ts) and never shows as a tick box. Which add-ons are offered,
    // and at what price, is dashboard → Products' (funnel_items); these give their pictures.
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
    {
      id: "emotional-keys",
      name: "Emotional Keys MIDI Bundle",
      headline: "YES! Add Emotional Keys MIDI Bundle!",
      price: { eur: 7, usd: 7 },
      image: "/funnels/top-hits-midi-bundle/bump-emotional-keys.webp",
      pitch: "Emotional Keys Vol.1, Vol.2 and Vol.3, by pianist Orazio Saracino.",
    },
    {
      id: "drum-kit",
      name: "MIDI Drum Kit Bundle",
      headline: "YES! Add MIDI Drum Kit Bundle!",
      price: { eur: 25, usd: 25 },
      image: "/funnels/famous-beats-bundle/bump-drum-kit.webp",
      pitch: "1050 MIDI drum patterns modeled after Billboard producers: complete beats, patterns and fragments.",
    },
    {
      id: "hustle",
      name: "HUSTLE Bundle (31 MIDI Packs)",
      headline: "YES! I Also Want 31 Musical MIDI Packs !",
      price: { eur: 25, usd: 25 },
      image: "/funnels/top-hits-midi-bundle/bump-hustle.png",
      pitch: "31 professional MIDI packs: jazz, trap, hip-hop, lofi, pop and more.",
    },
  ],
  // Paid zips in Cloudflare R2 (lib/r2.ts), handed out as 10-minute links once
  // the payment is confirmed: the same zips the other funnels sell.
  files: {
    pack: "shared/Famous Beats Bundle (320 MIDI Beats).zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    "drum-kit": "midi-drum-kit/MIDI Drum Kit - Bundle.zip",
    hustle: "shared/HUSTLE MIDI Bundle.zip",
    "top-hits": "top-hits-midi-bundle/TOP HITS MIDI Bundle.zip",
    "swing-grooves": "jazz-midi-pack/Drunk Swing Grooves.zip",
    expansions: "midi-drum-kit/EXPLORER Expansions (House, Lofi, Afrobeat).zip",
    // The bundle's four free bonuses (2026-11-09), the zips the other funnels give.
    "essential-drums": "clickfunnels/ESSENTIAL MIDI Drum Patterns.zip",
    "chord-pack": "jazz-midi-pack/Jazz MIDI Chord Pack.zip",
    "drum-loops": "jazz-midi-pack/Drum Loops for Songwriting.zip",
    bible: "jazz-midi-pack/The Chord Progressions Bible.zip",
    "anime-pack": "jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip",
  },
  // What a purchase brings beyond its own zip: the bundle comes with its six bonuses
  // (2026-11-09, as the Jazz MIDI Pack comes with its own; six since "add more bonuses just like midi jazz pack").
  includes: { pack: ["essential-drums", "chord-pack", "emotional-keys", "drum-loops", "bible", "anime-pack"] } as Record<string, readonly string[]>,
  fileNames: {
    "essential-drums": "ESSENTIAL MIDI Drum Patterns",
    "chord-pack": "MIDI Chord Pack (Jazz Edition)",
    "emotional-keys": "Emotional Keys MIDI Bundle",
    "drum-loops": "Drum Loops for Songwriting",
    bible: "The Chord Progressions Bible",
    "anime-pack": "Anime & Video Games MIDI Pack",
    "swing-grooves": "Drunk Swing Grooves",
    expansions: "MIDI Drum Kit Expansions",
  } as Record<string, string>,
  // One-click upsell after the order (lib/funnels.ts nextStep): TOP HITS, the
  // product ClickFunnels' buyers of this bundle took next (neo: 11 of its
  // upsells), on the MIDI Drum Kit's TOP HITS page (midi-drum-kit/upsell.ts).
  offers: [{ id: "top-hits", path: "offer", name: "TOP HITS MIDI Bundle (1000 Chord Progressions)", price: { eur: 27, usd: 27 } }],
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer", "buyer-famous-beats-bundle"],
    thankYou: "/famous-beats-bundle/thank-you",
    orderPage: "/famous-beats-bundle/order",
  },
} as const;

/** An order's files: what it bought, plus what those bring along (`includes`). */
export const unlocked = (items: readonly string[]) => [...new Set(items.flatMap((i) => [i, ...(funnel.includes[i] ?? [])]))];
