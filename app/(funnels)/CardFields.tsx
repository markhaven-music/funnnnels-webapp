"use client";

import { useState, type CSSProperties } from "react";
import { CardElement, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { PaymentMethodCreateParams, Stripe, StripeElementLocale, StripeElements, StripeElementsOptions, StripeElementStyle } from "@stripe/stripe-js";

// The card field: one 50px box, 2px #dbdcdd border, 5px corners (ClickFunnels'
// look), no labels, no "you allow Grind Studio to charge your card" notice.
// Stripe's own field (an iframe), so card numbers never touch our server.
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

// One field for number, expiry and CVC (Stripe's CardElement), since 11-06: the
// three separate fields of ClickFunnels were three iframes, and Safari's
// autofill only filled the one being typed in (the number, never the expiry).
// In a single field the browser fills number and expiry together. `words` are
// kept for the callers; Stripe writes its own placeholders in the page's locale.
export function CardFields({ look }: { words?: CardWords; look: CardLook }) {
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const style: StripeElementStyle = {
    base: {
      color: look.color,
      fontFamily: look.font,
      fontSize: "16px",
      fontWeight: "400",
      fontSmoothing: "antialiased",
      iconColor: look.color,
      "::placeholder": { color: look.placeholder },
    },
    invalid: { color: "#dc2626", iconColor: "#dc2626" },
  };
  const box: CSSProperties = {
    boxSizing: "border-box",
    minWidth: 0,
    padding: "15px 12px",
    border: `2px solid ${invalid ? "#dc2626" : "#dbdcdd"}`,
    borderRadius: 5,
    background: "#fff",
    ...(focused ? { outline: `2px solid ${look.focus}`, outlineOffset: -2 } : {}),
  };
  return (
    <div style={box}>
      {/* No Link "Autofill" button, no postcode: ClickFunnels asked for neither. */}
      <CardElement
        options={{ style, hidePostalCode: true, disableLink: true }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setInvalid(Boolean(e.error))}
      />
    </div>
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
  const card = elements.getElement(CardElement);
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
