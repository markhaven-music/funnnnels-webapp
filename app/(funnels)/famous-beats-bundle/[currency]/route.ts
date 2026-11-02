import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { funnel } from "../funnel";
import { landingHtml } from "../landing";

// The sales page (../landing.ts), one prebuilt document per currency on
// Vercel's CDN like the other funnels; proxy.ts rewrites /famous-beats-bundle here.

export const dynamic = "force-static";
// Its price is dashboard → Products' (hourly at the latest).
export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  if (!CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  const price = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency as Currency];
  return new Response(landingHtml(currency as Currency, price), { headers: { "content-type": "text/html; charset=utf-8" } });
}
