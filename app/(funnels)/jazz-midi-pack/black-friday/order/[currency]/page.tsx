import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { JazzOrder } from "../../../OrderView";

// The Jazz MIDI Pack order page's Black Friday copy (lib/blackFriday.ts): the regular order page
// (../../../order/[currency]/page.tsx) at BF.price with the regular price struck and a countdown in the red bar; its
// orders carry the Black Friday letter, which the checkout charges BF.price for until Black Friday ends.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Order · Jazz MIDI Pack · Black Friday · GRIND STUDIO",
  robots: { index: false, follow: false },
};

export default async function JazzBlackFridayOrderPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  return <JazzOrder currency={currency} bf />;
}
