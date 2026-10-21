import { deliver, fileFor, type StoredFile } from "@/lib/catalog";
import { getOrder } from "@/lib/orders";
import { funnel, unlocked } from "../funnel";

export const runtime = "nodejs";

// /jazz-midi-pack/download?order=pi_…|<PayPal order id>&file=pack|chord-pack|anime-pack|…
// Sends a zip only when Stripe or PayPal says this order succeeded and unlocks it
// (the pack it paid for, plus the bonuses that come with the pack): the
// product's in dashboard → Products (lib/catalog.ts), else the one funnel.ts
// names, shipped in private/ or (the big bonuses) in R2.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("file") ?? "pack";
  const order = await getOrder(url.searchParams.get("order"), funnel.slug);
  if (!order || order.status !== "succeeded" || !unlocked(order.items).includes(key)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  const local = funnel.files[key];
  const remote = funnel.remoteFiles[key];
  const code: StoredFile | undefined = local ? { store: "local", path: local } : remote ? { store: "r2", path: remote } : undefined;
  const file = await fileFor(funnel.slug, key, code);
  const res = file && (await deliver(file));
  if (!res) return new Response("This file isn't available right now. Email us and we send the file.", { status: 503 });
  return res;
}
