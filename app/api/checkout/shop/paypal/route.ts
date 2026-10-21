import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { isEmail } from "@/lib/contacts";
import { isDryRun } from "@/lib/funnels";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { money, toCents } from "@/lib/launch";
import { cleanVisitorId } from "@/lib/neoIds";
import { notePayPalOrder } from "@/lib/orders";
import { paypal, paypalConfigured, paypalValue, returnOrigin, type PayPalOrder } from "@/lib/paypal";
import { SHOP_SLUG, priceCart } from "@/lib/shop";

export const runtime = "nodejs";

// The PayPal twin of /api/checkout/shop/intent, like /api/checkout/paypal for
// the funnels: it creates the order with one line per product (sku = its
// slug), records what it sells (lib/orders.ts notePayPalOrder: the proof the
// order is ours, which the download asks for) and hands back
// PayPal's page for approving it. PayPal then sends the buyer to
// /api/checkout/paypal/return?funnel=shop, which takes the money and goes on
// to /shop/thank-you.

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isDryRun(body) && !paypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not connected yet." }, { status: 503 });
  }

  const email = String(body.email ?? "").trim();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  const country = visitorCountry(await headers(), body.country);
  const currency = currencyFor(country);
  const cart = await priceCart(body.items, currency).catch((err) => {
    console.error("shop paypal: pricing failed", err);
    return { error: "We couldn't start the PayPal payment. Please try again." };
  });
  if ("error" in cart) return NextResponse.json({ error: cart.error }, { status: 409 });
  if (typeof body.expected === "number" && Math.round(body.expected * 100) !== cart.amount) {
    return NextResponse.json(
      { error: `A price just changed: the total is now ${money(cart.amount / 100, currency)}. Check your cart and pay again.`, amount: cart.amount / 100 },
      { status: 409 },
    );
  }
  if (isDryRun(body)) return NextResponse.json({ dryRun: true, amount: cart.amount, currency, items: cart.items.map((i) => i.slug) });

  const origin = returnOrigin(body.origin);
  // custom_id (127 characters): what the thank-you page and Analytics need,
  // then neo's visitor id, then the step-1 email, as they fit.
  const meta = { f: SHOP_SLUG, w: body.waiver === true ? 1 : 0, c: country };
  const vid = cleanVisitorId(body.ft_vid) || cleanVisitorId((await cookies()).get("ft_vid")?.value);
  const fits = (m: object) => (JSON.stringify(m).length <= 127 ? JSON.stringify(m) : null);
  const customId =
    fits({ ...meta, ...(vid ? { n: vid } : {}), e: email }) ?? fits({ ...meta, ...(vid ? { n: vid } : {}) }) ?? fits({ ...meta, e: email }) ?? JSON.stringify(meta);
  const code = currency.toUpperCase();

  try {
    const order = await paypal<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: SHOP_SLUG,
            custom_id: customId,
            description: cart.items.map((i) => i.name).join(" + ").slice(0, 127),
            amount: {
              currency_code: code,
              value: paypalValue(cart.amount),
              breakdown: { item_total: { currency_code: code, value: paypalValue(cart.amount) } },
            },
            items: cart.items.map((i) => ({
              name: i.name.slice(0, 127),
              sku: i.slug,
              quantity: "1",
              category: "DIGITAL_GOODS",
              unit_amount: { currency_code: code, value: paypalValue(toCents(i.price[currency])) },
            })),
          },
        ],
        payment_source: {
          paypal: {
            email_address: email,
            experience_context: {
              brand_name: BRAND.name,
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              // PayPal appends ?token=<order id>&PayerID=… to both.
              return_url: `${origin}/api/checkout/paypal/return?funnel=${SHOP_SLUG}`,
              cancel_url: `${origin}/shop/cart`,
            },
          },
        },
      },
    });
    const approve = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve");
    if (!approve) throw new Error(`PayPal order ${order.id} came back without an approval link`);
    await notePayPalOrder({ id: order.id, funnel: SHOP_SLUG, amountCents: cart.amount, currency, items: cart.items.map((i) => i.slug) });
    return NextResponse.json({ orderId: order.id, approveUrl: approve.href });
  } catch (err) {
    console.error("shop paypal order failed", err);
    return NextResponse.json({ error: "We couldn't start the PayPal payment. Please try again." }, { status: 502 });
  }
}
