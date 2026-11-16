import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { funnel } from "../../../funnel";
import { isLang } from "../../../i18n";
import { landingHtml } from "../../../landing";
import { POPUP_BUMP, POPUP_IMAGE } from "../../../popupBump";
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
  const f = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const price = priceIn(f.price, currency as Currency);
  // The pop-up add-on (../../../popupBump.ts), only while dashboard → Products sells it.
  const wav = f.bumps?.find((b) => b.id === POPUP_BUMP);
  const popup = wav ? { price: priceIn(wav.price, currency as Currency), image: wav.image || POPUP_IMAGE } : undefined;
  const [edits, layouts] = await Promise.all([pageEdits(funnel.slug, lang, true), pageLayouts(funnel.slug, lang, true)]);
  return new Response(landingHtml(lang, currency as Currency, price, edits, false, layouts.landing ?? {}, "lp-new", popup), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
