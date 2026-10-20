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
  support: "support@thegrind.studio",
  guaranteeDays: 14,
  legal: {
    terms: "https://www.thegrind.studio/terms-and-conditions",
    privacy: "https://www.thegrind.studio/privacy-policy",
    refund: "https://www.thegrind.studio/refund-policy",
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
  ],
  // Paid zips in Cloudflare R2 (lib/r2.ts; copied from the ClickFunnels
  // downloads), handed out as 10-minute links once the payment is confirmed.
  files: {
    pack: "top-hits-midi-bundle/TOP HITS MIDI Bundle.zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    hustle: "shared/HUSTLE MIDI Bundle.zip",
    "famous-beats": "shared/Famous Beats Bundle (320 MIDI Beats).zip",
  },
  checkout: {
    leadTags: ["checkout-started"],
    buyerTags: ["buyer", "buyer-top-hits-midi-bundle"],
    thankYou: "/top-hits-midi-bundle/thank-you",
    orderPage: "/top-hits-midi-bundle/order",
  },
  counts: { progressions: 1000, artists: 496 },
} as const;
