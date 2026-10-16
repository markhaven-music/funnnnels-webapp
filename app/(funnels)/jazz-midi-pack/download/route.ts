import { readFile } from "node:fs/promises";
import path from "node:path";
import { getOrder } from "@/lib/orders";
import { presignedDownload, r2Configured } from "@/lib/r2";
import { funnel, unlocked } from "../funnel";

export const runtime = "nodejs";

// /jazz-midi-pack/download?order=pi_…|<PayPal order id>&file=pack|chord-pack|anime-pack|…
// Sends a zip only when Stripe or PayPal says this order succeeded and unlocks it
// (the pack it paid for, plus the bonuses that come with the pack).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("file") ?? "pack";
  const file = funnel.files[key];
  const remote = funnel.remoteFiles[key];
  if (!file && !remote) return new Response("Unknown file", { status: 404 });

  const order = await getOrder(url.searchParams.get("order"), funnel.slug);
  if (!order || order.status !== "succeeded" || !unlocked(order.items).includes(key)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  // Big bonuses live in R2: send the buyer to a link that works for 10 minutes.
  if (remote) {
    if (!r2Configured()) return new Response("Download storage isn't connected. Email us and we send the file.", { status: 503 });
    return Response.redirect(presignedDownload(remote, path.basename(remote)), 302);
  }

  const data = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), file));
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${path.basename(file)}"`,
      "cache-control": "private, no-store",
    },
  });
}
