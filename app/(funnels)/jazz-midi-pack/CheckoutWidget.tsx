"use client";

import { useMemo, useState } from "react";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import s from "./checkout.module.css";

// The two-step order form, modeled on the ClickFunnels checkout:
//   1 · Your info  → name + email (saved as a lead before any card is asked for)
//   2 · Payment    → product row, card / PayPal / wallets (Stripe), the tick-box
//                    add-on, summary, one big button.
// Stripe's Payment Element draws the card fields, so card numbers never touch
// our server.

type Props = {
  funnel: string;
  product: string;
  tagline: string;
  currency: "eur" | "usd";
  country: string;
  price: number;
  bump: { name: string; price: number; pitch: string };
  thankYou: string;
  publishableKey: string | null;
  europe: boolean;
};

type Info = { firstName: string; lastName: string; email: string };

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function stripeFor(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
}

const appearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#d9a441",
    colorBackground: "#1b1814",
    colorText: "#f1e8d8",
    colorTextSecondary: "#c9bfae",
    colorDanger: "#f08a76",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #3a342b", boxShadow: "none", padding: "14px" },
    ".Input:focus": { border: "1px solid #d9a441", boxShadow: "none" },
    ".Tab": { border: "1px solid #3a342b", boxShadow: "none" },
    ".Tab--selected": { border: "1px solid #d9a441" },
  },
};

export function CheckoutWidget(props: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState<Info>({ firstName: "", lastName: "", email: "" });
  const [bump, setBump] = useState(false);
  const total = props.price + (bump ? props.bump.price : 0);
  const stripePromise = useMemo(
    () => (props.publishableKey ? stripeFor(props.publishableKey) : null),
    [props.publishableKey],
  );

  return (
    <div className={s.widget}>
      <div className={s.secure}>
        <LockGlyph /> Secure checkout
      </div>

      <ol className={s.tabs}>
        <li>
          <button
            type="button"
            className={`${s.tab} ${step === 1 ? s.tabOn : ""}`}
            onClick={() => setStep(1)}
          >
            <span className={s.tabNum}>1</span>
            <span>
              <span className={s.tabTitle}>Your info</span>
              <span className={s.tabSub}>Name &amp; email</span>
            </span>
          </button>
        </li>
        <li>
          <div className={`${s.tab} ${step === 2 ? s.tabOn : ""}`} aria-current={step === 2}>
            <span className={s.tabNum}>2</span>
            <span>
              <span className={s.tabTitle}>Payment</span>
              <span className={s.tabSub}>Payment info</span>
            </span>
          </div>
        </li>
      </ol>

      <div className={s.body}>
        {step === 1 ? (
          <InfoStep
            funnel={props.funnel}
            info={info}
            onDone={(next) => {
              setInfo(next);
              setStep(2);
            }}
          />
        ) : (
          <>
            <button type="button" className={s.back} onClick={() => setStep(1)}>
              ← Go back
            </button>

            <div className={s.productRow}>
              <span className={s.radio} aria-hidden />
              <span className={s.productText}>
                <span className={s.productName}>{props.product}</span>
                <span className={s.productDesc}>{props.tagline}</span>
              </span>
              <span className={s.productPrice}>{money(props.price, props.currency)}</span>
            </div>

            <p className={s.label}>Payment information</p>
            {stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{ mode: "payment", amount: total * 100, currency: props.currency, appearance }}
              >
                <PayStep {...props} info={info} ticked={bump} setTicked={setBump} total={total} />
              </Elements>
            ) : (
              <>
                <div className={s.notConnected}>
                  Card and PayPal payments switch on once the Stripe keys are added.
                </div>
                <PayStepBody
                  {...props}
                  offer={props.bump}
                  ticked={bump}
                  setTicked={setBump}
                  total={total}
                  disabled
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoStep({
  funnel,
  info,
  onDone,
}: {
  funnel: string;
  info: Info;
  onDone: (info: Info) => void;
}) {
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Info;
    // Save the lead in the background: step 2 opens instantly, and a slow or
    // failing database never stands between a buyer and the card form.
    fetch("/api/checkout/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, funnel }),
      keepalive: true,
    }).catch(() => {});
    onDone(data);
  }

  return (
    <form onSubmit={submit} className={s.form}>
      <div className={s.row}>
        <input
          name="firstName"
          placeholder="First name"
          autoComplete="given-name"
          defaultValue={info.firstName}
          required
          className={s.input}
        />
        <input
          name="lastName"
          placeholder="Last name"
          autoComplete="family-name"
          defaultValue={info.lastName}
          className={s.input}
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        inputMode="email"
        defaultValue={info.email}
        required
        className={s.input}
      />
      <button className={s.cta}>
        <span className={s.ctaMain}>Go to step 2</span>
      </button>
      <p className={s.fine}>We respect your privacy. Your download link goes to this email.</p>
    </form>
  );
}

type BodyState = { ticked: boolean; setTicked: (v: boolean) => void; total: number };

function PayStep(props: Props & BodyState & { info: Info }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(waiver: boolean) {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);

      const res = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          funnel: props.funnel,
          ...props.info,
          bump: props.ticked,
          waiver,
          country: props.country,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.clientSecret) throw new Error(json.error ?? "Payment couldn't start.");

      const name = `${props.info.firstName} ${props.info.lastName}`.trim();
      const { error: payError } = await stripe.confirmPayment({
        elements,
        clientSecret: json.clientSecret,
        confirmParams: {
          return_url: new URL(props.thankYou, window.location.origin).toString(),
          payment_method_data: { billing_details: { name, email: props.info.email } },
        },
      });
      // Only reached when the payment fails; success redirects to the thank-you page.
      if (payError) throw new Error(payError.message);
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  return (
    <>
      <PaymentElement
        options={{
          layout: "tabs",
          // Step 1 already asked; don't make the buyer type it twice.
          defaultValues: {
            billingDetails: {
              email: props.info.email,
              name: `${props.info.firstName} ${props.info.lastName}`.trim(),
            },
          },
        }}
      />
      <PayStepBody
        {...props}
        offer={props.bump}
        onPay={pay}
        paying={paying || !stripe}
        error={error}
      />
    </>
  );
}

function PayStepBody({
  currency,
  price,
  product,
  europe,
  offer,
  ticked,
  setTicked,
  total,
  onPay,
  paying,
  disabled,
  error,
}: Pick<Props, "currency" | "price" | "product" | "europe"> &
  BodyState & {
    offer: Props["bump"];
    onPay?: (waiver: boolean) => void;
    paying?: boolean;
    disabled?: boolean;
    error?: string | null;
  }) {
  const [waiver, setWaiver] = useState(false);
  const blocked = disabled || paying || (europe && !waiver);

  return (
    <>
      <label className={`${s.bump} ${ticked ? s.bumpOn : ""}`}>
        <span className={s.bumpHead}>
          <input
            type="checkbox"
            checked={ticked}
            onChange={(e) => setTicked(e.target.checked)}
            className={s.check}
          />
          <span className={s.bumpTitle}>Yes! Add the {offer.name}</span>
          <span className={s.bumpPrice}>+{money(offer.price, currency)}</span>
        </span>
        <span className={s.bumpPitch}>
          <strong>Add-on offer:</strong> {offer.pitch}
        </span>
      </label>

      <div className={s.summary}>
        <div className={s.sumRow}>
          <span>{product}</span>
          <span>{money(price, currency)}</span>
        </div>
        {ticked && (
          <div className={s.sumRow}>
            <span>{offer.name}</span>
            <span>{money(offer.price, currency)}</span>
          </div>
        )}
        <div className={`${s.sumRow} ${s.sumTotal}`}>
          <span>Total</span>
          <span>{money(total, currency)}</span>
        </div>
      </div>

      {europe && (
        <label className={s.waiver}>
          <input
            type="checkbox"
            checked={waiver}
            onChange={(e) => setWaiver(e.target.checked)}
            className={s.check}
          />
          <span>
            I want instant access to the download, and I understand I lose my 14-day right of
            withdrawal once it starts.
          </span>
        </label>
      )}

      <button
        type="button"
        className={s.cta}
        disabled={blocked}
        onClick={() => onPay?.(waiver)}
      >
        <span className={s.ctaMain}>
          {paying && !disabled ? "Processing…" : `Get the pack — ${money(total, currency)}`}
        </span>
        <span className={s.ctaSub}>Instant download · one payment</span>
      </button>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function money(amount: number, currency: "eur" | "usd") {
  return currency === "eur" ? `€${amount}` : `$${amount}`;
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
      <path
        d="M4.5 7V5a3.5 3.5 0 1 1 7 0v2h.5A1 1 0 0 1 13 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm1.5 0h4V5a2 2 0 1 0-4 0z"
        fill="currentColor"
      />
    </svg>
  );
}
