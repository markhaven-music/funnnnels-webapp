import { cookies } from "next/headers";
import { SESSION_COOKIE, ownsLegacy, readSession } from "@/lib/account";
import { deliver } from "@/lib/catalog";
import { getOrder } from "@/lib/orders";
import { SHOP_SLUG, shopFile } from "@/lib/shop";

export const runtime = "nodejs";

// /shop/download?order=pi_…|<PayPal order id>&file=<product slug>
// /shop/download?file=<product slug> without an order: a purchase made before
// funnnnels (legacy_purchases), for the buyer signed in at /account.
// Once Stripe or PayPal says this order succeeded and includes the product,
// hand over its zip (lib/catalog.ts deliver: a short-lived link, or the file
// itself when it ships with the deployment). The zip is looked up now, so a
// product's replaced zip reaches past buyers too.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("file") ?? "";
  const orderId = url.searchParams.get("order");
  let paid: string;
  if (orderId) {
    const order = await getOrder(orderId, SHOP_SLUG);
    if (!order || order.status !== "succeeded" || !order.items.includes(slug)) {
      return new Response("This download link isn't valid for a completed order.", { status: 403 });
    }
    paid = `order ${order.id}`;
  } else {
    const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
    // Relative: the brand domain forwards here, so this request's host isn't the buyer's.
    if (!session) return new Response(null, { status: 303, headers: { location: "/account" } });
    if (!(await ownsLegacy(session.e, slug))) {
      return new Response("This download isn't in your purchases.", { status: 403 });
    }
    paid = "a purchase before funnnnels";
  }

  const file = await shopFile(slug).catch(() => null);
  const res = file && (await deliver(file));
  if (!res) {
    console.error(`shop download: no file for ${slug} (${paid})`);
    return new Response("This file isn't available right now. Email support@thegrind.studio and we'll send it.", { status: 503 });
  }
  return res;
}
