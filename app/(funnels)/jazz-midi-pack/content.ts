// The Jazz page as editable sections ("bricks"). This file is the default
// content: what the page shows before anything is published from the editor,
// and the fallback if the database doesn't answer. Edit the live page at
// funnnnels.com → Jazz MIDI Pack, not here.
//
// Text can use tokens that stay correct per visitor: {price} (€27 or $27),
// {files} (11,152), {total} (15,349: the pack + the bonuses' MIDI), {days} (14).
import type { RollId } from "./piano";

export type Para = { style: "p" | "bold" | "pull" | "hit"; text: string };
export type ChartCell = { ok: boolean | null; text: string };
export type ChartRow = { label: string; cells: ChartCell[] };

// `hide`: the parts removed in the editor, by key (sections.tsx Part): they
// don't render, in the editor or on the live page. Sections have it, and list
// items with parts of their own (steps, bonuses).
type Hide = { hide?: string[] };

type Fields = {
  // Centered, like the Grind Studio Drum Kit hero. In `headline`, *words* are highlighted
  // and _words_ underlined.
  s_hero: { tag: string; pre: string; headline: string; sub: string; bullets: string[]; ticks: string[]; hud: string[]; daws: string };
  s_letter: { eyebrow: string; title: string; paras: Para[] };
  s_compare_rolls: { beforeLabel: string; beforeText: string; afterLabel: string; afterText: string; note: string };
  s_product: { eyebrow: string; title: string; titleEm: string; lead: string; ticks: string[] };
  // Reviews: the eight on the Drum Kit and Top Hits order pages ("usa le 8 e
  // poi aggiungine altre, poi le cambio io dopo", 2026-11-02), editable; after
  // the guarantee ("metti social proof reviews verso la fine").
  s_reviews: { title: string; items: { quote: string; name: string; role: string }[] };
  s_previews: { eyebrow: string; title: string; sub: string; items?: { roll: RollId; title: string; meta: string }[] };
  s_steps: { eyebrow: string; title: string; steps: ({ title: string; text: string } & Hide)[] };
  s_inside: { eyebrow: string; title: string };
  // A comparison chart: one column per way to get voicings, the last one is the pack.
  // ok: true = ✓, false = ✗, null = neutral.
  s_math: { eyebrow: string; title: string; cols: string[]; rows: ChartRow[]; note: string };
  // The free bonuses: item n shows the cover bonus-n in public/funnels/jazz-midi-pack (1–5).
  s_bonuses: { eyebrow: string; title: string; sub: string; items: ({ name: string; text: string } & Hide)[] };
  s_offer: { eyebrow: string; title: string; stack: string[]; guarantee: string };
  s_guarantee: { title: string; text: string };
  s_after: { eyebrow: string; title: string; items: { lead: string; text: string }[] };
  s_faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  s_final: { title: string; note: string };
};

export type SectionProps = { [K in keyof Fields]: Fields[K] & Hide };

export type SectionType = keyof SectionProps;
export type Section<T extends SectionType = SectionType> = { id: string; type: T; props: SectionProps[T] };

export const SECTION_LABELS: Record<SectionType, string> = {
  s_hero: "Hero",
  s_letter: "Problem letter",
  s_compare_rolls: "Before / after",
  s_product: "Product intro",
  s_reviews: "Reviews",
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
      pre: "For producers who want a jazz vibe in their beats",
      headline: "You Want A *Jazz Vibe* In Your Beat. These Are The Chords, _Already Played_ The Way A Pianist Plays Them.",
      sub: "{files} drag-and-drop MIDI files: the chords under lofi, neo soul and trap soul, in every key, with bass lines and full loops. Drag one onto your Rhodes.",
      bullets: [
        "{files} Drag-And-Drop Jazz MIDI Files",
        "Lofi, Neo Soul, Trap Soul And Deep House Loops, Drums Included",
        "Voiced Like A Pianist: Chords That Sound Played",
        "Chord Names In Every File, No Theory Needed",
        "All 12 Keys, Bass Lines And Combo Loops",
        "5 Free Bonuses Included",
      ],
      ticks: ["Any DAW", "Chord names in every file", "{days}-day guarantee"],
      hud: [".mid · drag & drop", "13 voicings", "chords on the timeline"],
      daws: "Ableton Live · Logic · FL Studio · Cubase · Studio One · Reaper · Bitwig · GarageBand",
    },
  },
  // The door is the feeling ("I want a jazz vibe and don't know how", the
  // user's angle of 2026-11-04); lofi, neo soul and trap soul are the
  // specifics. The voicing is explained in its own block further down.
  {
    id: "letter",
    type: "s_letter",
    props: {
      eyebrow: "",
      title: "Where the *jazz vibe* comes from.",
      paras: [
        { style: "bold", text: "Dear producer," },
        { style: "p", text: "You know the sound. A Rhodes, a few chords, and a loop turns into a record. Lofi runs on it, neo soul runs on it, and half the trap soul beats on your feed run on it." },
        { style: "p", text: "So you open the piano roll to put some jazz in your beat, and you stop. Which chords? You try a seventh, a ninth, a few shapes from a chord chart. It sounds like a ringtone." },
        { style: "p", text: "You watch a tutorial. It starts with theory, and the guy plays piano. You go back to the four chords you always use, and the beat stays a loop." },
        { style: "pull", text: "The jazz vibe is two things: which chords, and how a pianist plays them." },
        { style: "p", text: "The chords are the easy half. Lofi, neo soul and trap soul are built on the same jazz progressions, and you can look them up in a minute." },
        { style: "p", text: "The hard half is how they’re played. A pianist keeps the notes close together and moves each one a little into the next chord, so the chords connect instead of jumping. That’s called voicing, and it’s why a pianist sounds smooth and a chord chart in a piano roll sounds like a grid. We show it below, with the same eight chords played both ways." },
        { style: "p", text: "We’re GRIND STUDIO. Our MIDI Drum Kit is in the sessions of 2,847 producers. This pack is for what sits on top of the drums." },
        { style: "hit", text: "We took the jazz progressions that lofi, neo soul and trap soul are built on, and voiced every one the way a pianist plays them, note by note, into {files} MIDI files." },
        { style: "p", text: "Drag one onto your Rhodes, your piano or your pad. The chord names show on the timeline. Start at 01, and the beat has the vibe before the drums are even in." },
      ],
    },
  },
  {
    id: "product",
    type: "s_product",
    props: {
      eyebrow: "Introducing",
      title: "The Jazz",
      titleEm: "MIDI Pack",
      lead: "{files} MIDI files. The most used jazz progressions, each voiced 13 ways, in 8 rhythms and all 12 keys, plus bass lines, combo loops and full lofi, neo soul, trap soul and deep house loops with drums. A different progression for every beat you upload, for years.",
      ticks: [
        "No theory needed: every file shows its chord names",
        "Your sounds: Rhodes, piano, pads, synths",
        "One payment, yours to keep",
      ],
    },
  },
  // The voicing, explained beside the before/after rolls (a letter block
  // followed by the rolls block is drawn as a pair, [currency]/page.tsx).
  {
    id: "voicing",
    type: "s_letter",
    props: {
      eyebrow: "",
      title: "Why these chords *sound played*.",
      paras: [
        { style: "p", text: "Same eight chords, same rhythm, played two ways. The first is root position, the way a chord chart or a chord plugin hands it to you. The second is the first folder of every progression in the pack." },
        { style: "p", text: "Watch the top note. In root position it jumps up to seven semitones from chord to chord. Voiced, it only moves between B and C, while the bass holds the roots." },
        { style: "p", text: "When a pianist moves from Dm7 to G7, two fingers stay put, the seventh drops a half step, and the hand barely moves. That is voice leading. Learning it takes months of theory and a piano you might not play, so we played it into every file: 13 voicings per progression, best-sounding first." },
        { style: "p", text: "Press play on both." },
      ],
    },
  },
  {
    id: "compare",
    type: "s_compare_rolls",
    props: {
      beforeLabel: "Before",
      beforeText: "Root position. The way a chord chart or a chord plugin hands it to you.",
      afterLabel: "After",
      afterText: "Best Voicing. The first folder of every progression.",
      note: "Same eight chords, same rhythm. Watch the top note.",
    },
  },
  {
    id: "previews",
    type: "s_previews",
    props: {
      eyebrow: "The whole pack, open",
      title: "Browse all {files} files. Press play on any of them.",
      sub: "Every folder and every file of the pack, note for note, played on a sine pluck or a piano, your pick. In your DAW they play through your sounds. Drum MIDI is shown here, not played.",
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
    id: "reviews",
    type: "s_reviews",
    props: {
      title: "What producers say about the *chords*.",
      items: [
        { quote: "Exactly what I needed. Perfect for modern songs and beats.", name: "Marcus Thompson", role: "Producer" },
        { quote: "These MIDI files saved me hundreds of hours. The chords are industry standard quality.", name: "Ardan Solis", role: "Verified Customer" },
        { quote: "Perfect. The chords add that extra sauce to make beats stand out.", name: "Niko Varela", role: "Verified Customer" },
        { quote: "This is what real production tools look like. Every progression is a hit waiting to happen.", name: "Soraya Kenji", role: "Verified Customer" },
        { quote: "The MIDI progressions are crazy. I've been using these on every session since I got the pack.", name: "Marek Tulan", role: "Hip-hop and Trap Beatmaker" },
        { quote: "Finally found chords that match the energy of modern music. This pack is legendary.", name: "Aisha Moretti", role: "Beatmaker" },
        { quote: "The creativity these MIDIs sparked is insane. Perfect foundation for any beat.", name: "Dara Kwon", role: "Trap Producer, 100M+ streams" },
        { quote: "These chords hit harder than anything I've found. Essential tools for modern producers.", name: "Ravi Lomax", role: "Trap Producer, 100M+ streams" },
      ],
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
        { q: "Is it only in C?", a: "The Progressions folder has each progression in its usual key, written in its name, and the Progressions in Every Key folder has every progression in all 12 keys. Or transpose in your DAW: the voice leading stays." },
        { q: "Do the genre loops have drums?", a: "Yes. Every lofi, neo soul, trap soul and deep house loop comes as separate chords, bass and drum MIDI, plus a full multitrack file. Drums use the GM map (kick C1, snare D1, hat F#1)." },
        { q: "What if a file doesn't load?", a: "Email support@thegrind.studio. We fix it, replace it, or refund you if we can't." },
      ],
    },
  },
  {
    id: "final",
    type: "s_final",
    props: { title: "Jazz chords, already played the way a pianist plays them. Your sounds. {price}.", note: "{days}-day satisfaction guarantee · instant download" },
  },
];

/** A blank section of a type, for "Add section" in the editor. */
export function defaultSection(type: SectionType): Section {
  const base = DEFAULT_SECTIONS.find((s) => s.type === type)!;
  return { ...structuredClone(base), id: `${type.slice(2)}-${Math.random().toString(36).slice(2, 7)}` };
}
