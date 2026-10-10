import { stripe, stripeConfigured } from "@/lib/stripe";

export type Order = {
  id: string;
  status: string; // Stripe PaymentIntent status: "succeeded", "processing", …
  email: string | null;
  items: string[]; // file keys this order unlocks, e.g. ["pack", "chord-pack"]
};

// Until orders live in the database (Phase 3b), the Stripe PaymentIntent IS
// the order: we ask Stripe directly, so a guessed or edited URL proves nothing.
export async function getOrder(id: unknown, funnelSlug: string): Promise<Order | null> {
  if (typeof id !== "string" || !/^pi_[A-Za-z0-9]+$/.test(id) || !stripeConfigured()) return null;
  try {
    const intent = await stripe().paymentIntents.retrieve(id);
    if (intent.metadata.funnel !== funnelSlug) return null;
    const items = ["pack"];
    if (intent.metadata.bump) items.push(intent.metadata.bump);
    return { id, status: intent.status, email: intent.receipt_email, items };
  } catch {
    return null;
  }
}
