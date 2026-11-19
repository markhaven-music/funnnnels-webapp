import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { articleHtml } from "./stiffDrums";
import { funnel } from "../funnel";

// The GET handler every version of the advertorial shares (../<slug>/[currency]/route.ts): one prebuilt document
// per currency on Vercel's CDN, priced from dashboard → Products. proxy.ts rewrites /midi-drum-kit/<slug> to it.
export function articleRoute(variant: string) {
  return async function GET(_req: Request, { params }: { params: Promise<{ currency: string }> }) {
    const { currency } = await params;
    if (!CURRENCIES.includes(currency as Currency)) return new Response("Not found", { status: 404 });
    const price = priceIn(((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price, currency as Currency);
    return new Response(articleHtml(currency as Currency, price, variant), { headers: { "content-type": "text/html; charset=utf-8" } });
  };
}
export const currencyParams = () => CURRENCIES.map((currency) => ({ currency }));
