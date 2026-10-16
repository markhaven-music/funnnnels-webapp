// The Jazz page as editable sections ("bricks"). This file is the default
// content: what the page shows before anything is published from the editor,
// and the fallback if the database doesn't answer. Edit the live page at
// funnnnels.com → Jazz MIDI Pack, not here.
//
// Text can use tokens that stay correct per visitor: {price} (€27 or $27),
// {files} (3,536), {days} (14).
import type { RollId } from "./piano";

export type Para = { style: "p" | "bold" | "pull" | "hit"; text: string };
export type ChartCell = { ok: boolean | null; text: string };
export type ChartRow = { label: string; cells: ChartCell[] };

export type SectionProps = {
  s_hero: { tag: string; headline: string; headlineEm: string; lead: string; ticks: string[]; hud: string[]; daws: string };
  s_letter: { eyebrow: string; title: string; paras: Para[] };
  s_compare_rolls: { beforeLabel: string; beforeText: string; afterLabel: string; afterText: string; note: string };
  s_product: { eyebrow: string; title: string; titleEm: string; lead: string; ticks: string[] };
  s_previews: { eyebrow: string; title: string; sub: string; items: { roll: RollId; title: string; meta: string }[] };
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
  s_compare_rolls: "Before / after",
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
      headline: "Jazz chords that sound",
      headlineEm: "played, not programmed.",
      lead: "26 jazz progressions, voiced the way a pianist plays them. 13 voicings, 8 rhythms, all 12 keys. Drag a .mid onto your track, load your keys, write on top.",
      ticks: ["Any DAW", "Chord names in every file", "{days}-day guarantee"],
      hud: [".mid · drag & drop", "13 voicings", "chords on the timeline"],
      daws: "Ableton Live · Logic · FL Studio · Cubase · Studio One · Reaper · Bitwig · GarageBand",
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
        { style: "hit", text: "So we voiced 26 jazz progressions the way a pianist would. Note by note." },
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
    id: "product",
    type: "s_product",
    props: {
      eyebrow: "Introducing",
      title: "The Jazz",
      titleEm: "MIDI Pack",
      lead: "{files} MIDI files. 26 jazz progressions, each voiced 13 ways, in 8 rhythms and all 12 keys. Plus bass lines, combo loops and full lofi, neo soul, trap soul and deep house loops.",
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
      eyebrow: "Real files, real piano",
      title: "Press play. This is the MIDI you get.",
      sub: "Each preview is a file from the pack, note for note, played on a grand piano sample. In your DAW it plays through your sound. The genre loops also ship with their drum MIDI.",
      items: [
        { roll: "ballad", title: "Ballad Arpeggios · ii–V–I", meta: "C · 70 bpm" },
        { roll: "neosoul", title: "Neo Soul loop · I–vi–ii–V", meta: "C · 88 bpm" },
        { roll: "lofi", title: "Lofi loop · Autumn Leaves type", meta: "Gm · 82 bpm" },
        { roll: "bossa", title: "Bossa Nova · Tritone Turnaround", meta: "C · 135 bpm" },
        { roll: "blues", title: "Swing Comping · Jazz Blues in F", meta: "F · 150 bpm" },
      ],
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
      sub: "Every order gets them, on the same download page as the pack.",
      items: [
        {
          name: "MIDI Chord Pack (Jazz Edition)",
          text: "2,304 MIDI files. All 12 major/minor key pairs in six folders: best voicing, best voicing with a smooth bass, sevenths, extended, altered & borrowed chords, and progressions.",
        },
        {
          name: "The Chord Progressions Bible",
          text: "The 50 most used chord progressions of all time. Each one as block chords, arpeggios and a piano arrangement: 150 MIDI files, e-piano WAV loops and a PDF cheat sheet.",
        },
        {
          name: "Anime & Video Games MIDI Pack",
          text: "1,548 MIDI files in all 12 keys. Add9, extended and borrowed chords, plus anime progressions (royal road, Komuro, Canon) and video game ones (victory fanfare, boss battle, dungeon).",
        },
        {
          name: "Emotional Keys MIDI Bundle",
          text: "Three volumes, 195 MIDI files: songstarters, chord progressions, melodies and bonus melodies, with an MP3 preview of each.",
        },
        {
          name: "Drum Loops for Songwriting",
          text: "47 WAV drum loops to write over: modern pop and ballads, hip hop, trap and R&B, dance and electronic, vintage and rock.",
        },
      ],
    },
  },
  {
    id: "offer",
    type: "s_offer",
    props: {
      eyebrow: "Get the pack",
      title: "Everything in the pack. {price}.",
      stack: [
        "{files} MIDI files in 5 folders",
        "26 progressions × 13 voicings × 8 rhythms",
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
    props: { title: "26 progressions. 13 voicings. Your sounds. {price}.", note: "{days}-day satisfaction guarantee · instant download" },
  },
];

/** A blank section of a type, for "Add section" in the editor. */
export function defaultSection(type: SectionType): Section {
  const base = DEFAULT_SECTIONS.find((s) => s.type === type)!;
  return { ...structuredClone(base), id: `${type.slice(2)}-${Math.random().toString(36).slice(2, 7)}` };
}
