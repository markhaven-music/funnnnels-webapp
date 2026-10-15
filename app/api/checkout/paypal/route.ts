import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isEmail } from "@/lib/contacts";
import { checkoutPhase, isDryRun, orderAmount, requestNow, resolveFunnel } from "@/lib/funnels";
import { money } from "@/lib/launch";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { paypal, paypalConfigured, paypalValue, type PayPalOrder } from "@/lib/paypal";

export const runtime = "nodejs";

// The PayPal twin of /api/checkout/intent: the buyer picked the PayPal tab on
// step 2 and clicked the big button. This creates the order and hands back
// PayPal's page for approving it; PayPal then sends the buyer to
// /api/checkout/paypal/return, which takes the money. As with Stripe, the
// amount and currency are worked out here, so PayPal only ever shows the real price.

// Where PayPal may send buyers back to: the brand domain the funnel lives on
// (it forwards /api/checkout/* here), this deployment, and local dev.
const RETURN_HOSTS = new Set(["m.thegrind.studio", "jazz.thegrind.studio", "funnnnels.vercel.app", "localhost"]);

function returnOrigin(raw: unknown): string {
  try {
    const url = new URL(String(raw));
    if (RETURN_HOSTS.has(url.hostname) || url.hostname.endsWith(".local")) return url.origin;
  } catch {
    // not a URL: fall through to the brand domain
  }
  return "https://m.thegrind.studio";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = await resolveFunnel(body.funnel);
  if (!f) return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });
  const now = requestNow(body);
  if (checkoutPhase(f, now) === "waitlist") {
    return NextResponse.json({ error: "The cart isn't open yet." }, { status: 403 });
  }
  if (!isDryRun(body) && !paypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not connected yet." }, { status: 503 });
  }

  const email = String(body.email ?? "").trim();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  const bump = body.bump === true;
  const country = visitorCountry(await headers(), body.country);
  const currency = currencyFor(country);
  const origin = returnOrigin(body.origin);
  const amount = orderAmount(f, currency, bump, now);
  if (typeof body.expected === "number" && Math.round(body.expected * 100) !== amount) {
    return NextResponse.json(
      { error: `The price just changed: it's now ${money(amount / 100, currency)}. Check the total and pay again.`, amount: amount / 100 },
      { status: 409 },
    );
  }
  if (isDryRun(body)) return NextResponse.json({ dryRun: true, amount, currency, phase: checkoutPhase(f, now) });

  // PayPal has no metadata, only custom_id (127 chars). It carries what the
  // thank-you page and the download need; the step-1 email rides along when it fits.
  const meta = { f: f.slug, b: bump && f.bump ? f.bump.id : "", w: body.waiver === true ? 1 : 0, c: country };
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
            description: (bump && f.bump ? `${f.product} + ${f.bump.name}` : f.product).slice(0, 127),
            amount: { currency_code: currency.toUpperCase(), value: paypalValue(amount) },
          },
        ],
        payment_source: {
          paypal: {
            email_address: email,
            experience_context: {
              brand_name: f.brand,
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              // PayPal appends ?token=<order id>&PayerID=… to both.
              return_url: `${origin}/api/checkout/paypal/return?funnel=${f.slug}`,
              cancel_url: `${origin}/${f.slug}#buy`,
            },
          },
        },
      },
    });
    const approve = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve");
    if (!approve) throw new Error(`PayPal order ${order.id} came back without an approval link`);
    return NextResponse.json({ orderId: order.id, approveUrl: approve.href });
  } catch (err) {
    console.error("paypal order failed", err);
    return NextResponse.json(
      { error: "We couldn't start the PayPal payment. Please try again." },
      { status: 502 },
    );
  }
}
