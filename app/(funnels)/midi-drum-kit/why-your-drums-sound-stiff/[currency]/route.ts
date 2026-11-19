import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { articleHtml } from "../../article/stiffDrums";
import { funnel } from "../../funnel";

// The MIDI Drum Kit's advertorial "Your drums sound stiff. It's not your sounds." (../../article/stiffDrums.ts),
// for image ads that look like content. One prebuilt document per currency on Vercel's CDN; proxy.ts
// rewrites /midi-drum-kit/why-your-drums-sound-stiff here. Counted as the Drum Kit's landing; its buttons
// go to the order page.

export const dynamic = "force-static";
// Its price is dashboard → Products' (hourly at the latest).
export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  if (!CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  const price = priceIn(((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price, currency as Currency);
  return new Response(articleHtml(currency as Currency, price), { headers: { "content-type": "text/html; charset=utf-8" } });
}
