"use client";

import { useEffect, useState } from "react";
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
      // The text stays 15px: at 16px iPhone Safari puts expiry and CVC on rows of their
      // own even on a 360px form ("perché siamo tornati a due righe", 11-08). The zoom an
      // iPhone does on a field under 16px is stopped by noZoomOnIos below instead.
      ".Input": { border: "2px solid #dbdcdd", boxShadow: "none", paddingLeft: "16px", paddingRight: "16px" },
      ".Input:focus": { borderColor: look.focus, boxShadow: "none" },
      ".Input--invalid": { borderColor: "#dc2626", boxShadow: "none" },
    },
  },
});

// An iPhone zooms the page in when a field with text under 16px gets focus or is
// autofilled, and leaves it zoomed, so the page swayed left and right ("dopo
// autofill… la pagina traballa", 11-08). maximum-scale=1 stops that zoom; on
// iOS people can still pinch to zoom. iPhones and iPads only: on Android it
// would block pinching, and Android doesn't zoom on focus anyway.
function noZoomOnIos() {
  const ios = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (ios && meta && !/maximum-scale/.test(meta.content)) meta.content += ", maximum-scale=1";
}

/**
 * True once the visitor has done anything on the page (scrolled, touched,
 * moved the mouse, pressed a key): the moment Stripe.js starts loading. Before
 * 11-10 it waited for the first tap on the form itself, so someone who filled
 * step 1 fast (autofill) reached the card fields before Stripe did and looked
 * at an empty space for seconds (6+ on a first visit). PageSpeed's robot
 * doesn't scroll or touch, so the page weighs the same there (docs/page-speed.md).
 */
export function useFirstTouch() {
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    const events = ["scroll", "touchstart", "pointerdown", "pointermove", "keydown"] as const;
    const on = () => setTouched(true);
    const opts = { once: true, passive: true, capture: true } as const;
    events.forEach((e) => window.addEventListener(e, on, opts));
    return () => events.forEach((e) => window.removeEventListener(e, on, opts));
  }, []);
  return touched;
}

// The fields' outline while Stripe's own are still loading: the number on one
// row, expiry and CVC on the next, in the fields' border and corners.
const ghost = { height: 48, border: "2px solid #dbdcdd", borderRadius: 5, background: "#f6f7f7" } as const;

export function CardFields(_: { words?: CardWords; look?: CardLook }) {
  useEffect(noZoomOnIos, []);
  // Stripe says "ready" ~0.7 s before its fields are painted (seen on a preview,
  // 11-10: ready at 0.6 s, fields at 1.3 s), and its frame is see-through until
  // then: so the outline stays behind the frame, and goes 1.5 s after "ready",
  // by when the fields cover it.
  const [ready, setReady] = useState(false);
  const [ghosts, setGhosts] = useState(true);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGhosts(false), 1500);
    return () => clearTimeout(t);
  }, [ready]);
  return (
    <div style={{ position: "relative", minHeight: ready ? undefined : 104 }}>
      {ghosts && (
        <div aria-hidden style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignContent: "start" }}>
          <div style={{ ...ghost, gridColumn: "1 / -1" }} />
          <div style={ghost} />
          <div style={ghost} />
        </div>
      )}
      <div style={{ position: "relative" }}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: "tabs",
            // Step 1 has them; the country is the visit's (Stripe gets it at payWithCard).
            fields: { billingDetails: { name: "never", email: "never", address: { country: "never" } } },
            // Apple / Google Pay have their own buttons above (<Wallet>); no Link.
            wallets: { applePay: "never", googlePay: "never", link: "never" },
            terms: { card: "never" },
          }}
        />
      </div>
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
