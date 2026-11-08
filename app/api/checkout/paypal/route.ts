import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { isEmail } from "@/lib/contacts";
import { checkoutPages, checkoutPhase, isDryRun, orderAmount, orderDescription, pickedBumps, requestNow, resolveFunnel } from "@/lib/funnels";
import { money } from "@/lib/launch";
import { currencyFor, visitorCountry } from "@/lib/geo";
import { PAYPAL_LOCALE, paypal, paypalConfigured, paypalValue, returnOrigin, type PayPalOrder } from "@/lib/paypal";
import { cleanVariant } from "@/app/(funnels)/midi-drum-kit/abtest";
import { cleanVisitorId } from "@/lib/neoIds";
import { notePayPalOrder } from "@/lib/orders";
import { BONUS_COOKIE, orderBonus } from "@/lib/bonusClock";

export const runtime = "nodejs";

// The PayPal twin of /api/checkout/intent: the buyer picked the PayPal tab on
// step 2 and clicked the big button. This creates the order and hands back
// PayPal's page for approving it; PayPal then sends the buyer to
// /api/checkout/paypal/return, which takes the money. As with Stripe, the
// amount and currency are worked out here, so PayPal only ever shows the real price.

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = await resolveFunnel(body.funnel);
  // The shop prices a cart: /api/checkout/shop/*.
  if (!f || f.kind === "shop") return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });
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
  const bumps = pickedBumps(f, body);
  // The Drum Kit order page's 5-minute bonus (lib/bonusClock.ts): free, so not in the amount.
  const bonus = orderBonus(f, body, (await cookies()).get(BONUS_COOKIE)?.value, bumps);
  if (bonus.expired) return NextResponse.json({ error: bonus.expired, bonusExpired: true }, { status: 409 });
  const country = visitorCountry(await headers(), body.country);
  const currency = currencyFor(country);
  const origin = returnOrigin(body.origin);
  // The buyer's language, for the pages PayPal sends them back to and its own page.
  const pages = checkoutPages(f, body.lang);
  const amount = orderAmount(f, currency, bumps, now);
  if (typeof body.expected === "number" && Math.round(body.expected * 100) !== amount) {
    return NextResponse.json(
      { error: `The price just changed: it's now ${money(amount / 100, currency)}. Check the total and pay again.`, amount: amount / 100 },
      { status: 409 },
    );
  }
  if (isDryRun(body)) return NextResponse.json({ dryRun: true, amount, currency, phase: checkoutPhase(f, now), bonus: bonus.item });

  // PayPal has no metadata, only custom_id (127 chars). It carries what the
  // thank-you page and the download need; the step-1 email rides along when it fits.
  // v: the A/B test variant the buyer saw (e.g. the button colour), if any.
  const variant = cleanVariant(body.variant);
  const meta = { f: f.slug, b: bumps.map((b) => b.id).join(","), w: body.waiver === true ? 1 : 0, c: country, ...(variant ? { v: variant } : {}) };
  // n: neo's visitor id (lib/neo.ts). The 127 characters keep, in order of need:
  // meta, then the visitor id, then the email.
  const vid = cleanVisitorId(body.ft_vid) || cleanVisitorId((await cookies()).get("ft_vid")?.value);
  const fits = (m: object) => (JSON.stringify(m).length <= 127 ? JSON.stringify(m) : null);
  const customId =
    fits({ ...meta, ...(vid ? { n: vid } : {}), e: email }) ?? fits({ ...meta, ...(vid ? { n: vid } : {}) }) ?? fits({ ...meta, e: email }) ?? JSON.stringify(meta);

  try {
    const order = await paypal<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: f.slug,
            custom_id: customId,
            description: orderDescription(f, bonus.item ? [...bumps, bonus.item] : bumps).slice(0, 127),
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
              ...(pages.lang ? { locale: PAYPAL_LOCALE[pages.lang] } : {}),
              // PayPal appends ?token=<order id>&PayerID=… to both.
              return_url: `${origin}/api/checkout/paypal/return?funnel=${f.slug}${pages.lang ? `&lang=${pages.lang}` : ""}`,
              cancel_url: `${origin}${pages.orderPage}`,
            },
          },
        },
      },
    });
    const approve = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve");
    if (!approve) throw new Error(`PayPal order ${order.id} came back without an approval link`);
    // What it sells, for the download and the thank-you page (lib/orders.ts).
    await notePayPalOrder({ id: order.id, funnel: f.slug, amountCents: amount, currency, items: ["pack", ...bumps.map((b) => b.id), ...(bonus.item ? [bonus.item.id] : [])] });
    return NextResponse.json({ orderId: order.id, approveUrl: approve.href });
  } catch (err) {
    console.error("paypal order failed", err);
    return NextResponse.json(
      { error: "We couldn't start the PayPal payment. Please try again." },
      { status: 502 },
    );
  }
}
