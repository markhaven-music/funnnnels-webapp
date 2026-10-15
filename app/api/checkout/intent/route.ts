import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isEmail } from "@/lib/contacts";
import { checkoutPhase, isDryRun, orderAmount, requestNow, resolveFunnel } from "@/lib/funnels";
import { money } from "@/lib/launch";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

// Step 2 of the checkout: the card form is already filled in the browser;
// this creates the PaymentIntent the browser then confirms. The amount and
// currency are worked out here from the funnel and the visitor's country —
// whatever the browser displayed, it can only ever pay the real price.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = await resolveFunnel(body.funnel);
  if (!f) return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });
  // Launches: no sales before the cart opens; the early-bird price only until its deadline.
  const now = requestNow(body);
  if (checkoutPhase(f, now) === "waitlist") {
    return NextResponse.json({ error: "The cart isn't open yet." }, { status: 403 });
  }
  if (!isDryRun(body) && !stripeConfigured()) {
    return NextResponse.json({ error: "Payments are not connected yet." }, { status: 503 });
  }

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
  const amount = orderAmount(f, currency, bump, now);
  // The page showed a total; if the price changed since (the early-bird just
  // ended), say so instead of charging something the buyer didn't see.
  if (typeof body.expected === "number" && Math.round(body.expected * 100) !== amount) {
    return NextResponse.json(
      { error: `The price just changed: it's now ${money(amount / 100, currency)}. Check the total and pay again.`, amount: amount / 100 },
      { status: 409 },
    );
  }
  if (isDryRun(body)) return NextResponse.json({ dryRun: true, amount, currency, phase: checkoutPhase(f, now) });

  try {
    const intent = await stripe().paymentIntents.create({
      amount,
      currency,
      // Cards only, matching the checkout's card fields (Apple Pay / Google Pay are cards).
      allowed_payment_method_types: ["card"],
      receipt_email: email,
      description: bump && f.bump ? `${f.product} + ${f.bump.name}` : f.product,
      metadata: {
        funnel: f.slug,
        bump: bump && f.bump ? f.bump.id : "",
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
