import { isCurrency, priceIn, type Currency } from "@/lib/geo";
import { after, NextResponse } from "next/server";
import Stripe from "stripe";
import { cleanVariant } from "@/app/(funnels)/midi-drum-kit/abtest";
import { offerProduct, ownedProducts } from "@/lib/catalog";
import { checkoutPages, offerOf, resolveFunnel, upsellsOn } from "@/lib/funnels";
import { toCents } from "@/lib/launch";
import { cleanVisitorId } from "@/lib/neoIds";
import { buyerDevice } from "@/lib/buyerDevice";
import { getOrder, notePayPalOrder, payPalVaultOf } from "@/lib/orders";
import { recordPayPalSale } from "@/lib/analytics";
import { sendSaleToNeo } from "@/lib/neo";
import { noteSale } from "@/lib/sales";
import { PAYPAL_LOCALE, isPayPalOrderId, paypal, paypalConfigured, paypalValue, returnOrigin, vaultIdOfCustomer, type PayPalOrder } from "@/lib/paypal";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { recordStripePayment, saleName } from "@/lib/stripeSales";

export const runtime = "nodejs";

// "Okay, add to my order" on an upsell page (app/(funnels)/midi-drum-kit/upsell.ts):
//   { funnel, offer, order: <the order it follows>, lang, bought: [upsell ids so far], variant, ft_vid }
// The order must be a paid order of this funnel (asked to Stripe or PayPal).
//   Card: the upsell is charged to the same card at once (the order kept it
//     for this: setup_future_usage), → { status: "paid", id }; if the bank
//     wants the buyer to confirm, → { status: "action", clientSecret, … } and
//     the page shows the bank's check.
//   PayPal: an order for the upsell, → { status: "paypal", url } to confirm on
//     PayPal; /api/checkout/paypal/return takes the money and moves on (or the
//     buyer cancels there: back on the offer page with ?unpaid=1).
// The price comes from the funnel (funnel.offers), never from the browser.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = await resolveFunnel(body.funnel);
  const offer = f ? offerOf(f, body.offer) : undefined;
  if (!f || !offer || !upsellsOn(f)) return NextResponse.json({ error: "This offer isn't available." }, { status: 404 });

  const parent = await getOrder(body.order, f.slug);
  if (!parent || parent.status !== "succeeded" || parent.offer) {
    return NextResponse.json({ error: "We couldn't find your order. Your purchase is safe: continue to get your downloads." }, { status: 400 });
  }
  // Already theirs (bought before, here or on ClickFunnels, or ticked at checkout): never
  // charged twice; the page moves on (/api/checkout/owned, normally asked first).
  if (parent.email) {
    const [product, owned] = await Promise.all([offerProduct(f.slug, offer.id), ownedProducts(parent.email, { parent: parent.id, offer: offer.id })]).catch(() => [null, new Set<string>()] as const);
    if (product && owned.has(product)) return NextResponse.json({ status: "owned" });
  }
  const lang = checkoutPages(f, body.lang).lang ?? "en";
  // The order's own currency (£ and CHF read the euro price list, lib/geo.ts).
  const currency: Currency = isCurrency(parent.currency) ? parent.currency : "usd";
  const amount = toCents(priceIn(offer.price, currency));
  const bought = (Array.isArray(body.bought) ? body.bought : []).filter((id: unknown) => typeof id === "string" && /^[A-Za-z0-9_]{6,40}$/.test(id));

  if (parent.provider === "stripe") {
    if (!stripeConfigured()) return NextResponse.json({ error: "Payments are not connected." }, { status: 503 });
    const intent = await stripe().paymentIntents.retrieve(parent.id);
    const customer = typeof intent.customer === "string" ? intent.customer : intent.customer?.id;
    const card = typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id;
    if (!customer || !card) {
      return NextResponse.json({ error: "This order can't take a one-click add-on. Your purchase is safe: continue to get your downloads." }, { status: 409 });
    }
    // Already bought (a reload, a second tap): the same upsell, not a second charge.
    const earlier = await stripe().paymentIntents.list({ customer, limit: 20 });
    const same = earlier.data.find((p) => p.metadata.parent === parent.id && p.metadata.offer === offer.id && p.status === "succeeded");
    if (same) return NextResponse.json({ status: "paid", id: same.id });

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    try {
      const up = await stripe().paymentIntents.create(
        {
          amount,
          currency,
          customer,
          payment_method: card,
          off_session: true,
          confirm: true,
          receipt_email: parent.email ?? undefined,
          description: `${f.product}: ${offer.name}`,
          metadata: {
            funnel: f.slug,
            offer: offer.id,
            parent: parent.id,
            lang,
            variant: cleanVariant(body.variant),
            ft_vid: cleanVisitorId(body.ft_vid) || parent.visitorId || "",
            email: parent.email?.toLowerCase() ?? "",
            country: intent.metadata.country ?? "",
            // The buyer's IP and browser: neo's fallback when the cookie was lost (lib/buyerDevice.ts).
            ...buyerDevice(req.headers),
          },
        },
        // Two taps within the same minute make one charge.
        { idempotencyKey: `upsell-${parent.id}-${offer.id}-${Math.floor(Date.now() / 60_000)}` },
      );
      if (up.status === "succeeded" || up.status === "processing") {
        // Into our orders now, not when (or if) the buyer reaches the thank-you page.
        after(() => recordStripePayment(up.id));
        return NextResponse.json({ status: "paid", id: up.id });
      }
      if (up.status === "requires_action" && up.client_secret) {
        return NextResponse.json({ status: "action", clientSecret: up.client_secret, paymentMethod: card, publishableKey });
      }
      return NextResponse.json({ error: "The payment didn't go through. Try again, or skip this offer: your order is safe." }, { status: 402 });
    } catch (err) {
      // The bank wants the buyer to confirm (3-D Secure): do it on the page.
      if (err instanceof Stripe.errors.StripeCardError && err.code === "authentication_required" && err.payment_intent?.client_secret) {
        return NextResponse.json({ status: "action", clientSecret: err.payment_intent.client_secret, paymentMethod: card, publishableKey });
      }
      if (err instanceof Stripe.errors.StripeCardError) {
        return NextResponse.json({ error: `${err.message} Your order is safe: you can skip this offer.` }, { status: 402 });
      }
      console.error("upsell charge failed", err);
      return NextResponse.json({ error: "The payment didn't go through. Try again, or skip this offer: your order is safe." }, { status: 502 });
    }
  }

  // PayPal. One tap when the main order saved the buyer's PayPal (vault, since 2026-11-16):
  // the upsell is charged to it at once, no PayPal page. Otherwise (an order from before,
  // a buyer PayPal didn't save, a charge PayPal wants confirmed) an order approved on
  // PayPal's page; a buyer who comes back without paying lands on the offer again with
  // ?unpaid=1, which says nothing was charged.
  if (!paypalConfigured() || !isPayPalOrderId(parent.id)) return NextResponse.json({ error: "PayPal is not connected." }, { status: 503 });
  // custom_id (127 characters): f = funnel, u = this upsell, p = the order it
  // follows, e = the buyer's email when it fits (the customer login finds it).
  const base = { f: f.slug, u: offer.id, p: parent.id, v: cleanVariant(body.variant) };
  const withEmail = JSON.stringify({ ...base, e: parent.email ?? "" });
  const customId = withEmail.length <= 127 ? withEmail : JSON.stringify(base);

  const oneTap = await payPalOneTap({ parentId: parent.id, slug: f.slug, product: f.product, offer, amount, currency, customId, lang, headers: req.headers }).catch((err) => {
    console.error("paypal one-tap upsell failed, PayPal page instead", err);
    return null;
  });
  if (oneTap) return NextResponse.json({ status: "paid", id: oneTap });

  const origin = returnOrigin(req.headers.get("origin") ?? req.headers.get("referer"));
  const page = `${lang === "en" ? "" : `/${lang}`}/${f.slug}/${offer.path}`;
  const back = `paypal_order=${parent.id}${bought.length ? `&u=${bought.join(",")}` : ""}`;
  try {
    const order = await paypal<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${f.slug}-${offer.id}`,
            custom_id: customId,
            description: `${f.product}: ${offer.name}`.slice(0, 127),
            amount: { currency_code: currency.toUpperCase(), value: paypalValue(amount) },
          },
        ],
        payment_source: {
          paypal: {
            ...(parent.email ? { email_address: parent.email } : {}),
            experience_context: {
              brand_name: f.brand,
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              ...(lang !== "en" ? { locale: PAYPAL_LOCALE[lang] } : {}),
              return_url: `${origin}/api/checkout/paypal/return?funnel=${f.slug}&offer=${offer.id}&${back}${lang !== "en" ? `&lang=${lang}` : ""}`,
              cancel_url: `${origin}${page}?${back}&unpaid=1`,
            },
          },
        },
      },
    });
    const approve = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve");
    if (!approve) throw new Error(`PayPal order ${order.id} came back without an approval link`);
    await notePayPalOrder({ id: order.id, funnel: f.slug, amountCents: amount, currency, items: [offer.id], offer: offer.id, ...buyerDevice(req.headers) });
    return NextResponse.json({ status: "paypal", url: approve.href });
  } catch (err) {
    console.error("upsell paypal order failed", err);
    return NextResponse.json({ error: "We couldn't start the PayPal payment. Try again, or skip this offer: your order is safe." }, { status: 502 });
  }
}

// The upsell charged to the buyer's saved PayPal → the new order's id, or null when
// there's nothing saved or PayPal didn't complete it (the caller sends them to PayPal).
async function payPalOneTap(o: {
  parentId: string;
  slug: string;
  product: string;
  offer: { id: string; name: string; last?: boolean };
  amount: number;
  currency: string;
  customId: string;
  lang: string;
  headers: Headers;
}): Promise<string | null> {
  const saved = await payPalVaultOf(o.parentId);
  const vaultId = saved.vaultId ?? (saved.customer ? await vaultIdOfCustomer(saved.customer) : null);
  if (!vaultId) return null;
  const order = await paypal<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    // Two taps within the same minute make one charge (as the card's idempotency key).
    requestId: `upsell-${o.parentId}-${o.offer.id}-${Math.floor(Date.now() / 60_000)}`,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `${o.slug}-${o.offer.id}`,
          custom_id: o.customId,
          description: `${o.product}: ${o.offer.name}`.slice(0, 127),
          amount: { currency_code: o.currency.toUpperCase(), value: paypalValue(o.amount) },
        },
      ],
      payment_source: { paypal: { vault_id: vaultId } },
    },
  });
  // A repeat of the same request id comes back with the same order: noted once.
  await notePayPalOrder({ id: order.id, funnel: o.slug, amountCents: o.amount, currency: o.currency, items: [o.offer.id], offer: o.offer.id, ...buyerDevice(o.headers) }).catch((err) => {
    if (err?.code !== "23505") throw err;
  });
  const capture = order.purchase_units[0]?.payments?.captures?.[0];
  if (order.status !== "COMPLETED" || !capture || (capture.status !== "COMPLETED" && capture.status !== "PENDING")) {
    console.warn(`paypal one-tap upsell not completed: order ${order.id} ${order.status} ${capture?.status ?? ""}`);
    return null;
  }
  // Counted and told now, as /api/checkout/paypal/return does for a PayPal-page payment.
  after(async () => {
    await recordPayPalSale(order, o.lang).catch((err) => console.error("paypal sale not recorded", err));
    const f = await resolveFunnel(o.slug);
    const sale = await getOrder(order.id, o.slug);
    await noteSale(sale, o.slug, o.lang);
    if (sale && f) await sendSaleToNeo(sale, saleName(f, sale));
  });
  return order.id;
}
