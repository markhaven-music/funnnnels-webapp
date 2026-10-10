import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isEmail } from "@/lib/contacts";
import { getFunnel, orderAmount } from "@/lib/funnels";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

// Step 2 of the checkout: the card form is already filled in the browser;
// this creates the PaymentIntent the browser then confirms. The amount and
// currency are worked out here from the funnel and the visitor's country —
// whatever the browser displayed, it can only ever pay the real price.
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Payments are not connected yet." }, { status: 503 });
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
  const name = [body.firstName, body.lastName]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 80);

  try {
    const intent = await stripe().paymentIntents.create({
      amount: orderAmount(f, currency, bump),
      currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      description: bump ? `${f.product} + ${f.bump.name}` : f.product,
      metadata: {
        funnel: f.slug,
        bump: bump ? f.bump.id : "",
        email,
        name,
        country,
        withdrawal_waiver: body.waiver === true ? "accepted" : "",
      },
    });
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("checkout intent failed", err);
    return NextResponse.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: 502 },
    );
  }
}
