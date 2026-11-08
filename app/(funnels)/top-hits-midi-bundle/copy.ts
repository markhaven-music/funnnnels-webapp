// The landing's words, exactly as on the ClickFunnels page. Inline marks:
//   **bold**   _italic_   ==yellow highlight==   {c} = € or $ for the visitor
// A letter line starting with "# " is one of the big Impact headings ("|" breaks the line).

export const bullets = {
  left: [
    "CRACK THE HARMONY OF RADIO-READY HITS",
    "DRAG IN, CHANGE THE KEY, INSTANTLY MAKE IT YOURS",
    "TAKE THE SKELETON, BUILD YOUR OWN TRACK",
    "PUT ANY MELODY ON TOP AND IT JUST WORKS",
  ],
  right: [
    "TRANSCRIBED 1:1 FROM **1,000** TOP HITS",
    "ZERO SAMPLE CLEARANCE RISK",
    "PAY ONCE, USE FOREVER",
    "TAKE THE SKELETON, BUILD YOUR OWN BODY",
    "UNDETECTABLE, UNPROVABLE, UNSTOPPABLE",
  ],
};

export const letter = [
  "**Dear Producer,**",
  "You already know how to make drums knock.",
  "What kills most beats is what sits on top of them.",
  "Four random chords from a YouTube tutorial.",
  "The same loop every other producer bought last week.",
  "A progression that sounds fine for eight bars and then goes nowhere.",
  "If you want to write beats with chords that actually move people, ==this is going to be the most important page you read all year.==",
  "We are **The Grind Studio**, a collective of platinum-certified producers and beatmakers based across Europe.",
  "Between us we've placed records on charting albums.",
  "Earned multi-platinum plaques.",
  "And spent the last decade in studio sessions figuring out why some beats get skipped after four seconds while others end up on repeat for months.",
  "After all those years, the answer kept coming back to the same place.",
  "The chords.",
  "Harmony is what gives a song the goosebumps.",
  "The feeling you can't name but keep replaying.",
  "When a track sticks in your head for weeks, nine times out of ten the progression put it there.",
  "So one day we asked ourselves a question.",
  "What if, instead of guessing at chords from scratch every single time...",
  "We could just **steal the skeleton** from records that already proved they work?",
  "# 1,000 Hits.|Note for note.",
  "That's exactly what we did.",
  "We sat down and transcribed **the chord progressions of 1,000 of the biggest songs in modern music**.",
  "By hand.",
  "By ear.",
  "Every chord, every voicing, every inversion.",
  "Every passing change and borrowed note that makes a progression sound _expensive_ instead of obvious.",
  "Then we exported every single one as a MIDI file, labelled with the original key and BPM.",
  "Now pay attention to this part, because it matters.",
  "MIDI is pure _data_.",
  "No audio, no samples, nothing lifted from the original recordings.",
  "Just the **blueprint**.",
  "Which means ==zero clearance issues, zero copyright landmines, zero risk.==",
  "You drag the MIDI onto a track.",
  "You load your own sound.",
  "Your piano, your pads, your synth.",
  "You change the key with one click and hit play.",
  "And suddenly you're hearing one of the most successful progressions in modern music, voiced with **your** sounds.",
  "Put a melody on top, drop your drums under it, and it just works.",
  "Because the hard part was already solved by a song that sold millions.",
  "# 1,000 songs.|496 artists.",
  "Here's what you get the moment you click below:",
  "**1,000 chord progressions**, transcribed 1:1 from real hits and organised by artist.",
  "Pop. Trap. R&B. Country. EDM. Afrobeats. K-pop. Latin.",
  "The full vocabulary of modern hit-making, from The Weeknd to Taylor Swift, from Bad Bunny to Billie Eilish.",
  "Every file labelled with its **key and BPM**, ready to drop in and transpose to fit whatever you're working on.",
  "One download.",
  "==Yours for life.==",
  "Use them on unlimited beats, including commercial releases.",
  "No DRM, no subscriptions, no fine print.",
  "Works in every DAW on earth: FL Studio, Ableton, Logic, Pro Tools, you name it.",
  "You download a .zip, you extract it, and the files live on your hard drive forever.",
  "That's the whole bundle.",
  "The price is below, and once you do the math per progression, the decision makes itself.",
];

type Mark = "yes" | "no" | "partial";
export type Cell = string | Mark;

export const compare = {
  columns: [
    { name: "Hitmaker MIDI Pack", sub: "What you're getting", bundle: true },
    { name: "Hiring a Transcriber", sub: "Fiverr / freelance", bundle: false },
    { name: "Figuring Out Chords By Ear", sub: "DIY trial & error", bundle: false },
  ],
  rows: [
    { label: "Number of hit chord progressions", values: ["1,000", "1 per order", "Probably none"] },
    { label: "Labelled with key & BPM", values: ["yes", "partial", "no"] },
    { label: "Transpose to any key in one click", values: ["yes", "no", "no"] },
    { label: "Works in any DAW", values: ["yes", "yes", "yes"] },
    { label: "Time to get started", values: ["5 minutes", "3-7 days", "Hours per song"] },
    { label: "Cost per progression", values: ["{c}0.03", "{c}10-30", "Free (your time isn't)"] },
    { label: "Note-for-note accuracy", values: ["yes", "partial", "no"] },
    { label: "Commercial license to sell beats", values: ["yes", "partial", "yes"] },
    { label: "Free Updates", values: ["yes", "no", "no"] },
    { label: "14-day quality guarantee", values: ["yes", "no", "no"] },
    { label: "Total cost for 1,000 progressions", values: ["{c}27", "{c}10,000+", "100s of hours"] },
  ] as { label: string; values: Cell[] }[],
};

export const faq: { q: string; a: string[] }[] = [
  {
    q: "What DAW do I need? Will this work in mine?",
    a: [
      "The MIDI files work in **every major DAW** — FL Studio, Ableton Live, Logic Pro, Studio One, Cubase, Pro Tools, GarageBand, Reaper, Bitwig. MIDI is a universal format. Just drag and drop the file into a track and load your own piano, synth, or pad on top.",
    ],
  },
  {
    q: "Wait — is this samples or MIDI?",
    a: [
      "This is **pure MIDI**. You get the chord progressions — every chord, voicing, and inversion — exactly as they appear in the original songs, with each file labelled by **key and BPM**.",
      "Why MIDI matters: with MIDI you can use **any instrument you want**, change the key with one click, swap sounds, edit individual notes. Samples lock you in. MIDI sets you free.",
    ],
  },
  {
    q: "How do I find the right progression fast out of 1,000?",
    a: [
      "Every file is named with the **artist, song, key and BPM**, and the whole pack is organised by artist. So if you want a moody minor progression at 120 BPM, or the exact chords behind a specific hit, you can find it in seconds — then drag the MIDI in and transpose it to your track's key.",
    ],
  },
  {
    q: "Are these the actual song MIDIs?",
    a: [
      "No — these are **painstakingly transcribed** by ear, note for note. Every chord, voicing, and passing change has been transcribed from the original recordings. They sound identical to the originals when played through similar instruments, but they're original recreations, not extracted from the master tracks.",
    ],
  },
  {
    q: "Can I sell beats made with these MIDI files?",
    a: [
      "**Yes.** You get a full commercial license. Use the MIDI files in beats you sell on BeatStars, Airbit, Traktrain, or directly to artists. Use them in songs you release on Spotify, Apple Music, or anywhere else. Profit is yours to keep.",
      "The only thing you can't do is resell or redistribute the MIDI files themselves as a pack.",
    ],
  },
  {
    q: "How fast do I get access?",
    a: [
      "**Instantly.** The second your payment goes through, you'll get an email with your download link. No waiting, no shipping, no setup. You can be making beats with the pack within 5 minutes.",
    ],
  },
  {
    q: "Do I need to know music theory?",
    a: [
      "Not at all. That's the whole point. The MIDI files _are_ the theory — the chords, the voicings, the movement. Drop them in and you're already starting from a hit-level harmonic foundation. Add your own sound, your own melody, your own drums on top.",
    ],
  },
  {
    q: "What if I don't like it?",
    a: [
      "If the pack isn't what you expected, just reply to your order email within **14 days** and we'll refund you in full. No forms, no questions, no hassle.",
    ],
  },
  {
    q: "What devices does this work on?",
    a: [
      "Anywhere you can run a DAW — **Mac, Windows, Linux**, even iPad and iPhone if you produce in mobile DAWs like BeatMaker 3, GarageBand iOS, or Cubasis.",
    ],
  },
  {
    q: "Will I get future updates or new packs?",
    a: [
      "Yes — when we release new MIDI packs, existing owners get them at a steep discount or free, depending on the drop. We'll email you whenever a new volume goes live.",
    ],
  },
  {
    q: "How is this different from free YouTube tutorials?",
    a: [
      "YouTube shows you _one progression_ in 12 minutes of fluff. This pack hands you **1,000 progressions** from real hits in one folder, each labelled with key and BPM so you can find the right one in seconds. No talking, no ads, no missing details.",
      "One chord transcription on Fiverr costs {c}20+. You're getting 1,000 of them for {c}27.",
    ],
  },
];

// The order page's left column (hidden on phones, as on ClickFunnels).
export const orderBullets = [
  "Grammy-Level Chord Progressions",
  "Finish Music 27X Faster",
  "Tap Into Dopamine To Hook Listeners",
  "Get Noticed By High Status Artists",
  "Chord Progressions Used In Top Hits",
  "Easily Make 750 Songs A Year",
  "Huge Library To Explore",
  "Never Feel Writer Block Again",
  "Works With Mac & PC and Any DAW",
  "Limited Time Sale",
  "Satisfaction Guarantee (No Risk)",
  "Limited To 1,250 Licenses",
];

export const reviews = [
  { quote: "Exactly what I needed. Perfect for modern songs and beats.", name: "Marcus Thompson", role: "Producer", icon: "youtube" },
  { quote: "These MIDI files saved me hundreds of hours. The patterns are industry standard quality.", name: "Ardan Solis", role: "Verified Customer", icon: "instagram" },
  { quote: "Perfect. The chords add that extra sauce to make beats stand out.", name: "Niko Varela", role: "Verified Customer", icon: "instagram" },
  { quote: "This is what real production tools look like. Every progression is a hit waiting to happen.", name: "Soraya Kenji", role: "Verified Customer", icon: "instagram" },
  { quote: "The MIDI progressions are crazy. I've been using these on every session since I got the pack.", name: "Marek Tulan", role: "Hip-hop and Trap Beatmaker", icon: "instagram" },
  { quote: "Finally found chords that match the energy of modern music. This pack is legendary.", name: "Aisha Moretti", role: "Beatmaker", icon: "instagram" },
  { quote: "The creativity these MIDIs sparked is insane. Perfect foundation for any beat.", name: "Dara Kwon", role: "Trap Producer, 100M+ streams", icon: "instagram" },
  { quote: "These chords hit harder than anything I've found. Essential tools for modern producers.", name: "Ravi Lomax", role: "Trap Producer, 100M+ streams", icon: "instagram" },
] as const;

// Each add-on's ClickFunnels description, after the red "ONE-TIME OFFER:".
export const bumpCopy: Record<string, string[]> = {
  "emotional-keys": [
    "This mini-bundle includes **'Emotional Keys Vol.1, Vol.2 and Vol.3**",
    "Includes: Musical Ideas, Chord Progressions and Melodies written by professional pianist and composer Orazio Saracino. Each MIDI Pack is {c}29 (total {c}87) but you can get them all right now at 95% off for __just {c}7!!__",
  ],
  hustle: [
    "The **'HUSTLE' Bundle** includes **31 Professional MIDI Packs** with Musical Ideas, Chord Progressions and Melodies. Jazz, Trap, Hiphop, Lofi, Pop and more. Each MIDI Pack is {c}29 (total {c}899) but you can get them all right now at 90% off for __just {c}25!!__",
    "Limited to the first 150 orders.",
  ],
  "famous-beats": [
    "The **'Famous Beats Bundle' Bundle** includes **32 Packs** containing 320 MIDI Transcription of some of the most influencial Drum Beats of all time. If you hired a professional transcription service you'd pay {c}20 per beat ({c}6,400 total). But right now you can get 320 total MIDI transcrptions for __just {c}27!!__",
    "Limited to the first 150 orders.",
  ],
};
