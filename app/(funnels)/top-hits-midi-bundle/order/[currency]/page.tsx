import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { fill, wordsFor } from "@/lib/words";
import { reviews } from "../../copy";
import { funnel } from "../../funnel";
import { fontVars } from "../../fonts";
import { orderOffer } from "../../offer";
import { OrderForm } from "../../OrderForm";
import { ReservedTimer } from "../../ReservedTimer";
import { Check } from "../../sections";
import { Tracking } from "../../Tracking";
import { Beacon } from "../../../Beacon";
import { B } from "../../Lines";
import { ORDER } from "../../words";
import s from "../../order.module.css";

// The order page, a copy of ClickFunnels' /order-top-hits-midi-bundle.
// Cached per currency like the landing (proxy.ts rewrites /top-hits-midi-bundle/order).
// Words in ../../words.ts ORDER, with the dashboard's edits (funnel map → Edit).

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
  // What it sells, as dashboard → Products has it (../../offer.ts); saving there revalidates the page.
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const w = await wordsFor(funnel.slug, "order", ORDER, { strict: true });
  const offer = await orderOffer(currency, product, w.bumps);

  return (
    <main className={`${s.page} ${fontVars}`}>
      <Tracking value={offer.price} currency={currency} event={null} />
      <Beacon funnel={funnel.slug} page="order" />
      <div className={s.redbar}>
        <B text={w.redbar} />
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
        {w.secure}
      </div>

      <div className={s.cols}>
        <section className={s.summaryCol}>
          <h2 className={s.colTitle}>{w.summaryTitle}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.productImg}
            src={`${IMG}/product.webp`}
            alt="TOP HITS MIDI Bundle: 1000 chord progressions"
            width={944}
            height={1172}
            fetchPriority="high"
          />
          <p className={s.dl}>{w.dl}</p>
          <ul className={s.list}>
            {w.bullets.map((b, i) => (
              <li key={i}>
                <Check />
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section id="complete-order">
          <h2 className={s.colTitle}>{w.completeTitle}</h2>
          <OrderForm
            currency={currency}
            country={FALLBACK_COUNTRY[currency]}
            publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null}
            afterOrder={nextStep(product, "en", null)}
            upsell={product.offers?.[0]?.id ?? null}
            offer={offer}
            words={w.form}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.paylogos} src={`${IMG}/payment-logos.webp`} alt="PayPal, Visa, Mastercard, American Express, Discover" width={190} height={22} />
        </section>
      </div>

      <section className={s.reviews}>
        <div className={s.reviewGrid}>
          {w.reviews.map((r, i) => (
            <figure key={i} className={s.review}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.stars} src={`${IMG}/stars.png`} alt="5 stars" width={300} height={99} />
              <blockquote className={s.quote}>&quot;{r.quote}&quot;</blockquote>
              <figcaption className={s.who}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/icon-${reviews[i]?.icon ?? "instagram"}.png`} alt="" width={50} height={50} />
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
            <img src="/funnels/midi-drum-kit/badge-quality-sm.webp" alt="14-day quality guarantee" width={86} height={86} />
            <div>
              <h3>{w.guarantee.title}</h3>
              <p>{fill(w.guarantee.text, { email: funnel.support, days: funnel.guaranteeDays })}</p>
            </div>
          </div>
          <div className={s.g}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/badge-secure.png`} alt="Secure payments" width={86} height={86} />
            <div>
              <h3>{w.payments.title}</h3>
              <p>{w.payments.text}</p>
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
