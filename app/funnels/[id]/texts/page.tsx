import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextsEditor } from "@/components/TextsEditor";
import { CF_PAGES, isCfPage } from "@/app/(funnels)/midi-drum-kit/cfPages";
import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { splitSections, type CfSection } from "@/lib/cfSections";
import { editableFunnel } from "@/lib/editablePages";
import { pageLayouts } from "@/lib/pageLayout";
import { pageEdits } from "@/lib/pageTexts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit page · funnnnels" };

type Params = Promise<{ id: string }>;
type Search = Promise<{ page?: string; lang?: string }>;

// Funnel map → Edit on a page built in code (lib/editablePages.ts: the MIDI
// Drum Kit, TOP HITS, Famous Beats, Jazz's thank-you page, the free packs'
// sign-up pages): its words, page by page and language by language, saved over
// the code's (lib/pageTexts.ts). On the Drum Kit's ClickFunnels pages also their
// sections (hidden, moved), pictures and the button colour (lib/pageLayout.ts,
// lib/cfSections.ts).
export default async function TextsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params;
  const f = editableFunnel(id);
  if (!f) notFound();
  const sp = await searchParams;
  const page = f.pages.find((p) => p.id === sp.page) ?? f.pages[0];
  const lang = f.langs.some((l) => l.lang === sp.lang) ? sp.lang! : f.langs[0].lang;

  const [edits, layouts] = await Promise.all([pageEdits(id, lang), id === drumKit.slug ? pageLayouts(id, lang) : Promise.resolve({})]);
  const code = page.code(lang);
  // The Drum Kit's ClickFunnels pages: their sections in the code's order, each named by the words it opens with.
  const sections =
    id === drumKit.slug && isCfPage(page.id) ? splitSections(CF_PAGES[page.id]).sections.map((s, i) => ({ id: s.id, label: sectionLabel(s, code, i) })) : [];
  const live = page.live(lang);

  return (
    <TextsEditor
      key={`${page.id}-${lang}`}
      funnel={{ id, name: f.name }}
      page={page.id}
      lang={lang}
      pages={f.pages.map((p) => ({ id: p.id, name: p.name }))}
      langs={f.langs}
      code={code}
      edited={edits[page.id] ?? {}}
      liveUrl={live}
      frameSrc={page.frame(lang)}
      sections={sections}
      layout={(layouts as Record<string, object>)[page.id] ?? {}}
      buttonColours={id === drumKit.slug && page.id === "landing"}
      vars={page.vars ?? { c: "€" }}
    />
  );
}

const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** A section's name in the editor: the first words it shows, else its first picture's name, else its number. */
function sectionLabel(section: CfSection, code: Record<string, string>, i: number): string {
  for (const key of section.texts) {
    const t = plain(code[key] ?? "");
    if (t.length > 2) return t.length > 48 ? `${t.slice(0, 47).trimEnd()}…` : t;
  }
  const picture = section.image?.match(/([\w-]+)\.\w+$/)?.[1];
  return picture ? `Picture: ${picture}` : `Section ${i + 1}`;
}
