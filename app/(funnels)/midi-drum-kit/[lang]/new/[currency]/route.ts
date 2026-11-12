import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { funnel } from "../../../funnel";
import { isLang } from "../../../i18n";
import { landingHtml } from "../../../landing";
import { LP } from "../../../landingTest";
import { pageLayouts } from "@/lib/pageLayout";
import { pageEdits } from "@/lib/pageTexts";

// The new MIDI Drum Kit landing (the landing test's "lp-new", ../../../landingTest.ts): the old
// page's words, sections and price with the new boxes, the Jazz-sized headlines and the player
// (../../../landingNew.ts). proxy.ts rewrites /midi-drum-kit and /it/midi-drum-kit here for half
// the visitors; cached per language and currency like the old one (../../[currency]/route.ts).

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return LP.langs.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; currency: string }> }) {
  const { lang, currency } = await params;
  if (!isLang(lang) || !LP.langs.includes(lang) || !CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  const price = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency as Currency];
  const [edits, layouts] = await Promise.all([pageEdits(funnel.slug, lang, true), pageLayouts(funnel.slug, lang, true)]);
  return new Response(landingHtml(lang, currency as Currency, price, edits, false, layouts.landing ?? {}, "lp-new"), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
