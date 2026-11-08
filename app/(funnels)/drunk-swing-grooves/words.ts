import { ORDER as TOP_HITS_ORDER, THANKS as TOP_HITS_THANKS } from "../top-hits-midi-bundle/words";
import { funnel } from "./funnel";

// Every word of the Drunk Swing Grooves pages (lib/words.ts reads the dashboard's
// edits by path). Marks: **bold**, ==highlight== (the page's yellow), {price} =
// the price in the visitor's currency, "|" breaks a heading's line. Every claim
// is in ./BRIEF.md. Angle (the user's, 2026-11-08): "that drunk feeling, the
// microtiming everybody wants but nobody knows how to make".

const n = funnel.counts;

// The MIDI Drum Kit's eight reviews, word for word (midi-drum-kit/copy/en.ts).
const DRUM_KIT_REVIEWS = [
  { quote: "The drum patterns are exactly what I needed. Perfect for modern trap and drill beats.", name: "Marcus Thompson", role: "Trap Producer" },
  { quote: "These MIDI files saved me hundreds of hours. The patterns are industry standard quality.", name: "Ardan Solis", role: "Verified Customer" },
  { quote: "Perfect for trap. The fragments add that extra sauce to make beats stand out.", name: "Niko Varela", role: "Verified Customer" },
  { quote: "This is what real trap production tools look like. Every pattern is a hit waiting to happen.", name: "Soraya Kenji", role: "Verified Customer" },
  { quote: "The MIDI patterns are crazy. I've been using these on every session since I got the pack.", name: "Marek Tulan", role: "Hip-hop and Trap Beatmaker" },
  { quote: "Finally found patterns that match the energy of modern trap. This pack is legendary.", name: "Aisha Moretti", role: "Beatmaker" },
  { quote: "The creativity these MIDIs sparked is insane. Perfect foundation for any trap beat.", name: "Dara Kwon", role: "Trap Producer, 100M+ streams" },
  { quote: "These patterns hit harder than anything I've found. Essential tools for modern producers.", name: "Ravi Lomax", role: "Trap Producer, 100M+ streams" },
];

export const LANDING = {
  hero: {
    title: "That ==drunk feeling.|In MIDI, ready to drag in.",
    sub: "The microtiming everybody wants and nobody knows how to program: the snare dead on the beat, the hats leaning, the kick a little loose. " +
      `${n.grooves} MIDI drum grooves with the J Dilla-style swing of lofi and neo soul.`,
  },
  ab: {
    title: "Play the beat, then flip the switch.",
    straight: "Quantized",
    drunk: "Drunk",
    caption: "Same notes, same sounds. Only the timing moves.",
    play: "Play the beat",
  },
  bullets: [
    `**${n.grooves} MIDI drum grooves**: ${n.patterns} beats × ${n.feels} feels, with the snare on 2 and 4 **and** in half-time`,
    "Light, Medium and Heavy drunk, plus **Quintuplet Swing**",
    "The snare on the beat, everything else laid back",
    "Drum rack **and** multitrack versions of every groove",
    `**${n.templates} groove templates** to put the feel on any MIDI`,
    "Any DAW: Ableton, FL Studio, Logic, MPC and more",
  ],
  cta: { label: "Get the grooves", note: "{price} · instant download" },
  proof: [
    ["2,847", "producers have the GRIND STUDIO MIDI Drum Kit in their sessions"],
    ["14 days", "quality guarantee on every file"],
  ],
  why: {
    title: "Why your drums sound stiff",
    body: [
      "Quantized MIDI puts every hit exactly on the grid. That's why it sounds like a machine.",
      "The beats you love don't sit on the grid. The snare lands dead on the beat, and everything around it leans: the hats a hair early, the kick a little loose, the ghost notes dragging behind.",
      "That's microtiming. You can do it by hand, moving every hit a few milliseconds by ear, on every beat, for hours. Or you start from a groove that already has it.",
    ],
    straight: "Quantized",
    drunk: "Drunk",
  },
  feels: {
    title: "Pick how drunk it sounds",
    caption: "Neo Soul Pocket in all four feels, on a stock drum kit.",
    items: [
      ["Light Drunk", "A little loose. For keys and for beats that still need to feel tight."],
      ["Medium Drunk", "The lofi pocket. The hats lean, the kick floats, the snare stays put."],
      ["Heavy Drunk", "Late and lazy, like a beat finger-drummed on a pad."],
      ["Quintuplet Swing", "Every second 16th on a five-note grid. Smooth and rolling: the neo soul swing."],
    ],
  },
  inside: {
    title: `${n.files} MIDI files. Here's what's inside.`,
    items: [
      [
        `Drum Grooves (${n.grooveFiles} files)`,
        "10 beats: Dusty Boom Bap, Lazy Sunday, Late Night Lofi, Neo Soul Pocket, Sliding Kick, Slow Soul, Rimshot Shuffle, Broken Beat, Jazzy Hop, Tape Stop Groove. Each with the snare on 2 and 4 and again in half-time (the snare on 3), in 4 feels: 80 grooves, 4 bars, 72 to 94 bpm. Every groove in two versions: drum rack and multitrack.",
      ],
      [
        `Groove Templates (${n.templates} files)`,
        "Swing from 52% to 70%, septuplet and quintuplet swing, 12 drunk feels, laid back and pushed. Put one on any MIDI: chords, bass, your own drums.",
      ],
      [
        `Bonus: Neo Soul Keys in Quintuplet Swing (${n.bonus} files)`,
        "10 neo soul progressions from the GRIND STUDIO Jazz MIDI Pack, keys and bass, played on the quintuplet grid. Put one over a groove and hear the feel on a whole beat.",
      ],
      ["The guide (PDF)", "How to use the templates in Ableton Live and Logic Pro, and which feel to use for what."],
    ],
    bonusCaption: "The bonus: Royal Road keys and bass over Neo Soul Pocket, both in Quintuplet Swing.",
  },
  versions: {
    title: "Drum rack or one sound per channel",
    items: [
      ["Drum Rack", "One track. Kick C1, snare D1, closed hat F#1. Drop it on a drum rack, an MPC or any General MIDI kit."],
      [
        "Multitrack",
        "One track per sound: kick, snare, clap, rim, closed hat, open hat. Every note on C3, so a sample loaded on its own channel plays at its own pitch. For FL Studio's Channel Rack, a Simpler per sound in Ableton, a sampler per hit.",
      ],
    ],
  },
  guarantee: {
    title: "14-day quality guarantee",
    text: "A file doesn't work, or the pack isn't what this page says? Email {email} within 14 days and we fix it. If we can't, you get a refund.",
  },
  license: {
    title: "Royalty-free",
    text: "Use the grooves in your own beats and releases, commercial ones too. No credit needed. Just don't resell or share the files.",
  },
  // "Introducing": the box beside what it is (grind-funnel-page §4 panel).
  intro: {
    title: "Drunk Swing Grooves",
    lead: "Drag a groove onto your drum rack and the beat already leans. No nudging notes for hours, no swing knob that moves everything at once.",
    ticks: [
      `${n.grooves} grooves, ${n.feels} feels, snare on 2 and 4 **and** half-time`,
      "Drum rack and multitrack versions",
      `${n.templates} groove templates for chords, bass, your own drums`,
      "Bonus: neo soul keys in quintuplet swing",
    ],
  },
  // The ✓/✗ chart, as on the Jazz page.
  compare: {
    title: "Other ways to get the drunk feel",
    cols: ["The swing knob", "Moving notes by hand", "Drunk Swing Grooves"],
    rows: [
      ["The snare stays on the beat", [false, "Swing moves it too"], [true, "If you're careful"], [true, "In every groove"]],
      ["Hats, kick and ghost notes move on their own", [false, "One amount for all"], [true, "One by one"], [true, "Each sound its own timing"]],
      ["Time it takes", [true, "Seconds"], [false, "Hours per beat"], [true, "Drag in a file"]],
      ["Sounds like a person played it", [false, "Even, mechanical swing"], [null, "If your ear is trained"], [true, "Light to heavy drunk"]],
    ] as [string, [boolean | null, string], [boolean | null, string], [boolean | null, string]][],
  },
  // Everything in the zip, then the price. No invented values (BRIEF: no value stack in money).
  stack: {
    title: "Everything you get",
    items: [
      [`${n.grooves} MIDI drum grooves`, `${n.grooveFiles} files: drum rack and multitrack`],
      [`${n.templates} groove templates`, "Swing, quintuplet, septuplet, drunk, laid back"],
      [`Bonus: Neo Soul Keys in Quintuplet Swing`, `${n.bonus} files: keys and bass`],
      ["The guide (PDF)", "Ableton Live and Logic Pro, which feel for what"],
    ],
    today: "Today",
  },
  // Social proof after the guarantee (grind-funnel-page §7): the Drum Kit's reviews.
  reviews: {
    title: "What producers say about GRIND STUDIO drums",
    note: "Reviews of the GRIND STUDIO MIDI Drum Kit.",
    items: DRUM_KIT_REVIEWS,
  },
  after: {
    title: "From the click to your first drunk beat in two minutes.",
    items: [
      ["Pay.", "Card or PayPal, one payment."],
      ["Download.", `A button on the next page and a link by email. One zip, ${n.files} MIDI files and the guide.`],
      ["Drag a groove in.", "Onto a drum rack, an MPC, FL Studio's Channel Rack. Press play: it already leans."],
    ],
  },
  faq: {
    title: "Questions",
    items: [
      ["Do they come with drum sounds?", "No, they're MIDI: you play them with your own kit. You bring the sounds, the files bring the feel."],
      ["Which DAWs?", "Any DAW that opens .mid files: Ableton Live, FL Studio, Logic Pro, Cubase, Studio One, Reaper, Bitwig, GarageBand, MPC software."],
      [
        "What's a groove template?",
        "Two bars of 16th notes with the timing of a feel. In Ableton you drop it in the Groove Pool, in Logic you make it a groove template, and the MIDI you apply it to takes that feel. The guide shows how.",
      ],
      ["Why is the snare on the beat?", "The snare is the anchor. When it stays put and everything around it moves, the beat sounds loose but never sloppy."],
      ["How do I get the files?", `Right after you pay: a download button on the next page and a link by email. One zip, ${n.files} MIDI files and a PDF guide.`],
    ],
  },
  final: { title: "Make your drums feel drunk." },
};
export type LandingWords = typeof LANDING;

// The order page: TOP HITS' template (as Famous Beats'), this pack's list and add-on.
// No reviews: this pack has none yet, and none are invented (grind-funnel-page §7).
export const ORDER = {
  ...TOP_HITS_ORDER,
  redbar: "**Instant download:** 211 MIDI files, any DAW",
  bullets: [
    "80 MIDI drum grooves in 4 feels",
    "Snare on 2 and 4, and half-time",
    "Light, Medium, Heavy drunk + Quintuplet Swing",
    "Snare on the beat, everything else laid back",
    "Drum rack and multitrack versions",
    "31 groove templates for any MIDI",
    "Bonus: neo soul keys in quintuplet swing",
    "Any DAW, Mac and PC",
    "Royalty-free",
    "14-day quality guarantee",
  ],
  // The MIDI Drum Kit's reviews (2026-11-08, the user chose "Drum Kit reviews" for this pack).
  reviews: DRUM_KIT_REVIEWS as { quote: string; name: string; role: string }[],
  guarantee: {
    title: "14-Day Quality Guarantee",
    text: "A file doesn't work, or the pack isn't what the page says? Email {email} within {days} days and we fix it. If we can't, you get a refund.",
  },
  form: { ...TOP_HITS_ORDER.form, pay: "GET THE GROOVES!", paypalNote: "After you click **GET THE GROOVES!** below, you finish paying on PayPal's secure page, then come straight back to your download." },
  bumps: {
    "record-samples": [
      "**122 WAV loops** of jazz chord progressions in Rhodes and piano, made to sound like an old record. Chop them like a sample over your grooves, no clearance needed. Add them for **{c}7**.",
    ],
  } as Record<string, string[]>,
};
export type OrderWords = typeof ORDER;

export const THANKS = TOP_HITS_THANKS;

// The Jazz MIDI Pack's one-click page after the order (./offer).
export const UPSELL = {
  bar: "Wait. Your order is complete: one more thing for your grooves.",
  title: "Your grooves swing.|Now give them ==chords that swing with them.",
  sub: "The Jazz MIDI Pack: the progressions behind lofi, neo soul and jazz, as MIDI, already voiced like a pianist plays them. Drop one over a drunk groove and the beat is there.",
  bullets: [
    "**10,496 MIDI files** in 5 folders",
    "The most used jazz progressions × 12 voicings × 8 rhythms",
    "Every progression in all 12 keys",
    "Walking, two-feel and bossa bass lines",
    "Lofi, neo soul, trap soul and deep house loops, drums included",
    "Chord names written into every file",
    "**Plus its 5 bonuses**: MIDI Chord Pack (Jazz Edition), The Chord Progressions Bible, Anime & Video Games MIDI Pack, Emotional Keys MIDI Bundle, Drum Loops for Songwriting",
  ],
  listen: "The pack's Royal Road, keys and bass, over a Drunk Swing groove:",
  yes: "Yes, add the Jazz MIDI Pack for {price}",
  yesSub: "One click: charged to the card or PayPal you just used",
  no: "No thanks, I'll skip the chords",
};
export type UpsellWords = typeof UPSELL;
