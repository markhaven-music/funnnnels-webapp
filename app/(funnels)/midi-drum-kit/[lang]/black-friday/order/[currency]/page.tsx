import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { pageEdits } from "@/lib/pageTexts";
import { copyWith } from "../../../../copy";
import { copyEdits } from "../../../../texts";
import { funnel } from "../../../../funnel";
import { isLang } from "../../../../i18n";
import { LP } from "../../../../landingTest";
import { DrumKitOrder } from "../../../../OrderView";

// The MIDI Drum Kit order page's Black Friday copy (lib/blackFriday.ts): the regular order page
// (../../../order/[currency]/page.tsx) at BF.price with the regular price struck, a countdown in the red bar, its
// orders carrying the Black Friday letter (the checkout charges BF.price for it until Black Friday ends).
// proxy.ts rewrites /midi-drum-kit/black-friday/order and /it/midi-drum-kit/black-friday/order here.

export const revalidate = 3600;

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

type Params = Promise<{ lang: string; currency: string }>;

export function generateStaticParams() {
  return LP.langs.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const edits = copyEdits(await pageEdits(funnel.slug, lang, true));
  return { title: copyWith(lang, undefined, edits).meta.orderTitle, robots: { index: false, follow: false } };
}

export default async function BlackFridayOrderPage({ params }: { params: Params }) {
  const { lang, currency } = await params;
  if (!isLang(lang) || !LP.langs.includes(lang) || !CURRENCIES.includes(currency as Currency)) notFound();
  return <DrumKitOrder lang={lang} currency={currency as Currency} bf />;
}
