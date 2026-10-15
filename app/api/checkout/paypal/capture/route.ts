import { NextResponse } from "next/server";
import { isPayPalOrderId, paypal, paypalConfigured, PayPalError, type PayPalOrder } from "@/lib/paypal";

export const runtime = "nodejs";

// The buyer approved the order in the PayPal popup; this takes the money.
// Capturing is safe to expose: it only works on an order this server created
// and the buyer approved. Whether the order really paid is checked again by
// the thank-you page and the download, never taken from this response.
export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: "PayPal is not connected yet." }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const orderId = body.orderId;
  if (!isPayPalOrderId(orderId)) return NextResponse.json({ error: "Unknown order" }, { status: 400 });

  try {
    const order = await paypal<PayPalOrder>(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      body: {},
    });
    return NextResponse.json({ orderId: order.id, status: order.status });
  } catch (err) {
    if (err instanceof PayPalError) {
      // A double click or a retried request: the money is already in.
      if (err.issue === "ORDER_ALREADY_CAPTURED") return NextResponse.json({ orderId, status: "COMPLETED" });
      // The buyer's card or bank said no: PayPal lets them pick another source.
      if (err.issue === "INSTRUMENT_DECLINED") return NextResponse.json({ restart: true });
    }
    console.error("paypal capture failed", err);
    return NextResponse.json(
      { error: "PayPal couldn't complete the payment. Nothing was charged." },
      { status: 502 },
    );
  }
}
