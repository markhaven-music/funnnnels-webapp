import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { BF } from "@/lib/blackFriday";
import { funnel } from "../../../funnel";
import { isLang } from "../../../i18n";
import { landingHtml } from "../../../landing";
import { POPUP_BUMP, POPUP_IMAGE } from "../../../popupBump";
import { LP } from "../../../landingTest";
import { pageLayouts } from "@/lib/pageLayout";
import { pageEdits } from "@/lib/pageTexts";

// The MIDI Drum Kit landing's Black Friday copy (lib/blackFriday.ts): the page visitors get at /midi-drum-kit
// (the new landing, ../../new/[currency]/route.ts), with its price struck for BF.price, a countdown in the red bar
// and its buttons to the Black Friday order page. proxy.ts rewrites /midi-drum-kit/black-friday and
// /it/midi-drum-kit/black-friday here until Black Friday ends, then sends them to the regular page.
// English and Italian, as the new landing.

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
  const wav = f.bumps?.find((b) => b.id === POPUP_BUMP);
  const popup = wav ? { price: priceIn(wav.price, currency as Currency), image: wav.image || POPUP_IMAGE } : undefined;
  const [edits, layouts] = await Promise.all([pageEdits(funnel.slug, lang, true), pageLayouts(funnel.slug, lang, true)]);
  const bf = { price: priceIn(BF.price, currency as Currency) };
  return new Response(landingHtml(lang, currency as Currency, price, edits, false, layouts.landing ?? {}, "lp-new", popup, bf), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
