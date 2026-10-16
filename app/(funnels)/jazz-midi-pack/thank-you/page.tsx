import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { getOrder } from "@/lib/orders";
import { funnel, unlocked } from "../funnel";
import { PurchasePixel } from "../PurchasePixel";
import s from "../jazz.module.css";
import b from "../btn.module.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you · Jazz MIDI Pack",
  robots: { index: false, follow: false },
};

// Bonus names win over the old add-on's: the Chord Pack is bonus 1 now.
const LABELS: Record<string, string> = {
  pack: funnel.product,
  [funnel.bump.id]: funnel.bump.name,
  ...Object.fromEntries(funnel.bonuses.map((x) => [x.id, x.name])),
};
const BONUS = new Set<string>(funnel.bonuses.map((x) => x.id));

// Stripe sends the buyer here with ?payment_intent=pi_… after paying, the
// PayPal button with ?paypal_order=…. We ask the provider directly whether it
// succeeded; the URL alone proves nothing.
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
    <main className={`${s.page} ${serif.variable}`}>
      {paid && order && <PurchasePixel orderId={order.id} value={order.amount} currency={order.currency} />}
      <section className={s.hero}>
        <div className={s.heroBg} aria-hidden />
        <header className={`${s.wrap} ${s.topbar}`}>
          <span className={s.logo}>
            GRIND <span className={s.dia}>◆</span> STUDIO
          </span>
        </header>
        <div className={`${s.wrap} ${s.col} ${s.thanks}`} style={{ position: "relative" }}>
          <p className={s.eyebrow}>{funnel.product}</p>
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
              {unlocked(order.items).map((key) => (
                <a
                  key={key}
                  href={`/${funnel.slug}/download?order=${order.id}&file=${key}`}
                  className={key === "pack" ? b.btn : s.ghostBtn}
                >
                  {key === "pack" && <span className={b.shine} aria-hidden />}
                  <span className={key === "pack" ? b.label : undefined}>
                    Download {BONUS.has(key) && key !== "pack" ? "bonus: " : ""}
                    {LABELS[key] ?? key}
                  </span>
                  {key === "pack" && <span className={b.inner}>.zip · {funnel.counts.files.toLocaleString("en-US")} MIDI files</span>}
                </a>
              ))}
            </div>
          )}
          {paid && (
            <p className={s.sub}>
              Start with folder 01, file 01. {order?.provider === "paypal" ? "PayPal" : "Stripe"} has emailed your receipt
              {order?.email ? ` to ${order.email}` : ""}. A file doesn&rsquo;t open? Email{" "}
              <a href={`mailto:${funnel.support}`}>{funnel.support}</a> and we fix it.
            </p>
          )}
          {!paid && !pending && (
            <div className={s.thanksActions}>
              <a href={`/${funnel.slug}#buy`} className={b.btn}>
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
