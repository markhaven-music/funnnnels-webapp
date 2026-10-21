import { deliver } from "@/lib/catalog";
import { getOrder } from "@/lib/orders";
import { SHOP_SLUG, shopFile } from "@/lib/shop";

export const runtime = "nodejs";

// /shop/download?order=pi_…|<PayPal order id>&file=<product slug>
// Once Stripe or PayPal says this order succeeded and includes the product,
// hand over its zip (lib/catalog.ts deliver: a short-lived link, or the file
// itself when it ships with the deployment). The zip is looked up now, so a
// product's replaced zip reaches past buyers too.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("file") ?? "";
  const order = await getOrder(url.searchParams.get("order"), SHOP_SLUG);
  if (!order || order.status !== "succeeded" || !order.items.includes(slug)) {
    return new Response("This download link isn't valid for a completed order.", { status: 403 });
  }

  const file = await shopFile(slug).catch(() => null);
  const res = file && (await deliver(file));
  if (!res) {
    console.error(`shop download: no file for ${slug} (order ${order.id})`);
    return new Response("This file isn't available right now. Email support@thegrind.studio and we'll send it.", { status: 503 });
  }
  return res;
}
