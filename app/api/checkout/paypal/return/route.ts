import { resolveFunnel } from "@/lib/funnels";
import { isPayPalOrderId, paypal, paypalCheckoutUrl, paypalConfigured, PayPalError } from "@/lib/paypal";

export const runtime = "nodejs";

// PayPal sends the buyer here after they approve on PayPal's page:
//   /api/checkout/paypal/return?funnel=jazz-midi-pack&token=<order id>&PayerID=…
// This takes the money, then hands them to the thank-you page, which asks
// PayPal again whether the order paid: nothing here is trusted on its own.
// Capturing is safe to expose: it only works on an order this server created
// and the buyer approved.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const f = await resolveFunnel(url.searchParams.get("funnel"));
  const orderId = url.searchParams.get("token");
  if (!f || !isPayPalOrderId(orderId) || !paypalConfigured()) return redirect(f ? (f.checkout.orderPage ?? `/${f.slug}#buy`) : "/");

  try {
    await paypal(`/v2/checkout/orders/${orderId}/capture`, { method: "POST", body: {} });
  } catch (err) {
    // The buyer's card or bank said no: back to PayPal to pick another source.
    if (err instanceof PayPalError && err.issue === "INSTRUMENT_DECLINED") return redirect(paypalCheckoutUrl(orderId));
    // A reload or a double redirect: the money is already in. Anything else,
    // the thank-you page shows "not completed" with a way back to checkout.
    if (!(err instanceof PayPalError && err.issue === "ORDER_ALREADY_CAPTURED")) {
      console.error("paypal capture failed", err);
    }
  }
  return redirect(`${f.checkout.thankYou}?paypal_order=${orderId}`);
}

// Relative on purpose: the buyer arrived through the brand domain
// (m.thegrind.studio forwards /api/checkout/* here) and stays on it.
function redirect(location: string) {
  return new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });
}
