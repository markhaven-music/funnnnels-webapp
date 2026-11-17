import { paypalFeeCents } from "@/lib/analytics";
import { paypal, paypalConfigured, type PayPalOrder } from "@/lib/paypal";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// The real processor fee of each order, for neo's aROAS ("we can get exactly
// how much we paid in fees from funnnnels"): neo used to take a flat
// 3.8% + €0.32 off every sale, ClickFunnels' 1% included.
//   Stripe  the charge's balance transaction fee (in EUR, the balance
//           currency), turned back into the sale's currency by its rate
//   PayPal  the capture's paypal_fee (paypal_sales.fee_cents, else PayPal)
// Written in cents of the order's own currency on orders.fee_cents and on
// neo's row for the sale (conversions, same database, platform funnnnels),
// which converts it to euros like the amount. Runs from the email job; a
// fee Stripe hasn't settled yet is simply tried again next time.

const BATCH = 25;
// Needs conversions.fee_cents + fee_checked_at (neo migration 20261117000001).

/** Fills the fees neo is still missing, a batch at a time. How many were filled. */
export async function fillOrderFees(): Promise<number> {
  const { data, error } = await supabase()
    .from("conversions")
    .select("id, order_id, currency")
    .eq("platform", "funnnnels")
    .is("fee_cents", null)
    // Not found last time: try again after half an hour (Stripe settling),
    // and only while the order is under 3 days old (PayPal forgets old
    // orders; those keep neo's Settings estimate).
    .or(`fee_checked_at.is.null,and(fee_checked_at.lt.${new Date(Date.now() - 30 * 60_000).toISOString()},occurred_at.gt.${new Date(Date.now() - 3 * 86_400_000).toISOString()})`)
    .order("occurred_at", { ascending: false })
    .limit(BATCH);
  if (error) throw error;
  let filled = 0;
  for (const c of data ?? []) {
    const fee = await feeOf(c.order_id as string).catch((err) => {
      console.error(`fee for ${c.order_id} failed`, err);
      return null;
    });
    if (fee === null) {
      await supabase().from("conversions").update({ fee_checked_at: new Date().toISOString() }).eq("id", c.id);
      continue;
    }
    const db = supabase();
    const [a, b] = await Promise.all([
      db.from("conversions").update({ fee_cents: fee }).eq("id", c.id),
      db.from("orders").update({ fee_cents: fee }).eq("id", c.order_id).is("fee_cents", null),
    ]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;
    filled++;
  }
  return filled;
}

/** The order's fee in cents of its own currency; null when unknown (yet). */
async function feeOf(orderId: string): Promise<number | null> {
  if (orderId.startsWith("pi_")) {
    if (!stripeConfigured()) return null;
    const pi = await stripe().paymentIntents.retrieve(orderId, {
      expand: ["latest_charge.balance_transaction"],
    });
    const charge = pi.latest_charge;
    const bt = charge && typeof charge !== "string" ? charge.balance_transaction : null;
    if (!bt || typeof bt === "string") return null;
    // exchange_rate: sale currency → balance currency; null when they match.
    return Math.round(bt.fee / (bt.exchange_rate ?? 1));
  }
  const { data } = await supabase().from("paypal_sales").select("fee_cents").eq("order_id", orderId).maybeSingle();
  if (data?.fee_cents != null) return data.fee_cents as number;
  if (!paypalConfigured()) return null;
  const fee = paypalFeeCents(await paypal<PayPalOrder>(`/v2/checkout/orders/${orderId}`));
  if (fee !== null) await supabase().from("paypal_sales").update({ fee_cents: fee }).eq("order_id", orderId).is("fee_cents", null);
  return fee;
}
