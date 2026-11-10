// The TOP HITS MIDI Bundle sales page, Jazz-style (2026-11-10: "crea nuovo funnel per TOP
// HITS MIDI Bundle con TUTTO"), in the Jazz page's sections as the Famous Beats page has
// them. Every claim is in ../BRIEF.md. `*x*` = yellow. {price} = the visitor's price,
// {c} = their currency sign, {per} = the price per progression, {email} = support.

export const LANDING = {
  hero: {
    pre: "MIDI · any DAW · transcribed, not sampled",
    title: "The chords behind *1,000 hits*. Note for note, in MIDI.",
    sub: "The Weeknd, Taylor Swift, SZA, Drake, Bad Bunny, Billie Eilish and more: 470+ artists. Drag a file in, change the key, load your sound and start on chords that already worked.",
    listen: "Press play. Four of the 1,000 files, played from the MIDI.",
    bullets: [
      "1,000 Chord Progressions From Hit Songs, In MIDI",
      "Transcribed By Ear: Every Chord, Voicing And Inversion",
      "Artist, Song, Key And BPM In The File Name",
      "Change The Key In One Click, Load Any Sound",
      "Any DAW, Mac Or PC. Commercial License",
      "6 Free Bonuses Included",
    ],
    ticks: ["Any DAW", "Key and BPM in the file name", "14-day guarantee"],
    proof: [
      ["2,847", "producers have the GRIND STUDIO MIDI Drum Kit in their sessions"],
      ["4,700+", "producers on the GRIND STUDIO email list"],
      ["14 days", "quality guarantee on every file"],
    ] as [string, string][],
  },
  cta: { label: "Get the bundle", note: "{price} · one payment · instant download" },
  letter: {
    title: "The drums knock. Then you open *the piano roll*.",
    body: [
      "The drums are done. The 808 sits right.",
      "Then you open the piano roll for the chords, and you sit there.",
      "Four chords from a tutorial. The same loop everybody bought last week.",
      "It sounds fine for eight bars. Then it goes nowhere.",
      "The songs that stay in your head stay there because of the chords underneath.",
    ],
    rollCaption: "The first 8 bars of the file, as they are in the pack. Press play: these are its notes.",
  },
  product: {
    title: "Or you start on",
    titleEm: "chords that already worked.",
    lead: "1,000 chord progressions from hit songs, transcribed by hand and by ear into MIDI. Every chord, voicing and inversion where the record has it.",
    ticks: [
      "1,000 MIDI files in 4 folders, sorted by genre",
      "Pop, trap, R&B, country, EDM, afrobeats, K-pop, Latin",
      "Artist, song, key and BPM in the file name",
      "Change the key in one click, load any sound",
      "Any DAW, Mac or PC. Commercial license",
    ],
  },
  getting: {
    title: "What you're actually getting.",
    steps: [
      ["A hit song.", "1,000 of them: The Weeknd, Taylor Swift, SZA, Drake, Bad Bunny and 470+ artists in all."],
      ["Its chords, pulled out by ear.", "Every chord, voicing and inversion, written down note for note."],
      ["Saved as a MIDI file.", "Named with the artist, the song, the key and the BPM. It opens in any DAW."],
      ["Played by your sounds.", "Your piano, your pads, your synth. Change the key in one click and write on top."],
    ] as [string, string][],
    total: "*That's the TOP HITS MIDI Bundle.* 1,000 of those progressions. One download.",
  },
  browse: {
    title: "Every progression in the bundle. Press play on any of them.",
    sub: "The first 8 bars of each file, played from the MIDI on a sine or a piano. Search an artist, a song, a key or a BPM.",
  },
  inside: {
    title: "What you get when you open the folder.",
    items: [
      ["1,000 chord progressions", "From hit songs by The Weeknd, Taylor Swift, SZA, Drake, Ariana Grande, Dua Lipa, Bad Bunny and 470+ artists in all."],
      ["Four folders by genre", "Modern Pop & Ballads (556 files), Hiphop, Trap & Urban (190), Dance & Electronic (146), Vintage Classics, Rock & Country (108)."],
      ["Transcribed by ear", "Written by hand, note for note: the chords, the voicings, the inversions, the passing changes. Our own transcriptions, not files pulled from the masters. No audio, no samples."],
      ["Find a song in seconds", "The artist, the song, the key and the BPM are in the file name. About half the files are in a major key, half in a minor one, from 57 to 188 BPM."],
      ["Any DAW, Mac or PC", "Standard .mid files. Drag them into FL Studio, Ableton, Logic, Pro Tools or whatever you make music in."],
      ["Commercial license", "Sell the beats, lease them, release the songs. The money is yours. You just can't resell the MIDI files."],
    ] as [string, string][],
  },
  steps: {
    title: "From checkout to chords in your DAW in about 5 minutes.",
    items: [
      ["Check out", "The download buttons are on the next page, and the links land in your inbox. One .zip."],
      ["Find the song", "Four folders by genre. Search an artist, a song, a key or a BPM in the file names."],
      ["Drag it in, change the key", "Drop the .mid on a track, transpose it to your beat, load your sound. Melody on top, drums under it."],
    ] as [string, string][],
  },
  compare: {
    title: "Guessing the chords vs. opening the file.",
    cols: ["By ear, from the song", "Hiring a transcriber", "TOP HITS MIDI Bundle"],
    rows: [
      ["Time", [false, "Hours per song, if it comes out right"], [false, "3–7 days per song"], [true, "1,000 progressions, ready in about 5 minutes"]],
      ["Cost", [null, "Free, one song a night"], [false, "{c}10–30 per song"], [true, "{per} per progression"]],
      ["Voicings and inversions", [false, "What you manage to hear"], [true, "Yes"], [true, "Where the record has them"]],
      ["Key and BPM", [null, "You work them out"], [null, "If you ask for them"], [true, "In the file name"]],
      ["Change the key", [null, "Once it's written"], [true, "Yes"], [true, "One click: it's MIDI"]],
    ] as [string, [boolean | null, string], [boolean | null, string], [boolean | null, string]][],
  },
  bonuses: {
    title: "Six bonuses. All in the {price}.",
    sub: "4,360 more MIDI files and 305 WAV loops, on the same download page as the bundle.",
    items: [
      {
        id: "bible",
        name: "The Chord Progressions Bible",
        value: 37,
        text: "The 50 most used chord progressions of all time, three ways each: block chords, arpeggio, arrangement.",
        inside: ["150 MIDI files", "258 piano and e-piano WAV loops"],
      },
      {
        id: "chord-pack",
        name: "MIDI Chord Pack (Jazz Edition)",
        value: 47,
        text: "Jazz chords and progressions in every key, for when a song needs more colour than the hit had.",
        inside: ["2,304 MIDI files", "All 12 major/minor key pairs", "6 folders per key: best voicing, smooth bass, sevenths, extended, altered, progressions"],
      },
      {
        id: "anime-pack",
        name: "Anime & Video Games MIDI Pack",
        value: 47,
        text: "Anime and video game progressions, from royal road to boss battle, in every key.",
        inside: ["1,548 MIDI files", "12 key pairs"],
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
        id: "essential-drums",
        name: "ESSENTIAL MIDI Drum Patterns",
        value: 7,
        text: "163 MIDI drum files to build the beat under your chords, one part at a time.",
        inside: ["158 one-part patterns: 808, closed and open hats, kick, snare or clap, accents", "Kick + snare and kick + 808 multi-track loops", "5 complete multi-track beats"],
      },
    ],
    free: "Free",
  },
  stack: {
    title: "1,000 transcriptions for the price of a few.",
    sub: "A transcriber charges {c}10–30 for a single song. This is the whole bundle, one payment.",
    items: [
      "1,000 chord progressions from hit songs, in MIDI",
      "4 folders by genre, 470+ artists",
      "Transcribed by ear, note for note",
      "Artist, song, key and BPM in the file name",
      "Works in any DAW, Mac and PC",
      "Full commercial license",
    ],
    today: "Today",
  },
  guarantee: {
    title: "14-day quality guarantee.",
    text: "If a file is broken, missing or not what this page says, email {email} within 14 days. We fix it or replace it. If we can't, you get a refund.",
  },
  license: {
    title: "Commercial license.",
    text: "Use every file in your own music, commercial releases included: sell the beats, lease them, put the songs out. The money is yours, no royalties. You just can't resell or share the MIDI files themselves.",
  },
  after: {
    title: "What happens after you pay.",
    items: [
      ["Pay", "by card, Apple Pay, Google Pay or PayPal."],
      ["Download", "from the buttons on the next page. The same links come by email."],
      ["Unzip", "four folders by genre, 1,000 .mid files named with artist, song, key and BPM. Plus the 6 bonuses."],
      ["Drag a .mid", "onto a track, change the key, load your sound. You can be writing in 5 minutes."],
    ] as [string, string][],
  },
  faq: {
    title: "Questions before you grab it.",
    items: [
      ["Is this MIDI or samples?", "MIDI: the chords as notes. No audio, no samples, nothing taken from the recordings. You load your own piano, pad or synth, change the key, edit any note."],
      ["Are these the original song files?", "No. They are our own transcriptions, written by hand and by ear, note for note, from the records: the chords, the voicings, the inversions, the passing changes."],
      ["Can I sell beats made with them?", "Yes. Full commercial license: sell on BeatStars, Airbit, Traktrain, lease to artists, release on Spotify and Apple Music, keep the money. You just can't resell or share the MIDI files themselves."],
      ["Will it work in my DAW?", "Yes. Standard .mid files: FL Studio, Ableton Live, Logic Pro, Pro Tools, Studio One, Cubase, Reaper, Bitwig, GarageBand. Mac and Windows, plus mobile DAWs that read MIDI."],
      ["How do I find the right progression out of 1,000?", "The files are in four folders by genre, and the name has the artist, the song, the key and the BPM. Search the folder for an artist, a key or a tempo, drag the file in and transpose it to your track."],
      ["How long is each file?", "Half of them run 16 bars or more: the progression as the song plays it. The shortest are 4-bar loops."],
      ["I don't know music theory. Can I use it?", "Yes. Drag a file onto a track, pick a sound, press play. The chords are already written. Change the key in one click to fit your beat."],
      ["How fast do I get it?", "Right after payment: the download buttons are on the next page and the links come by email."],
      ["What if a file doesn't work?", "14-day quality guarantee. If a file is broken, missing or not what this page says, email {email}. We fix it or replace it, and if we can't, you get a refund."],
    ] as [string, string][],
  },
  final: {
    title: "Start your next beat on chords that already worked.",
    sub: "Drag one in. Change the key. Write on top.",
  },
  disclaimer: [
    "Disclaimer: TOP HITS MIDI Bundle is designed to help you write music and improve your production workflow, but individual results may vary, and specific outcomes, income, or success are not guaranteed. Artist names and song titles are used only to identify the songs that were transcribed and do not imply endorsement or affiliation; all trademarks belong to their owners. The MIDI files are original transcriptions made by ear and contain no audio from the original recordings.",
    "The previews play the first bars of the MIDI files on a sine or on a sampled piano (Salamander Grand Piano by Alexander Holm, CC BY 3.0).",
    "GRIND STUDIO is not a part of the Facebook website or Meta Platforms, Inc. This site is NOT endorsed by Facebook in any way. FACEBOOK and INSTAGRAM are trademarks of META PLATFORMS, Inc.",
  ],
};

// The order page.
export const ORDER = {
  bfbar: "90% Sale Is Ending Soon",
  secure: "Secure checkout",
  srTitle: "Complete your TOP HITS MIDI Bundle order",
  tagline: "1,000 chord progressions from hit songs + 6 bonuses",
  stack: [
    "1,000 chord progressions from hit songs, in MIDI",
    "4 folders by genre, 470+ artists",
    "Artist, song, key and BPM in the file name",
    "Transcribed by ear, note for note",
    "Any DAW, Mac and PC · commercial license",
  ],
  bonusHead: "Plus 6 free bonuses",
  today: "Today",
  guarantee: "14-day quality guarantee. A file doesn't work? We fix it.",
  proof: [
    "**1,000** chord progressions from hit songs",
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
      "The 'HUSTLE' Bundle includes **31 Professional MIDI Packs** with Musical Ideas, Chord Progressions and Melodies. Jazz, Trap, Hiphop, Lofi, Pop and more. Each MIDI Pack is {c}29 (total {c}899) but you can get them all right now for just {c}25.",
    ],
  },
};

// Upsell 1 after the order (./offer): the Jazz MIDI Pack, one click. Its claims are
// the Jazz MIDI Pack's (../../jazz-midi-pack/BRIEF.md). A TOP HITS buyer already has five
// of its six bonuses, so the page sells the pack alone.
export const UPSELL = {
  bar: "Wait. Your order is complete: one more thing before your downloads.",
  title: "You have the chords of the hits.|Now get ==the ones nobody can write.",
  sub: "The Jazz MIDI Pack: the progressions behind lofi, neo soul and jazz, as MIDI, already voiced like a pianist plays them. The colour you add when a four-chord loop isn't enough.",
  bullets: [
    "**10,496 MIDI files** in 5 folders",
    "The most used jazz progressions × 12 voicings × 8 rhythms",
    "Every progression in all 12 keys",
    "Walking, two-feel and bossa bass lines",
    "Lofi, neo soul, trap soul and deep house loops, drums included",
    "Chord names written into every file",
  ],
  yes: "Yes, add the Jazz MIDI Pack for {price}",
  yesSub: "One click: charged to the card or PayPal you just used",
  no: "No thanks, I'll skip the jazz chords",
  end: "The pack goes on the same download page as your TOP HITS MIDI Bundle.",
};
export type UpsellWords = typeof UPSELL;
