import { after } from "next/server";
import type { Order } from "@/lib/orders";

// Every paid order also goes to neo (t.thegrind.studio), the tracker that
// credits sales to Meta ads, through its generic order webhook with
// platform "funnnnels": its sale push and dashboard then say the sale came
// from here and not from ClickFunnels. neo also sends Meta a server-side
// Purchase with event_id "purchase_<order id>"; the thank-you pages' Pixel
// Purchase uses the same id (purchaseEventId in lib/neoIds.ts), so Meta counts the sale once.
//
// NEO_ORDER_WEBHOOK = https://t.thegrind.studio/api/wh/generic/<token>, set
// in Vercel Production only: previews and local tests never reach neo.
// neo dedupes by order id, so a reloaded thank-you page sends it again harmlessly.

export function reportSaleToNeo(order: Order, product: string) {
  const url = process.env.NEO_ORDER_WEBHOOK;
  if (!url || order.status !== "succeeded") return;
  // After the response: the buyer's page never waits on neo.
  after(async () => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          email: order.email,
          amount_cents: Math.round(order.amount * 100),
          currency: order.currency.toUpperCase(),
          product_name: product,
          ...(order.visitorId ? { ft_vid: order.visitorId } : {}),
          platform: "funnnnels",
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) console.error("neo order webhook", res.status, await res.text().catch(() => ""));
    } catch (err) {
      console.error("neo order webhook failed", err);
    }
  });
}
