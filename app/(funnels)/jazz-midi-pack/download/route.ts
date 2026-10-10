import { readFile } from "node:fs/promises";
import path from "node:path";
import { getOrder } from "@/lib/orders";
import { funnel } from "../funnel";

export const runtime = "nodejs";

// /jazz-midi-pack/download?order=pi_…&file=pack|chord-pack
// Sends a paid zip only when Stripe says this order succeeded and includes it.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("file") ?? "pack";
  const file = funnel.files[key as keyof typeof funnel.files];
  if (!file) return new Response("Unknown file", { status: 404 });

  const order = await getOrder(url.searchParams.get("order"), funnel.slug);
  if (!order || order.status !== "succeeded" || !order.items.includes(key)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  const data = await readFile(path.join(process.cwd(), file));
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${path.basename(file)}"`,
      "cache-control": "private, no-store",
    },
  });
}
