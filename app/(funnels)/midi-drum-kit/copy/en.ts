// The MIDI Drum Kit funnel's own words in English: page titles, the order
// page, the order form and the thank-you page, as on ClickFunnels'
// /spot-available-midi-drum-kit-ad-15m30. The sales page's text is in
// ./landing/<lang>.json (it's ClickFunnels' own markup, see ../landing.ts).
// Marks (../top-hits-midi-bundle/Rich.tsx): **bold**, {c} → € or $.
// Other languages copy this shape (see ./index.ts).

export const en = {
  meta: {
    title: "1050 MIDI Drum Patterns + 3 Bonuses",
    description: "Make great beats with drag-and-drop MIDI drums. 1050 MIDI drum patterns and rolls + 3 bonuses, by GRIND STUDIO.",
    orderTitle: "Order MIDI Drum Kit",
    thanksTitle: "Thank you · MIDI Drum Kit",
  },
  orderTopbar: "**MORE BLACK FRIDAY:** 90% Sale Is Ending Soon",

  footer: { terms: "Terms and Conditions", privacy: "Privacy Policy", refund: "Refund Policy", contact: "Contact:" },

  // ─── order page ────────────────────────────────────────────
  order: {
    secure: "Secure Checkout",
    summaryTitle: "Order Summary:",
    productAlt: "MIDI Drum Kit: 1050 MIDI drum patterns + 3 bonuses",
    dl: "Download link will be sent to your email.",
    bullets: [
      "Grammy-Level Drum Patterns",
      "Finish Beats 27X Faster",
      "Tap Into Dopamine To Hook Listeners",
      "Get Noticed By High Status Artists",
      "Drum Patterns Used In Top Hits",
      "Easily Make 750 Beats A Year",
      "Huge Library To Explore",
      "Never Feel Beat Block Again",
      "Works With Mac & PC and Any DAW",
      "Limited Time Sale",
      "Money Back Guarantee (No Risk)",
      "Limited To 1,250 Licenses",
    ],
    completeTitle: "Complete Order:",
    paylogosAlt: "PayPal, Visa, Mastercard, American Express, Discover",
    reviews: [
      { quote: "\"The drum patterns are exactly what I needed. Perfect for modern trap and drill beats.\"", name: "Marcus Thompson", role: "Trap Producer", avatar: "avatar-c" },
      { quote: "\"These MIDI files saved me hundreds of hours. The patterns are industry standard quality.\"", name: "Ardan Solis", role: "Verified Customer", avatar: "avatar-a" },
      { quote: "\"Perfect for trap. The fragments add that extra sauce to make beats stand out.\"", name: "Niko Varela", role: "Verified Customer", avatar: "avatar-a" },
      { quote: "\"This is what real trap production tools look like. Every pattern is a hit waiting to happen.\"", name: "Soraya Kenji", role: "Verified Customer", avatar: "avatar-a" },
      { quote: "\"The MIDI patterns are crazy. I've been using these on every session since I got the pack.\"", name: "Marek Tulan", role: "Hip-hop and Trap Beatmaker", avatar: "avatar-a" },
      { quote: "\"Finally found patterns that match the energy of modern trap. This pack is legendary.\"", name: "Aisha Moretti", role: "Beatmaker", avatar: "avatar-a" },
      { quote: "\"The creativity these MIDIs sparked is insane. Perfect foundation for any trap beat.\"", name: "Dara Kwon", role: "Trap Producer, 100M+ streams", avatar: "avatar-a" },
      { quote: "\"These patterns hit harder than anything I've found. Essential tools for modern producers.\"", name: "Ravi Lomax", role: "Trap Producer, 100M+ streams", avatar: "avatar-a" },
    ],
    starsAlt: "5 stars",
    guaranteeTitle: "14-Day Money-Back Guarantee",
    guaranteeText:
      "Every pattern in this kit is tested before release. If anything's wrong with your files, email support@thegrind.studio within 14 days and we'll make it right — a fresh download, a replacement, or a refund if we can't fix it.",
    secureTitle: "Secure Payments",
    secureText:
      "Payments are processed through all major credit cards and PayPal with full 256-bit SSL encryption. No payment details are ever stored.",
    timer: { title: "YOUR COPY IS RESERVED FOR:", min: "min", sec: "sec", ms: "ms", label: "Your copy is reserved" },
  },

  // The order form (./OrderForm.tsx).
  form: {
    step1: "Your Info",
    step1Sub: "Name & Email",
    step2: "Payment",
    step2Sub: "Payment Info",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    next: "GO TO STEP 2",
    back: "Go Back",
    respect: "We respect your privacy & information.",
    paymentInfo: "PAYMENT INFORMATION",
    paymentMethod: "Payment method",
    card: "Card",
    paypal: "Paypal",
    notConnected: "Card payments switch on once the Stripe keys are added.",
    orCard: "or pay by card",
    paypalNote: "After you click the button, you finish paying on PayPal’s secure page, then come straight back to your download.",
    oto: "ONE-TIME OFFER:",
    summary: "Summary",
    total: "Total",
    pay: "Rush My Order!",
    processing: "Processing…",
    openingPaypal: "Opening PayPal…",
    waiver: "By paying you get instant access to the download and agree that your 14-day right of withdrawal ends once it starts.",
    paymentFailed: "Payment couldn't start.",
    paypalFailed: "PayPal couldn't start.",
    // The three tick-box offers, in funnel.bumps order (ids match).
    bumps: {
      expansions: {
        headline: "YES! Add Even More Drum Patterns!",
        body: [
          "3 MIDI Drum Kit Expansions. Includes **Complete Beats for House, Lo-Fi and Afrobeat**. Generate pro-level drums 27x faster. Usually {c}147 but you can get them all right now for just {c}7!!",
        ],
      },
      hustle: {
        headline: "YES! I Also Want 31 Musical MIDI Packs !",
        body: [
          "The 'HUSTLE' Bundle includes 31 Professional MIDI Packs with Musical Ideas, Chord Progressions and Melodies. Jazz, Trap, Hiphop, Lofi, Pop and more. Each MIDI Pack is {c}29 (total {c}899) but you can get them all right now at 90% off for just {c}25!!",
          "Limited to the first 150 orders.",
        ],
      },
      chords: {
        headline: "YES! I want Chord Progressions!",
        body: [
          "Legally \"steal\" the Chord Progressions from 750 Best Songs of all time. Create Chart-Topping Melodies **50x faster**. Each transcription value is {c}19 (total {c}14.250) but you can get them all right now for just {c}25!! (Bonuses: The Chord Progressions Bible, Drum Loops & 3 Emotional Keys MIDI Packs)",
          "Limited time offer.",
        ],
      },
    },
  },

  // The thank-you page.
  thanks: {
    // As on ClickFunnels' thank-you page.
    title: "Thank you!",
    sub: "You're in. Time to cook up.",
    paid: "You're in!",
    pending: "Payment processing…",
    failed: "Payment not completed",
    paidLead: "Payment received. Your downloads are below. Bookmark this page: the buttons keep working when you come back.",
    pendingLead: "Your bank is still confirming the payment. Refresh this page in a minute and your downloads will appear.",
    failedLead: "Nothing was charged. Go back and try again with another card or PayPal.",
    download: "Download",
    receipt: (provider: string, email: string | null) =>
      `${provider} has emailed your receipt${email ? ` to ${email}` : ""}.`,
    // Before the link to the customer login (m.thegrind.studio/account).
    account: "Find your downloads anytime at",
    fix: "and we fix it.",
    back: "Back to checkout",
    // Under the buttons, for what came with an add-on.
    support: "If you have any problem contact us at",
  },
};

export type Copy = typeof en;
