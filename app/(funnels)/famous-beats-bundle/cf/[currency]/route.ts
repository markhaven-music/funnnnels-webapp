import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { cfLandingHtml } from "../../cfLanding";
import { funnel } from "../../funnel";
import { FBB_POPUP } from "../../popupOffer";

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
  const f = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const price = priceIn(f.price, currency as Currency);
  // The landing pop-up's add-on (../../popupOffer.ts), at Products' price; none when Products doesn't sell it.
  const popup = f.bumps?.find((b) => b.id === FBB_POPUP.item);
  return new Response(cfLandingHtml(currency as Currency, price, popup ? priceIn(popup.price, currency as Currency) : null), { headers: { "content-type": "text/html; charset=utf-8" } });
}
