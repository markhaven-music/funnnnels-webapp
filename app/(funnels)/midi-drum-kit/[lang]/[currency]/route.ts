import { CURRENCIES, type Currency } from "@/lib/geo";
import { isLang, LANGS } from "../../i18n";
import { landingHtml } from "../../landing";

// The MIDI Drum Kit sales page, one prebuilt document per language and
// currency on Vercel's CDN (a whole HTML page: ClickFunnels' markup and CSS,
// outside the app's layout). proxy.ts rewrites /midi-drum-kit and
// /<lang>/midi-drum-kit here, with the currency from the visitor's country.

export const dynamic = "force-static";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; currency: string }> }) {
  const { lang, currency } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  return new Response(landingHtml(lang, currency as Currency), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
