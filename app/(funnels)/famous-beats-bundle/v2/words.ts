// The Famous Beats Bundle sales page, Jazz-style (2026-11-09: "Ne crei uno più simile a
// quello jazz per famous beats bundle? Offerta + simile e stile pagina più simile").
// The words are the live page's (../astro/landing.ts), reordered into the Jazz page's
// sections; every claim is in ../BRIEF.md. `*x*` = yellow. {price} = the
// visitor's price, {c} = their currency sign, {email} = support.

export const LANDING = {
  hero: {
    pre: "MIDI · any DAW · transcribed, not sampled",
    title: "The drums behind *320 hits*. Note for note, in MIDI.",
    sub: "Hits by Drake, Travis Scott, Future, Metro Boomin and more. Kick, snare, hats and percussion on separate tracks. Load your sounds and start on a groove that already worked.",
    listen: "Press play. These are three of the 320 files, played on a drum kit.",
    bullets: [
      "320 Drum Grooves From Hit Records, In MIDI",
      "Kick, Snare, Hats And Percussion On Separate Tracks",
      "Transcribed By Ear: Ghost Notes, Rolls And Velocity Included",
      "BPM, Artist And Song In Every File Name",
      "Any DAW, Mac Or PC. Commercial License",
      "6 Free Bonuses Included",
    ],
    ticks: ["Any DAW", "BPM and artist in every file name", "14-day guarantee"],
    proof: [
      ["2,847", "producers have the GRIND STUDIO MIDI Drum Kit in their sessions"],
      ["4,700+", "producers on the GRIND STUDIO email list"],
      ["14 days", "quality guarantee on every file"],
    ] as [string, string][],
  },
  cta: { label: "Get the bundle", note: "{price} · one payment · instant download" },
  letter: {
    title: "You've been copying grooves *by eye*.",
    body: [
      "Pause the video. Squint at the piano roll. Rebuild it, note by note.",
      "Play it back. It's close. It doesn't sit the same.",
      "You can't read the small stuff off a paused video. Ghost notes, velocity, hats a hair behind the grid.",
      "So one pattern eats the night, and the beat never gets made.",
    ],
    rollCaption: "One bar of {song} ({artist}, {bpm} BPM), as it is in the file. The taller the line, the harder the hit.",
  },
  product: {
    title: "Or you open",
    titleEm: "the actual file.",
    lead: "320 drum grooves from hit records, in 32 packs of 10. Transcribed by hand and by ear into multi-track MIDI. Every kick, snare, hat and ghost note where the record has it.",
    ticks: [
      "320 transcriptions, 32 packs of 10",
      "Kick, snare, hats and percussion on separate tracks",
      "Transcribed by ear, ghost notes included",
      "BPM, artist and song in every file name",
      "Any DAW, Mac or PC. Commercial license",
    ],
  },
  getting: {
    title: "What you're actually getting.",
    steps: [
      ["A hit record.", "320 of them: Drake, Travis Scott, Future, Metro Boomin and more."],
      ["Its drums, pulled out by ear.", "Every kick, snare, hat and ghost note, written down note for note."],
      ["Saved as a MIDI file.", "Kick, snare, hats and percussion on separate tracks. It opens in any DAW."],
      ["Played by your sounds.", "Load your kit, write on top. The groove is already there."],
    ] as [string, string][],
    total: "That's the Famous Beats Bundle. 320 of those grooves. 32 packs. One download.",
  },
  browse: {
    title: "Every song in the bundle. Press play on any of them.",
    sub: "The previews are the pack's own: each file played on a drum kit. Search an artist, a song or a BPM.",
    search: "Search 320 songs",
    showAll: "Show all 320 songs",
    none: "No song matches that.",
  },
  inside: {
    title: "What you get when you open the folder.",
    items: [
      ["320 transcriptions", "Drum grooves from Drake, Travis Scott, Future, Metro Boomin, Kendrick Lamar, Lil Baby and more."],
      ["One track per drum", "Kick, snare, hats and percussion come in on separate tracks. Mute the hats, swap the kick, move one snare."],
      ["Transcribed by ear", "Written by hand, note for note, ghost notes included. Not ripped from the master. An original transcription."],
      ["Find a groove in seconds", "BPM, artist and song are in every file name. Every pack has audio previews, so you hear it before you drag it."],
      ["Any DAW, Mac or PC", "Standard .mid files. Drag them into FL Studio, Ableton, Logic, Pro Tools or whatever you make beats in."],
      ["Commercial license", "Sell the beats, lease them, release them. The money is yours. You just can't resell the MIDI files."],
    ] as [string, string][],
  },
  quotes: {
    title: "Hit producers start with the drums.",
    items: [
      ["I start with the drums to secure a bounce. You wanna move people.", "Metro Boomin"],
      ["I always focus on the bounce.", "Tay Keith"],
      ["I could put on a beat… just to see if my boy gonna bounce.", "Mike WiLL Made-It"],
    ] as [string, string][],
    note: "Public statements, quoted for commentary. Not an endorsement.",
  },
  steps: {
    title: "From checkout to your first loop in about 5 minutes.",
    items: [
      ["Check out", "The download buttons are on the next page, and the links land in your inbox. One .zip, 32 packs."],
      ["Find the groove", "Scroll the audio previews. Or search a BPM or an artist in the file names."],
      ["Drag it in, load your kit", "Every drum lands on its own lane. Your kick, your snare, your hats, same groove."],
    ] as [string, string][],
  },
  compare: {
    title: "Guessing the groove vs. opening the file.",
    cols: ["By ear, from a video", "Hiring a transcriber", "Famous Beats Bundle"],
    rows: [
      ["Time", [false, "Hours per groove, if it comes out right"], [false, "3–7 days per song"], [true, "320 grooves, ready in about 5 minutes"]],
      ["Cost", [null, "Free, one groove a night"], [false, "{c}10–30 per song"], [true, "{c}0.08 per groove"]],
      ["Ghost notes and off-grid hits", [false, "Hats locked to the grid"], [true, "Yes"], [true, "Where the record has them"]],
      ["Velocity", [false, "Every hit at the same velocity"], [true, "Yes"], [true, "On every hit, the way it was played"]],
      ["One track per drum", [null, "If you build it that way"], [true, "Yes"], [true, "Kick, snare, hats and percussion"]],
    ] as [string, [boolean | null, string], [boolean | null, string], [boolean | null, string]][],
  },
  bonuses: {
    title: "Six bonuses. All in the {price}.",
    sub: "On the same download page as the bundle.",
    items: [
      {
        id: "essential-drums",
        name: "ESSENTIAL MIDI Drum Patterns",
        value: 7,
        text: "163 MIDI drum files to build your own grooves, one part at a time.",
        inside: ["158 one-part patterns: 808, closed and open hats, kick, snare or clap, accents", "Kick + snare and kick + 808 multi-track loops", "5 complete multi-track beats"],
      },
      {
        id: "chord-pack",
        name: "MIDI Chord Pack (Jazz Edition)",
        value: 47,
        text: "Jazz chords and progressions in every key, to put on top of your drums.",
        inside: ["2,304 MIDI files", "All 12 major/minor key pairs", "6 folders per key: best voicing, smooth bass, sevenths, extended, altered, progressions"],
      },
      {
        id: "emotional-keys",
        name: "Emotional Keys MIDI Bundle",
        value: 27,
        text: "Piano ideas to start a song from: songstarters, chords and melodies.",
        inside: ["195 MIDI files in 3 volumes", "Each: 20 songstarters, 20 chord progressions, 25 melodies", "An MP3 preview of every file"],
      },
      {
        id: "drum-loops",
        name: "Drum Loops for Songwriting",
        value: 27,
        text: "Drums to write over while the song takes shape.",
        inside: ["47 WAV drum loops", "Made for songwriting: put your chords and melody on top"],
      },
      {
        id: "bible",
        name: "The Chord Progressions Bible",
        value: 37,
        text: "The 50 most used chord progressions of all time, three ways each. Chords to put on top of your drums.",
        inside: ["150 MIDI files", "258 piano and e-piano WAV loops"],
      },
      {
        id: "anime-pack",
        name: "Anime & Video Games MIDI Pack",
        value: 47,
        text: "Anime and video game progressions, from royal road to boss battle, in every key.",
        inside: ["1,548 MIDI files", "12 key pairs"],
      },
    ],
    free: "Free",
  },
  stack: {
    title: "320 transcriptions for about the price of one.",
    sub: "A transcriber charges {c}10–30 for a single song. This is the whole bundle, one payment.",
    items: [
      "320 multi-track MIDI drum transcriptions",
      "32 packs of 10 songs",
      "Audio previews in every pack",
      "BPM, artist and song in every file name",
      "Works in any DAW, Mac and PC",
      "Full commercial license",
      "6 bonuses: ESSENTIAL MIDI Drum Patterns, MIDI Chord Pack (Jazz Edition), Emotional Keys MIDI Bundle, Drum Loops for Songwriting, The Chord Progressions Bible, Anime & Video Games MIDI Pack",
    ],
    today: "Today",
    perGroove: "That's {c}0.08 per groove.",
  },
  guarantee: {
    title: "14-day quality guarantee.",
    text: "If a file is broken, missing or not what this page says, email {email} within 14 days. We fix it or replace it. If we can't, you get a refund.",
  },
  after: {
    title: "What happens after you pay.",
    items: [
      ["Pay", "by card, Apple Pay, Google Pay or PayPal."],
      ["Download", "from the buttons on the next page. The same links come by email."],
      ["Unzip", "32 packs of 10 songs, each with its MIDI files and its audio previews, plus the 6 bonuses."],
      ["Drag a .mid", "onto a drum track and load your kit. You can be on a drum track in 5 minutes."],
    ] as [string, string][],
  },
  faq: {
    title: "Questions before you grab it.",
    items: [
      ["Is this MIDI or samples?", "MIDI: the drum part as notes, every hit, when it lands and how hard. There is no audio from the songs in the files. Each pack also has audio previews of the drums so you can hear a groove before you load it."],
      ["Are these the original song files?", "No. They are transcriptions, written by hand and by ear, note for note, from the records. Load similar drum sounds and you'll recognize the groove."],
      ["Can I sell beats made with them?", "Yes. Full commercial license: sell on BeatStars, Airbit, Traktrain, lease to artists, release on Spotify and Apple Music, keep the money. You just can't resell or share the MIDI files themselves."],
      ["Will it work in my DAW?", "Yes. Standard .mid files: FL Studio, Ableton Live, Logic Pro, Pro Tools, Studio One, Cubase, Reaper, Bitwig, GarageBand. Mac and Windows, plus mobile DAWs that read MIDI."],
      ["How do I find the right groove out of 320?", "Every pack has a folder of audio previews. Scroll and listen, no need to load each MIDI. File names carry the BPM, artist and song, so you can search the folder."],
      ["I don't know music theory. Can I use it?", "Yes. Drag a file onto a drum track, pick your sounds, press play. The groove is already written."],
      ["How fast do I get it?", "Right after payment: the download buttons are on the next page and the links come by email."],
      ["What if a file doesn't work?", "14-day quality guarantee. If a file is broken, missing or not what this page says, email {email}. We fix it or replace it, and if we can't, you get a refund."],
    ] as [string, string][],
  },
  final: {
    title: "Start your next beat on a groove that already worked.",
    sub: "Drop in your kit. Write on top. The pocket is already there.",
  },
  disclaimer: [
    "Disclaimer: Famous Beats Bundle is designed to help you create professional-sounding beats and improve your music production workflow, but individual results may vary, and specific outcomes, income, or success are not guaranteed. Reference to specific artists, including citations of their public statements, is for illustrative, educational and commentary purposes only and does not imply endorsement. Drum patterns are not intellectual property; these MIDI files are original transcriptions of non-proprietary rhythmic structures.",
    "The previews play the MIDI files on a drum kit. The MIDI files contain no audio from the songs.",
    "GRIND STUDIO is not a part of the Facebook website or Meta Platforms, Inc. This site is NOT endorsed by Facebook in any way. FACEBOOK and INSTAGRAM are trademarks of META PLATFORMS, Inc.",
  ],
};

// The order page.
export const ORDER = {
  bfbar: "90% Sale Is Ending Soon",
  secure: "Secure checkout",
  srTitle: "Complete your Famous Beats Bundle order",
  stack: [
    "320 multi-track MIDI drum transcriptions",
    "32 packs of 10 songs, with audio previews",
    "BPM, artist and song in every file name",
    "Any DAW, Mac and PC · commercial license",
  ],
  bonusHead: "Plus 6 free bonuses",
  today: "Today",
  guarantee: "14-day quality guarantee. A file doesn't work? We fix it.",
  proof: [
    "**320** drum transcriptions from hit records",
    "**14 days** quality guarantee on every file",
    "Card, Apple Pay, Google Pay or **PayPal**",
  ],
};

// The order page's tick boxes, Jazz-style: a headline and its words at this page's price.
// No "limited to N orders" (nothing limits them).
export const BUMP_COPY: Record<string, { headline: string; body: string[] }> = {
  "swing-grooves": {
    headline: "YES! Add the Drunk Swing Grooves!",
    body: [
      "80 MIDI drum grooves with the **drunk, J Dilla-style swing** of lofi and neo soul, in 4 feels, plus 31 groove templates. The snare stays on the beat, everything else lays back. Add it now for just {c}7.",
    ],
  },
  hustle: {
    headline: "YES! I Also Want 31 Musical MIDI Packs!",
    body: [
      "The 'HUSTLE' Bundle includes **31 Professional MIDI Packs** with Musical Ideas, Chord Progressions and Melodies. Jazz, Trap, Hiphop, Lofi, Pop and more. Each MIDI Pack is {c}29 (total {c}899) but you can get them all right now for just {c}27.",
    ],
  },
};
