import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { pageEdits } from "@/lib/pageTexts";
import { copyWith } from "../../../copy";
import { copyEdits } from "../../../texts";
import { funnel } from "../../../funnel";
import { isLang, LANGS } from "../../../i18n";
import { DrumKitOrder } from "../../../OrderView";

// The order page. Until 2026-11-12 a copy of ClickFunnels' /spot-available-midi-drum-kit-ad-15m30;
// now the Jazz MIDI Pack's order page with the Drum Kit's products, words and orange: it is drawn
// with the Jazz page's own stylesheets (jazz.module.css, checkout.module.css, btn.module.css,
// reviews.module.css), so font sizes and column widths are the Jazz page's and stay so ("font sizes
// of the page are different between the two. Also column widths. Make them the same as JAZZ MIDI
// PACK ORDER PAGE"). No card logos ("remove card images").
// Cached per language and currency; proxy.ts rewrites /midi-drum-kit/order and
// /<lang>/midi-drum-kit/order here. Its prices and add-ons are dashboard →
// Products' (../../../offer.ts), its words can be edited from the funnel map
// (../../../texts.ts); saving either revalidates it.

export const revalidate = 3600;

// The page runs under the iPhone's home bar, so the docked pay bar reaches the
// screen's edge (its own padding keeps the words above the bar: order.module.css .payBarBtn).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

type Params = Promise<{ lang: string; currency: string }>;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const edits = copyEdits(await pageEdits(funnel.slug, lang, true));
  return { title: copyWith(lang, undefined, edits).meta.orderTitle, robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: { params: Params }) {
  const { lang, currency } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(currency as Currency)) notFound();
  return <DrumKitOrder lang={lang} currency={currency as Currency} />;
}
