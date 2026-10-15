"use client";

import { useEffect, useRef, useState } from "react";

// PayPal's own Smart Button (JS SDK v5), drawn in an iframe PayPal controls.
// It opens the PayPal popup; our server creates and captures the order
// (/api/checkout/paypal, /api/checkout/paypal/capture).

type Buttons = { render(el: HTMLElement): Promise<void>; close(): Promise<void> };
type PayPalSdk = {
  Buttons(options: {
    style?: Record<string, string | number | boolean>;
    onClick?: (data: unknown, actions: { resolve(): Promise<void>; reject(): Promise<void> }) => Promise<void>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }, actions: { restart(): Promise<void> }) => Promise<void>;
    onError?: (err: unknown) => void;
  }): Buttons;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

// The SDK may be loaded once per page, for one currency; the price never
// changes currency after the page loads, so one loader is enough.
let sdk: Promise<PayPalSdk> | null = null;
function loadSdk(clientId: string, currency: string): Promise<PayPalSdk> {
  sdk ??= new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      "client-id": clientId,
      currency: currency.toUpperCase(),
      intent: "capture",
      components: "buttons",
      // Cards already go through Stripe's form above.
      "disable-funding": "card",
    });
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal didn't load")));
    script.onerror = () => {
      sdk = null;
      script.remove();
      reject(new Error("PayPal didn't load"));
    };
    document.head.appendChild(script);
  });
  return sdk;
}

export type PayPalHandlers = {
  /** A reason the buyer can't pay yet (e.g. the EU waiver isn't ticked), or null. */
  check: () => string | null;
  createOrder: () => Promise<string>;
  /** Captures the order; returns "restart" when PayPal should let the buyer pick another source. */
  onApprove: (orderId: string) => Promise<"done" | "restart">;
  onError: (message: string | null) => void;
};

export function PayPalButton({
  clientId,
  currency,
  ...handlers
}: PayPalHandlers & { clientId: string; currency: string }) {
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(handlers);
  const [failed, setFailed] = useState(false);

  // The button renders once; its callbacks read the latest bump/waiver/info.
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    let cancelled = false;
    let buttons: Buttons | null = null;
    loadSdk(clientId, currency)
      .then((paypal) => {
        if (cancelled || !box.current) return;
        // Our own errors carry a message for the buyer; PayPal's onError then
        // fires too, and must not paint over it with the generic one.
        let reported = false;
        const report = (err: unknown): never => {
          reported = true;
          latest.current.onError((err as Error).message);
          throw err;
        };
        buttons = paypal.Buttons({
          style: { layout: "horizontal", color: "gold", shape: "rect", label: "paypal", height: 48, tagline: false },
          onClick: (_data, actions) => {
            reported = false;
            const why = latest.current.check();
            latest.current.onError(why);
            return why ? actions.reject() : actions.resolve();
          },
          createOrder: () => latest.current.createOrder().catch(report),
          onApprove: async ({ orderID }, actions) => {
            const result = await latest.current.onApprove(orderID).catch(report);
            if (result === "restart") return actions.restart();
          },
          onError: () => {
            if (!reported) latest.current.onError("PayPal couldn't finish the payment. Nothing was charged.");
          },
        });
        return buttons.render(box.current);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      buttons?.close().catch(() => {});
    };
  }, [clientId, currency]);

  if (failed) return null;
  return <div ref={box} />;
}
