import { getOrder } from "@/lib/orders";
import { signedDownload } from "@/lib/products";
import { funnel } from "../funnel";

export const runtime = "nodejs";

// /top-hits-midi-bundle/download?order=pi_…|<PayPal order id>&file=pack|<add-on id>
// Once Stripe or PayPal says this order succeeded and includes the file,
// redirect to a 60-second signed link to the zip in the private bucket.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("file") ?? "pack";
  const path = funnel.files[key as keyof typeof funnel.files];
  if (!path) return new Response("Unknown file", { status: 404 });

  const order = await getOrder(url.searchParams.get("order"), funnel.slug);
  if (!order || order.status !== "succeeded" || !order.items.includes(key)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  const link = await signedDownload(path);
  if (!link) {
    console.error(`download: no file "${path}" for ${funnel.slug}`);
    return new Response(`This file isn't available right now. Email ${funnel.support} and we'll send it.`, { status: 503 });
  }
  return new Response(null, { status: 303, headers: { location: link, "cache-control": "private, no-store" } });
}
