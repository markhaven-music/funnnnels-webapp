import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { OrderForm } from "../../../top-hits-midi-bundle/OrderForm";
import { ReservedTimer } from "../../../midi-drum-kit/ReservedTimer";
import { copyFor } from "../../../midi-drum-kit/copy";
import { Check } from "../../../top-hits-midi-bundle/sections";
import { Tracking } from "../../../top-hits-midi-bundle/Tracking";
import base from "../../../top-hits-midi-bundle/order.module.css";
import dk from "../../../midi-drum-kit/order.module.css";
import { poppins } from "../../../midi-drum-kit/fonts";
import { Beacon } from "../../../Beacon";
import { withSkin } from "../../../skin";
import { orderBullets, reviews } from "../../copy";
import { funnel } from "../../funnel";
import { fontVars, inter } from "../../fonts";
import { orderOffer } from "../../offer";
import skin from "../../order.module.css";

// The order page, a copy of ClickFunnels' /order-famous-beats-bundle: the
// same ClickFunnels template as TOP HITS', so it's TOP HITS' page and form
// with this bundle's picture, words and checkout, drawn in its landing's look
// (../../order.module.css, a skin over the template's stylesheet).
// Cached per currency like the landing (proxy.ts rewrites /famous-beats-bundle/order).

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };
const IMG = "/funnels/top-hits-midi-bundle";
const OWN = `/funnels/${funnel.slug}`;
const s = withSkin(base, skin);


export const metadata: Metadata = {
  title: "Order Famous Beats Bundle",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // What it sells, as dashboard → Products has it (../../offer.ts); saving there revalidates the page.
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = await orderOffer(currency, product);

  return (
    <main className={`${s.page} ${fontVars} ${inter.variable} ${poppins.variable}`}>
      <Tracking value={offer.price} currency={currency} event={null} product={funnel.product} />
      <Beacon funnel={funnel.slug} page="order" />
      <div className={`${base.redbar} ${skin.dk}`}>
        <b>BLACK FRIDAY:</b> 90% Sale Is Ending Soon
      </div>
      <header className={s.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.logo} src={`${OWN}/logo.webp`} alt="GRIND STUDIO" width={236} height={27} />
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
            src={`${OWN}/product.webp`}
            srcSet={`${OWN}/product-720.webp 720w, ${OWN}/product.webp 944w`}
            sizes="(max-width: 769px) calc(100vw - 30px), 535px"
            alt="Famous Beats Bundle: 32 packs, 320 MIDI transcriptions"
            width={944}
            height={1172}
            fetchPriority="high"
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
          {/* The MIDI Drum Kit order page's form, exactly: no skin, its buttons, its font (../../order.module.css .dk). */}
          <div className={skin.dk}>
            <OrderForm
              currency={currency}
              country={FALLBACK_COUNTRY[currency]}
              publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null}
              afterOrder={nextStep(product, "en", null)}
              upsell={product.offers?.[0]?.id ?? null}
              offer={offer}
              sells={{ slug: funnel.slug, tagline: "", thankYou: funnel.checkout.thankYou }}
              buttons={dk}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.paylogos} src={`${IMG}/payment-logos.webp`} alt="PayPal, Visa, Mastercard, American Express, Discover" width={190} height={22} />
        </section>
      </div>

      <section className={s.reviews}>
        <div className={s.reviewGrid}>
          {reviews.map((r) => (
            <figure key={r.name} className={s.review}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.stars} src={`${IMG}/stars.png`} alt="5 stars" width={300} height={99} loading="lazy" decoding="async" />
              <blockquote className={s.quote}>&quot;{r.quote}&quot;</blockquote>
              <figcaption className={s.who}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/icon-${r.icon}.png`} alt="" width={50} height={50} loading="lazy" decoding="async" />
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
            <img src={`${OWN}/badge-guarantee.webp`} alt="100% money back guarantee" width={86} height={86} loading="lazy" decoding="async" />
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
            <img src={`${OWN}/badge-secure.webp`} alt="Secure payments" width={86} height={86} loading="lazy" decoding="async" />
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
      <ReservedTimer t={copyFor("en").order.timer} />
    </main>
  );
}
