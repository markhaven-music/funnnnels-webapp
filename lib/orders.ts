import { stripe, stripeConfigured } from "@/lib/stripe";
import { isPayPalOrderId, paypal, paypalConfigured, paypalValue, type PayPalOrder } from "@/lib/paypal";
import { offeredBumps, possibleAmounts, resolveFunnel } from "@/lib/funnels";

export type Order = {
  id: string;
  provider: "stripe" | "paypal";
  status: string; // Stripe PaymentIntent status: "succeeded", "processing", … (PayPal mapped onto it)
  email: string | null;
  amount: number; // in currency units, e.g. 36
  currency: string; // "eur" | "usd"
  items: string[]; // file keys this order unlocks, e.g. ["pack", "chord-pack"]
  visitorId: string | null; // neo's ft_vid from the checkout, for lib/neo.ts
};

// Until orders live in the database (Phase 3b), the Stripe PaymentIntent or
// the PayPal order IS the order: we ask the provider directly, so a guessed or
// edited URL proves nothing.
export async function getOrder(id: unknown, funnelSlug: string): Promise<Order | null> {
  if (typeof id === "string" && /^pi_[A-Za-z0-9]+$/.test(id)) return getStripeOrder(id, funnelSlug);
  if (isPayPalOrderId(id)) return getPayPalOrder(id, funnelSlug);
  return null;
}

async function getStripeOrder(id: string, funnelSlug: string): Promise<Order | null> {
  if (!stripeConfigured()) return null;
  try {
    const intent = await stripe().paymentIntents.retrieve(id);
    if (intent.metadata.funnel !== funnelSlug) return null;
    const items = ["pack"];
    // metadata.bump: the add-ons' ids, comma-separated.
    if (intent.metadata.bump) items.push(...intent.metadata.bump.split(","));
    return {
      id,
      provider: "stripe",
      status: intent.status,
      email: intent.receipt_email,
      amount: intent.amount / 100,
      currency: intent.currency,
      items,
      visitorId: intent.metadata.ft_vid || null,
    };
  } catch {
    return null;
  }
}

async function getPayPalOrder(id: string, funnelSlug: string): Promise<Order | null> {
  const f = await resolveFunnel(funnelSlug);
  if (!f || !paypalConfigured()) return null;
  try {
    const order = await paypal<PayPalOrder>(`/v2/checkout/orders/${id}`);
    const unit = order.purchase_units[0];
    const meta = JSON.parse(unit?.custom_id ?? "{}");
    if (meta.f !== funnelSlug) return null;

    const ids = String(meta.b ?? "").split(",");
    const bumps = offeredBumps(f).filter((b) => ids.includes(b.id));
    const currency = unit.amount.currency_code.toLowerCase();
    if (currency !== "eur" && currency !== "usd") return null;
    // Belt and braces: the order we created can't be edited by the buyer, but
    // only hand over files the amount actually paid for (at the early-bird or the full price).
    if (!possibleAmounts(f, currency, bumps).some((a) => paypalValue(a) === unit.amount.value)) return null;

    // The order says COMPLETED once captured; the capture itself can still be
    // PENDING (an eCheck, a review), which is Stripe's "processing".
    const capture = unit.payments?.captures?.[0];
    const status =
      capture?.status === "COMPLETED" ? "succeeded" : capture?.status === "PENDING" ? "processing" : order.status.toLowerCase();

    return {
      id,
      provider: "paypal",
      status,
      email: order.payer?.email_address ?? meta.e ?? null,
      amount: Number(unit.amount.value),
      currency,
      items: ["pack", ...bumps.map((b) => b.id)],
      visitorId: typeof meta.n === "string" ? meta.n : null,
    };
  } catch {
    return null;
  }
}
