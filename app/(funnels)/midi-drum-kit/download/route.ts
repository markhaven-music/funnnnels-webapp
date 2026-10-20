import path from "node:path";
import { getOrder } from "@/lib/orders";
import { presignedDownload, r2Configured } from "@/lib/r2";
import { funnel, unlocked } from "../funnel";

export const runtime = "nodejs";

// /midi-drum-kit/download?order=pi_…|<PayPal order id>&file=pack|<add-on id>
// Once Stripe or PayPal says this order succeeded and includes the file,
// redirect to a 10-minute link to the zip in R2.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("file") ?? "pack";
  const file = funnel.files[key as keyof typeof funnel.files];
  if (!file) return new Response("Unknown file", { status: 404 });

  const order = await getOrder(url.searchParams.get("order"), funnel.slug);
  if (!order || order.status !== "succeeded" || !unlocked(order.items).includes(key)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  if (!r2Configured()) {
    console.error(`download: R2 isn't configured (${funnel.slug} ${key})`);
    return new Response(`This file isn't available right now. Email ${funnel.support} and we'll send it.`, { status: 503 });
  }
  const link = presignedDownload(file, path.basename(file));
  return new Response(null, { status: 303, headers: { location: link, "cache-control": "private, no-store" } });
}
