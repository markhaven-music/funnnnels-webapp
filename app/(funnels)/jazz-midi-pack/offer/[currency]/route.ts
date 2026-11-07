import { CURRENCIES, type Currency } from "@/lib/geo";
import { upsellHtml } from "../../../midi-drum-kit/upsell";
import { funnel } from "../../funnel";

// The "famous-beats" upsell after the Jazz MIDI Pack order: the MIDI Drum Kit's
// page (midi-drum-kit/upsell.ts) selling for this funnel, one prebuilt
// document per currency; proxy.ts rewrites /jazz-midi-pack/offer here.

export const dynamic = "force-static";
// Its price is dashboard → Products' (saving there revalidates it; hourly at the latest).
export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  const html = CURRENCIES.includes(currency as Currency) ? await upsellHtml("famous-beats", "en", currency as Currency, funnel.slug) : null;
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
