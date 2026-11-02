"use client";

import { useState, type CSSProperties } from "react";
import { CardCvcElement, CardExpiryElement, CardNumberElement, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { PaymentMethodCreateParams, Stripe, StripeElementLocale, StripeElements, StripeElementsOptions, StripeElementStyle } from "@stripe/stripe-js";

// The card fields as ClickFunnels' checkout draws them (measured on the live
// /spot-available-midi-drum-kit-ad-15m30 at 1366px): the card number on top
// with a card icon, expiry and CVV side by side under it, the words inside the
// fields, no labels, no "you allow Grind Studio to charge your card" notice.
// Three 50px boxes, 2px #dbdcdd borders shared between them, 5px outer corners.
// Stripe's own fields (iframes), so card numbers never touch our server.
//
// Styled inline, not with a stylesheet: a CSS module shared by the Jazz and the
// ClickFunnels-style pages gets bundled with the Jazz page's CSS and fonts, and
// the Drum Kit order page would load them too (docs/page-speed.md).
//
// They live in their own <Elements> (cardElements below, no amount); the Apple
// Pay / Google Pay buttons (<Wallet>) keep theirs, with the amount. Paying by
// card: payWithCard; by wallet: payWithWallet.

export type CardWords = { number: string; expiry: string; cvc: string };
// The words inside the fields: `font` is loaded into Stripe's iframes from
// `fontCss`; `focus` rings the field being typed in.
export type CardLook = { font: string; fontCss: string; color: string; placeholder: string; focus: string };

export const INTER: CardLook = {
  font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontCss: "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap",
  color: "#384751",
  placeholder: "#384751",
  focus: "#000000",
};

export const cardElements = (look: CardLook, locale?: StripeElementLocale): StripeElementsOptions => ({
  fonts: [{ cssSrc: look.fontCss }],
  ...(locale ? { locale } : {}),
});

type Field = "number" | "expiry" | "cvc";
const EDGE = "2px solid #dbdcdd";
const FIELD: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  minWidth: 0,
  height: 50,
  padding: "0 12px",
  border: EDGE,
  background: "#fff",
};
const PLACE: Record<Field, CSSProperties> = {
  number: { gridColumn: "1 / -1", paddingLeft: 52, borderRadius: "5px 5px 0 0" },
  expiry: { borderTop: 0, borderRadius: "0 0 0 5px" },
  cvc: { borderTop: 0, borderLeft: 0, borderRadius: "0 0 5px 0" },
};
const EL: CSSProperties = { flex: 1, minWidth: 0 };

export function CardFields({ words, look }: { words: CardWords; look: CardLook }) {
  const [focused, setFocused] = useState<Field | null>(null);
  const [invalid, setInvalid] = useState<Record<Field, boolean>>({ number: false, expiry: false, cvc: false });
  const style: StripeElementStyle = {
    base: {
      color: look.color,
      fontFamily: look.font,
      fontSize: "16px",
      fontWeight: "400",
      fontSmoothing: "antialiased",
      "::placeholder": { color: look.placeholder },
    },
    invalid: { color: "#dc2626" },
  };
  const box = (f: Field): CSSProperties => ({
    ...FIELD,
    ...PLACE[f],
    ...(invalid[f] ? { borderColor: "#dc2626" } : {}),
    ...(focused === f ? { zIndex: 1, outline: `2px solid ${look.focus}`, outlineOffset: -2 } : {}),
  });
  const events = (f: Field) => ({
    onFocus: () => setFocused(f),
    onBlur: () => setFocused((x) => (x === f ? null : x)),
    onChange: (e: { error?: unknown }) => setInvalid((v) => ({ ...v, [f]: Boolean(e.error) })),
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div style={box("number")}>
        <CardIcon />
        {/* No Link "Autofill" button inside the field: ClickFunnels has none. */}
        <div style={EL}>
          <CardNumberElement options={{ style, placeholder: words.number, showIcon: false, disableLink: true }} {...events("number")} />
        </div>
      </div>
      <div style={box("expiry")}>
        <div style={EL}>
          <CardExpiryElement options={{ style, placeholder: words.expiry }} {...events("expiry")} />
        </div>
      </div>
      <div style={box("cvc")}>
        <div style={EL}>
          <CardCvcElement options={{ style, placeholder: words.cvc }} {...events("cvc")} />
        </div>
      </div>
    </div>
  );
}

// ClickFunnels' card icon, drawn from its pixels: a card outline, a chip, four dashes.
function CardIcon() {
  return (
    <svg
      viewBox="0 0 45 30"
      width="30"
      height="20"
      aria-hidden
      style={{ position: "absolute", top: "50%", left: 12, color: "#384751", transform: "translateY(-50%)" }}
    >
      <rect x="1.5" y="1.5" width="42" height="27" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="6" y="9" width="10.5" height="6" rx="1" fill="currentColor" />
      {[6, 15, 24, 33].map((x) => (
        <rect key={x} x={x} y="18" width="5.5" height="3" rx="1" fill="currentColor" />
      ))}
    </svg>
  );
}

type Billing = PaymentMethodCreateParams.BillingDetails;

/**
 * Pays with the card fields: checks them, asks the server for the
 * PaymentIntent (`intent`, its client secret), confirms it (3D Secure in
 * Stripe's window), then goes on to `next` the way Stripe's own redirect
 * would: proxy.ts records the order on that arrival, the upsells and the
 * thank-you page find it by ?payment_intent=. Throws the message to show.
 */
export async function payWithCard(stripe: Stripe, elements: StripeElements, billing: Billing, intent: () => Promise<string>, next: string) {
  const card = elements.getElement(CardNumberElement);
  if (!card) return;
  const { error, paymentMethod } = await stripe.createPaymentMethod({ type: "card", card, billing_details: billing });
  if (error) throw new Error(error.message);
  const clientSecret = await intent();
  const { error: payError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, { payment_method: paymentMethod.id });
  if (payError) throw new Error(payError.message);
  const url = new URL(next, window.location.origin);
  url.searchParams.set("payment_intent", paymentIntent.id);
  url.searchParams.set("redirect_status", paymentIntent.status);
  window.location.assign(url);
}

/** Pays with the wallet the buyer tapped; Stripe then redirects to `next`. */
export async function payWithWallet(stripe: Stripe, elements: StripeElements, billing: Billing, intent: () => Promise<string>, next: string) {
  const clientSecret = await intent();
  const { error } = await stripe.confirmPayment({
    elements,
    clientSecret,
    confirmParams: { return_url: new URL(next, window.location.origin).toString(), payment_method_data: { billing_details: billing } },
  });
  // Only reached when the payment fails.
  if (error) throw new Error(error.message);
}

/** Apple Pay / Google Pay buttons, only on devices that have one; inside an <Elements> with the amount. */
export function Wallet({
  pay,
  onReady,
  onError,
}: {
  pay: (stripe: Stripe, elements: StripeElements) => Promise<void>;
  onReady: (hasWallet: boolean) => void;
  onError: (message: string | null) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  // Out of the layout until a wallet shows: on a device without Apple Pay or
  // Google Pay Stripe still leaves an empty 8px frame, which with the form's
  // gaps made a band of space above the card fields ("crea troppo spazio").
  const [shown, setShown] = useState(false);
  return (
    <div style={shown ? undefined : { position: "absolute", width: "100%", height: 0, overflow: "hidden" }}>
      <ExpressCheckoutElement
        options={{
          buttonHeight: 48,
          buttonType: { applePay: "buy", googlePay: "buy" },
          paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
        }}
        onReady={(e) => {
          setShown(Boolean(e.availablePaymentMethods));
          onReady(Boolean(e.availablePaymentMethods));
        }}
        onConfirm={async (e) => {
          if (!stripe || !elements) return;
          onError(null);
          try {
            await pay(stripe, elements);
          } catch (err) {
            onError((err as Error).message);
            e.paymentFailed({ reason: "fail" });
          }
        }}
      />
    </div>
  );
}
