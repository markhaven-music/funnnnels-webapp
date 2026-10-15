// The product template's sections ("bricks"). Every product created from the
// dashboard's Launches panel starts with DEFAULT_KIT_SECTIONS, then is edited
// in the dashboard editor like the Jazz page.
//
// The defaults only say things true of every GRIND STUDIO pack (any DAW,
// license, guarantee). Lines in [brackets] are placeholders to replace with
// facts about the product before the launch.
//
// Tokens, filled per visitor and per phase (prices switch the second the
// early-bird ends, even on a page that's already open):
//   {name} {tagline} {price} (the price right now) {earlyprice} {fullprice}
//   {cartopen} {deadline} (dates in the visitor's time zone) {days}

export type KitPara = { style: "p" | "bold" | "pull" | "hit"; text: string };

export type KitSectionProps = {
  k_waitlist: { eyebrow: string; headline: string; headlineEm: string; lead: string; bullets: string[]; button: string; done: string; note: string };
  k_hero: { tag: string; headline: string; headlineEm: string; lead: string; ticks: string[] };
  k_letter: { eyebrow: string; title: string; paras: KitPara[] };
  k_product: { eyebrow: string; title: string; lead: string; ticks: string[] };
  k_inside: { eyebrow: string; title: string; items: { count: string; name: string; what: string }[] };
  k_steps: { eyebrow: string; title: string; steps: { title: string; text: string }[] };
  k_offer: { eyebrow: string; title: string; stack: string[]; guarantee: string };
  k_guarantee: { title: string; text: string };
  k_faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  k_final: { title: string; note: string };
};

export type KitSectionType = keyof KitSectionProps;
export type KitSection<T extends KitSectionType = KitSectionType> = { id: string; type: T; props: KitSectionProps[T] };

export const KIT_SECTION_LABELS: Record<KitSectionType, string> = {
  k_waitlist: "Waitlist (before cart opens)",
  k_hero: "Hero",
  k_letter: "Letter",
  k_product: "Product intro",
  k_inside: "What's inside",
  k_steps: "How it works",
  k_offer: "Offer + checkout",
  k_guarantee: "Guarantee",
  k_faq: "FAQ",
  k_final: "Final CTA",
};

export function isKitSectionType(t: unknown): t is KitSectionType {
  return typeof t === "string" && t in KIT_SECTION_LABELS;
}

/** Sections shown only before the cart opens; everything else only after. */
export const WAITLIST_ONLY: KitSectionType[] = ["k_waitlist"];

export const DEFAULT_KIT_SECTIONS: KitSection[] = [
  {
    id: "waitlist",
    type: "k_waitlist",
    props: {
      eyebrow: "Opens {cartopen}",
      headline: "{name}",
      headlineEm: "is almost here.",
      lead: "{tagline}",
      bullets: [
        "Early-bird price {earlyprice} until {deadline}",
        "After that: {fullprice}",
        "One email the moment the cart opens",
      ],
      button: "Get on the waitlist",
      done: "You're on the list. We'll email you the moment the cart opens.",
      note: "A few emails during the launch, nothing after. Unsubscribe anytime.",
    },
  },
  {
    id: "hero",
    type: "k_hero",
    props: {
      tag: "New from GRIND STUDIO",
      headline: "{name}",
      headlineEm: "[the result, in five words]",
      lead: "{tagline}",
      ticks: ["Any DAW", "Instant download", "{days}-day guarantee"],
    },
  },
  {
    id: "letter",
    type: "k_letter",
    props: {
      eyebrow: "[The problem]",
      title: "[The problem, as the producer says it]",
      paras: [
        { style: "bold", text: "Dear producer," },
        { style: "p", text: "[What they tried. Why it sounds wrong.]" },
        { style: "hit", text: "[What this pack does differently.]" },
      ],
    },
  },
  {
    id: "product",
    type: "k_product",
    props: {
      eyebrow: "Introducing",
      title: "{name}",
      lead: "[What's in it: counted files, folders, formats.]",
      ticks: ["Drag & drop into any DAW", "One payment, yours to keep"],
    },
  },
  {
    id: "inside",
    type: "k_inside",
    props: {
      eyebrow: "What's inside",
      title: "[Every folder does a job.]",
      items: [
        { count: "[0]", name: "[Folder 1]", what: "[What it's for.]" },
        { count: "[0]", name: "[Folder 2]", what: "[What it's for.]" },
      ],
    },
  },
  {
    id: "steps",
    type: "k_steps",
    props: {
      eyebrow: "How it works",
      title: "From empty session to a full idea in three moves.",
      steps: [
        { title: "Pick a file", text: "Folders are numbered best-sounding first. Start at 01." },
        { title: "Drag it into your DAW", text: "Onto any instrument track. Your sounds, your mix." },
        { title: "Make it yours", text: "Change the key, the tempo, the notes. It's MIDI." },
      ],
    },
  },
  {
    id: "offer",
    type: "k_offer",
    props: {
      eyebrow: "Get the pack",
      title: "Everything in {name}. {price}.",
      stack: ["[What's included, one line each]", "Instant download", "Use it in your releases, no royalties"],
      guarantee: "{days}-day satisfaction guarantee. A file doesn’t work? We fix it.",
    },
  },
  {
    id: "guarantee",
    type: "k_guarantee",
    props: {
      title: "{days}-day satisfaction guarantee.",
      text: "If anything’s wrong with your files, email support@thegrind.studio within {days} days and we make it right: a fresh download, a replacement, or a refund if we can’t fix it.",
    },
  },
  {
    id: "faq",
    type: "k_faq",
    props: {
      eyebrow: "FAQ",
      title: "Before you grab it.",
      items: [
        { q: "Which DAWs does it work in?", a: "Any DAW that opens .mid files: Ableton Live, Logic, FL Studio, Cubase, Studio One, Reaper, Bitwig, GarageBand." },
        { q: "Can I use them in my releases?", a: "Yes. Use them in your own music, commercial releases included, with no royalties. You can't resell or share the files themselves." },
        { q: "What if a file doesn't load?", a: "Email support@thegrind.studio. We fix it, replace it, or refund you if we can't." },
      ],
    },
  },
  {
    id: "final",
    type: "k_final",
    props: { title: "{name}. {price}.", note: "{days}-day satisfaction guarantee · instant download" },
  },
];

/** A new section of a type, for "Add section" in the editor. */
export function defaultKitSection(type: KitSectionType): KitSection {
  const base = DEFAULT_KIT_SECTIONS.find((s) => s.type === type)!;
  return { ...structuredClone(base), id: `${type.slice(2)}-${Math.random().toString(36).slice(2, 7)}` };
}

export function isKitSection(b: unknown): b is KitSection {
  return !!b && typeof b === "object" && isKitSectionType((b as KitSection).type) && typeof (b as KitSection).props === "object";
}
