"use client";

import { useMemo, useState } from "react";
// "pure": Stripe.js loads when loadStripe is called, not as soon as this file does.
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { cookieCountry, type Currency } from "@/lib/geo";
import { track } from "@/lib/beacon";
import { pixel } from "../jazz-midi-pack/Tracking";
import { CardFields, cardElements, INTER, payWithCard, payWithWallet, Wallet } from "../CardFields";
import type { OrderOffer } from "../midi-drum-kit/offer";
import { funnel } from "./funnel";
import { Rich } from "./Rich";
import s from "./order.module.css";

// The ClickFunnels order form of /order-top-hits-midi-bundle, step for step:
//   1 · Your Info → first, last, email (saved as a lead), "GO TO STEP 2"
//   2 · Payment   → product card, Card | Paypal, three tick-box offers,
//                   Summary, "GET THE PACK!"
// Both buttons are the landing's green one (./order.module.css .cta). Card
// fields are Stripe's, laid out like ClickFunnels' (../CardFields.tsx); PayPal
// sends the buyer to PayPal and back (/api/checkout/paypal → /api/checkout/paypal/return).
// What it sells (`offer`: names, prices, add-ons with their words) comes from
// the server page, as dashboard → Products has it (./offer.ts). Prices shown
// here are only a preview: the server prices the order itself.

const PAYPAL_ON = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

type Method = "card" | "paypal";
type Info = { firstName: string; lastName: string; email: string };
// afterOrder: where Stripe sends the buyer once paid (the upsell, or the
// thank-you page); upsell: that page's offer, skipped when ticked as an add-on.
type Props = { currency: Currency; country: string; publishableKey: string | null; afterOrder: string; upsell: string | null; offer: OrderOffer };

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function stripeFor(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
}

const money = (n: number, c: Currency) => `${c === "eur" ? "€" : "$"}${n.toFixed(2)}`;

export function OrderForm({ currency, country, publishableKey, afterOrder, upsell, offer }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState<Info>({ firstName: "", lastName: "", email: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [method, setMethod] = useState<Method>("card");
  const price = offer.price;
  const total = price + offer.bumps.filter((b) => picked.includes(b.id)).reduce((n, b) => n + b.price, 0);
  // Stripe.js (≈150 KB of script) loads once the buyer starts on the form, not
  // with the page, which kept the order page under 90 on PageSpeed mobile (docs/page-speed.md).
  const [wanted, setWanted] = useState(false);
  const stripePromise = useMemo(() => (publishableKey && wanted ? stripeFor(publishableKey) : null), [publishableKey, wanted]);
  // Paid by card: the upsell, unless its product is already in the order.
  const next = upsell && picked.includes(upsell) ? funnel.checkout.thankYou : afterOrder;
  const state: PayState = { currency, country, info, method, picked, setPicked, total, next, offer };

  return (
    <div className={s.form} onFocusCapture={() => setWanted(true)} onPointerDownCapture={() => setWanted(true)}>
      {step === 1 ? (
        <>
          <ol className={s.steps}>
            <li className={s.stepOn}>
              <span className={s.stepNum}>1</span>
              <span>
                <span className={s.stepTitle}>Your Info</span>
                <span className={s.stepSub}>Name &amp; Email</span>
              </span>
            </li>
            <li>
              <span className={s.stepNum}>2</span>
              <span>
                <span className={s.stepTitle}>Payment</span>
                <span className={s.stepSub}>Payment Info</span>
              </span>
            </li>
          </ol>
          <InfoStep
            info={info}
            onDone={(next) => {
              setInfo(next);
              setWanted(true);
              setStep(2);
              window.scrollTo({ top: document.getElementById("complete-order")?.offsetTop ?? 0, behavior: "smooth" });
              pixel("InitiateCheckout", { content_name: offer.product, value: price, currency: currency.toUpperCase() });
              track({ funnel: funnel.slug, page: "checkout" });
            }}
          />
        </>
      ) : (
        <div className={s.body}>
          <button type="button" className={s.back} onClick={() => setStep(1)}>
            <svg viewBox="0 0 448 512" width="14" height="14" aria-hidden>
              <path
                fill="currentColor"
                d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"
              />
            </svg>
            Go Back
          </button>

          <label className={s.product}>
            <input type="radio" checked readOnly className={s.radio} />
            <span className={s.productText}>
              <span className={s.productName}>{offer.name}</span>
              <span className={s.productDesc}>{funnel.tagline}</span>
            </span>
            <span className={s.productPrice}>{money(price, currency)}</span>
          </label>

          <p className={s.label}>
            <span>PAYMENT INFORMATION</span>
          </p>
          <div className={s.methods} role="radiogroup" aria-label="Payment method">
            <button
              type="button"
              role="radio"
              aria-checked={method === "card"}
              className={`${s.method} ${method === "card" ? s.methodOn : ""}`}
              onClick={() => setMethod("card")}
            >
              <CardGlyph /> Card
            </button>
            {PAYPAL_ON && (
              <button
                type="button"
                role="radio"
                aria-checked={method === "paypal"}
                className={`${s.method} ${method === "paypal" ? s.methodOn : ""}`}
                onClick={() => setMethod("paypal")}
              >
                <PayPalGlyph /> Paypal
              </button>
            )}
          </div>

          {stripePromise ? (
            <Elements stripe={stripePromise} options={cardElements(INTER, "en")}>
              <CardPay {...state} stripePromise={stripePromise} />
            </Elements>
          ) : (
            <>
              {method === "card" && <div className={s.notConnected}>Card payments switch on once the Stripe keys are added.</div>}
              <PayBody {...state} cardOff />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InfoStep({ info, onDone }: { info: Info; onDone: (info: Info) => void }) {
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Info;
    // The lead is saved in the background: step 2 opens at once either way.
    fetch("/api/checkout/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, funnel: funnel.slug }),
      keepalive: true,
    }).catch(() => {});
    onDone(data);
  }
  return (
    <form onSubmit={submit} className={s.body}>
      <div className={s.fields}>
        <input name="firstName" placeholder="First Name" autoComplete="given-name" defaultValue={info.firstName} required className={s.input} />
        <input name="lastName" placeholder="Last Name" autoComplete="family-name" defaultValue={info.lastName} className={s.input} />
        <input
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          defaultValue={info.email}
          required
          className={`${s.input} ${s.wide}`}
        />
      </div>
      <button className={s.cta}>
        <svg viewBox="0 0 448 512" className={s.ctaArrow} aria-hidden>
          <path
            fill="currentColor"
            d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"
          />
        </svg>
        GO TO STEP 2
      </button>
      <p className={s.respect}>We respect your privacy &amp; information.</p>
    </form>
  );
}

type PayState = {
  currency: Currency;
  country: string;
  info: Info;
  method: Method;
  picked: string[];
  setPicked: (ids: string[]) => void;
  total: number;
  next: string;
  offer: OrderOffer;
};

function CardPay({ stripePromise, ...props }: PayState & { stripePromise: ReturnType<typeof loadStripe> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const billing = { name: `${props.info.firstName} ${props.info.lastName}`.trim(), email: props.info.email };

  // The PaymentIntent, at the server's price; its client secret.
  async function intent(): Promise<string> {
    const res = await fetch("/api/checkout/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        funnel: funnel.slug,
        ...props.info,
        bumps: props.picked,
        country: cookieCountry(props.currency, props.country),
        expected: props.total,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.clientSecret) throw new Error(json.error ?? "Payment couldn't start.");
    return json.clientSecret;
  }

  async function payByCard() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    try {
      await payWithCard(stripe, elements, billing, intent, props.next);
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  return (
    <>
      {/* Hidden, not unmounted, on the Paypal tab: switching back keeps what was typed. */}
      <div hidden={props.method !== "card"} className={s.cardPane}>
        <Elements
          stripe={stripePromise}
          options={{ mode: "payment", amount: Math.round(props.total * 100), currency: props.currency, allowedPaymentMethodTypes: ["card"] }}
        >
          <Wallet pay={(st, el) => payWithWallet(st, el, billing, intent, props.next)} onReady={setHasWallet} onError={setError} />
        </Elements>
        {hasWallet && (
          <div className={s.orCard}>
            <span>or pay by card</span>
          </div>
        )}
        <CardFields words={{ number: "Card number", expiry: "MM / YY", cvc: "CVV" }} look={INTER} />
      </div>
      <PayBody {...props} onCard={payByCard} cardPaying={paying || !stripe} cardError={error} />
    </>
  );
}

function PayBody({
  currency,
  country,
  info,
  method,
  picked,
  setPicked,
  total,
  offer,
  onCard,
  cardPaying,
  cardOff,
  cardError,
}: PayState & { onCard?: () => void; cardPaying?: boolean; cardOff?: boolean; cardError?: string | null }) {
  const [paypalBusy, setPaypalBusy] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const paypal = method === "paypal";
  const busy = paypal ? paypalBusy : Boolean(cardPaying);
  const blocked = busy || (!paypal && (cardOff || !onCard));
  const error = paypal ? paypalError : cardError;

  async function payWithPayPal() {
    setPaypalBusy(true);
    setPaypalError(null);
    try {
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          funnel: funnel.slug,
          ...info,
          bumps: picked,
          country: cookieCountry(currency, country),
          origin: window.location.origin,
          expected: total,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.approveUrl) throw new Error(json.error ?? "PayPal couldn't start.");
      window.location.assign(json.approveUrl);
    } catch (err) {
      setPaypalError((err as Error).message);
      setPaypalBusy(false);
    }
  }

  const toggle = (id: string, on: boolean) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id));
  const chosen = offer.bumps.filter((b) => picked.includes(b.id));

  return (
    <>
      {paypal && (
        <div className={s.paypalNote}>
          <PayPalGlyph /> After you click the button, you finish paying on PayPal&rsquo;s secure page, then come straight back to
          your download.
        </div>
      )}

      {offer.bumps.map((b) => {
        const on = picked.includes(b.id);
        return (
          <label key={b.id} className={s.bump}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className={s.bumpImg} width={80} height={80} />
            <span className={s.bumpHead}>
              {/* Gone once ticked, as on ClickFunnels. */}
              {!on && <BumpArrow />}
              <input type="checkbox" checked={on} onChange={(e) => toggle(b.id, e.target.checked)} className={s.bumpCheck} />
              <span className={s.bumpTitle}>{b.headline}</span>
              <span className={s.bumpPrice}>{money(b.price, currency)}</span>
            </span>
            <span className={s.bumpText}>
              {b.body.map((p, i) => (
                <span key={i} className={s.bumpPara}>
                  {i === 0 && <span className={s.oto}>ONE-TIME OFFER:</span>} <Rich text={p} currency={currency} />
                </span>
              ))}
            </span>
          </label>
        );
      })}

      <details className={s.summary}>
        <summary>
          <span className={s.sumLeft}>
            <BasketGlyph /> Summary
          </span>
          <span className={s.sumRight}>
            {money(total, currency)}
            <svg viewBox="0 0 448 512" width="12" height="12" aria-hidden className={s.chev}>
              <path
                fill="currentColor"
                d="M207 381.5L12.7 187.1c-9.4-9.4-9.4-24.6 0-33.9l22.7-22.7c9.4-9.4 24.5-9.4 33.9 0L224 284.5l154.7-154c9.4-9.3 24.5-9.3 33.9 0l22.7 22.7c9.4 9.4 9.4 24.6 0 33.9L241 381.5c-9.4 9.4-24.6 9.4-33.9 0z"
              />
            </svg>
          </span>
        </summary>
        <div className={s.sumBody}>
          <div className={s.sumRow}>
            <span>{offer.name}</span>
            <span>{money(offer.price, currency)}</span>
          </div>
          {chosen.map((b) => (
            <div key={b.id} className={s.sumRow}>
              <span>{b.name}</span>
              <span>{money(b.price, currency)}</span>
            </div>
          ))}
          <div className={`${s.sumRow} ${s.sumTotal}`}>
            <span>Total</span>
            <span>{money(total, currency)}</span>
          </div>
        </div>
      </details>

      <button type="button" className={s.cta} disabled={blocked} onClick={() => (paypal ? payWithPayPal() : onCard?.())}>
        {busy && !cardOff ? (
          paypal ? "Opening PayPal…" : "Processing…"
        ) : (
          <>
            <svg viewBox="0 0 448 512" className={s.ctaArrow} aria-hidden>
              <path
                fill="currentColor"
                d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"
              />
            </svg>
            GET THE PACK!
            <span className={s.ctaSub}>Get Instant Access</span>
          </>
        )}
      </button>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <p className={s.respect}>We respect your privacy &amp; information.</p>
    </>
  );
}

// ClickFunnels' red arrow: Font Awesome's long-arrow-alt-right at 16px, wobbling.
function BumpArrow() {
  return (
    <svg viewBox="0 0 448 512" className={s.bumpArrow} aria-hidden>
      <path
        fill="currentColor"
        d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"
      />
    </svg>
  );
}

function CardGlyph() {
  return (
    <svg viewBox="0 0 20 16" width="16" height="13" aria-hidden>
      <rect x="1" y="1" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="1" y="4.5" width="18" height="3" fill="currentColor" />
      <rect x="4" y="10.5" width="5" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function PayPalGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path
        fill="#179bd7"
        d="M20.07 7.62c.02-.13.02-.27.02-.4C19.86 4 17.4 3 14.27 3H8.4c-.42 0-.78.3-.85.72L5.12 19.14c-.05.3.18.57.48.57h3.6l-.25 1.57c-.04.26.16.5.43.5h3.04c.37 0 .68-.27.74-.63l.03-.16.59-3.72.04-.2c.06-.37.37-.64.74-.64h.47c3.03 0 5.4-1.23 6.09-4.79.29-1.49.14-2.73-.63-3.6a3 3 0 0 0-.42-.42z"
      />
      <path
        fill="#253b80"
        d="M19.06 7.87c-.1-.06-.21-.11-.33-.15l-.4-.1-.42-.08a10.7 10.7 0 0 0-1.66-.12h-5.03a.8.8 0 0 0-.79.68l-1.07 6.79-.03.2c.07-.45.45-.78.9-.78h1.89c3.7 0 6.6-1.5 7.45-5.86l.07-.37a4.6 4.6 0 0 0-.58-.21zM10.43 7.4a.8.8 0 0 1 .79-.68h5.03c.6 0 1.15.04 1.66.12a7.9 7.9 0 0 1 1.15.28c.25.08.48.18.7.3.25-1.6 0-2.7-.87-3.7C17.94 2.63 16.2 2.1 13.96 2.1H7.48c-.46 0-.85.33-.92.78L3.86 19.98c-.05.34.21.65.55.65h4l1-6.36 1.02-6.87z"
      />
    </svg>
  );
}

function BasketGlyph() {
  return (
    <svg viewBox="0 0 576 512" width="15" height="13" aria-hidden>
      <path
        fill="currentColor"
        d="M576 216v16c0 13.3-10.7 24-24 24h-8l-26.1 182.8C514.5 462.5 494.2 480 470.3 480H105.7c-23.9 0-44.2-17.5-47.5-41.2L32 256h-8c-13.3 0-24-10.7-24-24v-16c0-13.3 10.7-24 24-24h67.3l106.8-146.8c10.4-14.3 30.4-17.5 44.7-7.1 14.3 10.4 17.5 30.4 7.1 44.7L170.4 192h235.2L326.1 82.8c-10.4-14.3-7.2-34.3 7.1-44.7 14.3-10.4 34.3-7.2 44.7 7.1L484.7 192H552c13.3 0 24 10.7 24 24z"
      />
    </svg>
  );
}
