import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { isEmail } from "@/lib/contacts";
import { isDryRun } from "@/lib/funnels";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { money } from "@/lib/launch";
import { cleanVisitorId } from "@/lib/neoIds";
import { SHOP_SLUG, priceCart } from "@/lib/shop";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

// The shop's twin of /api/checkout/intent: the card fields are filled in the
// browser; this prices the cart (`items`: the products' slugs) from the
// database at the visitor's currency and creates the PaymentIntent the
// browser then confirms. Whatever the cart page showed, it can only pay
// today's prices.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!isDryRun(body) && !stripeConfigured()) {
    return NextResponse.json({ error: "Payments are not connected yet." }, { status: 503 });
  }

  const email = String(body.email ?? "").trim();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  const country = visitorCountry(await headers(), body.country);
  const currency = currencyFor(country);
  const cart = await priceCart(body.items, currency).catch((err) => {
    console.error("shop intent: pricing failed", err);
    return { error: "We couldn't start the payment. Please try again." };
  });
  if ("error" in cart) return NextResponse.json({ error: cart.error }, { status: 409 });
  // The cart showed a total; if a price changed since, say so instead of
  // charging something the buyer didn't see.
  if (typeof body.expected === "number" && Math.round(body.expected * 100) !== cart.amount) {
    return NextResponse.json(
      { error: `A price just changed: the total is now ${money(cart.amount / 100, currency)}. Check your cart and pay again.`, amount: cart.amount / 100 },
      { status: 409 },
    );
  }
  if (isDryRun(body)) return NextResponse.json({ dryRun: true, amount: cart.amount, currency, items: cart.items.map((i) => i.slug) });
  const items = cart.items.map((i) => i.slug).join(",");
  if (items.length > 500) {
    return NextResponse.json({ error: "That's too many products for one card payment. Split the order in two." }, { status: 409 });
  }

  const name = [body.firstName, body.lastName]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 80);
  try {
    const intent = await stripe().paymentIntents.create({
      amount: cart.amount,
      currency,
      allowed_payment_method_types: ["card"],
      receipt_email: email,
      description: cart.items.map((i) => i.name).join(" + ").slice(0, 500),
      metadata: {
        funnel: SHOP_SLUG,
        // The products' slugs, comma-separated (lib/orders.ts → order.items).
        items,
        // Lower-case: the customer login finds orders by it (lib/account.ts).
        email: email.toLowerCase(),
        name,
        country,
        withdrawal_waiver: body.waiver === true ? "accepted" : "",
        lang: "en",
        ft_vid: cleanVisitorId(body.ft_vid) || cleanVisitorId((await cookies()).get("ft_vid")?.value),
      },
    });
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("shop intent failed", err);
    return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
  }
}
