import type { Metadata } from "next";
import { CURRENCIES } from "@/lib/geo";
import { LANGS } from "../../../i18n";
import { Vol2Page } from "../../vol2-offer/[currency]/vol2Page";

// MIDI Drum Kit Vol.2 as a normal sales page, for buyers with no order to add it to: the Vol.2 upsell page
// with `alone` (see there). m.thegrind.studio/midi-drum-kit/vol2, by link only: not in search.

export const revalidate = 3600;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export const metadata: Metadata = { title: "MIDI Drum Kit Vol.2 · GRIND STUDIO", robots: { index: false, follow: false } };

export default async function Vol2Alone({ params }: { params: Promise<{ lang: string; currency: string }> }) {
  return Vol2Page({ params, alone: true });
}
