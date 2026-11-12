// The blog's posts (m.thegrind.studio/blog), written for search: each answers
// one thing producers look up ("lofi chord progressions", "ii-V-I"…) and sends
// the reader on to the Jazz MIDI Pack. Rules:
//  - Every claim about the pack is in app/(funnels)/jazz-midi-pack/BRIEF.md.
//    No price (it changes in the dashboard), never how many progressions.
//  - Every chord named beside a roll is the chord written in that file
//    (rolls.json, from tools/blog_rolls.py), and every "the top note moves…"
//    was measured on those notes (2026-11-12).
//  - Voice: the funnels' "Diretto" (producer to producer, short sentences, no
//    hype, no exclamation marks).
// Inline marks in text: **bold**, [words](/path or https://…), and {pack} for
// the Jazz MIDI Pack's address with this post's utm tags (page.tsx).
import rolls from "./rolls.json";
import { MORE } from "./more";
import { isLive, RELEASE } from "./schedule";

export type RollKey = keyof typeof rolls;

export type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  /** A row of chord names, with what they are underneath. */
  | { chords: string[]; label?: string }
  | { table: { head: string[]; rows: string[][] } }
  /** A real file of the pack, drawn as a piano roll with a play button. */
  | { roll: RollKey; title: string }
  /** That file's chords bar by bar, four bars to a line (read from the file, never typed). */
  | { chart: RollKey; caption?: string }
  | { note: string }
  /** The pack's panel: box, one line, button. */
  | { cta: string };

export type Post = {
  slug: string;
  /** The page's h1. */
  title: string;
  /** <title> and the search result's blue line (≤ 60 characters). */
  seoTitle: string;
  /** The search result's grey lines (≤ 155 characters). */
  description: string;
  /** The line under the title on the blog's index. */
  teaser: string;
  /** The day it comes out, from schedule.ts (YYYY-MM-DD). */
  date: string;
  minutes: number;
  blocks: Block[];
  faq: { q: string; a: string }[];
};

export const PACK_LINE =
  "Every progression on this page is in the Jazz MIDI Pack: 10,496 MIDI files, each progression in 12 voicings, 8 rhythms and all 12 keys, with bass lines and full lofi, neo soul, trap soul and deep house loops. Drag one onto a Rhodes and change what you like.";

const FIRST: Post[] = [
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "jazz-chord-progressions-for-producers",
    date: RELEASE["jazz-chord-progressions-for-producers"],
    title: "10 Jazz Chord Progressions Every Producer Should Know",
    seoTitle: "10 Jazz Chord Progressions for Producers (Chords + MIDI)",
    description:
      "The ten jazz chord progressions behind lofi, neo soul and trap soul: the chords, what each one does in a beat, and a piano roll you can play.",
    teaser: "The short list behind lofi, neo soul and trap soul, each with its chords and a piano roll you can play.",
    minutes: 8,
    blocks: [
      { p: "Most of the jazz you hear in lofi, neo soul and trap soul comes from a short list of progressions. Learn these ten and you can read almost any chord chart, and you have a starting point for every beat that needs that sound." },
      { p: "Each one below has its chords, what it does in a track, and a piano roll you can play. The rolls are real files from our [Jazz MIDI Pack]({pack}), voiced the way a pianist plays them." },
      { note: "Reading the numbers: ii-V-I means the chords built on the 2nd, 5th and 1st notes of the key. Lower case is minor, upper case is major or dominant. In C major that's Dm7, G7, Cmaj7." },

      { h2: "1. ii-V-I" },
      { chords: ["Dm7", "G7", "Cmaj7"], label: "ii – V – I in C major" },
      { p: "The most used progression in jazz. The ii sets up, the V pulls, the I lands. Hold each chord for a bar and the I for two, and you have a lofi loop. Play it fast and it's bebop. If you only learn one, learn this: half of the list below is a ii-V-I with something swapped." },
      { roll: "iiVI", title: "ii-V-I in C" },
      { p: "More on it, with all 12 keys: [the ii-V-I explained for producers](/blog/ii-v-i-progression-explained)." },

      { h2: "2. Minor ii-V-i" },
      { chords: ["Dm7b5", "G7b9", "Cm6"], label: "ii – V – i in C minor" },
      { p: "The same move in a minor key. The half-diminished ii and the flat nine on the V give it a darker, more cinematic pull. Use it when a major ii-V-I sounds too happy for the beat." },
      { roll: "iiVi_minor", title: "Minor ii-V-i in C minor" },

      { h2: "3. The I-vi-ii-V turnaround" },
      { chords: ["Cmaj7", "Am7", "Dm7", "G7"], label: "I – vi – ii – V in C major, two beats each" },
      { p: "Two beats a chord, and the G7 at the end sends you back to the top. That's why it's called a turnaround. It never rests for long, so it loops forever, which makes it a good bed for a hook." },
      { roll: "turn_best", title: "I-vi-ii-V turnaround in C" },

      { h2: "4. The Autumn Leaves type" },
      { chords: ["Cm7", "F7", "Bbmaj7", "Ebmaj7", "Am7b5", "D7b9", "Gm6"], label: "ii – V – I – IV in Bb major, then ii – V – i in G minor" },
      { p: "A ii-V-I in a major key, then a ii-V-i in its relative minor. Four bars bright, four bars dark, in one eight-bar loop. It's the first standard most jazz students learn, and you hear it all over lofi." },
      { roll: "autumn", title: "Autumn Leaves type in G minor" },

      { h2: "5. The minor circle of fifths" },
      { chords: ["Fm9", "Bbm9", "Eb13", "Abmaj9", "Dbmaj9", "Gm7b5", "C7alt", "Fm9"], label: "i – iv – VII – III – VI – ii – V – i in F minor" },
      { p: "Each root drops a fifth to the next one, so every chord sounds like the answer to the one before. Eight bars that feel like a whole song. Fly Me to the Moon moves this way." },
      { roll: "circle", title: "Minor circle of fifths in F minor" },

      { h2: "6. Tritone substitution" },
      { chords: ["Dm7", "Db7", "Cmaj7"], label: "ii – bII7 – I in C major" },
      { p: "Swap the V for the dominant chord a tritone away: Db7 in place of G7. The two chords share their 3rd and 7th, so it still resolves, and the bass now walks down in half steps: D, Db, C. It's the late-night version of a ii-V-I." },
      { roll: "tritone", title: "Tritone substitution in C" },

      { h2: "7. The backdoor ii-V" },
      { chords: ["Fm7", "Bb7", "Cmaj7"], label: "iv – bVII7 – I in C major" },
      { p: "You reach the I from a whole step below, Bb7 to C, with a borrowed minor iv in front of it. It's softer and more soulful than the regular V. Gospel and neo soul use it all the time." },
      { roll: "backdoor", title: "Backdoor ii-V in C" },

      { h2: "8. Passing diminished" },
      { chords: ["Cmaj7", "C#dim7", "Dm7", "D#dim7", "Em7", "A7", "Dm7", "G7"], label: "I – #i° – ii – #ii° – iii – VI7 – ii – V in C major" },
      { p: "A diminished chord slipped between two chords a whole step apart, so the bass climbs in half steps: C, C#, D, D#, E. It sounds like an old record, in a good way. Try it in a bridge." },
      { roll: "passing", title: "Passing diminished in C" },

      { h2: "9. The minor line cliché" },
      { chords: ["Cm", "CmMaj7", "Cm7", "Cm6"], label: "One chord, one note falling: C, B, Bb, A" },
      { p: "One minor chord, and one inner note that falls a half step every bar. The chord barely changes and the track still moves. Think spy film." },
      { roll: "cliche", title: "Minor line cliché in C minor" },

      { h2: "10. The Dorian vamp" },
      { chords: ["Dm11", "G13"], label: "i – IV in D Dorian" },
      { p: "Two chords, back and forth, no resolution. The harmony stays out of the way so the drums, the bass and the topline can do the work. A lot of neo soul and house grooves are a vamp like this one." },
      { roll: "dorian", title: "Dorian vamp in D minor" },

      { h2: "The chords are half of it" },
      { p: "Type Dm7, G7 and Cmaj7 into a piano roll in root position and it sounds like a ringtone. The same three chords sound like a record when the notes stay close together and each one moves a step or less into the next chord. That's voicing. We show it with before and after piano rolls in [how to make chords sound jazzy](/blog/how-to-make-chords-sound-jazzy)." },

      { h2: "Want them as MIDI?" },
      { cta: PACK_LINE },
    ],
    faq: [
      { q: "What is the most common jazz chord progression?", a: "The ii-V-I: Dm7, G7, Cmaj7 in C major. Most jazz standards are chains of ii-V-Is in different keys, and lofi and neo soul loops borrow it constantly." },
      { q: "Do I need music theory to use jazz chords in my beats?", a: "No. You need to know which chords go together, which is what the list above gives you, and MIDI files with the chord names written in do the rest. The theory helps later, when you want to change them." },
      { q: "Which jazz progressions are used in lofi?", a: "Mostly the ii-V-I, the I-vi-ii-V turnaround, the Autumn Leaves type and minor loops such as vi-IV-I-V, all with seventh and ninth chords at 70 to 90 bpm." },
      { q: "Can I use these progressions in my own songs?", a: "Yes. A chord progression on its own isn't protected by copyright, which is why thousands of songs share the same ones. The melody, the lyrics and the recording are what's protected." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "lofi-chord-progressions",
    date: RELEASE["lofi-chord-progressions"],
    title: "Lofi Chord Progressions: 6 That Work, and How to Voice Them",
    seoTitle: "Lofi Chord Progressions: 6 That Work (With MIDI Examples)",
    description:
      "Six lofi chord progressions with the exact chords, a piano roll to play for each, and the voicing moves that make them sound like a record.",
    teaser: "Six progressions with the exact chords, a roll to play for each, and the moves that make them sound like a record.",
    minutes: 7,
    blocks: [
      { p: "Lofi is jazz harmony slowed down. The chords come from jazz standards and soul records: sevenths and ninths, played soft, somewhere between 70 and 90 bpm." },
      { p: "Here are six progressions that work, with the chords and a piano roll for each. The rolls are real files from our [Jazz MIDI Pack]({pack}). After the list: how to voice them so they sound played." },

      { h2: "1. Sad lofi: vi-IV-I-V" },
      { chords: ["Am9", "Fmaj9", "Cmaj9", "G13"], label: "vi – IV – I – V in C major" },
      { p: "The four chords of a thousand pop songs, started on the minor chord and dressed in ninths. Start here if you're new to this. In the file below, the top note of the first four chords is the same E. Only the notes under it move, which is why it sounds calm." },
      { roll: "sadlofi", title: "Sad lofi vi-IV-I-V in A minor" },
      { p: "The same progression as a full loop at 82 bpm, chords and bass:" },
      { roll: "loop_lofi_sad", title: "Sad lofi loop, 82 bpm" },

      { h2: "2. ii-V-I" },
      { chords: ["Dm7", "G7", "Cmaj7"], label: "ii – V – I in C major" },
      { p: "The jazz progression. One bar each for the ii and the V, two bars on the I, and it loops. Add ninths (Dm9, G13, Cmaj9) when it sounds too plain. [All 12 keys and the variations are here](/blog/ii-v-i-progression-explained)." },
      { roll: "iiVI", title: "ii-V-I in C" },

      { h2: "3. The Autumn Leaves type" },
      { chords: ["Cm7", "F7", "Bbmaj7", "Ebmaj7", "Am7b5", "D7b9", "Gm6"], label: "Four bars in Bb major, four in G minor" },
      { p: "Eight bars that go from bright to dark and back. You get a verse and a mood change out of one loop. Here it is as a lofi loop:" },
      { roll: "loop_lofi_autumn", title: "Autumn Leaves type, lofi loop, 82 bpm" },

      { h2: "4. The Just the Two of Us progression" },
      { chords: ["Dbmaj9", "C7alt", "Fm9", "Ebm9", "Ab13"], label: "IV – III7 – vi – v – I7, in F minor" },
      { p: "It starts away from home, pulls hard into the minor chord, and turns itself around. Slow it down and it's lofi. We wrote it out [in every key here](/blog/just-the-two-of-us-chord-progression)." },
      { roll: "jttou", title: "Just the Two of Us type in F minor" },

      { h2: "5. The Royal Road: IV-V-iii-vi" },
      { chords: ["Fmaj9", "G7", "Em7", "Am9"], label: "IV – V – iii – vi in C major" },
      { p: "Bright and nostalgic. It's the standard progression of J-pop and anime themes, and it's where lofi gets its wistful side." },
      { roll: "royal", title: "Royal Road in A minor" },

      { h2: "6. The minor lofi ballad" },
      { chords: ["Dm9", "Bbmaj9", "Gm9", "A7alt"], label: "i – VI – iv – V in D minor" },
      { p: "The darkest of the six. The A7alt at the end is the only tense chord, and it pulls you back to the Dm9. Good under a vocal chop." },
      { roll: "lofiballad", title: "Minor lofi ballad in D minor" },

      { h2: "How to voice lofi chords" },
      { p: "The progression is the easy part. These six moves are what make it sound like a record." },
      {
        ol: [
          "**Use sevenths and ninths.** A plain triad sounds like pop. Add the 7th, then try the 9th on top.",
          "**Stay in the middle of the keyboard**, roughly C3 to C5. Lower gets muddy, higher gets thin.",
          "**Give the root to the bass.** Your chord can then start on the 3rd or the 7th, and the two don't fight.",
          "**Move as little as possible.** Keep the notes two chords share and move the others by a step. [Before and after rolls here](/blog/how-to-make-chords-sound-jazzy).",
          "**Play soft.** Velocities around 50 to 80, and not all the same.",
          "**Pick a warm sound.** A Rhodes, a felt piano, a soft pad. Then take some highs off.",
        ],
      },

      { h2: "The six progressions as MIDI" },
      { cta: PACK_LINE },
    ],
    faq: [
      { q: "What chords are used in lofi?", a: "Seventh and ninth chords: maj7, m7, dominant 7 and their 9th versions (Cmaj9, Am9, G13). They come from jazz and soul, played softly at a slow tempo." },
      { q: "What is the most common lofi chord progression?", a: "There's no single winner, but the ii-V-I (Dm7, G7, Cmaj7) and vi-IV-I-V with seventh chords (Am9, Fmaj9, Cmaj9, G13) are the two you'll hear most." },
      { q: "What BPM is lofi?", a: "Usually 70 to 90 bpm. The lofi loops in our Jazz MIDI Pack are at 82." },
      { q: "Do I need to play piano to make lofi chords?", a: "No. You can draw the chords in the piano roll or drag in MIDI files that are already voiced, then pick the sound." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "neo-soul-chord-progressions",
    date: RELEASE["neo-soul-chord-progressions"],
    title: "Neo Soul Chord Progressions: 6 Loops and the Chords Behind Them",
    seoTitle: "Neo Soul Chord Progressions: 6 Loops (With MIDI Examples)",
    description:
      "Six neo soul chord progressions with the exact chords and a piano roll to play, plus what makes a chord sound neo soul in the first place.",
    teaser: "Six loops with the exact chords, a roll to play for each, and what makes a chord sound neo soul.",
    minutes: 7,
    blocks: [
      { p: "Neo soul is a Rhodes playing ninth chords over a lazy drum groove. Think D'Angelo and Erykah Badu. The progressions are short loops of two to four chords. The color comes from the extensions and from how one chord slides into the next." },
      { p: "Six loops below, with the chords and a piano roll for each. The rolls are real files from our [Jazz MIDI Pack]({pack})." },

      { h2: "1. The 4-3-2-1" },
      { chords: ["Fmaj9", "Em7", "Dm9", "Cmaj9"], label: "IV – iii – ii – I in C major" },
      { p: "Four chords walking down the scale from the IV to the I. It's smooth because every root is one step below the last. In the file below the top note stays on E for all four chords. The second time round, an A7b9 and a G13 push it back to the top." },
      { roll: "neo4321", title: "Neo soul 4-3-2-1 in C" },
      { p: "As a full neo soul loop at 88 bpm, chords and bass:" },
      { roll: "loop_neo_4321", title: "4-3-2-1, neo soul loop, 88 bpm" },

      { h2: "2. The neo soul minor loop" },
      { chords: ["Bbm9", "Ebm9", "Ab13", "Dbmaj9", "Gbmaj9", "F7alt"], label: "i – iv – VII – III – VI – V in Bb minor" },
      { p: "It starts minor, passes through a ii-V into the relative major, and the F7alt at the end drags you back to the Bbm9. Four bars, and it never sits still." },
      { roll: "loop_neo_minor", title: "Neo soul minor loop, 88 bpm" },

      { h2: "3. The minor turnaround" },
      { chords: ["Cm9", "Abmaj9", "Dm7b5", "G7alt"], label: "i – VI – ii – V in C minor" },
      { p: "The minor version of the I-vi-ii-V. The last two chords are a minor ii-V, so the loop pulls itself back to the start every time." },
      { roll: "minorturn", title: "Minor turnaround in C minor" },

      { h2: "4. I-III7-IV-iv" },
      { chords: ["Cmaj9", "E7b9", "Fmaj9", "Fm6/9"], label: "I – III7 – IV – iv in C major" },
      { p: "The E7 is the surprise, and the IV turning minor at the end is the heartbreak. Slow jam material." },
      { roll: "I_III7", title: "I-III7-IV-iv in C" },

      { h2: "5. The minor plagal (backdoor) loop" },
      { chords: ["Ebmaj9", "Abmaj9", "Abm9", "Db13", "Ebmaj9"], label: "I – IV – iv – bVII7 – I in Eb major" },
      { p: "The IV turns minor, then a dominant chord a whole step under the I slides home. This is the gospel move, and it's everywhere in neo soul." },
      { roll: "plagal", title: "Minor plagal in Eb" },

      { h2: "6. The Dorian vamp" },
      { chords: ["Dm11", "G13"], label: "i – IV in D Dorian" },
      { p: "Two chords and no resolution. When the groove is the point, this is all the harmony you need." },
      { roll: "dorian", title: "Dorian vamp in D minor" },

      { h2: "What makes a chord sound neo soul" },
      {
        ul: [
          "**Ninths, elevenths and thirteenths.** The minor 9 is the signature: Dm9 is D, F, A, C, E.",
          "**Altered dominants** (7alt, 7b9) right before a minor chord. That's the tension you hear before the loop restarts.",
          "**Chords that move by step or half step**: passing chords, tritone subs, a chord approached from a half step away.",
          "**Close voicings in the middle of the keyboard**, with the root in the bass.",
          "**A slow tempo**, around 80 to 95 bpm. The neo soul loops in our pack are at 88.",
          "**The sound.** A Rhodes or a Wurlitzer does half the work.",
        ],
      },
      { p: "The stacking of the notes matters as much as the chord names. We show why, with before and after rolls, in [how to make chords sound jazzy](/blog/how-to-make-chords-sound-jazzy)." },

      { h2: "The six loops as MIDI" },
      { cta: PACK_LINE },
    ],
    faq: [
      { q: "What chords are used in neo soul?", a: "Extended chords: minor 9, major 9, dominant 13 and altered dominants, in short loops such as IV-iii-ii-I or i-VI-ii-V." },
      { q: "What is the neo soul chord?", a: "People usually mean the minor 9: a minor seventh chord with the 9th on top. Dm9 is D, F, A, C, E." },
      { q: "What is the difference between lofi and neo soul chords?", a: "The harmony is mostly the same. Neo soul uses more extensions and altered dominants and more movement between chords. Lofi keeps it simpler and slower." },
      { q: "What key is neo soul in?", a: "Any key. Transpose the MIDI until it suits the singer or the sample you're working with." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-make-chords-sound-jazzy",
    date: RELEASE["how-to-make-chords-sound-jazzy"],
    title: "How to Make Chords Sound Jazzy in Your DAW",
    seoTitle: "How to Make Chords Sound Jazzy in Your DAW (5 Moves)",
    description:
      "Five moves that turn stiff piano-roll chords into chords that sound played: sevenths, ninths, voice leading and rhythm. With before and after rolls.",
    teaser: "Five moves that turn stiff piano-roll chords into chords that sound played, with before and after rolls.",
    minutes: 7,
    blocks: [
      { p: "You put Cmaj7, Am7, Dm7 and G7 in the piano roll. They're the right chords, and it still sounds like a ringtone. What you're hearing is the way they're stacked." },
      { p: "Press play on both of these. Same eight chords, same rhythm, two files from our [Jazz MIDI Pack]({pack})." },
      { roll: "turn_root", title: "Before: root position" },
      { roll: "turn_best", title: "After: voiced" },
      { p: "In the first, every chord is in root position, the way a chord chart or a chord plugin hands it to you. The top note jumps as much as seven semitones from one chord to the next. In the second, the top note never moves more than three, and the bass holds the roots underneath. The difference between the two is five moves." },

      { h2: "1. Add the seventh" },
      { p: "A triad is three notes: C, E, G. Add the 7th note of the scale on top and you get Cmaj7: C, E, G, B. That one note is most of the jazz sound. Do it to every chord in your progression before anything else." },

      { h2: "2. Add a ninth, and give the root to the bass" },
      { p: "Next, the 9th: Dm9 is D, F, A, C, E. Five notes in one hand gets thick, so let the bass play the D and keep F, A, C, E for the chord. A pianist in a band does the same thing, because the bass player already has the root." },

      { h2: "3. Keep the shared notes, move the rest by a step" },
      { p: "This is voice leading, and it's the move that matters most. Take a ii-V-I in C, as it is in the pack's Best Voicing file:" },
      {
        table: {
          head: ["Chord", "Bass", "Chord notes"],
          rows: [
            ["Dm7", "D", "A – C – D – F"],
            ["G7", "G", "G – B – D – F"],
            ["Cmaj7", "C", "G – B – C – E"],
          ],
        },
      },
      { p: "From Dm7 to G7, the D and the F stay where they are. C drops a half step to B, A drops a whole step to G. From G7 to Cmaj7, G and B stay, F drops to E and D drops to C. No note in the chord moves more than two semitones." },
      { roll: "iiVI_root", title: "ii-V-I in root position" },
      { roll: "iiVI", title: "ii-V-I, voice-led" },

      { h2: "4. Keep the top note steady" },
      { p: "The ear follows the top note as if it were a melody. In root position, the top of that ii-V-I climbs from C to F to B: up five semitones, then up six. Voiced, it goes F, F, E. When the top barely moves, the chords sound like one phrase." },

      { h2: "5. Give the chords a rhythm" },
      { p: "Four chords held for a bar each is a pad. A pianist comps: short hits, some on the beat and some before it. The classic pattern is the Charleston, a hit on beat 1 and another on the and of 2. Here it is on the same ii-V-I:" },
      { roll: "iiVI_charleston", title: "ii-V-I, Charleston rhythm" },

      { h2: "Four voicings worth knowing" },
      { p: "Once the five moves make sense, these are the shapes pianists reach for. All four are the same ii-V-I." },
      {
        table: {
          head: ["Voicing", "What it is", "Use it for"],
          rows: [
            ["Shell", "Root, 3rd and 7th. Three notes.", "Busy beats, where the chord has to stay out of the way"],
            ["Rootless", "3rd, 5th, 7th and 9th. The bass has the root.", "The smooth Rhodes sound of lofi and neo soul"],
            ["Drop 2", "A close chord with its second note from the top dropped an octave", "Wider, more open chords under a melody"],
            ["Quartal", "Notes stacked in fourths", "A modern, open, modal sound"],
          ],
        },
      },
      { roll: "iiVI_shell", title: "ii-V-I, shell voicing" },
      { roll: "iiVI_rootless", title: "ii-V-I, rootless voicing" },
      { roll: "iiVI_quartal", title: "ii-V-I, stacked in fourths" },

      { h2: "The shortcut" },
      { p: "Doing this by hand for every chord of every beat takes a while, and it takes longer if you don't play keys. That's why we made the pack: each progression is already voiced 12 ways, with the chord names written into the file so you can see what you're playing." },
      { cta: "10,496 jazz MIDI files, voiced note by note: 12 voicings and 8 rhythms for each progression, in all 12 keys, with bass lines and full lofi, neo soul, trap soul and deep house loops. Works in any DAW that opens .mid." },
    ],
    faq: [
      { q: "Why do my chords sound stiff in the piano roll?", a: "Usually because every chord is in root position, so all the notes jump together from chord to chord. Keep the notes two chords share, move the others by a step, and let the bass play the root." },
      { q: "What is voice leading?", a: "Moving each note of a chord to the nearest note of the next chord. Shared notes stay put and the rest move by a half step or a whole step, so the chords connect." },
      { q: "What is a rootless voicing?", a: "A chord played without its root, usually the 3rd, 5th, 7th and 9th, while the bass plays the root. It keeps the chord light and leaves the low end to the bass." },
      { q: "Which notes can I leave out of a chord?", a: "The 5th first, then the root if a bass is playing it. Keep the 3rd and the 7th: they're the two notes that tell you what the chord is." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "ii-v-i-progression-explained",
    date: RELEASE["ii-v-i-progression-explained"],
    title: "The ii-V-I Progression, Explained for Producers",
    seoTitle: "ii-V-I (2-5-1) Chord Progression in All 12 Keys, Explained",
    description:
      "What a ii-V-I (2-5-1) is, why it works, the chords in all 12 keys, the minor version, and the variations producers use in lofi, neo soul and R&B.",
    teaser: "What a 2-5-1 is, why it works, the chords in all 12 keys, and the variations worth stealing.",
    minutes: 6,
    blocks: [
      { p: "The ii-V-I, also written 2-5-1, is three chords: the ones built on the 2nd, 5th and 1st notes of a key. In C major that's Dm7, G7 and Cmaj7. It's the most used progression in jazz, and lofi, neo soul and R&B borrow it all the time." },
      { chords: ["Dm7", "G7", "Cmaj7"], label: "ii – V – I in C major" },
      { roll: "iiVI", title: "ii-V-I in C" },
      { p: "The roll above is a real file from our [Jazz MIDI Pack]({pack}). Press play, then read on for why those three chords fit together so well." },

      { h2: "Why it works" },
      { p: "Two things happen at once. The roots fall by a fifth each time: D to G, G to C. That's the strongest root movement there is. Above them, the 7th of each chord falls a half step to become the 3rd of the next: the C in Dm7 drops to the B in G7, and the F in G7 drops to the E in Cmaj7." },
      { p: "Those two half steps are what makes it sound smooth. They only come through if you voice the chords so those notes are next to each other. In root position they're buried:" },
      { roll: "iiVI_root", title: "ii-V-I in root position" },

      { h2: "The ii-V-I in all 12 keys" },
      { p: "The major version, and the minor version on the same home note. The minor one uses a half-diminished ii (m7b5) and often a flat nine on the V." },
      {
        table: {
          head: ["Key", "Major ii-V-I", "Minor ii-V-i"],
          rows: [
            ["C", "Dm7 – G7 – Cmaj7", "Dm7b5 – G7 – Cm7"],
            ["Db / C#", "Ebm7 – Ab7 – Dbmaj7", "D#m7b5 – G#7 – C#m7"],
            ["D", "Em7 – A7 – Dmaj7", "Em7b5 – A7 – Dm7"],
            ["Eb", "Fm7 – Bb7 – Ebmaj7", "Fm7b5 – Bb7 – Ebm7"],
            ["E", "F#m7 – B7 – Emaj7", "F#m7b5 – B7 – Em7"],
            ["F", "Gm7 – C7 – Fmaj7", "Gm7b5 – C7 – Fm7"],
            ["Gb / F#", "Abm7 – Db7 – Gbmaj7", "G#m7b5 – C#7 – F#m7"],
            ["G", "Am7 – D7 – Gmaj7", "Am7b5 – D7 – Gm7"],
            ["Ab / G#", "Bbm7 – Eb7 – Abmaj7", "A#m7b5 – D#7 – G#m7"],
            ["A", "Bm7 – E7 – Amaj7", "Bm7b5 – E7 – Am7"],
            ["Bb", "Cm7 – F7 – Bbmaj7", "Cm7b5 – F7 – Bbm7"],
            ["B", "C#m7 – F#7 – Bmaj7", "C#m7b5 – F#7 – Bm7"],
          ],
        },
      },
      { roll: "iiVi_minor", title: "Minor ii-V-i in C minor" },

      { h2: "Three variations worth stealing" },
      { h3: "Tritone substitution" },
      { chords: ["Dm7", "Db7", "Cmaj7"], label: "Db7 in place of G7" },
      { p: "Replace the V with the dominant chord a tritone away. The bass now walks down in half steps: D, Db, C." },
      { roll: "tritone", title: "Tritone substitution in C" },
      { h3: "The backdoor" },
      { chords: ["Fm7", "Bb7", "Cmaj7"], label: "iv – bVII7 – I" },
      { p: "Reach the I from a whole step below. Softer than the regular V, with a gospel feel." },
      { roll: "backdoor", title: "Backdoor ii-V in C" },
      { h3: "Extensions" },
      { chords: ["Dm9", "G13", "Cmaj9"], label: "The same three chords with one more note each" },
      { p: "Add the 9th to the ii and the I and the 13th to the V. Same progression, more color. This is the version you hear in neo soul." },

      { h2: "How to use it in a beat" },
      {
        ol: [
          "**As the whole loop.** One bar of Dm7, one of G7, two of Cmaj7. Four bars, done.",
          "**As a turnaround.** Put a quick ii-V in the last bar of any loop to pull it back to the first chord.",
          "**To change key.** Play the ii-V of the new key right before it, and the change sounds planned.",
          "**With a walking bass.** One note per beat that connects the roots, like this:",
        ],
      },
      { roll: "iiVI_walking", title: "Walking bass over a ii-V-I in C" },
      { p: "Autumn Leaves and Fly Me to the Moon are built from ii-V-Is. In pop, the verse and chorus of Doja Cat's Say So loop one in D: Em7, A7, Dmaj7. For more progressions built from it, see [10 jazz chord progressions every producer should know](/blog/jazz-chord-progressions-for-producers)." },

      { h2: "The ii-V-I as MIDI, in every key" },
      { cta: "The Jazz MIDI Pack has the ii-V-I, major and minor, in all 12 keys, 12 voicings and 8 rhythms, with walking, two-feel and bossa bass lines, beside the rest of the jazz progressions producers use: 10,496 MIDI files. The chord names are written into every file." },
    ],
    faq: [
      { q: "What is a 2-5-1 chord progression?", a: "The chords built on the 2nd, 5th and 1st notes of a key, played in that order. In C major: Dm7, G7, Cmaj7. It's written ii-V-I in Roman numerals." },
      { q: "What is the ii-V-I in C major?", a: "Dm7, G7, Cmaj7." },
      { q: "What is the ii-V-i in A minor?", a: "Bm7b5, E7, Am7. The ii is half-diminished and the V is often played with a flat nine (E7b9)." },
      { q: "Why does a ii-V-I sound jazzy?", a: "The roots fall in fifths while the 7th of each chord drops a half step to the 3rd of the next. That smooth pull toward the last chord is the sound of jazz harmony." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "just-the-two-of-us-chord-progression",
    date: RELEASE["just-the-two-of-us-chord-progression"],
    title: "The Just the Two of Us Chord Progression, in Every Key",
    seoTitle: "Just the Two of Us Chord Progression (IV-III7-vi), Every Key",
    description:
      "The Just the Two of Us chord progression (IV-III7-vi): the chords, why it works, a table for all 12 keys, and how producers use it in lofi and trap soul.",
    teaser: "The chords, why they pull so hard, a table for all 12 keys, and how to use it in lofi and trap soul.",
    minutes: 5,
    blocks: [
      { p: "Three chords from Grover Washington Jr. and Bill Withers' 1981 hit turned into one of the most reused loops in music. In the original key, F minor, they are Dbmaj7, C7 and Fm7, followed by a quick Ebm7 and Ab7 that lead back to the start." },
      { chords: ["Dbmaj7", "C7", "Fm7", "Ebm7", "Ab7"], label: "IV – III7 – vi – v – I7, counted in Ab major" },
      { p: "Here it is as a file from our [Jazz MIDI Pack]({pack}), with ninths and an altered C7:" },
      { roll: "jttou", title: "Just the Two of Us type in F minor" },

      { h2: "Why it works" },
      { p: "It starts on the IV chord, so it never sounds like it has arrived. The C7 is the dominant of F minor, and it pulls hard into the Fm7. Then Ebm7 and Ab7 are a ii-V that points straight back at the Dbmaj7. Every chord leads to the next one, and the last one leads to the first. That's why you can loop it for four minutes." },
      { p: "In Japan it's known as the Marunouchi progression, Marusa for short, after Sheena Ringo's Marunouchi Sadistic. It's a staple of J-pop." },

      { h2: "The progression in all 12 keys" },
      { p: "Listed by minor key, since that's how the loop feels. The last two chords are the turnaround. Leave them out and hold the minor chord if you want it simpler." },
      {
        table: {
          head: ["Key", "IV", "III7", "vi", "Turnaround"],
          rows: [
            ["A minor", "Fmaj7", "E7", "Am7", "Gm7 – C7"],
            ["Bb minor", "Gbmaj7", "F7", "Bbm7", "Abm7 – Db7"],
            ["B minor", "Gmaj7", "F#7", "Bm7", "Am7 – D7"],
            ["C minor", "Abmaj7", "G7", "Cm7", "Bbm7 – Eb7"],
            ["C# minor", "Amaj7", "G#7", "C#m7", "Bm7 – E7"],
            ["D minor", "Bbmaj7", "A7", "Dm7", "Cm7 – F7"],
            ["Eb minor", "Bmaj7", "Bb7", "Ebm7", "Dbm7 – Gb7"],
            ["E minor", "Cmaj7", "B7", "Em7", "Dm7 – G7"],
            ["F minor (original)", "Dbmaj7", "C7", "Fm7", "Ebm7 – Ab7"],
            ["F# minor", "Dmaj7", "C#7", "F#m7", "Em7 – A7"],
            ["G minor", "Ebmaj7", "D7", "Gm7", "Fm7 – Bb7"],
            ["G# minor", "Emaj7", "D#7", "G#m7", "F#m7 – B7"],
          ],
        },
      },

      { h2: "How producers use it" },
      {
        ul: [
          "**Lofi.** Slow it to 70 to 85 bpm, add ninths (Dbmaj9, Fm9), play it on a Rhodes.",
          "**Trap soul.** The same chords at 70 bpm with a sparse bass, as in the loop below.",
          "**With an altered dominant.** C7alt in place of C7 makes the pull into the minor chord stronger.",
          "**With a tritone sub the second time.** Our file swaps the C7 for a Gb13 on the repeat, so the bass slides down a half step into F.",
        ],
      },
      { roll: "loop_trap_jttou", title: "Just the Two of Us type, trap soul loop, 70 bpm" },
      { p: "Two more loops in the same family: the Royal Road (IV-V-iii-vi) and the sad lofi vi-IV-I-V, both in [lofi chord progressions](/blog/lofi-chord-progressions)." },

      { h2: "The progression as MIDI" },
      { cta: "The Just the Two of Us type is one of the progressions in the Jazz MIDI Pack, in 12 voicings, 8 rhythms and all 12 keys, with bass lines and as lofi, neo soul, trap soul and deep house loops. 10,496 MIDI files in total, chord names written into every file." },
    ],
    faq: [
      { q: "What are the chords in Just the Two of Us?", a: "Dbmaj7, C7 and Fm7, followed by Ebm7 and Ab7 that lead back to the Dbmaj7." },
      { q: "What key is Just the Two of Us in?", a: "F minor." },
      { q: "What is the Just the Two of Us progression in Roman numerals?", a: "IV – III7 – vi, counted in the relative major (Ab). With the turnaround: IV – III7 – vi – v – I7." },
      { q: "Is it the same as the Royal Road progression?", a: "No. The Royal Road is IV-V-iii-vi: Fmaj7, G7, Em7, Am7 in C. Both start on the IV and land on the vi, but the Just the Two of Us progression gets there through a dominant III7." },
      { q: "Can I use this progression in my own song?", a: "Yes. A chord progression on its own isn't protected by copyright. The melody, the lyrics and the recording are." },
    ],
  },
];

/** Every post, out or scheduled, in the order they come out. */
export const POSTS: Post[] = [...FIRST, ...MORE].sort((a, b) => a.date.localeCompare(b.date));

/** The posts that are out now. Pages that list posts are rebuilt every hour (revalidate), so a post joins them on its day. */
export const livePosts = (now = Date.now()) => POSTS.filter((p) => isLive(p.slug, now));

export const post = (slug: string) => POSTS.find((p) => p.slug === slug);
export const roll = (key: RollKey) => rolls[key];

export const SITE = "https://m.thegrind.studio";
export const BLOG = {
  title: "The Grind Studio Blog",
  description: "Chord progressions, voicings and beat-making notes for producers, with piano rolls you can play.",
};

/** The Jazz MIDI Pack's page, tagged so neo credits a sale to the post and the spot it came from. */
export const packUrl = (slug: string, spot: "text" | "box" | "end") =>
  `/jazz-midi-pack?utm_source=blog&utm_medium=organic&utm_campaign=${slug}&utm_content=${spot}`;
