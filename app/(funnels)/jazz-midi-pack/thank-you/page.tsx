import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { getOrder } from "@/lib/orders";
import { funnel } from "../funnel";
import s from "../jazz.module.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you — Jazz MIDI Pack",
  robots: { index: false, follow: false },
};

const LABELS: Record<string, string> = {
  pack: funnel.product,
  [funnel.bump.id]: funnel.bump.name,
};

// Stripe sends the buyer here with ?payment_intent=pi_… after paying. We ask
// Stripe directly whether it succeeded; the URL alone proves nothing.
export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { payment_intent } = await searchParams;
  const order = await getOrder(payment_intent, funnel.slug);
  const paid = order?.status === "succeeded";
  const pending = order?.status === "processing";

  return (
    <main className={`${s.page} ${serif.variable}`}>
      <header className={s.hero}>
        <p className={s.eyebrow}>{funnel.product}</p>
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
        <p className={s.lede}>
          {paid
            ? "Payment received. Your files are below. Bookmark this page: the buttons keep working whenever you come back."
            : pending
              ? "Your bank is still confirming the payment. Refresh this page in a minute and your downloads will appear."
              : "Nothing was charged. You can go back and try again with another card or PayPal."}
        </p>
        {paid && order && (
          <div className={s.heroActions}>
            {order.items.map((key) => (
              <a
                key={key}
                href={`/${funnel.slug}/download?order=${order.id}&file=${key}`}
                className={key === "pack" ? s.primary : s.ghost}
              >
                Download {LABELS[key] ?? key}
              </a>
            ))}
          </div>
        )}
        {paid && order?.email && (
          <p className={s.note} style={{ marginTop: 20 }}>
            Stripe has emailed your receipt to {order.email}.
          </p>
        )}
        {!paid && !pending && (
          <div className={s.heroActions}>
            <a href={`/${funnel.slug}#buy`} className={s.primary}>
              Back to checkout
            </a>
          </div>
        )}
      </header>
    </main>
  );
}
