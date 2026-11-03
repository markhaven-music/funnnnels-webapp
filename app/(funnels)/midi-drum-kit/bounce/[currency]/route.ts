import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { astroHtml } from "../../../astroLanding";
import { TEMPLATE } from "../../astro/bounce";
import { funnel } from "../../funnel";

// The Drum Kit's "bounce" landing (angle: stiff drums → it's the pattern), the
// Astro page m.thegrind.studio/bounce copied 1:1 (../../astro/bounce.ts), in
// English, its buttons on the English order page. Counted as the Drum Kit's
// landing: the funnel's variant field holds the button-colour test (../../abtest.ts).
// One prebuilt document per currency; proxy.ts rewrites /midi-drum-kit/bounce here,
// and m.thegrind.studio/bounce forwards there.

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
  const html = astroHtml(TEMPLATE, { funnel: funnel.slug, orderPage: funnel.checkout.orderPage, currency: currency as Currency, price });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
