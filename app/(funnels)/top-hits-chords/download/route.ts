import { deliver, fileFor } from "@/lib/catalog";
import { getOrder } from "@/lib/orders";
import { funnel, unlocked } from "../funnel";

export const runtime = "nodejs";

// /top-hits-chords/download?order=pi_…|<PayPal order id>&file=pack|<add-on id>
// Once Stripe or PayPal says this order succeeded and includes the file,
// redirect to a short-lived link to its zip: the product's in dashboard →
// Products (lib/catalog.ts), else the one funnel.ts names in R2.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("file") ?? "pack";
  const order = await getOrder(url.searchParams.get("order"), funnel.slug);
  if (!order || order.status !== "succeeded" || !unlocked(order.items).includes(key)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  const code = funnel.files[key as keyof typeof funnel.files];
  const file = await fileFor(funnel.slug, key, code ? { store: "r2", path: code } : undefined);
  const res = file && (await deliver(file));
  if (!res) {
    console.error(`download: no file for ${funnel.slug} ${key}`);
    return new Response(`This file isn't available right now. Email ${funnel.support} and we'll send it.`, { status: 503 });
  }
  return res;
}
