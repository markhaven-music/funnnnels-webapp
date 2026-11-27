import type { Metadata } from "next";
import { CURRENCIES } from "@/lib/geo";
import { LANGS } from "../../../i18n";
import { Vol2Page } from "./vol2Page";

// MIDI Drum Kit Vol.2, the Drum Kit's first one-click upsell: the page is ./vol2Page.tsx (shared with ../../vol2).

export const revalidate = 3600;

type Params = Promise<{ lang: string; currency: string }>;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export const metadata: Metadata = { title: "Add MIDI Drum Kit Vol.2 · GRIND STUDIO", robots: { index: false, follow: false } };

export default async function Vol2Offer({ params }: { params: Params }) {
  return Vol2Page({ params, alone: false });
}

