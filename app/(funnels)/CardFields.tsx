"use client";

import { CardCvcElement, CardExpiryElement, CardNumberElement, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { PaymentMethodCreateParams, Stripe, StripeElementLocale, StripeElements, StripeElementsOptions, StripeElementStyle } from "@stripe/stripe-js";
import c from "./card.module.css";

// The card fields as ClickFunnels' checkout draws them (measured on the live
// /spot-available-midi-drum-kit-ad-15m30 at 1366px): the card number on top
// with a card icon, expiry and CVV side by side under it, the words inside the
// fields, no labels and no "you allow Grind Studio to charge your card" notice.
// Stripe's own fields (iframes), so card numbers never touch our server.
//
// They live in their own <Elements> (cardElements below, no amount); the Apple
// Pay / Google Pay buttons (<Wallet>) keep theirs, with the amount. Paying by
// card: payWithCard; by wallet: payWithWallet.

export type CardWords = { number: string; expiry: string; cvc: string };
// The words inside the fields: `font` is loaded into Stripe's iframes from `fontCss`.
export type CardLook = { font: string; fontCss: string; color: string; placeholder: string };

export const INTER: CardLook = {
  font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontCss: "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap",
  color: "#384751",
  placeholder: "#384751",
};

export const cardElements = (look: CardLook, locale?: StripeElementLocale): StripeElementsOptions => ({
  fonts: [{ cssSrc: look.fontCss }],
  ...(locale ? { locale } : {}),
});

export function CardFields({ words, look, className }: { words: CardWords; look: CardLook; className?: string }) {
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
  return (
    <div className={`${c.box} ${className ?? ""}`}>
      <div className={`${c.field} ${c.number}`}>
        <CardIcon />
        <CardNumberElement className={c.el} options={{ style, placeholder: words.number, showIcon: false }} />
      </div>
      <div className={`${c.field} ${c.expiry}`}>
        <CardExpiryElement className={c.el} options={{ style, placeholder: words.expiry }} />
      </div>
      <div className={`${c.field} ${c.cvc}`}>
        <CardCvcElement className={c.el} options={{ style, placeholder: words.cvc }} />
      </div>
    </div>
  );
}

// ClickFunnels' card icon, drawn from its pixels: a card outline, a chip, four dashes.
function CardIcon() {
  return (
    <svg className={c.icon} viewBox="0 0 45 30" width="30" height="20" aria-hidden>
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
  return (
    <ExpressCheckoutElement
      options={{
        buttonHeight: 48,
        buttonType: { applePay: "buy", googlePay: "buy" },
        paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
      }}
      onReady={(e) => onReady(Boolean(e.availablePaymentMethods))}
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
  );
}
