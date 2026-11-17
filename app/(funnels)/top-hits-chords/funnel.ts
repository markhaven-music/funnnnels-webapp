import { priceIn, type Currency } from "@/lib/geo";
// TOP HITS MIDI Bundle, the new funnel (2026-11-10, "crea nuovo funnel per TOP HITS MIDI Bundle
// con TUTTO", then "crea un funnel a parte"): the same product as ../top-hits-midi-bundle (the
// 1:1 ClickFunnels copy, still live and untouched), sold by its own funnel at
// m.thegrind.studio/top-hits-chords: Jazz-style landing, order page with the 5-minute bonus,
// the Jazz MIDI Pack then Famous Beats after the order, six bonuses with the bundle.
// Everything that isn't layout lives here: product, price, add-ons, upsells, tracking, files.
// Its prices, add-ons and upsells are dashboard → Products' (funnel_items); these are the fallback.

export const funnel = {
  slug: "top-hits-chords",
  product: "TOP HITS MIDI Bundle",
  // The dashboard's name for it (funnel list, Analytics, Live): two funnels sell this product.
  label: "TOP HITS MIDI Bundle (new funnel)",
  // The line under the name on the order form's product card.
  orderName: "TOP HITS MIDI Bundle (1000 Chord Progressions)",
  brand: "GRIND STUDIO",
  // Same accounts as the other GRIND STUDIO funnels.
  tracking: {
    metaPixelId: "1679148316291540",
    clarityId: "yum5a2rsel",
    neoSnippet: "https://t.thegrind.studio/api/s/3d5ba6a05e6bcaea",
  },
  // The hero video (vsl/script-en.md, tools/top_hits_vsl.py, 4:05, voice Aaron Sage), in Wistia's
  // own player; its still is a frame of the video (117.3 s). Rendered again 2026-11-15 with a new
  // voice take, for Blinding Lights' corrected last chord; 47ic5iver0 was the 2026-11-10 render.
  vsl: { wistiaId: "x8jj158ddq" as string },
  support: "support@thegrind.studio",
  guaranteeDays: 60,
  legal: {
    terms: "/terms-and-conditions",
    privacy: "/privacy-policy",
    refund: "/refund-policy",
  },
  tagline: "Bundle of 1000 Chord Progressions from Top Hits.",
  // The launch price, dashboard → Products' since 2026-11-15 ("okay lets' keep 27 then"); it was 97 from 11-08.
  price: { eur: 27, usd: 27 },
  // The order page's add-ons. Ids double as file keys and travel in PayPal's 127-character
  // custom_id, so keep them short. Drunk Swing Grooves and HUSTLE are tick boxes (the order
  // page's ORDER_BUMPS); the Expansions are the 5-minute bonus (./fiveMinBonus.ts): free
  // while the clock runs, never shown as a tick box.
  bumps: [
    {
      id: "swing-grooves",
      name: "Drunk Swing Grooves (211 MIDI Files)",
      headline: "YES! Add the Drunk Swing Grooves!",
      price: { eur: 7, usd: 7 },
      image: "/funnels/jazz-midi-pack/bump-grooves.webp",
      pitch: "80 MIDI drum grooves with the drunk, J Dilla-style swing of lofi and neo soul, plus 31 groove templates.",
    },
    {
      id: "hustle",
      name: "HUSTLE Bundle (31 MIDI Packs)",
      headline: "YES! I Also Want 31 Musical MIDI Packs!",
      price: { eur: 25, usd: 25 },
      image: "/funnels/top-hits-midi-bundle/bump-hustle.png",
      pitch: "31 professional MIDI packs: jazz, trap, hip-hop, lofi, pop and more.",
    },
    {
      id: "expansions",
      name: "MIDI Drum Kit Expansions (House, Lo-Fi, Afrobeat)",
      headline: "YES! Add the MIDI Drum Kit Expansions!",
      price: { eur: 27, usd: 27 },
      image: "/funnels/midi-drum-kit/bump-expansions.webp",
      pitch: "10,003 more MIDI drum files: Afrobeat, Lo-Fi and House.",
    },
  ],
  // Paid zips in Cloudflare R2 (lib/r2.ts), handed out as 10-minute links once the payment
  // is confirmed. The bundle's zip is the live funnel's own.
  files: {
    pack: "top-hits-midi-bundle/TOP HITS MIDI Bundle.zip",
    "swing-grooves": "jazz-midi-pack/Drunk Swing Grooves.zip",
    hustle: "shared/HUSTLE MIDI Bundle.zip",
    expansions: "midi-drum-kit/EXPLORER Expansions (House, Lofi, Afrobeat).zip",
    // The six free bonuses: the zips the Jazz and Famous Beats funnels give.
    bible: "jazz-midi-pack/The Chord Progressions Bible.zip",
    "chord-pack": "jazz-midi-pack/Jazz MIDI Chord Pack.zip",
    "anime-pack": "jazz-midi-pack/Anime & Video Game MIDI Chord Pack.zip",
    "emotional-keys": "jazz-midi-pack/Emotional Keys MIDI Bundle.zip",
    "drum-loops": "jazz-midi-pack/Drum Loops for Songwriting.zip",
    "essential-drums": "clickfunnels/ESSENTIAL MIDI Drum Patterns.zip",
    // The upsells: the Jazz MIDI Pack (./offer) and the Famous Beats Bundle (./offer-2).
    "jazz-pack": "jazz-midi-pack/Jazz MIDI Pack.zip",
    "famous-beats": "shared/Famous Beats Bundle (320 MIDI Beats).zip",
  },
  // What a purchase brings beyond its own zip: the bundle its six bonuses (the page's
  // promise), the Jazz MIDI Pack upsell the five of its own that go with it everywhere.
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
  } as Record<string, string>,
  // One-click upsells after the order (lib/funnels.ts nextStep), in order: the Jazz MIDI
  // Pack on this funnel's own page (./offer), then the Famous Beats Bundle on the MIDI Drum
  // Kit's page (./offer-2, midi-drum-kit/upsell.ts). Which run, and in which order, is
  // dashboard → Products' (funnel_items).
  offers: [
    { id: "jazz-pack", path: "offer", name: "Jazz MIDI Pack", price: { eur: 27, usd: 27 } },
    { id: "famous-beats", path: "offer-2", name: "Famous Beats Bundle (320 MIDI Beats)", price: { eur: 27, usd: 27 } },
  ],
  checkout: {
    leadTags: ["checkout-started"],
    // The product's own buyer tag, as the live funnel gives it: one product, two funnels.
    buyerTags: ["buyer", "buyer-top-hits-midi-bundle"],
    thankYou: "/top-hits-chords/thank-you",
    orderPage: "/top-hits-chords/order",
  },
  // Counted from the pack (BRIEF.md): 1,000 files, 478 artist credits ("470+" on the page).
  // 1,000 files; since 2026-11-15 each one also in all 12 keys (tools/top_hits_keys.py):
  // 1,000 × 12 = 12,000 MIDI files (the empty file and the duplicate were replaced that day, BRIEF.md).
  counts: { progressions: 1000, artists: 478, files: 12000 },
} as const;

// The launch (BRIEF.md, 2026-11-15, "Sun 22 Nov, midnight"): €27 / $27 until Sunday 22 Nov at
// midnight Pacific time, or the first 100 copies; then 97 again. The database ends it
// (db/top-hits-launch-close.sql); the pages only say it, in the red bar, while it's true.
export const launch = {
  price: { eur: 27, usd: 27 },
  after: { eur: 97, usd: 97 },
  ends: Date.parse("2026-11-23T08:00:00Z"),
} as const;

/** Is the launch price the one in force? `amount` is the price dashboard → Products has now. */
export const launchOn = (amount: number, currency: Currency, now = Date.now()) => now < launch.ends && amount === priceIn(launch.price, currency);

// The bundle's four folders (BRIEF.md): the pack's own names and counts, the files each has in the
// 12 keys, the artists with the most songs in it (counted from the file names), its box
// (public/funnels/top-hits-midi-bundle/folder-<box>-360/640.webp, GPT Image 2.6 from the bundle's box).
export const folders = [
  { name: "Modern Pop & Ballads", box: "pop", songs: 556, files: 6672, artists: "Taylor Swift, The Weeknd, Sabrina Carpenter, Chappell Roan, Tate McRae, Ariana Grande, Doja Cat, Dua Lipa" },
  { name: "Hiphop, Trap & Urban", box: "hiphop", songs: 190, files: 2280, artists: "Drake, SZA, Bad Bunny, KAROL G, Rihanna, Post Malone, Tyla, Chris Brown" },
  { name: "Dance & Electronic", box: "dance", songs: 146, files: 1752, artists: "David Guetta, Charli xcx, Calvin Harris, Daft Punk, Ava Max, Zedd, deadmau5, Avicii" },
  { name: "Vintage Classics, Rock & Country", box: "vintage", songs: 108, files: 1296, artists: "Michael Jackson, Madonna, Whitney Houston, Stevie Wonder, Beyoncé, Hozier, Myles Smith" },
] as const;

/** An order's files: what it bought, plus what those bring along (`includes`). */
export const unlocked = (items: readonly string[]) => [...new Set(items.flatMap((i) => [i, ...(funnel.includes[i] ?? [])]))];
