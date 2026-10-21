"use client";

import { useMemo, useState } from "react";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { cookieCountry, type Currency } from "@/lib/geo";
import { track } from "@/lib/beacon";
import { AB, readVariant } from "./abtest";
import { pixel } from "../jazz-midi-pack/Tracking";
import { Rich } from "../top-hits-midi-bundle/Rich";
import s from "../top-hits-midi-bundle/order.module.css";
import d from "./order.module.css";
import { copyFor, type Copy } from "./copy";
import { funnel } from "./funnel";
import { money as fmt, paths, type Lang } from "./i18n";

// The ClickFunnels order form of /spot-available-midi-drum-kit-ad-15m30 (the
// same template as TOP HITS' ../top-hits-midi-bundle/OrderForm.tsx), step for
// step, in the page's language (words in ./copy, `form`):
//   1 · Your Info → first, last, email (saved as a lead), "GO TO STEP 2"
//   2 · Payment   → product card, Card | Paypal, three tick-box offers,
//                   Summary, "Rush My Order!"
// Card fields are Stripe's (numbers never touch our server); PayPal sends the
// buyer to PayPal and back (/api/checkout/paypal → /api/checkout/paypal/return).
// Prices shown here are only a preview: the server prices the order itself.

const PAYPAL_ON = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

type Method = "card" | "paypal";
type Info = { firstName: string; lastName: string; email: string };
// afterOrder: the page after paying (the first upsell, or the thank-you page);
// keepCard: the card is kept for the one-click upsells (Stripe setup_future_usage,
// which the intent route sets too: both must say the same).
type Props = { lang: Lang; currency: Currency; country: string; publishableKey: string | null; afterOrder: string; keepCard: boolean };

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function stripeFor(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
}

// Light fields like the ClickFunnels form.
const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#0a0a0a",
    colorText: "#384751",
    colorDanger: "#dc2626",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: "4px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #dcdcdc", boxShadow: "none", padding: "13px" },
    ".Input:focus": { border: "1px solid #0a0a0a", boxShadow: "none" },
  },
};


export function OrderForm({ lang, currency, country, publishableKey, afterOrder, keepCard }: Props) {
  const t = copyFor(lang, currency).form;
  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState<Info>({ firstName: "", lastName: "", email: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [method, setMethod] = useState<Method>("card");
  const price = funnel.price[currency];
  const total = price + funnel.bumps.filter((b) => picked.includes(b.id)).reduce((n, b) => n + b.price[currency], 0);
  const stripePromise = useMemo(() => (publishableKey ? stripeFor(publishableKey) : null), [publishableKey]);
  const state: PayState = { lang, t, currency, country, info, method, picked, setPicked, total, afterOrder };

  return (
    <div className={s.form}>
      {step === 1 ? (
        <>
          <ol className={s.steps}>
            <li className={s.stepOn}>
              <span className={s.stepNum}>1</span>
              <span>
                <span className={s.stepTitle}>{t.step1}</span>
                <span className={s.stepSub}>{t.step1Sub}</span>
              </span>
            </li>
            <li>
              <span className={s.stepNum}>2</span>
              <span>
                <span className={s.stepTitle}>{t.step2}</span>
                <span className={s.stepSub}>{t.step2Sub}</span>
              </span>
            </li>
          </ol>
          <InfoStep
            t={t}
            info={info}
            onDone={(next) => {
              setInfo(next);
              setStep(2);
              window.scrollTo({ top: document.getElementById("complete-order")?.offsetTop ?? 0, behavior: "smooth" });
              pixel("InitiateCheckout", { content_name: funnel.product, value: price, currency: currency.toUpperCase(), ab_btn: readVariant() });
              track({ funnel: funnel.slug, page: "checkout", lang, abCookie: AB.cookie });
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
            {t.back}
          </button>

          <label className={s.product}>
            <input type="radio" checked readOnly className={s.radio} />
            <span className={s.productText}>
              <span className={s.productName}>{funnel.orderName}</span>
            </span>
            <span className={s.productPrice}>{fmt(price, currency, lang)}</span>
          </label>

          <p className={s.label}>
            <span>{t.paymentInfo}</span>
          </p>
          <div className={s.methods} role="radiogroup" aria-label={t.paymentMethod}>
            <button
              type="button"
              role="radio"
              aria-checked={method === "card"}
              className={`${s.method} ${method === "card" ? s.methodOn : ""}`}
              onClick={() => setMethod("card")}
            >
              <CardGlyph /> {t.card}
            </button>
            {PAYPAL_ON && (
              <button
                type="button"
                role="radio"
                aria-checked={method === "paypal"}
                className={`${s.method} ${method === "paypal" ? s.methodOn : ""}`}
                onClick={() => setMethod("paypal")}
              >
                <PayPalGlyph /> {t.paypal}
              </button>
            )}
          </div>

          {stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                mode: "payment",
                amount: Math.round(total * 100),
                currency,
                appearance,
                allowedPaymentMethodTypes: ["card"],
                locale: lang,
                ...(keepCard ? { setupFutureUsage: "off_session" as const } : {}),
              }}
            >
              <CardPay {...state} />
            </Elements>
          ) : (
            <>
              {method === "card" && <div className={s.notConnected}>{t.notConnected}</div>}
              <PayBody {...state} cardOff />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InfoStep({ t, info, onDone }: { t: Copy["form"]; info: Info; onDone: (info: Info) => void }) {
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
        <input name="firstName" placeholder={t.firstName} autoComplete="given-name" defaultValue={info.firstName} required className={s.input} />
        <input name="lastName" placeholder={t.lastName} autoComplete="family-name" defaultValue={info.lastName} className={s.input} />
        <input
          name="email"
          type="email"
          placeholder={t.email}
          autoComplete="email"
          inputMode="email"
          defaultValue={info.email}
          required
          className={`${s.input} ${s.wide}`}
        />
      </div>
      <button className={`${s.orange} ${d.cta}`}>
        <svg viewBox="0 0 448 512" className={s.orangeArrow} aria-hidden>
          <path
            fill="currentColor"
            d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"
          />
        </svg>
        {t.next}
      </button>
      <p className={s.respect}>{t.respect}</p>
    </form>
  );
}

type PayState = {
  lang: Lang;
  afterOrder: string;
  t: Copy["form"];
  currency: Currency;
  country: string;
  info: Info;
  method: Method;
  picked: string[];
  setPicked: (ids: string[]) => void;
  total: number;
};

function CardPay(props: PayState) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const europe = props.currency === "eur";

  async function confirm() {
    if (!stripe || !elements) return;
    const res = await fetch("/api/checkout/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        funnel: funnel.slug,
        ...props.info,
        bumps: props.picked,
        variant: readVariant(),
        lang: props.lang,
        waiver: europe,
        country: cookieCountry(props.currency, props.country),
        expected: props.total,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.clientSecret) throw new Error(json.error ?? props.t.paymentFailed);
    const name = `${props.info.firstName} ${props.info.lastName}`.trim();
    const { error: payError } = await stripe.confirmPayment({
      elements,
      clientSecret: json.clientSecret,
      confirmParams: {
        return_url: new URL(props.afterOrder, window.location.origin).toString(),
        // The card form doesn't ask for the country (fields below): Stripe needs
        // it here instead, so it's the one we already know from the visit.
        payment_method_data: {
          billing_details: { name, email: props.info.email, address: { country: cookieCountry(props.currency, props.country) } },
        },
      },
    });
    if (payError) throw new Error(payError.message);
  }

  async function payByCard() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);
      await confirm();
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  return (
    <>
      {/* Hidden, not unmounted, on the Paypal tab: switching back keeps what was typed. */}
      <div hidden={props.method !== "card"} className={s.cardPane}>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 48,
            buttonType: { applePay: "buy", googlePay: "buy" },
            paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
          }}
          onReady={(e) => setHasWallet(Boolean(e.availablePaymentMethods))}
          onConfirm={async (e) => {
            setError(null);
            try {
              await confirm();
            } catch (err) {
              setError((err as Error).message);
              e.paymentFailed({ reason: "fail" });
            }
          }}
        />
        {hasWallet && (
          <div className={s.orCard}>
            <span>{props.t.orCard}</span>
          </div>
        )}
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "never", googlePay: "never", link: "never" },
            // No country picker: one field less to fill in ("crea friction inutile").
            // The postal code stays where Stripe asks for it (US, UK, Canada cards).
            fields: { billingDetails: { address: { country: "never" } } },
            defaultValues: {
              billingDetails: { email: props.info.email, name: `${props.info.firstName} ${props.info.lastName}`.trim() },
            },
          }}
        />
      </div>
      <PayBody {...props} onCard={payByCard} cardPaying={paying || !stripe} cardError={error} />
    </>
  );
}

function PayBody({
  lang,
  t,
  currency,
  country,
  info,
  method,
  picked,
  setPicked,
  total,
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
  const europe = currency === "eur";

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
          variant: readVariant(),
          waiver: europe,
          country: cookieCountry(currency, country),
          origin: window.location.origin,
          lang,
          expected: total,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.approveUrl) throw new Error(json.error ?? t.paypalFailed);
      window.location.assign(json.approveUrl);
    } catch (err) {
      setPaypalError((err as Error).message);
      setPaypalBusy(false);
    }
  }

  const toggle = (id: string, on: boolean) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id));
  const chosen = funnel.bumps.filter((b) => picked.includes(b.id));

  return (
    <>
      {paypal && (
        <div className={s.paypalNote}>
          <PayPalGlyph /> {t.paypalNote}
        </div>
      )}

      {funnel.bumps.map((b) => {
        const on = picked.includes(b.id);
        return (
          <label key={b.id} className={`${s.bump} ${on ? s.bumpOn : ""}`}>
            <span className={`${s.bumpHead} ${d.bumpHead}`}>
              <span className={`${s.bumpArrow} ${d.bumpArrow}`} aria-hidden>
                <svg viewBox="0 0 448 512" width="14" height="14">
                  <path
                    fill="currentColor"
                    d="M313.9 216H12c-6.6 0-12 5.4-12 12v56c0 6.6 5.4 12 12 12h301.9v46.1c0 21.4 25.9 32.1 41 17L441 273c9.4-9.4 9.4-24.6 0-33.9L354.9 153c-15.1-15.1-41-4.4-41 17V216z"
                  />
                </svg>
              </span>
              <input type="checkbox" checked={on} onChange={(e) => toggle(b.id, e.target.checked)} className={s.bumpCheck} />
              <span className={s.bumpTitle}>{t.bumps[b.id].headline}</span>
              <span className={s.bumpPrice}>{fmt(b.price[currency], currency, lang)}</span>
            </span>
            <span className={s.bumpBody}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt="" className={s.bumpImg} width={80} height={80} />
              <span className={s.bumpText}>
                {t.bumps[b.id].body.map((p, i) => (
                  <span key={i} className={s.bumpPara}>
                    {i === 0 && <span className={s.oto}>{t.oto}</span>} <Rich text={p} currency={currency} />
                  </span>
                ))}
              </span>
            </span>
          </label>
        );
      })}

      <details className={s.summary}>
        <summary>
          <span className={s.sumLeft}>
            <BasketGlyph /> {t.summary}
          </span>
          <span className={s.sumRight}>
            {fmt(total, currency, lang)}
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
            <span>{funnel.orderName}</span>
            <span>{fmt(funnel.price[currency], currency, lang)}</span>
          </div>
          {chosen.map((b) => (
            <div key={b.id} className={s.sumRow}>
              <span>{b.name}</span>
              <span>{fmt(b.price[currency], currency, lang)}</span>
            </div>
          ))}
          <div className={`${s.sumRow} ${s.sumTotal}`}>
            <span>{t.total}</span>
            <span>{fmt(total, currency, lang)}</span>
          </div>
        </div>
      </details>

      <button type="button" className={`${s.orange} ${s.rush} ${d.cta}`} disabled={blocked} onClick={() => (paypal ? payWithPayPal() : onCard?.())}>
        {busy && !cardOff ? (paypal ? t.openingPaypal : t.processing) : t.pay}
      </button>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <p className={s.respect}>{t.respect}</p>
      {europe && (
        <p className={s.waiver}>
          {t.waiver}
        </p>
      )}
    </>
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
