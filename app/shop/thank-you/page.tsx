import type { Metadata } from "next";
import { after } from "next/server";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { KitPurchasePixel } from "@/app/(funnels)/_kit/KitTracking";
import { Beacon } from "@/app/(funnels)/Beacon";
import { Clarity } from "@/app/(funnels)/Clarity";
import b from "@/app/(funnels)/jazz-midi-pack/btn.module.css";
import { reportSaleToNeo } from "@/lib/neo";
import { getOrder } from "@/lib/orders";
import { noteSale } from "@/lib/sales";
import { SHOP_SLUG, orderTitle, shopLabels, type ShopLabel } from "@/lib/shop";
import { ShopFrame } from "../ShopFrame";
import { ClearCart } from "../ShopClient";
import s from "../shop.module.css";

// After a shop order: Stripe sends the buyer here with ?payment_intent=pi_…,
// the PayPal return with ?paypal_order=…; we ask the provider whether it
// paid, the URL alone proves nothing. One download per product.

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Thank you · ${BRAND.name}`, robots: { index: false, follow: false } };

export default async function ShopThankYou({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string }>;
}) {
  const { payment_intent, paypal_order } = await searchParams;
  const order = await getOrder(payment_intent ?? paypal_order, SHOP_SLUG);
  const labels: Record<string, ShopLabel> = order ? await shopLabels(order.items).catch(() => ({})) : {};
  const title = order ? orderTitle(order.items, labels) : "";
  // The sale also goes to neo, labelled funnnnels (lib/neo.ts), and into the orders.
  if (order) reportSaleToNeo(order, title);
  if (order) after(() => noteSale(order, SHOP_SLUG, "en"));
  const paid = order?.status === "succeeded";
  const pending = order?.status === "processing";

  return (
    <ShopFrame>
      <Beacon funnel={SHOP_SLUG} page="thank-you" />
      <Clarity purchase={paid && !!order} />
      {paid && order && <KitPurchasePixel product={title} orderId={order.id} value={order.amount} currency={order.currency} />}
      {paid && order && <ClearCart slugs={order.items} />}
      <section className={`${s.wrap} ${s.thanks}`}>
        <p className={s.eyebrow}>{paid ? "Order complete" : "Your order"}</p>
        <h1 className={s.title}>
          {paid ? (
            <>
              You&rsquo;re in. <em>Go write.</em>
            </>
          ) : pending ? (
            <>
              Payment <em>processing.</em>
            </>
          ) : (
            <>
              Payment <em>not completed.</em>
            </>
          )}
        </h1>
        <p className={s.intro}>
          {paid
            ? "Payment received. Your files are below. Bookmark this page: the buttons keep working when you come back."
            : pending
              ? "Your bank is still confirming the payment. Refresh this page in a minute and your downloads will appear."
              : "Nothing was charged. Go back to your cart and try again with another card or PayPal."}
        </p>
        {paid && order && (
          <div className={s.downloads}>
            {order.items.map((slug, i) => (
              <a key={slug} href={`/shop/download?order=${encodeURIComponent(order.id)}&file=${slug}`} className={i === 0 ? `${b.btn} ${b.full}` : s.ghost}>
                {i === 0 && <span className={b.shine} aria-hidden />}
                <span className={i === 0 ? b.label : undefined}>Download {labels[slug]?.name ?? slug}</span>
                {i === 0 && <span className={b.inner}>.zip</span>}
              </a>
            ))}
          </div>
        )}
        {paid && (
          <p className={s.fine} data-clarity-mask="True">
            {order?.provider === "paypal" ? "PayPal" : "Stripe"} has emailed your receipt
            {order?.email ? ` to ${order.email}` : ""}. A file doesn&rsquo;t open? Email <a href={`mailto:${BRAND.support}`}>{BRAND.support}</a> and we fix it.
          </p>
        )}
        {!paid && !pending && (
          <div className={s.downloads}>
            <a href="/shop/cart" className={`${b.btn} ${b.full}`}>
              <span className={b.shine} aria-hidden />
              <span className={b.label}>Back to my cart</span>
            </a>
          </div>
        )}
      </section>
    </ShopFrame>
  );
}
