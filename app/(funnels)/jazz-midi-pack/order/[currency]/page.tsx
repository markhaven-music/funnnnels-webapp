import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { JazzOrder } from "../../OrderView";

// The order page, like the ClickFunnels funnels: every CTA on the landing comes
// here. Cached on the CDN per currency like the landing (proxy.ts rewrites
// /jazz-midi-pack/order); publishing from the editor refreshes it too. The
// stack, guarantee and bonuses are the landing's own sections, so an edit there
// shows here. The reviews are the landing's too. No fake timer (the brief rules
// it out); since 2026-11-09 a real one: the 5-minute Record Samples bonus
// (../../fiveMinBonus.ts), its end kept by the server.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Order · Jazz MIDI Pack · GRIND STUDIO",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  return <JazzOrder currency={currency} />;
}
