// The blog's second batch (2026-11-12): fourteen posts that come out three a
// week (schedule.ts). Same rules as posts.ts: every claim about the pack is in
// the Jazz BRIEF.md, no price, never how many progressions, the "Diretto" voice.
// A tune's bar-by-bar chart is never typed here: a { chart } block prints it
// from the pack's own file, which follows the tune's changes ("X Type" in the
// pack). The chords named in the text and the FAQs were checked against it.
// Song facts (composer, year, key, form) are the standard ones; no melody and
// no lyrics are quoted.
import type { Post } from "./posts";
import { RELEASE } from "./schedule";

const tune = (name: string) =>
  `These changes are in the Jazz MIDI Pack as "${name} Type": 12 voicings, 8 rhythms and all 12 keys, with walking, two-feel and bossa bass lines, and as lofi, neo soul, trap soul and deep house loops. 10,496 MIDI files in total, chord names written into every file.`;

const COPYRIGHT = {
  q: "Can I use these chords in my own track?",
  a: "Yes. A chord progression on its own isn't protected by copyright, which is why so many tunes share the same changes. The melody, the lyrics and the recording are protected, so write your own on top.",
};

export const MORE: Post[] = [
  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "autumn-leaves-chords",
    date: RELEASE["autumn-leaves-chords"],
    title: "Autumn Leaves Chords: The Progression Every Producer Should Steal",
    seoTitle: "Autumn Leaves Chords, Explained (With MIDI Piano Roll)",
    description:
      "The Autumn Leaves chords in G minor, bar by bar, with a piano roll to play: a major ii-V-I and a minor ii-V-i in one eight-bar loop.",
    teaser: "A major ii-V-I and a minor ii-V-i in one eight-bar loop. The chords, a roll to play, and how to use it.",
    minutes: 5,
    blocks: [
      { p: "Autumn Leaves is the first standard most jazz students learn. Joseph Kosma wrote it in 1945, and it's usually played in G minor. The reason it's taught first is the same reason it works in a beat: its opening eight bars are the two most useful progressions in jazz, back to back." },
      { p: "Here are those eight bars as they are in our [Jazz MIDI Pack]({pack}). Press play." },
      { chart: "autumn" },
      { roll: "autumn", title: "Autumn Leaves type in G minor" },

      { h2: "How the eight bars are built" },
      { p: "Bars 1 to 4 are a ii-V-I in Bb major with one extra chord: Cm7, F7, Bbmaj7, then Ebmaj7. Bars 5 to 8 are a ii-V-i in G minor: Am7b5, D7b9, Gm. Bb major and G minor share the same notes, so the loop changes mood without changing key. Four bars bright, four bars dark." },
      { p: "Look at the roots: C, F, Bb, Eb, A, D, G. Each one is a fifth below the last. That steady fall is why every chord sounds like it answers the one before it. If the ii-V-I is new to you, [start here](/blog/ii-v-i-progression-explained)." },

      { h2: "The rest of the tune" },
      { p: "The full tune is 32 bars. The eight bars above are played twice, then the second half starts on the minor ii-V-i and moves back to the major one, so you hear the same two progressions in the other order. If you have the opening eight, you have the material for the whole thing." },

      { h2: "How to use it in a beat" },
      {
        ul: [
          "**As a lofi loop.** Slow it to around 80 bpm and put it on a Rhodes. Here it is as a loop from the pack:",
        ],
      },
      { roll: "loop_lofi_autumn", title: "Autumn Leaves type, lofi loop, 82 bpm" },
      {
        ul: [
          "**As two loops.** Bars 1 to 4 on their own are a bright four-bar loop. Bars 5 to 8 on their own are a dark one. Use one for the verse and one for the hook.",
          "**With a walking bass.** One note per beat that joins the roots. This is the pack's bass line for the same eight bars:",
        ],
      },
      { roll: "autumn_walking", title: "Walking bass, Autumn Leaves type" },
      { p: "More loops in the same family are in [lofi chord progressions](/blog/lofi-chord-progressions)." },

      { h2: "The changes as MIDI" },
      { cta: tune("Autumn Leaves") },
    ],
    faq: [
      { q: "What are the chords in Autumn Leaves?", a: "In G minor, the opening eight bars are Cm7, F7, Bbmaj7, Ebmaj7, Am7b5, D7, Gm, Gm. The rest of the tune reuses the same two progressions." },
      { q: "What key is Autumn Leaves in?", a: "Most players use G minor (relative major Bb). E minor is the other common key." },
      { q: "Why is Autumn Leaves the first tune jazz students learn?", a: "Because it's a major ii-V-I followed by a minor ii-V-i, the two progressions most other standards are made of, in one short form." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "trap-soul-chords",
    date: RELEASE["trap-soul-chords"],
    title: "Trap Soul Chords: 5 Progressions and How to Play Them",
    seoTitle: "Trap Soul Chords: 5 Progressions (With MIDI Examples)",
    description:
      "Five trap soul chord progressions with the exact chords and a 70 bpm loop to play for each, and what separates trap soul chords from lofi and neo soul.",
    teaser: "Five progressions with the exact chords, a 70 bpm loop to play for each, and what makes them trap soul.",
    minutes: 6,
    blocks: [
      { p: "Trap soul is R&B harmony over trap drums: dark ninth chords, a slow tempo, and a lot of space. Bryson Tiller put the name on an album in 2015, and the sound has been a lane of its own since." },
      { p: "The chords are the same jazz chords lofi and neo soul use. What changes is how few of them you play and how long you let them ring. Five progressions below, each as a 70 bpm loop from our [Jazz MIDI Pack]({pack}), chords and bass." },

      { h2: "1. The Just the Two of Us progression" },
      { chords: ["Dbmaj9", "C7alt", "Fm9", "Ebm9", "Ab13"], label: "IV – III7 – vi – v – I7, in F minor" },
      { p: "The most reused loop in the genre. It starts away from home, the C7alt pulls hard into the minor chord, and the last two chords turn it around. [The chords in every key are here](/blog/just-the-two-of-us-chord-progression)." },
      { roll: "loop_trap_jttou", title: "Just the Two of Us type, trap soul loop, 70 bpm" },

      { h2: "2. The minor loop" },
      { chords: ["Bbm9", "Ebm9", "Ab13", "Dbmaj9", "Gbmaj9", "F7alt"], label: "i – iv – VII – III – VI – V in Bb minor" },
      { p: "It opens on a minor ninth, slips into the relative major for a bar, and the F7alt at the end drags it back. Dark, but it moves." },
      { roll: "loop_trap_minor", title: "Minor loop, trap soul, 70 bpm" },

      { h2: "3. vi-IV-I-V in ninths" },
      { chords: ["Am9", "Fmaj9", "Cmaj9", "G13"], label: "vi – IV – I – V in C major" },
      { p: "The four chords of pop, started on the minor chord. Played as ninths at 70 bpm it stops sounding like pop. The simplest of the five to sing over." },
      { roll: "loop_trap_sad", title: "vi-IV-I-V, trap soul loop, 70 bpm" },

      { h2: "4. The minor circle of fifths" },
      { chords: ["Fm9", "Bbm9", "Eb13", "Abmaj9", "Dbmaj9", "Gm7b5", "C7alt", "Fm9"], label: "Eight bars in F minor" },
      { p: "Every root falls a fifth to the next. Eight bars with a different chord in each, so the loop feels like a whole song. Use it when four chords get boring." },
      { roll: "loop_trap_circle", title: "Minor circle of fifths, trap soul loop, 70 bpm" },

      { h2: "5. The minor ballad" },
      { chords: ["Dm9", "Bbmaj9", "Gm9", "A7alt"], label: "i – VI – iv – V in D minor" },
      { p: "Three soft chords and one tense one. The A7alt is the only chord that wants to move, and it only wants to go back to the Dm9." },
      { roll: "loop_trap_ballad", title: "Minor ballad, trap soul loop, 70 bpm" },

      { h2: "What makes chords sound trap soul" },
      {
        ul: [
          "**Minor keys and minor ninths.** Four of the five loops above start on a m9 chord.",
          "**One chord per bar, held.** The chord rings while the hi-hats do the moving. Busy comping belongs to neo soul.",
          "**A slow tempo.** 60 to 75 bpm, counted in half time. The pack's trap soul loops are at 70.",
          "**A low, simple bass.** Roots on the 808, long notes, a slide into the next chord.",
          "**A dark sound.** A filtered Rhodes, a soft pad or a detuned keys patch, with the highs rolled off and plenty of reverb.",
        ],
      },
      { p: "The voicing matters as much as the chord. A m9 in root position sounds thick and muddy. The same chord with the root on the 808 and the other notes close together sounds like the record. We show the difference in [how to make chords sound jazzy](/blog/how-to-make-chords-sound-jazzy)." },

      { h2: "The five loops as MIDI" },
      { cta: "The Jazz MIDI Pack has every one of its progressions as a trap soul loop at 70 bpm: chords, bass and drums as separate MIDI files, plus a full multitrack file. It also has them as lofi, neo soul and deep house loops, in 12 voicings and all 12 keys. 10,496 MIDI files in total." },
    ],
    faq: [
      { q: "What chords are used in trap soul?", a: "Mostly minor ninths, major ninths and altered dominants in a minor key, one chord per bar: for example Dbmaj9, C7alt, Fm9." },
      { q: "What BPM is trap soul?", a: "Usually 60 to 75 bpm in half time (120 to 150 if you count the hi-hats). The trap soul loops in our pack are at 70." },
      { q: "What is the difference between trap soul and neo soul chords?", a: "The chords are the same family. Neo soul moves more: passing chords, rhythmic comping, more extensions. Trap soul holds one dark chord per bar and leaves the movement to the drums." },
      { q: "What key is best for trap soul?", a: "Any minor key. Pick the one where the 808 sounds best on the root, usually somewhere between C and G." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "fly-me-to-the-moon-chords",
    date: RELEASE["fly-me-to-the-moon-chords"],
    title: "Fly Me to the Moon Chords: The Circle of Fifths in One Tune",
    seoTitle: "Fly Me to the Moon Chords, Bar by Bar (With MIDI Roll)",
    description:
      "The Fly Me to the Moon chords, all 32 bars, with a piano roll to play. Why the progression works (every root falls a fifth) and how to loop it in a beat.",
    teaser: "All 32 bars, a roll to play, why every chord sounds like the answer to the last, and how to loop it.",
    minutes: 5,
    blocks: [
      { p: "Bart Howard wrote Fly Me to the Moon in 1954. The version everyone knows is Frank Sinatra's from 1964, with Count Basie's band and a Quincy Jones arrangement. It's usually played in C major, and it starts on the A minor chord." },
      { p: "It's the cleanest example of one idea: move the root down a fifth, again and again. Here are the 32 bars as they are in our [Jazz MIDI Pack]({pack})." },
      { chart: "fly" },
      { roll: "fly", title: "Fly Me to the Moon type, all 32 bars" },

      { h2: "The first eight bars are the whole idea" },
      { chords: ["Am7", "Dm7", "G7", "Cmaj7", "Fmaj7", "Bm7b5", "E7b9", "Am7"], label: "vi – ii – V – I – IV – vii – III7 – vi in C major" },
      { p: "Read the roots: A, D, G, C, F, B, E, A. Each is a fifth below the last, and after seven steps you're back where you started. That's the circle of fifths, played inside one key. Every chord sets up the next one, which is why the tune feels like it's always arriving." },
      { p: "Bars 2 to 4 are a ii-V-I in C. Bars 6 to 8 are a ii-V-i in A minor. So the eight bars are the two standard progressions with two chords joining them. [The ii-V-I is explained here](/blog/ii-v-i-progression-explained)." },

      { h2: "What the other 24 bars do" },
      { p: "Bars 9 to 16 run ii-V-I in C again, with an Em7 and A7 in bar 12 that push it back to the Dm7. Bars 17 to 24 repeat the opening. The last eight bars are ii-V, iii-VI, ii-V, I: a turnaround stretched out, landing on C in bar 31." },

      { h2: "How to use it in a beat" },
      {
        ol: [
          "**Loop bars 1 to 8.** It's a complete eight-bar loop that never repeats a chord until the last bar.",
          "**Loop bars 1 to 4** for a brighter four-bar version: Am7, Dm7, G7, Cmaj7.",
          "**Add ninths.** Am9, Dm9, G13, Cmaj9, Fmaj9. Same roots, more color.",
          "**Change the feel, keep the chords.** Howard wrote it as a waltz and Sinatra swung it in four. It works slow on a Rhodes as well.",
        ],
      },
      { p: "The same root movement in a minor key is progression 5 in [10 jazz chord progressions every producer should know](/blog/jazz-chord-progressions-for-producers)." },

      { h2: "The changes as MIDI" },
      { cta: tune("Fly Me to the Moon") },
    ],
    faq: [
      { q: "What are the chords in Fly Me to the Moon?", a: "The first eight bars in C are Am7, Dm7, G7, Cmaj7, Fmaj7, Bm7b5, E7, Am7. The other 24 bars are built from the same ii-V-I in C and ii-V-i in A minor." },
      { q: "What key is Fly Me to the Moon in?", a: "Usually C major, starting on the A minor chord." },
      { q: "What progression is Fly Me to the Moon?", a: "A circle of fifths progression: vi-ii-V-I-IV-vii-III7-vi. Each root is a fifth below the one before." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "jazz-piano-voicings-for-producers",
    date: RELEASE["jazz-piano-voicings-for-producers"],
    title: "Jazz Piano Voicings for Producers: 8 Ways to Play One Chord",
    seoTitle: "Jazz Piano Voicings Explained: Shell, Rootless, Drop 2",
    description:
      "Eight jazz piano voicings on the same ii-V-I, each with its notes and a piano roll to play: shell, rootless, drop 2, drop 3, spread, close and quartal.",
    teaser: "Eight ways to stack the same ii-V-I, each with its notes and a roll to play, and when to use which.",
    minutes: 7,
    blocks: [
      { p: "A voicing is the way you stack a chord's notes: which ones you play, in what order, and how far apart. Dm7 is always D, F, A and C. Whether it sounds like a ringtone or a record depends on the voicing." },
      { p: "Below, the same ii-V-I in C (Dm7, G7, Cmaj7) eight ways. Every roll is a file from our [Jazz MIDI Pack]({pack}), same chords, same rhythm, so the only thing you hear changing is the voicing." },

      { h2: "1. Root position" },
      { p: "The notes in order from the root up: D, F, A, C. It's what a chord chart or a chord plugin gives you. All four notes jump together to the next chord, which is the stiff sound you're trying to get away from. Hear it once, then move on." },
      { roll: "iiVI_root", title: "ii-V-I, root position" },

      { h2: "2. Shell" },
      { p: "Root, 3rd and 7th, nothing else. For Dm7 that's D in the bass with F and C above it. The 3rd and 7th are the two notes that say what the chord is, so three notes are enough. Bud Powell played this way. Use it in a busy beat, where the chord has to stay out of the way." },
      { roll: "iiVI_shell", title: "ii-V-I, shell voicing" },

      { h2: "3. Rootless" },
      { p: "3rd, 5th, 7th and 9th: F, A, C, E for Dm7. No root, because the bass has it. This is the Bill Evans sound and the Rhodes sound of lofi and neo soul. Watch how little the notes move from one chord to the next." },
      { roll: "iiVI_rootless", title: "ii-V-I, rootless voicing" },

      { h2: "4. Voice-led close" },
      { p: "All four notes inside one octave, in whatever order puts them nearest the next chord: A, C, D, F, then G, B, D, F, then G, B, C, E. Two notes stay and two move by a step each time. This is the smoothest pad you can make." },
      { roll: "iiVI_close", title: "ii-V-I, voice-led close" },

      { h2: "5. Drop 2" },
      { p: "Take a close voicing and drop its second note from the top down an octave. Dm7 becomes F, C, D, A. The chord opens up without getting muddy. Guitarists and horn arrangers live on these. Use it under a melody, where a close chord would crowd the top." },
      { roll: "iiVI_drop2", title: "ii-V-I, drop 2" },

      { h2: "6. Drop 3" },
      { p: "The same trick with the third note from the top: C, A, D, F for Dm7. There's a wide gap above the lowest note, so it sounds like a bass note with a small chord over it." },
      { roll: "iiVI_drop3", title: "ii-V-I, drop 3" },

      { h2: "7. Spread" },
      { p: "Two hands. The left plays the root and the 7th low, the right plays the 3rd, 5th and 9th above: D and C, then F, A, E. It's the full, wide sound of a solo pianist. Good for an intro where the keys are alone." },
      { roll: "iiVI_spread", title: "ii-V-I, spread voicing" },

      { h2: "8. Quartal" },
      { p: "Notes stacked in fourths in place of thirds: D, G, C, F, with an A on top. It's the chord from Miles Davis's So What. It sounds open and modern, and a little ambiguous, because fourths don't say major or minor as clearly as thirds do." },
      { roll: "iiVI_quartal", title: "ii-V-I, stacked in fourths" },

      { h2: "Which one to use" },
      {
        table: {
          head: ["You want", "Use"],
          rows: [
            ["A smooth Rhodes for lofi or neo soul", "Rootless or voice-led close"],
            ["Chords that stay out of the way of busy drums", "Shell"],
            ["Room under a vocal or a lead", "Drop 2"],
            ["Keys on their own, sounding big", "Spread"],
            ["A modern, open, modal color", "Quartal"],
          ],
        },
      },
      { p: "The rule under all of them is the same: keep the notes two chords share, move the others by a step. We show that with before and after rolls in [how to make chords sound jazzy](/blog/how-to-make-chords-sound-jazzy)." },

      { h2: "Every voicing, already played" },
      { cta: "In the Jazz MIDI Pack every progression comes in 12 voicings: these eight, three inversions, and a Best Voicing with four voices over a root bass. Each one in 8 rhythms, with the chord names written into the file. 10,496 MIDI files in total." },
    ],
    faq: [
      { q: "What is a chord voicing?", a: "The way a chord's notes are arranged: which notes you play, in what order from low to high, and how far apart they are." },
      { q: "What is a shell voicing?", a: "The root, 3rd and 7th of a chord, with the 5th left out. For Dm7: D, F and C." },
      { q: "What is a rootless voicing?", a: "A chord played without its root, usually the 3rd, 5th, 7th and 9th, while the bass plays the root. For Dm7: F, A, C, E." },
      { q: "What is a drop 2 voicing?", a: "A close-position chord with its second note from the top moved down an octave. It spreads the chord over more than an octave." },
      { q: "Which voicing is best for lofi?", a: "Rootless or close voicings in the middle of the keyboard, with the root in the bass." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "blue-bossa-chords",
    date: RELEASE["blue-bossa-chords"],
    title: "Blue Bossa Chords: 16 Bars, Two Keys",
    seoTitle: "Blue Bossa Chords, Bar by Bar (With MIDI Piano Roll)",
    description:
      "The Blue Bossa chords in C minor, all 16 bars, with a piano roll to play: a minor loop that slips into Db major for four bars, and how to use it in a beat.",
    teaser: "All 16 bars, a roll to play, the four bars where it changes key, and how to use it in a beat.",
    minutes: 5,
    blocks: [
      { p: "Kenny Dorham wrote Blue Bossa, and it first came out on Joe Henderson's album Page One in 1963. It's 16 bars in C minor, and it's one of the first tunes people call at a jam session, because it's short and it does one clever thing." },
      { p: "Here are the 16 bars as they are in our [Jazz MIDI Pack]({pack}), with ninths on the chords." },
      { chart: "bluebossa" },
      { roll: "bluebossa", title: "Blue Bossa type, all 16 bars" },

      { h2: "How it's built" },
      { p: "Bars 1 to 8 stay in C minor: two bars of Cm, two of Fm, then a minor ii-V-i (Dm7b5, G7, Cm). That's the i chord, the iv chord and the way home." },
      { p: "Bars 9 to 12 are the clever thing. Ebm9, Ab13, Dbmaj9 is a ii-V-I in Db major, a key a half step above where you were. Nothing prepares it. The tune just lifts, sits there for two bars, and then bars 13 to 16 take the same minor ii-V-i back to C minor." },
      { p: "So the whole tune is three progressions: a minor vamp, a major ii-V-I a half step up, and a minor ii-V-i. [Both ii-V-Is are explained here](/blog/ii-v-i-progression-explained)." },

      { h2: "The bossa rhythm" },
      { p: "Played as held chords it's a pad. The bossa nova comping pattern is what gives it the lilt: short chords that land on the beat and between the beats in a two-bar pattern. Here are the same 16 bars with that rhythm:" },
      { roll: "bluebossa_bossa", title: "Blue Bossa type, bossa nova rhythm, 135 bpm" },

      { h2: "How to use it in a beat" },
      {
        ul: [
          "**Loop bars 1 to 8** for a dark eight-bar loop that resolves.",
          "**Use bars 9 to 12 as the switch-up.** Four bars in a new key, then back. It does the job of a bridge.",
          "**Slow it down.** At 80 bpm on a Rhodes it's lofi. The pack has it as lofi, neo soul, trap soul and deep house loops.",
          "**Add the bossa bass**: the root on beats 1 and 3, the fifth just before each.",
        ],
      },

      { h2: "The changes as MIDI" },
      { cta: tune("Blue Bossa") },
    ],
    faq: [
      { q: "What are the chords in Blue Bossa?", a: "Cm, Cm, Fm, Fm, Dm7b5, G7, Cm, Cm, then Ebm7, Ab7, Dbmaj7, Dbmaj7, Dm7b5, G7, Cm, and a Dm7b5 G7 turnaround in the last bar." },
      { q: "What key is Blue Bossa in?", a: "C minor, with four bars in Db major in the middle (bars 9 to 12)." },
      { q: "How many bars is Blue Bossa?", a: "16 bars, played around as many times as you like." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "royal-road-chord-progression",
    date: RELEASE["royal-road-chord-progression"],
    title: "The Royal Road Progression (IV-V-iii-vi), in Every Key",
    seoTitle: "Royal Road Progression (IV-V-iii-vi): Chords in Every Key",
    description:
      "The Royal Road chord progression (IV-V-iii-vi) from J-pop and anime: the chords, why it sounds nostalgic, a table for all 12 keys, and a piano roll to play.",
    teaser: "The J-pop and anime progression: the chords, why it sounds nostalgic, all 12 keys, and a roll to play.",
    minutes: 5,
    blocks: [
      { p: "In Japan it's called ōdō shinkō, the royal road progression, because so many hits take it. Four chords: IV, V, iii, vi. In C major that's F, G, Em, Am. If a song sounds like an anime opening, there's a good chance this is why." },
      { chords: ["Fmaj9", "G7", "Em7", "Am9"], label: "IV – V – iii – vi in C major" },
      { p: "Here it is as a file from our [Jazz MIDI Pack]({pack}), with sevenths and ninths. The second time round, an E7alt replaces the Em7 for a stronger pull into the A minor." },
      { roll: "royal", title: "Royal Road in A minor" },

      { h2: "Why it sounds nostalgic" },
      { p: "It starts on the IV, so it opens away from home. IV to V is the brightest move in a major key, and it makes you expect the I chord. The I never comes. The V goes to iii, then down to vi, and the loop ends on a minor chord. You get the lift and then the letdown, every four bars. Bright start, wistful ending: that's the feeling." },
      { p: "It never lands on the I at all, so it never sounds finished. That's what makes it loop so well." },

      { h2: "The Royal Road in all 12 keys" },
      {
        table: {
          head: ["Key", "IV", "V", "iii", "vi"],
          rows: [
            ["C", "Fmaj7", "G7", "Em7", "Am7"],
            ["Db", "Gbmaj7", "Ab7", "Fm7", "Bbm7"],
            ["D", "Gmaj7", "A7", "F#m7", "Bm7"],
            ["Eb", "Abmaj7", "Bb7", "Gm7", "Cm7"],
            ["E", "Amaj7", "B7", "G#m7", "C#m7"],
            ["F", "Bbmaj7", "C7", "Am7", "Dm7"],
            ["F#", "Bmaj7", "C#7", "A#m7", "D#m7"],
            ["G", "Cmaj7", "D7", "Bm7", "Em7"],
            ["Ab", "Dbmaj7", "Eb7", "Cm7", "Fm7"],
            ["A", "Dmaj7", "E7", "C#m7", "F#m7"],
            ["Bb", "Ebmaj7", "F7", "Dm7", "Gm7"],
            ["B", "Emaj7", "F#7", "D#m7", "G#m7"],
          ],
        },
      },

      { h2: "How producers use it" },
      {
        ul: [
          "**Lofi.** Slow it to 80 bpm with ninths on a soft piano. Here it is as a loop from the pack:",
        ],
      },
      { roll: "loop_lofi_royal", title: "Royal Road, lofi loop, 82 bpm" },
      {
        ul: [
          "**With a dominant III.** Swap the iii for a III7 (E7 in place of Em7) and the last chord hits harder.",
          "**Future bass, pop and anime-style beats.** Play it as plain triads, loud and wide. That's the J-pop version.",
          "**With a ii-V on the end.** Add Dm7 and G7 after the Am and it turns into an eight-bar loop that leads back to the F.",
        ],
      },
      { p: "Its closest relative is the Just the Two of Us progression, which also starts on the IV and lands on the vi, by a darker route. [That one is here, in every key](/blog/just-the-two-of-us-chord-progression)." },

      { h2: "The progression as MIDI" },
      { cta: "The Royal Road is one of the progressions in the Jazz MIDI Pack, in 12 voicings, 8 rhythms and all 12 keys, with bass lines and as lofi, neo soul, trap soul and deep house loops. The Anime & Video Games MIDI Pack, with more progressions of this kind, is one of the free bonuses. 10,496 MIDI files in the pack, chord names written into every file." },
    ],
    faq: [
      { q: "What is the Royal Road chord progression?", a: "IV – V – iii – vi. In C major: F, G, Em, Am. It's the most used progression in J-pop and anime music." },
      { q: "Why is it called the Royal Road?", a: "It's a translation of the Japanese name, ōdō shinkō. The royal road is the sure way to get somewhere, and this progression is the sure way to a hit." },
      { q: "Is the Royal Road the same as the Just the Two of Us progression?", a: "No. Just the Two of Us is IV – III7 – vi: it reaches the minor chord through a dominant III7 and has no V chord. Both start on the IV and end on the vi." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "jazz-blues-chord-progression",
    date: RELEASE["jazz-blues-chord-progression"],
    title: "The Jazz Blues Chord Progression: 12 Bars, Explained",
    seoTitle: "Jazz Blues Chord Progression in F: 12 Bars, Explained",
    description:
      "The 12-bar jazz blues in F, bar by bar, with a piano roll to play: how it differs from a basic blues, plus the minor blues and the Bird blues.",
    teaser: "The 12 bars in F, a roll to play, what jazz adds to a basic blues, and the minor and Bird versions.",
    minutes: 6,
    blocks: [
      { p: "The blues is 12 bars and three chords. Jazz musicians kept the 12 bars and filled them with more chords, each one there to lead into the next. The result is the jazz blues, and it's the form more jazz tunes are written on than any other." },
      { p: "Here it is in F, as it is in our [Jazz MIDI Pack]({pack})." },
      { chart: "blues" },
      { roll: "blues", title: "Jazz blues in F" },

      { h2: "What jazz adds to a basic blues" },
      {
        table: {
          head: ["Bars", "Basic blues", "Jazz blues", "Why"],
          rows: [
            ["2", "F7", "Bb7", "A quick trip to the IV and back, so bar 1 to 4 isn't one chord"],
            ["4", "F7", "Cm7 – F7", "A ii-V that leads into the Bb7 of bar 5"],
            ["6", "Bb7", "Bdim7", "A passing chord: the bass climbs a half step on its way back to F"],
            ["8", "F7", "D7b9", "Sets up the Gm7 in bar 9"],
            ["9 – 10", "C7 – Bb7", "Gm7 – C7", "A ii-V in place of V-IV"],
            ["11 – 12", "F7 – C7", "F7 D7b9 – Gm7 C7", "A turnaround that sends you back to bar 1"],
          ],
        },
      },
      { p: "Every change is the same idea: put a chord in front of the next chord that points at it. Most of them are ii-Vs. [The ii-V-I is explained here](/blog/ii-v-i-progression-explained)." },

      { h2: "With swing comping and a walking bass" },
      { p: "Held chords show you the harmony. To sound like the blues it needs a rhythm: short chords that push the beat, over a bass that plays one note per beat." },
      { roll: "blues_swing", title: "Jazz blues in F, swing comping, 150 bpm" },
      { roll: "blues_walking", title: "Jazz blues in F, walking bass" },

      { h2: "The minor blues" },
      { p: "The same 12 bars in a minor key. Fewer chords, darker color. The last four bars swap the ii-V for Ab7 to G7, a half step slide down into the C minor." },
      { chart: "minorblues" },
      { roll: "minorblues", title: "Minor blues in C" },

      { h2: "The Bird blues" },
      { p: "Charlie Parker's version, as in Blues for Alice. It starts on a major seventh chord and then runs a chain of ii-Vs down to the Bb7 in bar 5, and another chain down to the Gm7 in bar 9. Still 12 bars, still a blues, with a chord change almost every two beats." },
      { chart: "birdblues" },
      { roll: "birdblues", title: "Bird blues in F" },

      { h2: "How to use it in a beat" },
      {
        ul: [
          "**Loop bars 9 to 12.** Gm7, C7, F7, D7b9 is a four-bar turnaround that never stops.",
          "**Use all 12 bars** when you want a form with a beginning, a middle and an end. Twelve bars also break the four- and eight-bar habit.",
          "**Take the minor blues slow.** At 75 bpm it's a trap soul or boom bap bed.",
        ],
      },

      { h2: "The blues as MIDI" },
      { cta: "The jazz blues in F, the minor blues in C and the Bird blues are all in the Jazz MIDI Pack, each in 12 voicings, 8 rhythms and all 12 keys, with walking, two-feel and bossa bass lines and as lofi, neo soul, trap soul and deep house loops. 10,496 MIDI files in total, chord names written into every file." },
    ],
    faq: [
      { q: "What is the jazz blues chord progression?", a: "A 12-bar blues with extra chords that lead into each change. In F: F7, Bb7, F7, Cm7 F7, Bb7, Bdim7, F7, D7, Gm7, C7, F7 D7, Gm7 C7." },
      { q: "What is the difference between a blues and a jazz blues?", a: "A basic blues uses three chords: I7, IV7 and V7. A jazz blues keeps the 12 bars and adds a quick IV in bar 2, a ii-V into bar 5, a diminished passing chord in bar 6, and a ii-V and turnaround in the last four bars." },
      { q: "What key is the jazz blues usually in?", a: "F and Bb are the two most common keys, because they suit saxophones and trumpets." },
      { q: "What is a Bird blues?", a: "Charlie Parker's reharmonized 12-bar blues, as in Blues for Alice. It starts on a major seventh chord and moves through chains of ii-Vs." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "misty-chords",
    date: RELEASE["misty-chords"],
    title: "Misty Chords: The Ballad Progression, Bar by Bar",
    seoTitle: "Misty Chords, Bar by Bar (With MIDI Piano Roll)",
    description:
      "The Misty chords in Eb, all 32 bars, with a piano roll to play: how the ballad is built from ii-Vs, the backdoor move in bar 4, and how to use it in a beat.",
    teaser: "All 32 bars in Eb, a roll to play, the backdoor move that makes it, and how to loop it.",
    minutes: 5,
    blocks: [
      { p: "Erroll Garner wrote Misty in 1954. It's a 32-bar ballad in Eb, and it's a good one to learn from, because nearly every bar is a ii-V going somewhere." },
      { p: "Here are the 32 bars as they are in our [Jazz MIDI Pack]({pack})." },
      { chart: "misty" },
      { roll: "misty_ballad", title: "Misty type, ballad arpeggios, 70 bpm" },

      { h2: "The first four bars" },
      { chords: ["Ebmaj7", "Bbm7", "Eb7", "Abmaj7", "Abm7", "Db7"], label: "I – (ii-V into IV) – IV – (backdoor ii-V)" },
      { p: "Bar 1 is home. Bar 2, Bbm7 to Eb7, is a ii-V that leads to the Abmaj7 in bar 3: the I chord turns into a dominant and falls to the IV. Bar 4 is the move that makes the tune. Abm7 to Db7 is a backdoor ii-V. It reaches Eb from a whole step below, and it sounds softer than the usual Bb7." },
      { p: "Those four bars on their own are a loop. The backdoor is progression 7 in [10 jazz chord progressions every producer should know](/blog/jazz-chord-progressions-for-producers)." },

      { h2: "Bars 5 to 8, and the form" },
      { p: "Bars 5 to 8 are a turnaround in two-beat chords: Ebmaj7 Cm7, Fm7 Bb7, Gm7 C7, Fm7 Bb7. That's I-vi-ii-V, then iii-VI-ii-V, the same thing starting one step higher." },
      { p: "The form is AABA. Bars 1 to 8 are played twice, the second time ending on Eb. Bars 17 to 24 are the bridge: a ii-V-I into Ab, then Am7 to D7, a ii-V from far outside the key that slides back in through Gm7 C7, Fm7 Bb7. Bars 25 to 32 are the opening again." },

      { h2: "How to use it in a beat" },
      {
        ul: [
          "**Loop bars 1 to 4.** I, ii-V, IV, backdoor ii-V. Four bars, slow, on a Rhodes.",
          "**Loop bars 5 to 8** for a busier turnaround with a chord every two beats.",
          "**Use the bridge as a switch-up.** Eight bars that leave the key and come back.",
          "**Keep it slow.** It's a ballad: 60 to 75 bpm. The file above is at 70.",
        ],
      },

      { h2: "The changes as MIDI" },
      { cta: tune("Misty") },
    ],
    faq: [
      { q: "What are the chords in Misty?", a: "In Eb, the first four bars are Ebmaj7, Bbm7 Eb7, Abmaj7, Abm7 Db7, followed by a turnaround: Ebmaj7 Cm7, Fm7 Bb7, Gm7 C7, Fm7 Bb7." },
      { q: "What key is Misty in?", a: "Eb major." },
      { q: "What is the form of Misty?", a: "32 bars, AABA: an eight-bar section played twice, an eight-bar bridge, and the first section again." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "deep-house-chords",
    date: RELEASE["deep-house-chords"],
    title: "Deep House Chords: 4 Progressions and How to Play Them",
    seoTitle: "Deep House Chords: 4 Progressions (With MIDI Examples)",
    description:
      "Four deep house chord progressions with the exact chords and a 122 bpm loop to play for each, and what makes a chord stab sound deep.",
    teaser: "Four progressions with the exact chords, a 122 bpm loop to play for each, and what makes a stab sound deep.",
    minutes: 5,
    blocks: [
      { p: "Deep house is house music with jazz chords. It came out of Chicago in the mid 1980s, when producers like Larry Heard put soft minor sevenths and ninths over a four-on-the-floor kick. The drums are simple. The chords are where the mood is." },
      { p: "Four progressions below, each as a 122 bpm loop from our [Jazz MIDI Pack]({pack}), chords and bass." },

      { h2: "1. The Dorian vamp" },
      { chords: ["Dm11", "G13"], label: "i – IV in D Dorian" },
      { p: "Two chords, back and forth, and nothing resolves. This is the deep house loop: it can run for seven minutes because it never asks to end. The chords are short stabs that land between the kicks." },
      { roll: "loop_house_dorian", title: "Dorian vamp, deep house loop, 122 bpm" },

      { h2: "2. The 4-3-2-1" },
      { chords: ["Fmaj9", "Em7", "Dm9", "Cmaj9"], label: "IV – iii – ii – I in C major" },
      { p: "Four chords walking down the scale. Warm and bright, the kind of loop that goes under a vocal." },
      { roll: "loop_house_4321", title: "4-3-2-1, deep house loop, 122 bpm" },

      { h2: "3. The minor loop" },
      { chords: ["Bbm9", "Ebm9", "Ab13", "Dbmaj9", "Gbmaj9", "F7alt"], label: "i – iv – VII – III – VI – V in Bb minor" },
      { p: "Darker, with more movement: it passes through the relative major and comes back on an altered dominant. Late-night material." },
      { roll: "loop_house_minor", title: "Minor loop, deep house, 122 bpm" },

      { h2: "4. The minor circle of fifths" },
      { chords: ["Fm9", "Bbm9", "Eb13", "Abmaj9", "Dbmaj9", "Gm7b5", "C7alt", "Fm9"], label: "Eight bars in F minor" },
      { p: "Eight bars, a new chord in each, every root a fifth below the last. Use it when you want the track to feel like it's travelling." },
      { roll: "loop_house_circle", title: "Minor circle of fifths, deep house loop, 122 bpm" },

      { h2: "What makes chords sound deep" },
      {
        ul: [
          "**Minor sevenths, ninths and elevenths.** A plain triad sounds like big-room house. The 7th and the 9th are the deep part.",
          "**Stabs, not pads.** Short chords on the offbeats, between the kicks. The gaps are part of the groove.",
          "**Few chords.** Two is enough. One is enough if the bass moves.",
          "**One shape, moved.** Play a m9 chord and slide the whole shape up and down the keyboard. The classic records got this from sampling a single chord and playing it on different keys.",
          "**The sound.** A Rhodes, an organ, or a soft analog-style pad with the filter half closed.",
          "**The tempo.** 118 to 125 bpm. The pack's deep house loops are at 122.",
        ],
      },
      { p: "For the voicings themselves, shell and rootless shapes work best as stabs. They're in [jazz piano voicings for producers](/blog/jazz-piano-voicings-for-producers), and the general idea is in [how to make chords sound jazzy](/blog/how-to-make-chords-sound-jazzy)." },

      { h2: "The loops as MIDI" },
      { cta: "The Jazz MIDI Pack has every one of its progressions as a deep house loop at 122 bpm: chords, bass and drums as separate MIDI files, plus a full multitrack file. It also has them as lofi, neo soul and trap soul loops, in 12 voicings and all 12 keys. 10,496 MIDI files in total." },
    ],
    faq: [
      { q: "What chords are used in deep house?", a: "Minor sevenths, ninths and elevenths, usually two to four chords looped: for example Dm11 to G13, or Fmaj9, Em7, Dm9, Cmaj9." },
      { q: "What BPM is deep house?", a: "Usually 118 to 125 bpm. The deep house loops in our pack are at 122." },
      { q: "What key is deep house in?", a: "Mostly minor keys. A minor, C minor, D minor and F minor are all common. Any key works: transpose the MIDI." },
      { q: "How do I make deep house chord stabs?", a: "Use a seventh or ninth chord, shorten the notes to an eighth or less, and place them on the offbeats between the kicks. Then filter the sound and add a little delay." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "summertime-chords",
    date: RELEASE["summertime-chords"],
    title: "Summertime Chords: A 16-Bar Minor Loop From 1935",
    seoTitle: "Summertime Chords, Bar by Bar (With MIDI Piano Roll)",
    description:
      "The Summertime chords in A minor, all 16 bars, with a piano roll to play: a minor ballad built on i, iv and ii-V, and how to turn it into a lofi loop.",
    teaser: "All 16 bars in A minor, a roll to play, how it's built, and how to turn it into a lofi loop.",
    minutes: 4,
    blocks: [
      { p: "George Gershwin wrote Summertime in 1935 for the opera Porgy and Bess. It has been recorded thousands of times since, in every style there is. The form is 16 bars in a minor key, and jazz players usually take it in A minor or D minor." },
      { p: "Here are the 16 bars in A minor as they are in our [Jazz MIDI Pack]({pack}), with ninths on the chords." },
      { chart: "summertime" },
      { roll: "summertime", title: "Summertime type, all 16 bars" },

      { h2: "How it's built" },
      { p: "Bars 1 to 4 sit on A minor, with a quick Bm7b5 E7 in bar 2 that leaves and comes straight back. Bar 4 turns the A minor into A7, a dominant chord, and that pushes into the D minor of bar 5." },
      { p: "Bars 5 to 8 are the iv chord, D minor, then a minor ii-V (Bm7b5, E7) that leads home." },
      { p: "Bars 9 to 12 are the lift. Am9, Fmaj9, Dm9, G13 heads for C major, the relative major, and bar 13 lands on it. For one bar the tune is in a major key. Then a minor ii-V takes it back to A minor to finish." },
      { p: "So it's a minor tune made of three things: the i chord, the iv chord, and ii-Vs that join them. [The minor ii-V-i is explained here](/blog/ii-v-i-progression-explained)." },

      { h2: "How to use it in a beat" },
      {
        ul: [
          "**As a lofi loop.** It's already slow and minor. Here it is from the pack:",
        ],
      },
      { roll: "loop_lofi_summertime", title: "Summertime type, lofi loop, 82 bpm" },
      {
        ul: [
          "**Loop bars 9 to 12.** Am9, Fmaj9, Dm9, G13 is a four-bar loop that leans toward major.",
          "**Loop bars 5 to 8** for a darker one: two bars of Dm9, then Bm7b5 and E7.",
          "**Use all 16** when you want a verse that goes somewhere and comes back.",
        ],
      },

      { h2: "The changes as MIDI" },
      { cta: tune("Summertime") },
    ],
    faq: [
      { q: "What are the chords in Summertime?", a: "In A minor: Am, a quick Bm7b5 E7, Am, A7, then Dm for two bars, Bm7b5, E7, then Am, F, Dm, G7, C, and a Bm7b5 E7 back to Am." },
      { q: "What key is Summertime in?", a: "Jazz players usually play it in A minor or D minor. Singers move it to whatever suits their voice." },
      { q: "How many bars is Summertime?", a: "16 bars." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-write-a-walking-bass-line",
    date: RELEASE["how-to-write-a-walking-bass-line"],
    title: "How to Write a Walking Bass Line in Your DAW",
    seoTitle: "How to Write a Walking Bass Line in the Piano Roll",
    description:
      "A walking bass line in four rules, written out on a ii-V-I with a piano roll to play, plus the two-feel and bossa bass patterns for slower beats.",
    teaser: "Four rules, written out on a ii-V-I with a roll to play, plus the two-feel and bossa patterns.",
    minutes: 5,
    blocks: [
      { p: "A walking bass line plays one note on every beat and never stops. It tells you the chord and it carries the time, which is why a jazz trio can swing with no drummer. You can write one in the piano roll with four rules." },
      { p: "Here is one over a ii-V-I in C, a file from our [Jazz MIDI Pack]({pack})." },
      { roll: "iiVI_walking", title: "Walking bass over a ii-V-I in C" },

      { h2: "The four rules" },
      {
        ol: [
          "**Beat 1 is the root.** New chord, new root. That's what tells the listener where they are.",
          "**Beats 2 and 3 are chord notes.** The 3rd and the 5th are the safe ones.",
          "**Beat 4 leads into the next root.** Play the note a half step above or below it.",
          "**Keep the notes the same length.** Four even quarter notes. The feel comes from the line, not from the rhythm.",
        ],
      },
      { p: "Look at the first two bars of the file above. Over Dm7 it plays D, F, A, Ab: root, 3rd, 5th, then Ab, a half step above the G that's coming. Over G7 it plays G, B, D, Db: root, 3rd, 5th, then Db, a half step above C. That's the whole method." },

      { h2: "On a longer form" },
      { p: "The same rules over a 12-bar blues in F. Watch beat 4 of each bar: it's almost always a half step from the next root." },
      { roll: "blues_walking", title: "Walking bass, jazz blues in F" },
      { p: "The chords under that line are in [the jazz blues chord progression](/blog/jazz-blues-chord-progression)." },

      { h2: "Two simpler patterns" },
      { h3: "Two-feel" },
      { p: "Two notes per bar: the root on beat 1, the fifth on beat 3. It's what a bass player does in the first chorus of a tune, before the walking starts. In a beat it leaves more room." },
      { roll: "iiVI_twofeel", title: "Two-feel bass over a ii-V-I in C" },
      { h3: "Bossa nova" },
      { p: "Root and fifth again, in the bossa rhythm: the root on beat 1, the fifth just before beat 3, the root on beat 3, the fifth just before the next bar." },
      { roll: "iiVI_bossabass", title: "Bossa nova bass over a ii-V-I in C" },

      { h2: "Making it sound right" },
      {
        ul: [
          "**Use an upright bass sound**, or an electric bass with the tone rolled off. A sub or an 808 doesn't walk.",
          "**Stay low**, between E1 and around G3.",
          "**Vary the velocity a little**, with beats 2 and 4 slightly louder. That's where the swing sits.",
          "**Put a ride cymbal on top** and you have a rhythm section.",
        ],
      },

      { h2: "Bass lines, already written" },
      { cta: "The Jazz MIDI Pack has a walking, a two-feel and a bossa nova bass line for every one of its progressions, and combo loops with comping, walking bass and ride together. They sit beside the chords in 12 voicings, 8 rhythms and all 12 keys. 10,496 MIDI files in total." },
    ],
    faq: [
      { q: "What is a walking bass line?", a: "A bass line that plays one note on every beat, moving by step or through the notes of each chord, with the root on beat 1 of each chord." },
      { q: "How do you write a walking bass line?", a: "Root on beat 1, chord notes on beats 2 and 3, and on beat 4 a note a half step above or below the next chord's root." },
      { q: "What is a two-feel bass line?", a: "Two notes per bar, usually the root on beat 1 and the fifth on beat 3." },
      { q: "What notes can a walking bass use?", a: "The chord's notes, the notes of the scale between them, and half-step approach notes right before a new chord." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "girl-from-ipanema-chords",
    date: RELEASE["girl-from-ipanema-chords"],
    title: "The Girl from Ipanema Chords: Bossa Nova Harmony in 40 Bars",
    seoTitle: "Girl from Ipanema Chords, Bar by Bar (With MIDI Roll)",
    description:
      "The Girl from Ipanema chords in F, all 40 bars, with a piano roll to play: the II7 chord, the tritone sub in bar 6, the bridge that changes key four times.",
    teaser: "All 40 bars in F, a roll to play, the chord that makes it bossa, and the bridge that changes key four times.",
    minutes: 5,
    blocks: [
      { p: "Antônio Carlos Jobim wrote The Girl from Ipanema in 1962, and the 1964 recording with Stan Getz and Astrud Gilberto made bossa nova a worldwide sound. It's usually played in F. The form is 40 bars: an eight-bar section twice, a 16-bar bridge, and the first section again." },
      { p: "Here are the 40 bars as they are in our [Jazz MIDI Pack]({pack})." },
      { chart: "ipanema" },
      { roll: "ipanema", title: "Girl from Ipanema type, all 40 bars" },

      { h2: "The first eight bars" },
      { chords: ["Fmaj7", "G7#11", "Gm7", "Gb7#11", "Fmaj7"], label: "I – II7 – ii – bII7 – I in F major" },
      { p: "Two bars of Fmaj7, then two bars of G7. That G7 is the sound of the tune. In F major the chord on G should be minor. Making it a dominant chord with a raised 11th gives it the bright, floating color that people hear as bossa nova." },
      { p: "Then Gm7 to Gb7 to Fmaj7. That's a ii-V-I with the V replaced by the dominant a tritone away, so the bass slides down by half steps: G, Gb, F. [Tritone substitution is explained here](/blog/ii-v-i-progression-explained)." },

      { h2: "The bridge" },
      { p: "Bars 17 to 32 are where it gets strange. The tune jumps up a half step to F#maj7, then moves in two-bar pairs: F#maj7 to B7, F#m7 to D7, Gm7 to Eb7. No pair resolves where you expect it to." },
      { p: "Then four bars of ordinary harmony bring it home: Am7, D7b9, Gm7, C7b9. After twelve bars of drifting, that plain iii-VI-ii-V sounds like relief. That contrast is the bridge's whole trick." },

      { h2: "How to use it in a beat" },
      {
        ul: [
          "**Loop bars 1 to 8.** Fmaj7, G7#11, Gm7, Gb7#11. Four chords, two bars each, and it sounds like sunshine.",
          "**Borrow the II7.** In any major-key loop, turn the ii chord into a dominant 7#11 for a bar. Instant bossa color.",
          "**Borrow the half-step slide.** End a loop on the dominant a half step above your first chord.",
          "**Use a bossa rhythm.** The pack has these changes with bossa nova comping and a bossa bass line.",
        ],
      },
      { p: "Another bossa standard with a simpler form: [Blue Bossa](/blog/blue-bossa-chords)." },

      { h2: "The changes as MIDI" },
      { cta: tune("Girl from Ipanema") },
    ],
    faq: [
      { q: "What are the chords in The Girl from Ipanema?", a: "In F, the main section is Fmaj7 (two bars), G7 (two bars), Gm7, Gb7, Fmaj7, Gb7. The bridge starts on F#maj7 and moves through B7, F#m7, D7, Gm7 and Eb7 before a iii-VI-ii-V back to F." },
      { q: "What key is The Girl from Ipanema in?", a: "Most lead sheets have it in F. The 1964 Getz/Gilberto recording is in Db." },
      { q: "How many bars is The Girl from Ipanema?", a: "40 bars: two eight-bar sections, a 16-bar bridge, and a final eight." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "my-funny-valentine-chords",
    date: RELEASE["my-funny-valentine-chords"],
    title: "My Funny Valentine Chords: One Chord, One Falling Note",
    seoTitle: "My Funny Valentine Chords, Bar by Bar (With MIDI Roll)",
    description:
      "The My Funny Valentine chords in C minor, all 36 bars, with a piano roll to play: the falling line that opens it and the major-key bridge.",
    teaser: "All 36 bars in C minor, a roll to play, the falling note that opens it, and how to loop it.",
    minutes: 5,
    blocks: [
      { p: "Richard Rodgers wrote My Funny Valentine in 1937 for the musical Babes in Arms. Chet Baker and Miles Davis turned it into one of the most played ballads in jazz. It's in C minor and it's 36 bars long, four more than the usual 32." },
      { p: "Here are the 36 bars as they are in our [Jazz MIDI Pack]({pack})." },
      { chart: "valentine" },
      { roll: "valentine_ballad", title: "My Funny Valentine type, ballad arpeggios, 70 bpm" },

      { h2: "The first four bars: one chord, one falling note" },
      { chords: ["Cm", "CmMaj7", "Cm7", "Cm6"], label: "One note falls a half step each bar: C, B, Bb, A" },
      { p: "For four bars the chord is C minor. The only thing that changes is one note inside it, which drops a half step every bar. It's called a line cliché, and it's why the opening sounds like it's sinking. You hear the same device in a lot of film music." },
      { p: "Then Abmaj7, Fm7, and a minor ii-V (Dm7b5, G7b9) back to C minor. That's the first eight bars. The second eight start the same way and end on Fm7b5 to Bb7, which points at Eb major." },

      { h2: "The bridge goes major" },
      { p: "Bars 17 to 24 are in Eb, the relative major: Ebmaj7, Fm7, Gm7, Fm7, walking up and down the scale two beats at a time. After sixteen bars of minor, the tune opens up. Then a G7b9 pulls it back to C minor." },
      { p: "The last section is the opening again, stretched to twelve bars. It doesn't end in C minor. It ends on Eb, the major key, in bar 35. A sad tune that finishes somewhere warm." },

      { h2: "How to use it in a beat" },
      {
        ul: [
          "**Loop bars 1 to 4.** One chord and one moving note. It leaves all the room in the world for drums and a vocal.",
          "**Loop bars 1 to 8** for a full minor phrase that resolves.",
          "**Put the falling note in the bass** as well as the chord: C, B, Bb, A. It gets heavier.",
          "**Use the bridge as the lift.** Eight bars of major in a minor beat.",
        ],
      },
      { p: "The line cliché on its own is progression 9 in [10 jazz chord progressions every producer should know](/blog/jazz-chord-progressions-for-producers)." },

      { h2: "The changes as MIDI" },
      { cta: tune("My Funny Valentine") },
    ],
    faq: [
      { q: "What are the chords in My Funny Valentine?", a: "In C minor, the first eight bars are Cm, Cm(maj7), Cm7, Cm6, Abmaj7, Fm7, Dm7b5, G7. The bridge is in Eb major." },
      { q: "What key is My Funny Valentine in?", a: "C minor. It ends in Eb major, the relative major." },
      { q: "What is a line cliché?", a: "One chord held while a single note inside it moves by half steps. In My Funny Valentine: C, B, Bb, A over a C minor chord." },
      COPYRIGHT,
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    slug: "all-the-things-you-are-chords",
    date: RELEASE["all-the-things-you-are-chords"],
    title: "All the Things You Are Chords: Five Keys in 36 Bars",
    seoTitle: "All the Things You Are Chords, Bar by Bar (MIDI Roll)",
    description:
      "The All the Things You Are chords in Ab, all 36 bars, with a piano roll to play: how one pattern of fifths moves through five keys.",
    teaser: "All 36 bars in Ab, a roll to play, how one pattern moves through five keys, and what to take from it.",
    minutes: 5,
    blocks: [
      { p: "Jerome Kern wrote All the Things You Are in 1939. It's in Ab, it's 36 bars long, and it passes through five keys on the way. Jazz players treat it as a test piece. For a producer it's a lesson in how to change key so smoothly nobody notices." },
      { p: "Here are the 36 bars as they are in our [Jazz MIDI Pack]({pack})." },
      { chart: "attya" },
      { roll: "attya", title: "All the Things You Are type, all 36 bars" },

      { h2: "The first eight bars: one pattern, then a side door" },
      { chords: ["Fm7", "Bbm7", "Eb7", "Abmaj7", "Dbmaj7", "Dm7", "G7", "Cmaj7"], label: "vi – ii – V – I – IV in Ab, then ii – V – I in C" },
      { p: "Bars 1 to 5 fall in fifths through Ab major: F, Bb, Eb, Ab, Db. Then, where you expect the pattern to carry on, bar 6 plays Dm7 G7 and bar 7 lands on Cmaj7. The tune has left Ab and arrived in C, through a ii-V." },
      { p: "Bars 9 to 16 do exactly the same thing a fourth lower. Fifths through Eb major, then a ii-V into G. Same shape, new keys." },

      { h2: "The bridge and the way home" },
      { p: "The bridge stays in G for four bars (Am7, D7, Gmaj7), then takes a ii-V into E major: F#m7b5, B7, Emaj7. That's the fifth key. One chord, C7alt, turns it around, and the last section starts on Fm7 as if nothing had happened." },
      { p: "The last twelve bars run the opening pattern once more and then walk down to the finish: Dbmaj7, Dbm7, Cm7, Bdim7, Bbm7, Eb7, Abmaj7. Ab, C, Eb, G, E, and back to Ab." },

      { h2: "What a producer can take from it" },
      {
        ul: [
          "**The key change by ii-V.** To move a beat to a new key, play that key's ii-V in the bar before. It's how every change in this tune works. [The ii-V-I is here](/blog/ii-v-i-progression-explained).",
          "**The sequence.** Take a four- or eight-bar loop and repeat it a fourth lower. It sounds like a development, and you wrote nothing new.",
          "**Bars 1 to 5 as a loop.** Fm7, Bbm7, Eb7, Abmaj7, Dbmaj7 is five bars of falling fifths that ends on a soft IV chord.",
          "**The walk-down.** Dbmaj7, Dbm7, Cm7, Bdim7, Bbm7 is a ready-made ending.",
        ],
      },

      { h2: "The changes as MIDI" },
      { cta: tune("All the Things You Are") },
    ],
    faq: [
      { q: "What are the chords in All the Things You Are?", a: "In Ab, the first eight bars are Fm7, Bbm7, Eb7, Abmaj7, Dbmaj7, Dm7 G7, Cmaj7, Cmaj7. The next eight repeat the pattern a fourth lower, ending in G." },
      { q: "What key is All the Things You Are in?", a: "Ab major. It passes through C, Eb, G and E before returning to Ab." },
      { q: "How many bars is All the Things You Are?", a: "36 bars: the last section is twelve bars long, four more than the usual eight." },
      COPYRIGHT,
    ],
  },
];
