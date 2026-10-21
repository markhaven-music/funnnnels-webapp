import { reportSaleToNeo } from "@/lib/neo";
import { orderFromIntent } from "@/lib/orders";
import { recordSale } from "@/lib/sales";
import { resolveFunnel } from "@/lib/funnels";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

// Stripe → us when a card payment succeeds: the dependable record of a sale,
// even when the buyer closes the tab before the thank-you page. Endpoint in
// the Stripe Dashboard (Developers → Webhooks → Add destination):
//   https://funnnnels.com/api/webhooks/stripe, event payment_intent.succeeded,
//   signing secret (whsec_…) in Vercel as STRIPE_WEBHOOK_SECRET.
//
// The Stripe account is shared with ClickFunnels, so most events aren't ours:
// a payment without one of our products in metadata.funnel gets a 200 and is ignored.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !stripeConfigured()) return new Response("STRIPE_WEBHOOK_SECRET is not set", { status: 503 });

  const payload = await req.text();
  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(payload, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }
  if (event.type !== "payment_intent.succeeded") return Response.json({ ignored: event.type });

  const intent = event.data.object;
  const f = await resolveFunnel(intent.metadata?.funnel);
  if (!f) return Response.json({ ignored: "not a funnnnels payment" });
  const order = orderFromIntent(intent);
  try {
    await recordSale(order, f.slug);
  } catch (err) {
    // 500 → Stripe retries for up to three days; recording is idempotent.
    console.error(`stripe webhook: recording ${order.id} failed`, err);
    return new Response("Recording failed", { status: 500 });
  }
  // neo dedupes by order id, so the thank-you page sending it too is harmless.
  reportSaleToNeo(order, order.offer ? (f.offers?.find((o) => o.id === order.offer)?.name ?? order.offer) : f.product);
  return Response.json({ recorded: order.id });
}
