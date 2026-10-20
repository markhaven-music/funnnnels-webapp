import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { resolveFunnel } from "@/lib/funnels";
import { getOrder } from "@/lib/orders";
import { KitPurchasePixel } from "../../_kit/KitTracking";
import { Beacon } from "../../Beacon";
import { BRAND } from "../../_kit/brand";
import s from "../../jazz-midi-pack/jazz.module.css";
import b from "../../jazz-midi-pack/btn.module.css";

// Thank-you page of a launch-kit product: the template twin of
// jazz-midi-pack/thank-you. Stripe sends the buyer here with
// ?payment_intent=pi_…, the PayPal return with ?paypal_order=…; we ask the
// provider whether it paid, the URL alone proves nothing.

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

export default async function KitThankYou({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string }>;
}) {
  const { slug } = await params;
  const f = await resolveFunnel(slug);
  if (!f || f.kind !== "kit") notFound();
  const { payment_intent, paypal_order } = await searchParams;
  const order = await getOrder(payment_intent ?? paypal_order, f.slug);
  const paid = order?.status === "succeeded";
  const pending = order?.status === "processing";
  const labels: Record<string, string> = { pack: f.product, ...(f.bump ? { [f.bump.id]: f.bump.name } : {}) };

  return (
    <main className={`${s.page} ${serif.variable}`}>
      <Beacon funnel={f.slug} page="thank-you" />
      {paid && order && <KitPurchasePixel product={f.product} orderId={order.id} value={order.amount} currency={order.currency} />}
      <section className={s.hero}>
        <div className={s.heroBg} aria-hidden />
        <header className={`${s.wrap} ${s.topbar}`}>
          <span className={s.logo}>
            GRIND <span className={s.dia}>◆</span> STUDIO
          </span>
        </header>
        <div className={`${s.wrap} ${s.col} ${s.thanks}`} style={{ position: "relative" }}>
          <p className={s.eyebrow}>{f.product}</p>
          <h1 className={s.display}>
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
          <p className={s.lead}>
            {paid
              ? "Payment received. Your files are below. Bookmark this page: the buttons keep working when you come back."
              : pending
                ? "Your bank is still confirming the payment. Refresh this page in a minute and your downloads will appear."
                : "Nothing was charged. Go back and try again with another card or PayPal."}
          </p>
          {paid && order && (
            <div className={s.thanksActions}>
              {order.items.map((key) => (
                <a key={key} href={`/${f.slug}/download?order=${order.id}&file=${key}`} className={key === "pack" ? b.btn : s.ghostBtn}>
                  {key === "pack" && <span className={b.shine} aria-hidden />}
                  <span className={key === "pack" ? b.label : undefined}>Download {labels[key] ?? key}</span>
                  {key === "pack" && <span className={b.inner}>.zip</span>}
                </a>
              ))}
            </div>
          )}
          {paid && (
            <p className={s.sub}>
              {order?.provider === "paypal" ? "PayPal" : "Stripe"} has emailed your receipt
              {order?.email ? ` to ${order.email}` : ""}. A file doesn&rsquo;t open? Email{" "}
              <a href={`mailto:${BRAND.support}`}>{BRAND.support}</a> and we fix it.
            </p>
          )}
          {!paid && !pending && (
            <div className={s.thanksActions}>
              <a href={`/${f.slug}#buy`} className={b.btn}>
                <span className={b.shine} aria-hidden />
                <span className={b.label}>Back to checkout</span>
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
