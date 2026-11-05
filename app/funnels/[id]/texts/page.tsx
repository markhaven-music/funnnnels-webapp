import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextsEditor } from "@/components/TextsEditor";
import { CF_PAGES, isCfPage } from "@/app/(funnels)/midi-drum-kit/cfPages";
import { isLang, LANGS, paths, type Lang } from "@/app/(funnels)/midi-drum-kit/i18n";
import { codeTexts, isTextPage, TEXT_PAGES, type TextPage } from "@/app/(funnels)/midi-drum-kit/texts";
import { splitSections, type CfSection } from "@/lib/cfSections";
import { getFunnelMap, type MapStep } from "@/lib/funnelMap";
import { pageLayouts } from "@/lib/pageLayout";
import { pageEdits } from "@/lib/pageTexts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit page · funnnnels" };

type Params = Promise<{ id: string }>;
type Search = Promise<{ page?: string; lang?: string }>;

// The MIDI Drum Kit's pages are built in code (ClickFunnels' markup, copy/*):
// their words are edited here, page by page and language by language, and
// saved over the code's (lib/pageTexts.ts, ../../../(funnels)/midi-drum-kit/texts.ts);
// on ClickFunnels' pages so are their sections (hidden, moved), pictures and the
// button colour (lib/pageLayout.ts, lib/cfSections.ts).
export default async function TextsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params;
  if (id !== "midi-drum-kit") notFound();
  const sp = await searchParams;
  const page: TextPage = isTextPage(sp.page) ? sp.page : "landing";
  const lang = sp.lang && isLang(sp.lang) ? sp.lang : "en";

  const [map, edits, layouts] = await Promise.all([getFunnelMap(id), pageEdits(id, lang), pageLayouts(id, lang)]);
  if (!map) notFound();
  const steps = map.langs.find((l) => l.lang === lang)?.steps ?? [];
  const isStep = (st: MapStep) =>
    st.offer ? st.offer.id === page : (page === "landing" && st.kind === "landing") || st.kind === page;
  const code = codeTexts(page, lang);
  // The page's sections in the code's order, each named by the words it opens with.
  const sections = isCfPage(page) ? splitSections(CF_PAGES[page]).sections.map((s, i) => ({ id: s.id, label: sectionLabel(s, code, i) })) : [];

  return (
    <TextsEditor
      key={`${page}-${lang}`}
      funnel={{ id, name: map.name }}
      page={page}
      lang={lang}
      pages={TEXT_PAGES.map((p) => ({ id: p.id, name: p.name }))}
      langs={LANGS.filter((l) => map.langs.some((m) => m.lang === l)).map((l) => ({ lang: l, label: map.langs.find((m) => m.lang === l)!.label }))}
      code={code}
      edited={edits[page] ?? {}}
      liveUrl={steps.find(isStep)?.url ?? null}
      frameSrc={frameSrc(id, page, lang)}
      sections={sections}
      layout={layouts[page] ?? {}}
      buttonColours={page === "landing"}
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

// The page as the editor shows it, on this site. ClickFunnels' pages come with
// their texts marked and without their scripts (api/funnels/[id]/texts/frame);
// the order and thank-you pages are the pages themselves, kept here with
// ?edit=1 (proxy.ts), in euros, not counted (?preview=1; the thank-you page
// then shows as for a buyer of everything).
function frameSrc(id: string, page: TextPage, lang: Lang): string {
  if (page === "order") return `${paths(lang).order}?edit=1&preview=1&origin=1&country=FR`;
  if (page === "thank-you") return `${paths(lang).thankYou}?edit=1&preview=1&origin=1&country=FR`;
  return `/api/funnels/${id}/texts/frame?page=${page}&lang=${lang}`;
}
