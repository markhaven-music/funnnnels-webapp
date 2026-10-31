import type Stripe from "stripe";
import { resolveFunnel, type Product } from "@/lib/funnels";
import { sendSaleToNeo } from "@/lib/neo";
import { orderFromIntent, type Order } from "@/lib/orders";
import { recordSale } from "@/lib/sales";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// A card payment goes into `orders` (lib/sales.ts) as soon as we hear of it,
// not when the buyer reaches the thank-you page, which someone who stops at
// an upsell never does:
//   - the page Stripe sends the buyer back to (the first upsell, or the
//     thank-you page) records it on arrival (proxy.ts);
//   - a one-click upsell is recorded when it's charged (api/checkout/upsell);
//   - the email job sweeps Stripe each minute for anything still missing,
//     a tab closed on the way included (sweepStripe, api/cron/email).
// Each upsell is an order of its own (`parent`); the receipt waits 5 minutes
// so the upsells bought right after ride in the same email (lib/outbox.ts).
// A new order also goes to neo at once, so Meta hears of the sale.

/** Records this PaymentIntent if it's a paid order of ours. Never throws. */
export async function recordStripePayment(id: string): Promise<void> {
  if (!stripeConfigured() || !/^pi_[A-Za-z0-9]+$/.test(id)) return;
  try {
    await recordIntent(await stripe().paymentIntents.retrieve(id));
  } catch (err) {
    console.error(`recording stripe payment ${id} failed`, err);
  }
}

// As long as a receipt is still sent for it (lib/outbox.ts RECEIPT_GIVE_UP_MS).
const SWEEP_DAYS = 3;

/** The paid card orders of the last 3 days missing from `orders`, recorded now. How many. */
export async function sweepStripe(): Promise<number> {
  if (!stripeConfigured()) return 0;
  const since = Math.floor(Date.now() / 1000) - SWEEP_DAYS * 86_400;
  // The account is shared with ClickFunnels: only payments with our metadata.funnel.
  const paid: Stripe.PaymentIntent[] = [];
  let page: string | undefined;
  do {
    const res = await stripe().paymentIntents.search({ query: `status:'succeeded' AND created>${since} AND -metadata['funnel']:null`, limit: 100, page });
    paid.push(...res.data);
    page = res.has_more ? (res.next_page ?? undefined) : undefined;
  } while (page && paid.length < 500);
  if (!paid.length) return 0;

  const { data, error } = await supabase().from("orders").select("id").in("id", paid.map((p) => p.id));
  if (error) throw error;
  const known = new Set((data ?? []).map((r) => r.id as string));
  let added = 0;
  for (const intent of paid) {
    if (!known.has(intent.id) && (await recordIntent(intent))) added++;
  }
  return added;
}

async function recordIntent(intent: Stripe.PaymentIntent): Promise<boolean> {
  if (intent.status !== "succeeded") return false;
  const f = await resolveFunnel(intent.metadata?.funnel);
  if (!f) return false;
  const order = orderFromIntent(intent);
  if (!(await recordSale(order, f.slug))) return false;
  await sendSaleToNeo(order, saleName(f, order));
  return true;
}

/** What neo calls the sale: the upsell's name, or the product's. */
export function saleName(f: Product, order: Order): string {
  return order.offer ? (f.offers?.find((o) => o.id === order.offer)?.name ?? order.offer) : f.product;
}
