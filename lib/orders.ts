import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { isPayPalOrderId, paypal, paypalConfigured, paypalValue, type PayPalOrder } from "@/lib/paypal";
import { getFunnel, offerOf, offeredBumps, possibleAmounts, resolveFunnel } from "@/lib/funnels";
import { toCents } from "@/lib/launch";
import { SHOP_SLUG, shopItems } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

export type Order = {
  id: string;
  provider: "stripe" | "paypal";
  status: string; // Stripe PaymentIntent status: "succeeded", "processing", … (PayPal mapped onto it)
  email: string | null;
  amount: number; // in currency units, e.g. 36
  currency: string; // "eur" | "usd"
  items: string[]; // file keys this order unlocks, e.g. ["pack", "chord-pack"]
  visitorId: string | null; // neo's ft_vid from the checkout, for lib/neo.ts
  // A one-click upsell (funnel.offers): its id and the order it followed.
  offer: string | null;
  parent: string | null;
  // For the receipt and the dashboard (lib/sales.ts); not always known.
  name?: string | null;
  country?: string | null;
  lang?: string | null;
  waiver?: boolean;
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
    return orderFromIntent(intent);
  } catch {
    return null;
  }
}

/** The order a PaymentIntent is (the customer library lists them from Stripe's search, lib/account.ts). */
export function orderFromIntent(intent: Stripe.PaymentIntent): Order {
  // An upsell unlocks its own file only; an order, the pack and its add-ons
  // (metadata.bump: their ids, comma-separated); a shop order, its products
  // (metadata.items: their slugs).
  const offer = intent.metadata.offer || null;
  const items = intent.metadata.funnel === SHOP_SLUG ? shopItems(intent.metadata.items) : offer ? [offer] : ["pack"];
  if (!offer && intent.metadata.bump) items.push(...intent.metadata.bump.split(","));
  return {
    id: intent.id,
    provider: "stripe",
    status: intent.status,
    email: intent.receipt_email,
    amount: intent.amount / 100,
    currency: intent.currency,
    items,
    visitorId: intent.metadata.ft_vid || null,
    offer,
    parent: intent.metadata.parent || null,
    name: intent.metadata.name || null,
    country: intent.metadata.country || null,
    lang: intent.metadata.lang || null,
    waiver: intent.metadata.withdrawal_waiver === "accepted",
  };
}

// Every PayPal order this server creates, with what it sells and for how
// much (db/catalog.sql paypal_orders). PayPal's custom_id alone proves
// nothing: anyone can create an order to our account in a browser with the
// public client id, with any amount and custom_id. The record also outlives
// a price changed in dashboard → Products.
export async function notePayPalOrder(o: { id: string; funnel: string; amountCents: number; currency: string; items: string[]; offer?: string | null }) {
  const { error } = await supabase()
    .from("paypal_orders")
    .insert({ id: o.id, funnel: o.funnel, amount_cents: o.amountCents, currency: o.currency, items: o.items, offer: o.offer ?? null });
  if (error) throw error;
}

type MadeRow = { funnel: string; amount_cents: number; currency: string; items: string[]; offer: string | null };

async function getPayPalOrder(id: string, funnelSlug: string): Promise<Order | null> {
  if (!paypalConfigured()) return null;
  try {
    const [order, { data: made, error: madeErr }] = await Promise.all([
      paypal<PayPalOrder>(`/v2/checkout/orders/${id}`),
      supabase().from("paypal_orders").select("funnel, amount_cents, currency, items, offer").eq("id", id).maybeSingle(),
    ]);
    if (madeErr) throw madeErr;
    const unit = order.purchase_units[0];
    const meta = JSON.parse(unit?.custom_id ?? "{}");
    if (meta.f !== funnelSlug) return null;

    const currency = unit.amount.currency_code.toLowerCase();
    if (currency !== "eur" && currency !== "usd") return null;
    let items: string[];
    let offer: string | null;
    if (made) {
      // Ours: it unlocks what we sold, for the amount we asked.
      const m = made as MadeRow;
      if (m.funnel !== funnelSlug || m.currency !== currency || paypalValue(m.amount_cents) !== unit.amount.value) return null;
      items = m.items;
      offer = m.offer;
    } else {
      // Not recorded: made before orders were (2026-10-22), so checked
      // against the code's prices, the ones of that time. The shop records all of its own.
      const f = funnelSlug === SHOP_SLUG ? undefined : (getFunnel(funnelSlug) ?? (await resolveFunnel(funnelSlug)));
      if (!f) return null;
      // An upsell (custom_id u = its id, p = the order it followed): its price only.
      const up = typeof meta.u === "string" ? offerOf(f, meta.u) : undefined;
      if (meta.u && !up) return null;
      const ids = up ? [] : String(meta.b ?? "").split(",");
      const bumps = offeredBumps(f).filter((b) => ids.includes(b.id));
      // Only hand over files the amount actually paid for (at the early-bird or the full price).
      const paid = up ? [toCents(up.price[currency])] : possibleAmounts(f, currency, bumps);
      if (!paid.some((a) => paypalValue(a) === unit.amount.value)) return null;
      items = up ? [up.id] : ["pack", ...bumps.map((b) => b.id)];
      offer = up?.id ?? null;
    }

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
      items,
      visitorId: typeof meta.n === "string" ? meta.n : null,
      offer,
      parent: typeof meta.p === "string" ? meta.p : null,
      name: [order.payer?.name?.given_name, order.payer?.name?.surname].filter(Boolean).join(" ") || null,
      country: typeof meta.c === "string" ? meta.c : null,
      waiver: meta.w === 1,
    };
  } catch {
    return null;
  }
}
