import type { Metadata } from "next";
import { getOrder } from "@/lib/orders";
import { funnel } from "../funnel";
import { fontVars } from "../fonts";
import { PurchasePixel } from "../Tracking";
import s from "../order.module.css";
import t from "./thanks.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you · TOP HITS MIDI Bundle",
  robots: { index: false, follow: false },
};

const LABELS: Record<string, string> = {
  pack: funnel.product,
  ...Object.fromEntries(funnel.bumps.map((b) => [b.id, b.name])),
};

// Stripe sends the buyer here with ?payment_intent=pi_…, PayPal's return with
// ?paypal_order=…. We ask the provider whether it paid; the URL proves nothing.
export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string }>;
}) {
  const { payment_intent, paypal_order } = await searchParams;
  const order = await getOrder(payment_intent ?? paypal_order, funnel.slug);
  const paid = order?.status === "succeeded";
  const pending = order?.status === "processing";

  return (
    <main className={`${s.page} ${fontVars}`}>
      {paid && order && <PurchasePixel orderId={order.id} value={order.amount} currency={order.currency} />}
      <header className={s.header} style={{ display: "block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.logo} src="/funnels/top-hits-midi-bundle/logo.png" alt="GRIND STUDIO" width={900} height={103} />
      </header>
      <section className={t.wrap}>
        <h1 className={t.title}>{paid ? "You're in!" : pending ? "Payment processing…" : "Payment not completed"}</h1>
        <p className={t.lead}>
          {paid
            ? "Payment received. Your downloads are below. Bookmark this page: the buttons keep working when you come back."
            : pending
              ? "Your bank is still confirming the payment. Refresh this page in a minute and your downloads will appear."
              : "Nothing was charged. Go back and try again with another card or PayPal."}
        </p>
        {paid && order && (
          <div className={t.list}>
            {order.items.map((key) => (
              <a key={key} className={key === "pack" ? `${s.orange} ${t.btn}` : t.ghost} href={`/${funnel.slug}/download?order=${order.id}&file=${key}`}>
                Download {LABELS[key] ?? key}
              </a>
            ))}
          </div>
        )}
        {paid && (
          <p className={t.note}>
            {order?.provider === "paypal" ? "PayPal" : "Stripe"} has emailed your receipt{order?.email ? ` to ${order.email}` : ""}. A file
            doesn&apos;t open? Email <a href={`mailto:${funnel.support}`}>{funnel.support}</a> and we fix it.
          </p>
        )}
        {!paid && !pending && (
          <a className={`${s.orange} ${t.btn}`} href={funnel.checkout.orderPage}>
            Back to checkout
          </a>
        )}
      </section>
    </main>
  );
}
