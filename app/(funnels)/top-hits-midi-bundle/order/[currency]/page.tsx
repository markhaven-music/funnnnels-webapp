import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { orderBullets, reviews } from "../../copy";
import { funnel } from "../../funnel";
import { fontVars } from "../../fonts";
import { OrderForm } from "../../OrderForm";
import { ReservedTimer } from "../../ReservedTimer";
import { Check } from "../../sections";
import { Tracking } from "../../Tracking";
import { Beacon } from "../../../Beacon";
import s from "../../order.module.css";

// The order page, a copy of ClickFunnels' /order-top-hits-midi-bundle.
// Cached per currency like the landing (proxy.ts rewrites /top-hits-midi-bundle/order).

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };
const IMG = "/funnels/top-hits-midi-bundle";

export const metadata: Metadata = {
  title: "Order TOP HITS MIDI Bundle",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();

  return (
    <main className={`${s.page} ${fontVars}`}>
      <Tracking value={funnel.price[currency]} currency={currency} event={null} />
      <Beacon funnel={funnel.slug} page="order" />
      <div className={s.redbar}>
        <b>MORE BLACK FRIDAY:</b> 90% Sale Is Ending Soon
      </div>
      <header className={s.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.logo} src={`${IMG}/logo.png`} alt="GRIND STUDIO" width={900} height={103} />
      </header>

      <div className={s.secure}>
        <svg viewBox="0 0 448 512" aria-hidden>
          <path
            fill="currentColor"
            d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"
          />
        </svg>
        Secure Checkout
      </div>

      <div className={s.cols}>
        <section className={s.summaryCol}>
          <h2 className={s.colTitle}>Order Summary:</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.productImg}
            src={`${IMG}/product.webp`}
            alt="TOP HITS MIDI Bundle: 1000 chord progressions"
            width={1856}
            height={2304}
          />
          <p className={s.dl}>Download link will be sent to your email.</p>
          <ul className={s.list}>
            {orderBullets.map((b) => (
              <li key={b}>
                <Check />
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section id="complete-order">
          <h2 className={s.colTitle}>Complete Order:</h2>
          <OrderForm
            currency={currency}
            country={FALLBACK_COUNTRY[currency]}
            publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.paylogos} src={`${IMG}/payment-logos.webp`} alt="PayPal, Visa, Mastercard, American Express, Discover" width={190} height={22} />
        </section>
      </div>

      <section className={s.reviews}>
        <div className={s.reviewGrid}>
          {reviews.map((r) => (
            <figure key={r.name} className={s.review}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.stars} src={`${IMG}/stars.png`} alt="5 stars" width={300} height={99} />
              <blockquote className={s.quote}>&quot;{r.quote}&quot;</blockquote>
              <figcaption className={s.who}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/icon-${r.icon}.png`} alt="" width={50} height={50} />
                <span>
                  <span className={s.name}>{r.name}</span>
                  <span className={s.role}>{r.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={s.guarantee}>
        <div className={s.gGrid}>
          <div className={s.g}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/badge-guarantee.png`} alt="100% money back guarantee" width={86} height={86} />
            <div>
              <h3>Quality Guarantee</h3>
              <p>
                Every pattern in this kit is tested before release. If anything&apos;s wrong with your files, email{" "}
                {funnel.support} within {funnel.guaranteeDays} days and we&apos;ll make it right — a fresh download, a
                replacement, or a refund if we can&apos;t fix it.
              </p>
            </div>
          </div>
          <div className={s.g}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/badge-secure.png`} alt="Secure payments" width={86} height={86} />
            <div>
              <h3>Secure Payments</h3>
              <p>
                Payments are processed through all major credit cards and PayPal with full 256-bit SSL encryption. No
                payment details are ever stored.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        © 2026 {funnel.brand} - <a href={funnel.legal.terms}>Terms and Conditions</a> -{" "}
        <a href={funnel.legal.privacy}>Privacy Policy</a> - <a href={funnel.legal.refund}>Refund Policy</a> -{" "}
        <b>Contact:</b> <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
      </footer>
      <ReservedTimer />
    </main>
  );
}
