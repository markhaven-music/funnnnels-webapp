"use client";

import { useState } from "react";
import { ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { PaymentMethodCreateParams, Stripe, StripeElementLocale, StripeElements, StripeElementsOptions } from "@stripe/stripe-js";

// The card fields: Stripe's Payment Element, cards only (since 11-06, "se è gold
// standard usiamo quello"). Number, expiry and CVC are three boxes in ONE
// iframe, so the browser's autofill fills them together: the ClickFunnels-style
// three separate fields filled only the number, the single CardElement skipped
// the expiry. Labels sit inside the boxes and float up when typing; 2px
// #dbdcdd borders and 5px corners as before; no "you allow Grind Studio to
// charge your card" notice. Name, email and country come from step 1, so the
// element doesn't ask them; a ZIP shows where Stripe wants one (US, UK, CA).
// Stripe's own fields, so card numbers never touch our server.
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

/** What is being paid: the Elements group needs it for the Payment Element (react-stripe-js updates it as add-ons are ticked). */
export type CardAmount = { total: number; currency: string };

export const cardElements = (look: CardLook, locale: StripeElementLocale | undefined, pay: CardAmount): StripeElementsOptions => ({
  fonts: [{ cssSrc: look.fontCss }],
  ...(locale ? { locale } : {}),
  mode: "payment",
  amount: Math.max(50, Math.round(pay.total * 100)),
  currency: pay.currency.toLowerCase(),
  allowedPaymentMethodTypes: ["card"],
  // payWithCard makes the card a PaymentMethod first (stripe.createPaymentMethod),
  // which the Payment Element only allows with this. Without it every card
  // payment failed before reaching the server, from 11-06 17:21 to 11-07 17:30.
  paymentMethodCreation: "manual",
  appearance: {
    theme: "stripe",
    labels: "floating",
    variables: {
      fontFamily: look.font,
      // 15px text and 2px spacing: with more, Stripe stacks expiry and CVC on rows
      // of their own below ~360px wide (tried on a layout lab page, 11-06).
      fontSizeBase: "15px",
      colorText: look.color,
      colorTextPlaceholder: look.placeholder,
      colorPrimary: look.focus,
      colorDanger: "#dc2626",
      borderRadius: "5px",
      spacingUnit: "2px",
    },
    rules: {
      // 16px at the sides like the name and email fields: Stripe's own was ~8px with
      // spacingUnit 2px, so the words sat off to the left ("sembra un po' decentrato", 11-06).
      ".Input": { border: "2px solid #dbdcdd", boxShadow: "none", paddingLeft: "16px", paddingRight: "16px" },
      ".Input:focus": { borderColor: look.focus, boxShadow: "none" },
      ".Input--invalid": { borderColor: "#dc2626", boxShadow: "none" },
    },
  },
});

export function CardFields(_: { words?: CardWords; look?: CardLook }) {
  return (
    <PaymentElement
      options={{
        layout: "tabs",
        // Step 1 has them; the country is the visit's (Stripe gets it at payWithCard).
        fields: { billingDetails: { name: "never", email: "never", address: { country: "never" } } },
        // Apple / Google Pay have their own buttons above (<Wallet>); no Link.
        wallets: { applePay: "never", googlePay: "never", link: "never" },
        terms: { card: "never" },
      }}
    />
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
  // Checks the fields (and shows their errors) before anything is created.
  const { error: invalid } = await elements.submit();
  if (invalid) throw new Error(invalid.message);
  const { error, paymentMethod } = await stripe.createPaymentMethod({ elements, params: { billing_details: billing } });
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
  // left: 0 too: without it the box starts where the form's text does and,
  // a page wide, stuck out 20-40px on the right, so phones panned sideways (11-06).
  const [shown, setShown] = useState(false);
  return (
    <div style={shown ? undefined : { position: "absolute", left: 0, width: "100%", height: 0, overflow: "hidden" }}>
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
