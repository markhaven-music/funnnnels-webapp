import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isEmail } from "@/lib/contacts";
import { getFunnel, orderAmount } from "@/lib/funnels";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { paypal, paypalConfigured, paypalValue, type PayPalOrder } from "@/lib/paypal";

export const runtime = "nodejs";

// The PayPal twin of /api/checkout/intent: the buyer clicked the PayPal button
// on step 2, and this creates the order the PayPal popup then asks them to
// approve. As with Stripe, the amount and currency are worked out here, so the
// popup can only ever show the real price.
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not connected yet." }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const f = getFunnel(body.funnel);
  if (!f) return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });

  const email = String(body.email ?? "").trim();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  const bump = body.bump === true;
  const country = visitorCountry(await headers(), body.country);
  const currency = currencyFor(country);

  // PayPal has no metadata, only custom_id (127 chars). It carries what the
  // thank-you page and the download need; the step-1 email rides along when it fits.
  const meta = { f: f.slug, b: bump ? f.bump.id : "", w: body.waiver === true ? 1 : 0, c: country };
  const withEmail = JSON.stringify({ ...meta, e: email });
  const customId = withEmail.length <= 127 ? withEmail : JSON.stringify(meta);

  try {
    const order = await paypal<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: f.slug,
            custom_id: customId,
            description: (bump ? `${f.product} + ${f.bump.name}` : f.product).slice(0, 127),
            amount: { currency_code: currency.toUpperCase(), value: paypalValue(orderAmount(f, currency, bump)) },
          },
        ],
        payment_source: {
          paypal: {
            email_address: email,
            experience_context: {
              brand_name: f.brand,
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
            },
          },
        },
      },
    });
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("paypal order failed", err);
    return NextResponse.json(
      { error: "We couldn't start the PayPal payment. Please try again." },
      { status: 502 },
    );
  }
}
