import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { funnel } from "../../funnel";
import { isLang, LANGS } from "../../i18n";
import { landingHtml } from "../../landing";
import { pageEdits } from "@/lib/pageTexts";

// The MIDI Drum Kit sales page, one prebuilt document per language and
// currency on Vercel's CDN (a whole HTML page: ClickFunnels' markup and CSS,
// outside the app's layout). proxy.ts rewrites /midi-drum-kit and
// /<lang>/midi-drum-kit here, with the currency from the visitor's country.
// Its price is dashboard → Products' and its words can be edited from the funnel
// map (saving either revalidates it; hourly at the latest).

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; currency: string }> }) {
  const { lang, currency } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  const price = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency as Currency];
  const edits = await pageEdits(funnel.slug, lang, true);
  return new Response(landingHtml(lang, currency as Currency, price, edits), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
