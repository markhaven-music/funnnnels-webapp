import type { Metadata } from "next";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { FamousBeatsLanding } from "../../_v2/Landing";

// The landing test's "fbb-v3" (../../landingTest.ts): the same page in the new MIDI Drum Kit landing's
// order (../../_v2/Landing.tsx). proxy.ts rewrites /famous-beats-bundle here for the visitors who drew it.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Famous Beats Bundle · GRIND STUDIO",
  description: "The drums behind 320 hits, transcribed note for note into multi-track MIDI. Drake, Travis Scott, Future, Metro Boomin and more. Any DAW.",
  openGraph: {
    title: "The drums behind 320 hits. Note for note, in MIDI.",
    description: "320 drum transcriptions from hit records + 4 bonuses, by GRIND STUDIO. Drag into your DAW.",
    type: "website",
    url: "https://m.thegrind.studio/famous-beats-bundle",
    images: [{ url: "https://m.thegrind.studio/funnels/famous-beats-bundle/hero-960.webp", width: 960, height: 1286 }, { url: "/funnels/famous-beats-bundle/preview.webp", width: 720, height: 450 }],
  },
};

export default async function FamousBeatsV3({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  return <FamousBeatsLanding currency={currency} variant="v3" />;
}
