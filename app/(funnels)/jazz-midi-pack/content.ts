// The Jazz page as editable sections ("bricks"). This file is the default
// content: what the page shows before anything is published from the editor,
// and the fallback if the database doesn't answer. Edit the live page at
// funnnnels.com → Jazz MIDI Pack, not here.
//
// Text can use tokens that stay correct per visitor: {price} (€27 or $27),
// {files} (3,536), {total} (7,733: the pack + the bonuses' MIDI), {days} (14).
import type { RollId } from "./piano";

export type Para = { style: "p" | "bold" | "pull" | "hit"; text: string };
export type ChartCell = { ok: boolean | null; text: string };
export type ChartRow = { label: string; cells: ChartCell[] };

export type SectionProps = {
  // Centered, like the Grind Studio Drum Kit hero. In `headline`, *words* are highlighted
  // and _words_ underlined.
  s_hero: { tag: string; pre: string; headline: string; sub: string; bullets: string[]; ticks: string[]; hud: string[]; daws: string };
  s_letter: { eyebrow: string; title: string; paras: Para[] };
  s_compare_rolls: { beforeLabel: string; beforeText: string; afterLabel: string; afterText: string; note: string };
  // The Drum Kit's "What's the secret of the 0.1%": what people think it is,
  // crossed out, then what it is.
  s_secret: { eyebrow: string; title: string; lead: string; myths: string[]; answer: string };
  // The Drum Kit's "Patterns used by the best producers of all time" and its
  // producer quotes. The names are set in type, not their logos. Each name has
  // a record built on a progression from the download, and each quote a
  // source. Both are checked in BRIEF.md "Greats".
  s_greats: {
    eyebrow: string;
    title: string;
    names: string[];
    quotesTitle: string;
    quotes: { quote: string; name: string; role: string; source: string }[];
    note: string;
  };
  // The Drum Kit's "Why Patterns and Fragments? Easy.": what each way the pack
  // varies a progression is for.
  s_why: { eyebrow: string; title: string; cols: { count: string; name: string; what: string; list: string; perfect: string }[]; foot: string };
  s_product: { eyebrow: string; title: string; titleEm: string; lead: string; ticks: string[] };
  s_previews: { eyebrow: string; title: string; sub: string; items?: { roll: RollId; title: string; meta: string }[] };
  s_steps: { eyebrow: string; title: string; steps: { title: string; text: string }[] };
  s_inside: { eyebrow: string; title: string };
  // A comparison chart: one column per way to get voicings, the last one is the pack.
  // ok: true = ✓, false = ✗, null = neutral.
  s_math: { eyebrow: string; title: string; cols: string[]; rows: ChartRow[]; note: string };
  // The free bonuses: item n shows the cover bonus-n in public/funnels/jazz-midi-pack (1–5).
  s_bonuses: { eyebrow: string; title: string; sub: string; items: { name: string; text: string }[] };
  s_offer: { eyebrow: string; title: string; stack: string[]; guarantee: string };
  s_guarantee: { title: string; text: string };
  s_after: { eyebrow: string; title: string; items: { lead: string; text: string }[] };
  s_faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  s_final: { title: string; note: string };
};

export type SectionType = keyof SectionProps;
export type Section<T extends SectionType = SectionType> = { id: string; type: T; props: SectionProps[T] };

export const SECTION_LABELS: Record<SectionType, string> = {
  s_hero: "Hero",
  s_letter: "Problem letter",
  s_secret: "The secret",
  s_compare_rolls: "Before / after",
  s_greats: "Played by the greats",
  s_why: "Why voicings and rhythms",
  s_product: "Product intro",
  s_previews: "Previews",
  s_steps: "How it works",
  s_inside: "What's inside",
  s_math: "Do the math",
  s_bonuses: "Bonuses",
  s_offer: "Offer + checkout",
  s_guarantee: "Guarantee",
  s_after: "After you pay",
  s_faq: "FAQ",
  s_final: "Final CTA",
};

export const DEFAULT_SECTIONS: Section[] = [
  {
    id: "hero",
    type: "s_hero",
    props: {
      tag: "{files} MIDI files",
      pre: "For producers who don’t play jazz piano",
      headline: "*The Jazz Progressions* Everyone Wants And _Nobody Can Write_, As Drag-And-Drop MIDI",
      sub: "Voiced like a real pianist, note by note: chords that sound played, not programmed",
      bullets: [
        "{files} Drag-And-Drop Jazz MIDI Files",
        "The Most Used Jazz Progressions × 13 Voicings × 8 Rhythms",
        "Voice-Led Like A Pianist: No Jumping Chords",
        "Chord Names In Every File, No Theory Needed",
        "All 12 Keys, Bass Lines And Genre Loops",
        "5 Free Bonuses Included",
      ],
      ticks: ["Any DAW", "Chord names in every file", "{days}-day guarantee"],
      hud: [".mid · drag & drop", "13 voicings", "chords on the timeline"],
      daws: "Ableton Live · Logic · FL Studio · Cubase · Studio One · Reaper · Bitwig · GarageBand",
    },
  },
  {
    id: "secret",
    type: "s_secret",
    props: {
      eyebrow: "The secret",
      title: "What makes jazz chords sound *expensive*?",
      lead: "Most producers think it’s one of these:",
      myths: ["More notes in every chord", "Chord names you can’t pronounce", "An expensive piano plugin"],
      answer: "It’s none of them. It’s where each note goes when the chord changes.",
    },
  },
  {
    id: "letter",
    type: "s_letter",
    props: {
      eyebrow: "Why your chords sound stiff",
      title: "Your chords aren’t wrong. They just jump.",
      paras: [
        { style: "bold", text: "Dear producer," },
        { style: "p", text: "You found the chords. Dm7, G7, Cmaj7. The right notes." },
        { style: "p", text: "You put them in the piano roll and it sounds like a ringtone." },
        { style: "p", text: "Every chord is a block. Every block lands somewhere new on the keyboard. Nothing connects." },
        { style: "pull", text: "Pianists don’t play chords. They play lines." },
        { style: "p", text: "When a jazz player moves from Dm7 to G7, two fingers stay put. The seventh drops a half step. The hand barely moves." },
        { style: "p", text: "That’s voice leading. It’s why a player sounds smooth and a chord plugin sounds like a grid. Learning it takes months of theory and a piano you might not play." },
        { style: "p", text: "We’re GRIND STUDIO. Our MIDI Drum Kit is in the sessions of 2,847 producers. This one is for what sits on top of the drums." },
        { style: "hit", text: "So we took the most used jazz progressions, the ones everyone wants and nobody can write, and voiced every one the way a pianist would. Note by note." },
        { style: "p", text: "Same chords. Hear the difference." },
      ],
    },
  },
  {
    id: "compare",
    type: "s_compare_rolls",
    props: {
      beforeLabel: "Before",
      beforeText: "Root position. The way most chord tools hand it to you.",
      afterLabel: "After",
      afterText: "Best Voicing. The first folder of every progression.",
      note: "Same eight chords, same rhythm. Watch the top note. Before, it jumps up to seven semitones from chord to chord. After, it only moves between B and C, while the roots hold the bottom.",
    },
  },
  {
    id: "greats",
    type: "s_greats",
    props: {
      eyebrow: "Played by the greats",
      title: "Progressions used by the greatest artists of all time.",
      names: ["SZA", "Doja Cat", "Silk Sonic", "Bill Withers", "Miles Davis", "John Coltrane", "Charlie Parker", "Duke Ellington"],
      quotesTitle: "What top producers say about chords:",
      quotes: [
        {
          quote: "If you’re a hip-hop producer that wants a lot of melodic stuff happening, you’re probably going to go to jazz first.",
          name: "Robert Glasper",
          role: "Grammy-winning pianist and producer",
          source: "https://www.npr.org/event/music/524393926/jazz-is-the-mother-of-hip-hop-how-sampling-connects-genres",
        },
        {
          quote: "Those chord changes. They take you away.",
          name: "Pharrell Williams",
          role: "Producer, “Happy”",
          source: "https://www.interviewmagazine.com/music/new-again-pharrell-williams",
        },
        {
          quote: "My favorite chord progressions are 1-4-5, which is the blues, or jazz, 2-5-1.",
          name: "Terrace Martin",
          role: "Producer for Kendrick Lamar",
          source: "https://www.npr.org/sections/microphonecheck/2015/02/11/385218373/terrace-martin-everything-got-a-little-bit-of-funk-in-it",
        },
        {
          quote: "It was some real slapping beats with some very pretty chords.",
          name: "Masego",
          role: "Singer and producer, “Tadow”",
          source: "https://www.dummymag.com/features/i-just-get-very-nerdy-masego-talks-trap-house-jazz-and-female-influence",
        },
        {
          quote: "I’ve always had a crazy obsession with chords and jazz and soul etc is heaven when it comes to chords.",
          name: "Tom Misch",
          role: "Guitarist and producer, “Geography”",
          source: "https://earmilk.com/2014/09/29/tom-misch-talks-about-his-love-of-chords-dilla-and-sixth-form-interview/",
        },
        {
          quote: "…the language of musical harmony is an absolutely extraordinary one.",
          name: "Jacob Collier",
          role: "Grammy-winning multi-instrumentalist",
          source: "https://www.npr.org/2022/06/17/1105496521/jacob-collier-the-whimsical-process-of-creating-art",
        },
      ],
      note: "Each name has a record built on a progression from your download. The quotes are from the linked interviews. None of these artists is connected to GRIND STUDIO or endorses this pack.",
    },
  },
  {
    id: "product",
    type: "s_product",
    props: {
      eyebrow: "Introducing",
      title: "The Jazz",
      titleEm: "MIDI Pack",
      lead: "{files} MIDI files. The most used jazz progressions, the ones everyone wants and nobody can write, each voiced 13 ways, in 8 rhythms and all 12 keys. Plus bass lines, combo loops and full lofi, neo soul, trap soul and deep house loops.",
      ticks: [
        "No theory needed: every file shows its chord names",
        "Your sounds: Rhodes, piano, pads, synths",
        "One payment, yours to keep",
      ],
    },
  },
  {
    id: "previews",
    type: "s_previews",
    props: {
      eyebrow: "The whole pack, open",
      title: "Browse all {files} files. Press play on any of them.",
      sub: "Every folder and every file of the pack, note for note, played on a warm sine synth. In your DAW they play through your sounds. Drum MIDI is shown here, not played.",
    },
  },
  {
    id: "why",
    type: "s_why",
    props: {
      eyebrow: "Voicings and rhythms",
      title: "Why 13 voicings and 8 rhythms? *Easy.*",
      cols: [
        {
          count: "13",
          name: "Voicings",
          what: "Which notes, where. The same progression stacked 13 ways.",
          list: "Rootless · Drop 2 · Quartal · Shell · Spread over two hands · Close and voice-led · and 7 more",
          perfect: "Finding the colour that sits with your sound: dark and low, wide and open, or close and soft.",
        },
        {
          count: "8",
          name: "Rhythms",
          what: "When the notes play. The same voicing played 8 ways.",
          list: "Pads · Ballad arpeggios · Swing comping · Bossa nova · Charleston · Anticipations · and 2 more",
          perfect: "Dropping in a part that already grooves, instead of block chords you chop up by hand.",
        },
      ],
      foot: "Every progression × 13 voicings × 8 rhythms: 2,704 files in the first folder alone.",
    },
  },
  {
    id: "steps",
    type: "s_steps",
    props: {
      eyebrow: "How it works",
      title: "From empty session to jazz chords in three moves.",
      steps: [
        { title: "Pick a progression", text: "Folders and files are numbered best-sounding first. Start at 01." },
        { title: "Drag the .mid onto your keys", text: "Rhodes, piano, pad, anything. The chord names show up on the timeline." },
        { title: "Make it yours", text: "Change the key, swap the rhythm, add drums. The voice leading stays." },
      ],
    },
  },
  { id: "inside", type: "s_inside", props: { eyebrow: "What’s inside", title: "Five folders. Every one does a job." } },
  {
    id: "math",
    type: "s_math",
    props: {
      eyebrow: "Do the math",
      title: "Other ways to get jazz voicings.",
      cols: ["Learn jazz piano", "Book a keys player", "Chord plugins", "This pack"],
      rows: [
        {
          label: "Voiced the way a pianist plays",
          cells: [
            { ok: true, text: "Once you can play it" },
            { ok: true, text: "Yes" },
            { ok: false, text: "One voicing, block chords that jump" },
            { ok: true, text: "13 voicings, note by note" },
          ],
        },
        {
          label: "No theory, no playing",
          cells: [
            { ok: false, text: "Months of lessons and theory" },
            { ok: true, text: "They play it" },
            { ok: true, text: "Yes" },
            { ok: true, text: "Chord names in every file" },
          ],
        },
        {
          label: "Bass lines and full loops",
          cells: [
            { ok: false, text: "Another instrument to learn" },
            { ok: false, text: "Book a bass player too" },
            { ok: null, text: "Chords, mostly" },
            { ok: true, text: "Walking, two-feel and bossa bass, plus loops with drums" },
          ],
        },
        {
          label: "Chords in your track today",
          cells: [
            { ok: false, text: "You still play every chord in" },
            { ok: false, text: "When their calendar says so" },
            { ok: true, text: "Yes" },
            { ok: true, text: "Instant download" },
          ],
        },
        {
          label: "What it costs",
          cells: [
            { ok: false, text: "Lessons, for months" },
            { ok: false, text: "Every session, every song" },
            { ok: null, text: "A plugin license" },
            { ok: true, text: "{price} once" },
          ],
        },
      ],
      note: "{files} files for {price}. Less than a cent a file.",
    },
  },
  {
    id: "bonuses",
    type: "s_bonuses",
    props: {
      eyebrow: "Free with the pack",
      title: "Five bonuses. All in the {price}.",
      sub: "4,197 more MIDI files, 305 WAV loops and a PDF, on the same download page as the pack. Press play on any of them.",
      items: [
        {
          name: "MIDI Chord Pack (Jazz Edition)",
          text: "Jazz chords and progressions in every key, voiced the same way as the pack.",
        },
        {
          name: "The Chord Progressions Bible",
          text: "The 50 most used chord progressions of all time, three ways each.",
        },
        {
          name: "Anime & Video Games MIDI Pack",
          text: "Anime and video game progressions, from royal road to boss battle, in every key.",
        },
        {
          name: "Emotional Keys MIDI Bundle",
          text: "Piano ideas to start a song from: songstarters, chords and melodies.",
        },
        {
          name: "Drum Loops for Songwriting",
          text: "Drums to write over while the chords take shape.",
        },
      ],
    },
  },
  {
    id: "offer",
    type: "s_offer",
    props: {
      eyebrow: "Everything you get",
      title: "{files} jazz MIDI files + 4,197 in the bonuses. Today {price}.",
      stack: [
        "{files} MIDI files in 5 folders",
        "The most used jazz progressions × 13 voicings × 8 rhythms",
        "All 12 keys, as voice-led pads",
        "Walking, two-feel and bossa bass lines",
        "Lofi, neo soul, trap soul and deep house loops, drums included",
        "Chord names written into every file",
      ],
      guarantee: "{days}-day satisfaction guarantee. A file doesn’t work? We fix it.",
    },
  },
  {
    id: "guarantee",
    type: "s_guarantee",
    props: {
      title: "{days}-day satisfaction guarantee.",
      text: "Every file is tested before release. If anything’s wrong with your files, email support@thegrind.studio within {days} days and we make it right: a fresh download, a replacement, or a refund if we can’t fix it.",
    },
  },
  {
    id: "after",
    type: "s_after",
    props: {
      eyebrow: "After you pay",
      title: "From the click to your first chord in two minutes.",
      items: [
        { lead: "Pay by card.", text: "Secured by Stripe. One payment, no subscription." },
        { lead: "Download right away.", text: "The download buttons appear on the next page." },
        { lead: "Receipt by email.", text: "Stripe sends it to the address you entered." },
        { lead: "Unzip, drag, play.", text: "Start with folder 01, file 01." },
      ],
    },
  },
  {
    id: "faq",
    type: "s_faq",
    props: {
      eyebrow: "FAQ",
      title: "Before you grab it.",
      items: [
        { q: "Which DAWs does it work in?", a: "Any DAW that opens .mid files: Ableton Live, Logic, FL Studio, Cubase, Studio One, Reaper, Bitwig, GarageBand. Drag a file onto an instrument track." },
        { q: "I don't know jazz theory. Will I get lost?", a: "No. Files are numbered best-sounding first and every file shows its chord names on the timeline. Start at 01." },
        { q: "I don't play piano.", a: "You don't need to. The voicings are already played into the MIDI. You choose the sound." },
        { q: "Can I use them in my releases?", a: "Yes. Use them in your own music, commercial releases included, with no royalties. You can't resell or share the files themselves." },
        { q: "Is it only in C?", a: "The main folder is in each progression's original key, and the All 12 Keys folder has every progression in every key. Or transpose in your DAW: the voice leading stays." },
        { q: "Do the genre loops have drums?", a: "Yes. Every lofi, neo soul, trap soul and deep house loop comes as separate chords, bass and drum MIDI, plus a full multitrack file. Drums use the GM map (kick C1, snare D1, hat F#1)." },
        { q: "What if a file doesn't load?", a: "Email support@thegrind.studio. We fix it, replace it, or refund you if we can't." },
      ],
    },
  },
  {
    id: "final",
    type: "s_final",
    props: { title: "The progressions everyone wants. 13 voicings. Your sounds. {price}.", note: "{days}-day satisfaction guarantee · instant download" },
  },
];

/** A blank section of a type, for "Add section" in the editor. */
export function defaultSection(type: SectionType): Section {
  const base = DEFAULT_SECTIONS.find((s) => s.type === type)!;
  return { ...structuredClone(base), id: `${type.slice(2)}-${Math.random().toString(36).slice(2, 7)}` };
}
