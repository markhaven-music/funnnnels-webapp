import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { funnel } from "../../funnel";
import { landingHtml } from "../../landing";
import { pageEdits } from "@/lib/pageTexts";

// The landing test's "fbb-old" (../../landingTest.ts): the Astro page as it was live until
// 2026-11-10 (../../landing.ts), one prebuilt document per currency. proxy.ts rewrites
// /famous-beats-bundle here for the visitors who drew it.

export const dynamic = "force-static";
// Its price is dashboard → Products', its words the dashboard's editor's (hourly at the latest).
export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
  const { currency } = await params;
  if (!CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
  const price = priceIn(((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price, currency as Currency);
  const edits = (await pageEdits(funnel.slug, "en", true)).landing ?? {};
  return new Response(landingHtml(currency as Currency, price, edits), { headers: { "content-type": "text/html; charset=utf-8" } });
}
