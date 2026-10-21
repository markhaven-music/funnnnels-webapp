import { upsertContact } from "@/lib/contacts";
import { resolveFunnel } from "@/lib/funnels";
import type { Order } from "@/lib/orders";
import { supabase } from "@/lib/supabase";

// Every paid order, saved once in `orders` (db/orders.sql + db/email.sql):
// what the dashboard's Orders panel lists, what the receipt email is sent
// from (lib/outbox.ts, a few minutes later so the one-click upsells bought
// right after ride in the same email), and how the abandoned-checkout
// reminder knows someone bought.
//
// Called from every place that learns about a payment: the Stripe webhook
// (even if the buyer closed the tab), the PayPal return, and the thank-you
// pages. Safe to call again and again for the same order.
//
// Stripe or PayPal stays the judge of whether an order paid: downloads ask
// them, never this table.
export async function recordSale(order: Order, funnel: string, lang?: string | null): Promise<void> {
  if (order.status !== "succeeded") return;
  const f = await resolveFunnel(funnel);
  if (!f) return;
  const email = order.email?.trim().toLowerCase() || null;
  const language = order.lang || lang || "en";

  const { data: inserted, error } = await supabase()
    .from("orders")
    .upsert(
      {
        id: order.id,
        provider: order.provider,
        funnel,
        items: order.items,
        amount_cents: Math.round(order.amount * 100),
        currency: order.currency,
        email,
        name: order.name ?? null,
        country: order.country ?? null,
        status: order.status,
        withdrawal_waiver: order.waiver ?? false,
        lang: language,
        offer: order.offer,
        parent: order.parent,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw error;

  // A new buyer: tag them (which can start a sequence, db/email.sql).
  if (inserted?.length && email) {
    try {
      await upsertContact({ email, name: order.name ?? undefined, source: funnel, tags: [...f.checkout.buyerTags], lang: language });
    } catch (err) {
      console.error(`order ${order.id}: tagging the buyer failed`, err);
    }
  }
}

/** recordSale for pages and routes: never throws, only logs. */
export async function noteSale(order: Order | null, funnel: string, lang?: string | null): Promise<void> {
  if (!order) return;
  try {
    await recordSale(order, funnel, lang);
  } catch (err) {
    console.error(`recording order ${order.id} failed`, err);
  }
}

/** Has this email paid for this product (any provider)? */
export async function hasPaidOrder(funnel: string, email: string): Promise<boolean> {
  const { count, error } = await supabase()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("funnel", funnel)
    .eq("email", email.trim().toLowerCase())
    .eq("status", "succeeded");
  if (error) throw error;
  return (count ?? 0) > 0;
}

// ─── dashboard ─────────────────────────────────────────────────────

export type OrderRow = {
  id: string;
  provider: "stripe" | "paypal";
  funnel: string;
  items: string[];
  amountCents: number;
  currency: "eur" | "usd";
  email: string | null;
  name: string | null;
  country: string | null;
  lang: string;
  offer: string | null;
  parent: string | null;
  emailSentAt: string | null;
  emailError: string | null;
  createdAt: string;
};

export async function listOrders(limit = 1000): Promise<OrderRow[]> {
  const { data, error } = await supabase().from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    provider: r.provider,
    funnel: r.funnel,
    items: r.items ?? [],
    amountCents: r.amount_cents,
    currency: r.currency,
    email: r.email,
    name: r.name,
    country: r.country,
    lang: r.lang,
    offer: r.offer,
    parent: r.parent,
    emailSentAt: r.email_sent_at,
    emailError: r.email_error,
    createdAt: r.created_at,
  }));
}
