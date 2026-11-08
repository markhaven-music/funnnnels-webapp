import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { isEmail } from "@/lib/contacts";
import { checkoutPhase, isDryRun, orderAmount, orderDescription, pickedBumps, requestNow, resolveFunnel, upsellsOn } from "@/lib/funnels";
import { money } from "@/lib/launch";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { cleanVariant } from "@/app/(funnels)/midi-drum-kit/abtest";
import { cleanVisitorId } from "@/lib/neoIds";
import { BONUS_COOKIE, orderBonus } from "@/lib/bonusClock";

export const runtime = "nodejs";

// Step 2 of the checkout: the card form is already filled in the browser;
// this creates the PaymentIntent the browser then confirms. The amount and
// currency are worked out here from the funnel and the visitor's country —
// whatever the browser displayed, it can only ever pay the real price.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = await resolveFunnel(body.funnel);
  // The shop prices a cart: /api/checkout/shop/*.
  if (!f || f.kind === "shop") return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });
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
  const bumps = pickedBumps(f, body);
  // The Drum Kit order page's 5-minute bonus (lib/bonusClock.ts): free, so not in the amount.
  const bonus = orderBonus(f, body, (await cookies()).get(BONUS_COOKIE)?.value, bumps);
  if (bonus.expired) return NextResponse.json({ error: bonus.expired, bonusExpired: true }, { status: 409 });
  const country = visitorCountry(await headers(), body.country);
  const currency = currencyFor(country);
  const name = [body.firstName, body.lastName]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 80);
  const amount = orderAmount(f, currency, bumps, now);
  // The page showed a total; if the price changed since (the early-bird just
  // ended), say so instead of charging something the buyer didn't see.
  if (typeof body.expected === "number" && Math.round(body.expected * 100) !== amount) {
    return NextResponse.json(
      { error: `The price just changed: it's now ${money(amount / 100, currency)}. Check the total and pay again.`, amount: amount / 100 },
      { status: 409 },
    );
  }
  if (isDryRun(body)) return NextResponse.json({ dryRun: true, amount, currency, phase: checkoutPhase(f, now), bonus: bonus.item });

  try {
    // With one-click upsells after the order, the card is kept on a customer
    // so each "Okay, add to my order" charges it without asking again.
    const keepCard = upsellsOn(f);
    const customer = keepCard ? await stripe().customers.create({ email, name: name || undefined, metadata: { funnel: f.slug } }) : null;
    const intent = await stripe().paymentIntents.create({
      amount,
      currency,
      ...(customer ? { customer: customer.id, setup_future_usage: "off_session" as const } : {}),
      // Cards only, matching the checkout's card fields (Apple Pay / Google Pay are cards).
      allowed_payment_method_types: ["card"],
      receipt_email: email,
      description: orderDescription(f, bonus.item ? [...bumps, bonus.item] : bumps),
      metadata: {
        funnel: f.slug,
        // The add-ons' ids, comma-separated (one for single-bump products), the free bonus included.
        bump: [...bumps, ...(bonus.item ? [bonus.item] : [])].map((b) => b.id).join(","),
        // The add-on given free by the 5-minute bonus, if any.
        bonus: bonus.item?.id ?? "",
        // Lower-case: the customer login finds orders by it (lib/account.ts).
        email: email.toLowerCase(),
        name,
        country,
        withdrawal_waiver: body.waiver === true ? "accepted" : "",
        // The A/B test variant the buyer saw (e.g. the button colour), if any.
        variant: cleanVariant(body.variant),
        // The page's language ("fr" for /fr/midi-drum-kit), for Analytics.
        lang: typeof body.lang === "string" && f.langs?.includes(body.lang) ? body.lang : "en",
        // neo's visitor id (its snippet adds it to the form, and sets the cookie), for lib/neo.ts.
        ft_vid: cleanVisitorId(body.ft_vid) || cleanVisitorId((await cookies()).get("ft_vid")?.value),
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
