import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { JazzLanding } from "../../LandingView";

// The Jazz MIDI Pack landing's Black Friday copy (lib/blackFriday.ts): the regular landing (../../[currency]/page.tsx)
// at BF.price with the regular price struck, a countdown in the red bar, every button to
// /jazz-midi-pack/black-friday/order. proxy.ts rewrites /jazz-midi-pack/black-friday here until Black Friday ends,
// then sends it to the regular page.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Jazz MIDI Pack · Black Friday · GRIND STUDIO",
  robots: { index: false, follow: false },
};

export default async function JazzBlackFridayPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  return <JazzLanding currency={currency} bf />;
}
