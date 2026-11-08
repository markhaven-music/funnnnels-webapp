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
import { fill, wordsFor } from "@/lib/words";
import { ORDER } from "../../words";
import { B } from "../../../top-hits-midi-bundle/Lines";
import { funnel } from "../../funnel";
import { fontVars, inter } from "../../../famous-beats-bundle/fonts";
import { orderOffer } from "../../offer";
import skin from "../../../famous-beats-bundle/order.module.css";

// The order page: the Famous Beats Bundle's (TOP HITS' template with the MIDI Drum
// Kit's form, ../../../famous-beats-bundle/order), with this pack's picture, words,
// add-on and checkout. Reviews: the MIDI Drum Kit's (the user's choice, 2026-11-08).
// Cached per currency like the landing (proxy.ts rewrites /drunk-swing-grooves/order).

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };
const IMG = "/funnels/top-hits-midi-bundle";
const OWN = `/funnels/${funnel.slug}`;
const FB = "/funnels/famous-beats-bundle";
const s = withSkin(base, skin);


export const metadata: Metadata = {
  title: "Order Drunk Swing Grooves",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // What it sells, as dashboard → Products has it (../../offer.ts); saving there revalidates the page.
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  // Its words, with the dashboard's edits (funnel map → Edit).
  const w = await wordsFor(funnel.slug, "order", ORDER, { strict: true });
  const offer = await orderOffer(currency, product, w.bumps);

  return (
    <main className={`${s.page} ${fontVars} ${inter.variable} ${poppins.variable}`}>
      <Tracking value={offer.price} currency={currency} event={null} product={funnel.product} />
      <Beacon funnel={funnel.slug} page="order" />
      <div className={`${base.redbar} ${skin.dk}`}>
        <B text={w.redbar} />
      </div>
      <header className={s.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.logo} src={`${OWN}/logo.webp`} alt="GRIND STUDIO" width={236} height={28} />
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
            src={`${OWN}/pack-square.webp`}
            srcSet={`${OWN}/pack-square-600.webp 600w, ${OWN}/pack-square.webp 900w`}
            sizes="(max-width: 769px) calc(100vw - 30px), 535px"
            alt="The Drunk Swing Grooves box: 80 MIDI drum grooves with the drunk feel"
            width={900}
            height={900}
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
              words={w.form}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.paylogos} src={`${IMG}/payment-logos.webp`} alt="PayPal, Visa, Mastercard, American Express, Discover" width={190} height={22} />
        </section>
      </div>

      {w.reviews.length > 0 && (
      <section className={s.reviews}>
        <div className={s.reviewGrid}>
          {w.reviews.map((r, i) => (
            <figure key={i} className={s.review}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.stars} src={`${IMG}/stars.png`} alt="5 stars" width={300} height={99} loading="lazy" decoding="async" />
              <blockquote className={s.quote}>&quot;{r.quote}&quot;</blockquote>
              <figcaption className={s.who}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/icon-instagram.png`} alt="" width={50} height={50} loading="lazy" decoding="async" />
                <span>
                  <span className={s.name}>{r.name}</span>
                  <span className={s.role}>{r.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      )}

      <section className={s.guarantee}>
        <div className={s.gGrid}>
          <div className={s.g}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/funnels/midi-drum-kit/badge-quality-sm.webp" alt="14-day quality guarantee" width={86} height={86} loading="lazy" decoding="async" />
            <div>
              <h3>{w.guarantee.title}</h3>
              <p>{fill(w.guarantee.text, { email: funnel.support, days: funnel.guaranteeDays })}</p>
            </div>
          </div>
          <div className={s.g}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${FB}/badge-secure.webp`} alt="Secure payments" width={86} height={86} loading="lazy" decoding="async" />
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
      <ReservedTimer t={copyFor("en").order.timer} />
    </main>
  );
}
