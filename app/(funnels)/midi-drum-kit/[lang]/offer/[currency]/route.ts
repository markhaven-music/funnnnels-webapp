import { CURRENCIES, type Currency } from "@/lib/geo";
import { isLang, LANGS } from "../../../i18n";
import { upsellHtml } from "../../../upsell";

// The "famous-beats" upsell page (../../../upsell.ts), one prebuilt document per
// language and currency; proxy.ts rewrites /midi-drum-kit/offer and
// /<lang>/midi-drum-kit/offer here.

export const dynamic = "force-static";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string; currency: string }> }) {
  const { lang, currency } = await params;
  const html = isLang(lang) && CURRENCIES.includes(currency as Currency) ? upsellHtml("famous-beats", lang, currency as Currency) : null;
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
