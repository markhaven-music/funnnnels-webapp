import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { JazzLanding } from "../LandingView";

// Copy rules: grind-studio-landing-pages/docs/copy-style.md ("Diretto").
// Every claim is in BRIEF.md. The sections are edited in the dashboard
// editor (funnnnels.com); content.ts holds the defaults / fallback.
//
// Served from Vercel's CDN, not rendered per visit: one prebuilt page per
// currency (/jazz-midi-pack/eur, /jazz-midi-pack/usd). proxy.ts picks the
// visitor's one and rewrites /jazz-midi-pack to it, so the address bar never
// changes. Publishing from the editor refreshes both (lib/pages.ts
// revalidateFunnelPages); the hourly revalidate is only a safety net.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Jazz MIDI Pack · GRIND STUDIO",
  // One address for search, whatever tags a link carries (the blog's and the ads' utm_*).
  alternates: { canonical: "https://m.thegrind.studio/jazz-midi-pack" },
  description:
    "The most used jazz progressions, voiced the way a pianist plays them. 10,496 MIDI files: 12 voicings, 8 rhythms, all 12 keys, bass lines, lofi / neo soul / trap soul / deep house loops.",
  openGraph: {
    title: "The jazz progressions everyone wants, as drag-and-drop MIDI.",
    description: "10,496 jazz MIDI files + 7 bonuses by GRIND STUDIO, voiced like a real pianist. Drag into your DAW.",
    type: "website",
    url: "https://m.thegrind.studio/jazz-midi-pack",
    images: [{ url: "https://m.thegrind.studio/funnels/jazz-midi-pack/vsl-en-1600.webp", width: 1600, height: 900 }],
  },
};

export default async function JazzMidiPackPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  return <JazzLanding currency={currency} />;
}
