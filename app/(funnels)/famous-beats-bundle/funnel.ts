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
  },
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
