import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextsEditor } from "@/components/TextsEditor";
import { isLang, LANGS } from "@/app/(funnels)/midi-drum-kit/i18n";
import { codeTexts, isTextPage, TEXT_PAGES, type TextPage } from "@/app/(funnels)/midi-drum-kit/texts";
import { getFunnelMap, type MapStep } from "@/lib/funnelMap";
import { pageEdits } from "@/lib/pageTexts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit texts · funnnnels" };

type Params = Promise<{ id: string }>;
type Search = Promise<{ page?: string; lang?: string }>;

// The MIDI Drum Kit's pages are built in code (ClickFunnels' markup, copy/*):
// their words are edited here, page by page and language by language, and
// saved over the code's (lib/pageTexts.ts, ../../../(funnels)/midi-drum-kit/texts.ts).
export default async function TextsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params;
  if (id !== "midi-drum-kit") notFound();
  const sp = await searchParams;
  const page: TextPage = isTextPage(sp.page) ? sp.page : "landing";
  const lang = sp.lang && isLang(sp.lang) ? sp.lang : "en";

  const [map, edits] = await Promise.all([getFunnelMap(id), pageEdits(id, lang)]);
  if (!map) notFound();
  const steps = map.langs.find((l) => l.lang === lang)?.steps ?? [];
  const isStep = (st: MapStep) =>
    st.offer ? st.offer.id === page : (page === "landing" && st.kind === "landing") || st.kind === page;

  return (
    <TextsEditor
      key={`${page}-${lang}`}
      funnel={{ id, name: map.name }}
      page={page}
      lang={lang}
      pages={TEXT_PAGES.map((p) => ({ id: p.id, name: p.name }))}
      langs={LANGS.filter((l) => map.langs.some((m) => m.lang === l)).map((l) => ({ lang: l, label: map.langs.find((m) => m.lang === l)!.label }))}
      code={codeTexts(page, lang)}
      edited={edits[page] ?? {}}
      liveUrl={steps.find(isStep)?.url ?? null}
    />
  );
}
