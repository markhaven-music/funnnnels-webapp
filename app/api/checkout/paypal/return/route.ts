import { checkoutPages, nextStep, offerOf, resolveFunnel } from "@/lib/funnels";
import { after } from "next/server";
import { recordPayPalSale } from "@/lib/analytics";
import { getOrder } from "@/lib/orders";
import { sendSaleToNeo } from "@/lib/neo";
import { noteSale } from "@/lib/sales";
import { saleName } from "@/lib/stripeSales";
import { isPayPalOrderId, paypal, paypalCheckoutUrl, paypalConfigured, PayPalError, type PayPalOrder } from "@/lib/paypal";

export const runtime = "nodejs";

// PayPal sends the buyer here after they approve on PayPal's page:
//   /api/checkout/paypal/return?funnel=jazz-midi-pack&token=<order id>&PayerID=…
// (plus &lang=fr when the buyer paid from a translated page, and for a
// one-click upsell &offer=<id>&paypal_order=<the order it follows>&u=<upsells so far>)
// This takes the money, then hands them to the thank-you page, which asks
// PayPal again whether the order paid: nothing here is trusted on its own.
// Capturing is safe to expose: it only works on an order this server created
// and the buyer approved.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const f = await resolveFunnel(url.searchParams.get("funnel"));
  const orderId = url.searchParams.get("token");
  const pages = f ? checkoutPages(f, url.searchParams.get("lang")) : null;
  if (!f || !pages || !isPayPalOrderId(orderId) || !paypalConfigured()) return redirect(pages ? pages.orderPage : "/");
  const offer = offerOf(f, url.searchParams.get("offer"));
  const parent = url.searchParams.get("paypal_order");

  let captured = false;
  try {
    await paypal(`/v2/checkout/orders/${orderId}/capture`, { method: "POST", body: {} });
    captured = true;
  } catch (err) {
    // The buyer's card or bank said no: back to PayPal to pick another source.
    if (err instanceof PayPalError && err.issue === "INSTRUMENT_DECLINED") return redirect(paypalCheckoutUrl(orderId));
    // A reload or a double redirect: the money is already in. Anything else,
    // the thank-you page shows "not completed" with a way back to checkout.
    if (!(err instanceof PayPalError && err.issue === "ORDER_ALREADY_CAPTURED")) {
      console.error("paypal capture failed", err);
    } else {
      captured = true;
    }
  }
  // PayPal can't list our orders, so dashboard → Analytics counts them from here.
  if (captured) {
    try {
      await recordPayPalSale(await paypal<PayPalOrder>(`/v2/checkout/orders/${orderId}`), pages.lang ?? "en");
    } catch (err) {
      console.error("paypal sale not recorded", err);
    }
    // The order too (the receipt email goes from there), once the buyer is on their way,
    // and neo hears of it now: a buyer who leaves on an upsell never reaches the
    // thank-you page that used to tell it (neo dedupes by order id).
    const lang = pages.lang ?? "en";
    after(async () => {
      const order = await getOrder(orderId, f.slug);
      await noteSale(order, f.slug, lang);
      if (order) await sendSaleToNeo(order, saleName(f, order));
    });
  }
  // Next: the upsells (with the order and what was bought so far), then the thank-you page.
  if (offer && isPayPalOrderId(parent)) {
    const u = (url.searchParams.get("u") ?? "").split(",").filter((id) => isPayPalOrderId(id));
    if (captured) u.push(orderId);
    return redirect(`${nextStep(f, url.searchParams.get("lang"), offer.id)}?paypal_order=${parent}${u.length ? `&u=${u.join(",")}` : ""}`);
  }
  // An upsell the buyer already ticked as an add-on is skipped.
  const owned = captured && f.offers?.length ? ((await getOrder(orderId, f.slug))?.items ?? []) : [];
  return redirect(`${nextStep(f, url.searchParams.get("lang"), null, owned)}?paypal_order=${orderId}`);
}

// Relative on purpose: the buyer arrived through the brand domain
// (m.thegrind.studio forwards /api/checkout/* here) and stays on it.
function redirect(location: string) {
  return new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });
}
