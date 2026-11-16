import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { funnel } from "../../funnel";
import { isLang, LANGS } from "../../i18n";
import { landingHtml } from "../../landing";
import { POPUP_BUMP, POPUP_IMAGE } from "../../popupBump";
import { pageLayouts } from "@/lib/pageLayout";
import { pageEdits } from "@/lib/pageTexts";

// The MIDI Drum Kit sales page, one prebuilt document per language and
// currency on Vercel's CDN (a whole HTML page: ClickFunnels' markup and CSS,
// outside the app's layout). proxy.ts rewrites /midi-drum-kit and
// /<lang>/midi-drum-kit here, with the currency from the visitor's country.
// Its price is dashboard → Products' and its words, sections, pictures and
// button colour can be edited from the funnel map (saving any revalidates it;
// hourly at the latest).

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; currency: string }> }) {
  const { lang, currency } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  const f = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const price = priceIn(f.price, currency as Currency);
  // The pop-up add-on (../../popupBump.ts), only while dashboard → Products sells it.
  const wav = f.bumps?.find((b) => b.id === POPUP_BUMP);
  const popup = wav ? { price: priceIn(wav.price, currency as Currency), image: wav.image || POPUP_IMAGE } : undefined;
  const [edits, layouts] = await Promise.all([pageEdits(funnel.slug, lang, true), pageLayouts(funnel.slug, lang, true)]);
  return new Response(landingHtml(lang, currency as Currency, price, edits, false, layouts.landing ?? {}, undefined, popup), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
