"use client";

import { useMemo, useState } from "react";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import s from "./checkout.module.css";
import b from "./btn.module.css";
import { Arrow } from "./Cta";
import { pixel } from "./Tracking";

// The two-step order form, copied from the ClickFunnels checkout:
//   1 · Your info  → name + email (saved as a lead before any card is asked for)
//   2 · Payment    → the product box, Card | PayPal tabs, the yellow order bump,
//                    summary, one big button.
// Card: Stripe's Payment Element draws the fields, so card numbers never touch
// our server. PayPal: the big button sends the buyer to PayPal's own page and
// back (/api/checkout/paypal → PayPal → /api/checkout/paypal/return), the way
// ClickFunnels does it. PayPal runs beside Stripe, not through it (lib/paypal.ts).

// Set when the PayPal keys are; the server holds the secret.
const PAYPAL_ON = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

type Method = "card" | "paypal";

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
  const [method, setMethod] = useState<Method>("card");
  const total = props.price + (bump ? props.bump.price : 0);
  const stripePromise = useMemo(
    () => (props.publishableKey ? stripeFor(props.publishableKey) : null),
    [props.publishableKey],
  );
  const body = { ...props, info, method, ticked: bump, setTicked: setBump, total };

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
              pixel("InitiateCheckout", {
                content_name: props.product,
                value: props.price,
                currency: props.currency.toUpperCase(),
              });
            }}
          />
        ) : (
          <>
            <button type="button" className={s.back} onClick={() => setStep(1)}>
              ← Go back
            </button>

            <div className={s.orderBox}>
              <span className={s.orderTag}>Instant download</span>
              <span className={s.orderName}>{props.product}</span>
              <span className={s.orderDesc}>{props.tagline}</span>
              <span className={s.orderPrice}>{money(props.price, props.currency)} · one payment</span>
            </div>

            <p className={s.label}>
              <span>Payment information</span>
            </p>
            {PAYPAL_ON && <MethodTabs method={method} setMethod={setMethod} />}

            {stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{ mode: "payment", amount: total * 100, currency: props.currency, appearance }}
              >
                <PayStep {...body} />
              </Elements>
            ) : (
              <>
                {method === "card" && (
                  <div className={s.notConnected}>Card payments switch on once the Stripe keys are added.</div>
                )}
                <PayStepBody {...body} offer={props.bump} cardOff />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MethodTabs({ method, setMethod }: { method: Method; setMethod: (m: Method) => void }) {
  return (
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
      <button
        type="button"
        role="radio"
        aria-checked={method === "paypal"}
        className={`${s.method} ${method === "paypal" ? s.methodOn : ""}`}
        onClick={() => setMethod("paypal")}
      >
        <PayPalGlyph /> PayPal
      </button>
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
      <button className={b.btn}>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span>Go to step 2</span>
          <Arrow className={b.arrow} />
        </span>
      </button>
      <p className={s.fine}>We respect your privacy. Your download link goes to this email.</p>
    </form>
  );
}


type BodyState = {
  info: Info;
  method: Method;
  ticked: boolean;
  setTicked: (v: boolean) => void;
  total: number;
};

function PayStep(props: Props & BodyState) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payByCard(waiver: boolean) {
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
      {/* Hidden, not unmounted, on the PayPal tab: switching back keeps what was typed. */}
      <div hidden={props.method !== "card"}>
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
      </div>
      <PayStepBody
        {...props}
        offer={props.bump}
        onCard={payByCard}
        cardPaying={paying || !stripe}
        cardError={error}
      />
    </>
  );
}

function PayStepBody({
  funnel,
  country,
  info,
  method,
  currency,
  price,
  product,
  europe,
  offer,
  ticked,
  setTicked,
  total,
  onCard,
  cardPaying,
  cardOff,
  cardError,
}: Pick<Props, "funnel" | "country" | "currency" | "price" | "product" | "europe"> &
  BodyState & {
    offer: Props["bump"];
    onCard?: (waiver: boolean) => void;
    cardPaying?: boolean;
    cardOff?: boolean;
    cardError?: string | null;
  }) {
  // EU buyers: clicking the button next to the notice below is their consent to
  // instant access (it ends the 14-day withdrawal right); no tick box, as on ClickFunnels.
  const waiver = europe;
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
        body: JSON.stringify({ funnel, ...info, bump: ticked, waiver, country, origin: window.location.origin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.approveUrl) throw new Error(json.error ?? "PayPal couldn't start.");
      // PayPal's page takes over; it sends the buyer back to the thank-you page.
      window.location.assign(json.approveUrl);
    } catch (err) {
      setPaypalError((err as Error).message);
      setPaypalBusy(false);
    }
  }

  const [lead, rest] = splitPitch(offer.pitch);

  return (
    <>
      {paypal && (
        <div className={s.paypalNote}>
          <PayPalGlyph /> After you click the button, you finish paying on PayPal&rsquo;s secure page, then
          come straight back to your download.
        </div>
      )}

      <label className={`${s.bump} ${ticked ? s.bumpOn : ""}`}>
        <span className={s.bumpHead}>
          <span className={s.bumpArrow} aria-hidden>
            ➜
          </span>
          <input
            type="checkbox"
            checked={ticked}
            onChange={(e) => setTicked(e.target.checked)}
            className={s.bumpCheck}
          />
          <span className={s.bumpTitle}>YES! Add the {offer.name}!</span>
          <span className={s.bumpPrice}>{money(offer.price, currency)}</span>
        </span>
        <span className={s.bumpBody}>
          <BumpCover />
          <span className={s.bumpPitch}>
            <span className={s.bumpOffer}>ADD-ON OFFER:</span> <strong>{lead}</strong>
            {rest} Only <strong>{money(offer.price, currency)}</strong>, added to this order.
          </span>
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

      <button
        type="button"
        className={b.btn}
        disabled={blocked}
        onClick={() => (paypal ? payWithPayPal() : onCard?.(waiver))}
      >
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span>{busy && !cardOff ? (paypal ? "Opening PayPal…" : "Processing…") : paypal ? "Pay with PayPal" : "Get the pack"}</span>
          {!busy && <Arrow className={b.arrow} />}
        </span>
        <span className={b.inner}>{money(total, currency)} · instant download · one payment</span>
      </button>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {europe && (
        <p className={s.fine}>
          By paying you get instant access to the download and agree that your 14-day right of
          withdrawal ends once it starts.
        </p>
      )}
    </>
  );
}

// "Lead sentence: the rest." → the lead goes bold, like the ClickFunnels bump.
function splitPitch(pitch: string): [string, string] {
  const at = pitch.indexOf(":");
  return at > 0 ? [pitch.slice(0, at + 1), pitch.slice(at + 1)] : [pitch, ""];
}

function money(amount: number, currency: "eur" | "usd") {
  return currency === "eur" ? `€${amount}` : `$${amount}`;
}

// The add-on as a small cover, drawn in CSS like the main product box.
function BumpCover() {
  return (
    <span className={s.bumpCover} aria-hidden>
      <span className={s.bumpCoverBrand}>GRIND ◆ STUDIO</span>
      <span className={s.bumpCoverJazz}>Jazz</span>
      <span className={s.bumpCoverName}>CHORD PACK</span>
      <span className={s.bumpCoverKeys}>
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </span>
  );
}

function CardGlyph() {
  return (
    <svg viewBox="0 0 20 16" width="18" height="15" aria-hidden>
      <rect x="1" y="1" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="1" y="4.5" width="18" height="3" fill="currentColor" />
      <rect x="4" y="10.5" width="5" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function PayPalGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className={s.ppGlyph}>
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
