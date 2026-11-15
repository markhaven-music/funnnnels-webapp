import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { cfLandingHtml } from "../../cfLanding";
import { funnel } from "../../funnel";

// The landing test's "fbb-cf" (../../landingTest.ts): ClickFunnels' red Famous Beats page as a landing
// (../../cfLanding.ts), one prebuilt document per currency. proxy.ts rewrites /famous-beats-bundle here
// for the visitors who drew it.

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  if (!CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  const price = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency as Currency];
  return new Response(cfLandingHtml(currency as Currency, price), { headers: { "content-type": "text/html; charset=utf-8" } });
}
