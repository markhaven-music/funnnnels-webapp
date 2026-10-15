import { resolveFunnel } from "@/lib/funnels";
import { getOrder } from "@/lib/orders";
import { productFile, signedDownload } from "@/lib/products";

export const runtime = "nodejs";

// /<slug>/download?order=pi_…|<PayPal order id>&file=pack|<add-on id>
// For launch-kit products: once Stripe or PayPal says this order succeeded and
// includes the file, redirect to a 60-second signed link to the zip in the
// private bucket. The link is never shown before payment and expires fast.
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const f = await resolveFunnel(slug);
  if (!f || f.kind !== "kit") return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const key = url.searchParams.get("file") ?? "pack";
  const order = await getOrder(url.searchParams.get("order"), f.slug);
  if (!order || order.status !== "succeeded" || !order.items.includes(key)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  const path = await productFile(f.slug, key);
  const link = path && (await signedDownload(path));
  if (!link) {
    console.error(`download: no file "${key}" for ${f.slug}`);
    return new Response("This file isn't available right now. Email support@thegrind.studio and we'll send it.", { status: 503 });
  }
  return new Response(null, { status: 303, headers: { location: link, "cache-control": "private, no-store" } });
}
