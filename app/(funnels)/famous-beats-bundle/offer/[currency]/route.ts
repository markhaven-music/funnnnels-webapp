import { CURRENCIES, type Currency } from "@/lib/geo";
import { upsellHtml } from "../../../midi-drum-kit/upsell";
import { funnel } from "../../funnel";

// The "top-hits" upsell after the Famous Beats order: the MIDI Drum Kit's
// TOP HITS page (midi-drum-kit/upsell.ts) selling for this funnel, one
// prebuilt document per currency; proxy.ts rewrites /famous-beats-bundle/offer here.

export const dynamic = "force-static";
// Its price is dashboard → Products' (saving there revalidates it; hourly at the latest).
export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  const html = CURRENCIES.includes(currency as Currency) ? await upsellHtml("top-hits", "en", currency as Currency, funnel.slug) : null;
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
