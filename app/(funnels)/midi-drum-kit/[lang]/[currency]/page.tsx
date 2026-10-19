import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { copyFor } from "../../copy";
import { isLang, LANGS } from "../../i18n";
import { Landing } from "../../Landing";

// The MIDI Drum Kit sales page, one prebuilt page per language and currency
// on Vercel's CDN. proxy.ts rewrites /midi-drum-kit and /<lang>/midi-drum-kit
// here, with the currency from the visitor's country.

export const revalidate = 3600;

type Params = Promise<{ lang: string; currency: string }>;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = copyFor(lang).meta;
  return { title: t.title, description: t.description, openGraph: { title: t.title, description: t.description, type: "website" } };
}

export default async function DrumKitPage({ params }: { params: Params }) {
  const { lang, currency } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(currency as Currency)) notFound();
  return <Landing lang={lang} currency={currency as Currency} />;
}
