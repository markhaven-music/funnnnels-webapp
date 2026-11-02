"use client";

import { useMemo, useState } from "react";
// "pure": Stripe.js loads when loadStripe is called, not as soon as this file does.
import { loadStripe } from "@stripe/stripe-js/pure";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { CardFields, cardElements, payWithCard, payWithWallet, Wallet, type CardLook } from "../CardFields";
import { OwnerSkip } from "../OwnerSkip";
import s from "./checkout.module.css";
import b from "./btn.module.css";
import { Arrow } from "./Cta";
import { pixel } from "./Tracking";
import { track } from "@/lib/beacon";
import { cookieCountry } from "@/lib/geo";

// The two-step order form, copied from the ClickFunnels checkout:
//   1 · Your info  → name + email (saved as a lead before any card is asked for)
//   2 · Payment    → the product box, Card | PayPal tabs, the yellow order bump,
//                    summary, one big button.
// Card: Stripe's card fields laid out like ClickFunnels' (../CardFields.tsx), so
// card numbers never touch our server. PayPal: the big button sends the buyer
// to PayPal's own page and
// back (/api/checkout/paypal → PayPal → /api/checkout/paypal/return), the way
// ClickFunnels does it. PayPal runs beside Stripe, not through it (lib/paypal.ts).

// Set when the PayPal keys are; the server holds the secret.
const PAYPAL_ON = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

type Method = "card" | "paypal";

type Props = {
  funnel: string;
  product: string;
  tagline: string;
  // A small picture of the product next to its name in step 2 (optional).
  image?: string;
  currency: "eur" | "usd";
  country: string;
  price: number;
  // The add-on; `cover` is the two lines on its little box (default: the Jazz Chord Pack's).
  bump: { name: string; price: number; pitch: string; cover?: [string, string] } | null;
  thankYou: string;
  publishableKey: string | null;
  // The shop: several products in one order. They fill the summary and go to
  // the shop's checkout APIs as `items` (their slugs); `price` is the cart's
  // total, and the cart page shows the products, so there's no order box.
  cart?: { slug: string; name: string; price: number }[];
  // Load Stripe.js (~200 KB, about half a second of a phone's processor) once
  // the buyer starts on step 1, not with the page: it's only needed at step 2
  // (docs/page-speed.md rule 4). Jazz, the launch kit and the shop's cart.
  deferStripe?: boolean;
  // false: no "Secure checkout" row on top of the card (the Jazz order page, 2026-11-01).
  secureRow?: boolean;
};

type Info = { firstName: string; lastName: string; email: string };

const stripeCache = new Map<string, ReturnType<typeof loadStripe>>();
function stripeFor(key: string) {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
}

// The page's body face (Geist), black words on the white fields like the name and email ones.
const GEIST: CardLook = {
  font: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontCss: "https://fonts.googleapis.com/css2?family=Geist:wght@400&display=swap",
  color: "#000000",
  placeholder: "#6b6b6b",
  focus: "#000000",
};

export function CheckoutWidget(props: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState<Info>({ firstName: "", lastName: "", email: "" });
  const [bump, setBump] = useState(false);
  const [method, setMethod] = useState<Method>("card");
  const total = props.price + (bump && props.bump ? props.bump.price : 0);
  const [wanted, setWanted] = useState(!props.deferStripe);
  const stripePromise = useMemo(
    () => (props.publishableKey && wanted ? stripeFor(props.publishableKey) : null),
    [props.publishableKey, wanted],
  );
  const body = { ...props, info, method, ticked: bump, setTicked: setBump, total };

  return (
    <div className={s.widget}>
      {props.secureRow !== false && (
        <div className={s.secure}>
          <LockGlyph /> Secure checkout
        </div>
      )}

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

      <div className={s.body} onFocusCapture={() => setWanted(true)} onPointerDownCapture={() => setWanted(true)}>
        {step === 1 ? (
          <InfoStep
            funnel={props.funnel}
            info={info}
            onDone={(next) => {
              setInfo(next);
              setWanted(true);
              setStep(2);
              pixel("InitiateCheckout", {
                content_name: props.product,
                value: props.price,
                currency: props.currency.toUpperCase(),
              });
              track({ funnel: props.funnel, page: "checkout" });
            }}
          />
        ) : (
          <>
            <button type="button" className={s.back} onClick={() => setStep(1)}>
              ← Go back
            </button>

            {!props.cart && (
              <div className={`${s.orderBox} ${props.image ? s.orderBoxPic : ""}`}>
                {props.image && (
                  <img className={s.orderPic} src={props.image} alt="" width={52} height={74} />
                )}
                <span className={s.orderText}>
                  <span className={s.orderTag}>Instant download</span>
                  <span className={s.orderName}>{props.product}</span>
                  <span className={s.orderDesc}>{props.tagline}</span>
                  <span className={s.orderPrice}>{money(props.price, props.currency)} · one payment</span>
                </span>
              </div>
            )}

            <p className={s.label}>
              <span>Payment information</span>
            </p>
            {PAYPAL_ON && <MethodTabs method={method} setMethod={setMethod} />}

            {stripePromise ? (
              <Elements stripe={stripePromise} options={cardElements(GEIST)}>
                <PayStep {...body} stripePromise={stripePromise} />
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
      <button className={`${b.btn} ${b.full}`}>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span>Go to step 2</span>
          <Arrow className={b.arrow} />
        </span>
      </button>
      <p className={s.fine}>We respect your privacy. Your download link goes to this email.</p>
      <OwnerSkip onSkip={() => onDone(info)} />
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

function PayStep({ stripePromise, ...props }: Props & BodyState & { stripePromise: ReturnType<typeof loadStripe> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const billing = { name: `${props.info.firstName} ${props.info.lastName}`.trim(), email: props.info.email };

  // Card fields and wallet buttons both pay through here: the PaymentIntent at
  // the server's price (its client secret). Success goes on to the thank-you page.
  async function intent(): Promise<string> {
    const res = await fetch(props.cart ? "/api/checkout/shop/intent" : "/api/checkout/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        funnel: props.funnel,
        ...(props.cart ? { items: props.cart.map((l) => l.slug) } : {}),
        ...props.info,
        bump: props.ticked,
        country: cookieCountry(props.currency, props.country),
        // The total on screen: the server refuses if its price differs (an early-bird just ended).
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
      await payWithCard(stripe, elements, billing, intent, props.thankYou);
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  return (
    <>
      {/* Hidden, not unmounted, on the PayPal tab: switching back keeps what was typed. */}
      <div hidden={props.method !== "card"} className={s.cardPane}>
        <Elements
          stripe={stripePromise}
          options={{ mode: "payment", amount: Math.round(props.total * 100), currency: props.currency, allowedPaymentMethodTypes: ["card"] }}
        >
          <Wallet pay={(st, el) => payWithWallet(st, el, billing, intent, props.thankYou)} onReady={setHasWallet} onError={setError} />
        </Elements>
        {hasWallet && (
          <div className={s.orCard}>
            <span>or pay by card</span>
          </div>
        )}
        <CardFields words={{ number: "Card number", expiry: "MM / YY", cvc: "CVV" }} look={GEIST} />
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
  cart,
  offer,
  ticked,
  setTicked,
  total,
  onCard,
  cardPaying,
  cardOff,
  cardError,
}: Pick<Props, "funnel" | "country" | "currency" | "price" | "product" | "cart"> &
  BodyState & {
    offer: Props["bump"];
    onCard?: () => void;
    cardPaying?: boolean;
    cardOff?: boolean;
    cardError?: string | null;
  }) {
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
      const res = await fetch(cart ? "/api/checkout/shop/paypal" : "/api/checkout/paypal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          funnel,
          ...(cart ? { items: cart.map((l) => l.slug) } : {}),
          ...info,
          bump: ticked,
          country: cookieCountry(currency, country),
          origin: window.location.origin,
          expected: total,
        }),
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

  const [lead, rest] = splitPitch(offer?.pitch ?? "");

  return (
    <>
      {paypal && (
        <div className={s.paypalNote}>
          <PayPalGlyph /> After you click the button, you finish paying on PayPal&rsquo;s secure page, then
          come straight back to your download.
        </div>
      )}

      {offer && (
        <label className={s.bump}>
          <BumpCover lines={offer.cover} />
          <span className={s.bumpHead}>
            {/* Gone once ticked, as on ClickFunnels. */}
            {!ticked && (
              <svg viewBox="0 0 448 512" className={s.bumpArrow} aria-hidden>
                <path
                  fill="currentColor"
                  d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"
                />
              </svg>
            )}
            <input
              type="checkbox"
              checked={ticked}
              onChange={(e) => setTicked(e.target.checked)}
              className={s.bumpCheck}
            />
            <span className={s.bumpTitle}>YES! Add the {offer.name}!</span>
            <span className={s.bumpPrice}>{money(offer.price, currency)}</span>
          </span>
          <span className={s.bumpPitch}>
            <span className={s.bumpOffer}>ADD-ON OFFER:</span> <strong>{lead}</strong>
            {rest} Only <strong>{money(offer.price, currency)}</strong>, added to this order.
          </span>
        </label>
      )}

      <div className={s.summary}>
        {(cart ?? [{ slug: "", name: product, price }]).map((l) => (
          <div key={l.slug} className={s.sumRow}>
            <span>{l.name}</span>
            <span>{money(l.price, currency)}</span>
          </div>
        ))}
        {ticked && offer && (
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
        className={`${b.btn} ${b.full}`}
        disabled={blocked}
        onClick={() => (paypal ? payWithPayPal() : onCard?.())}
      >
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span>{busy && !cardOff ? (paypal ? "Opening PayPal…" : "Processing…") : paypal ? "Pay with PayPal" : cart ? "Complete my order" : "Get the pack"}</span>
          {!busy && <Arrow className={b.arrow} />}
        </span>
        <span className={b.inner}>{money(total, currency)} · instant download · one payment</span>
      </button>
      {error && (
        <p className={s.error} role="alert">
          {error}
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
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return currency === "eur" ? `€${n}` : `$${n}`;
}

// The add-on as a small cover, drawn in CSS like the main product box.
function BumpCover({ lines = ["Jazz", "CHORD PACK"] }: { lines?: [string, string] }) {
  return (
    <span className={s.bumpCover} aria-hidden>
      <span className={s.bumpCoverBrand}>GRIND ◆ STUDIO</span>
      <span className={s.bumpCoverJazz}>{lines[0]}</span>
      <span className={s.bumpCoverName}>{lines[1]}</span>
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
