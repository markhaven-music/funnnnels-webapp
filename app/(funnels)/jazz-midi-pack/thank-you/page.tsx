import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { funnel } from "../funnel";
import s from "../jazz.module.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif" });

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you — Jazz MIDI Pack",
  robots: { index: false, follow: false },
};

// Stripe sends the buyer here with ?payment_intent=pi_… after paying. We ask
// Stripe directly whether it succeeded; the URL alone proves nothing.
export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { payment_intent: id } = await searchParams;
  let status: string | null = null;
  let email: string | null = null;
  if (id && stripeConfigured() && /^pi_[A-Za-z0-9]+$/.test(id)) {
    try {
      const intent = await stripe().paymentIntents.retrieve(id);
      if (intent.metadata.funnel === funnel.slug) {
        status = intent.status;
        email = intent.receipt_email;
      }
    } catch {
      status = null;
    }
  }

  const paid = status === "succeeded";
  const pending = status === "processing";

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
            ? `Payment received. Your download link is on its way${email ? ` to ${email}` : ""}.`
            : pending
              ? "Your bank is still confirming the payment. We'll email your download link as soon as it clears."
              : "Nothing was charged. You can go back and try again with another card or PayPal."}
        </p>
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
