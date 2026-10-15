// The Jazz page as editable sections ("bricks"). This file is the default
// content: what the page shows before anything is published from the editor,
// and the fallback if the database doesn't answer. Edit the live page at
// funnnnels.com → Jazz MIDI Pack, not here.
//
// Text can use tokens that stay correct per visitor: {price} (€27 or $27),
// {files} (3,536), {days} (14).
import type { RollId } from "./piano";

export type Para = { style: "p" | "bold" | "pull" | "hit"; text: string };

export type SectionProps = {
  s_hero: { tag: string; headline: string; headlineEm: string; lead: string; ticks: string[]; hud: string[]; daws: string };
  s_letter: { eyebrow: string; title: string; paras: Para[] };
  s_compare_rolls: { beforeLabel: string; beforeText: string; afterLabel: string; afterText: string; note: string };
  s_product: { eyebrow: string; title: string; titleEm: string; lead: string; ticks: string[] };
  s_previews: { eyebrow: string; title: string; sub: string; items: { roll: RollId; title: string; meta: string }[] };
  s_steps: { eyebrow: string; title: string; steps: { title: string; text: string }[] };
  s_inside: { eyebrow: string; title: string };
  s_math: { eyebrow: string; title: string; cards: { title: string; text: string }[]; winTitle: string; winText: string };
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
      cards: [
        { title: "Learn jazz piano", text: "Months of lessons and theory. Then you still have to play every chord in." },
        { title: "Book a keys player", text: "Paid per session, every song. Your chords wait on their calendar." },
        { title: "Chord plugins", text: "One voicing, block chords. The exact jump you’re trying to get rid of." },
      ],
      winTitle: "This pack",
      winText: "{price} once. {files} files. Less than a cent a file.",
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
