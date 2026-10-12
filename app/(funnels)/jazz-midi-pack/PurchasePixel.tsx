"use client";

import Script from "next/script";
import { funnel } from "./funnel";
import { BOOT } from "./Tracking";

// Pixel Purchase for a paid order, once per order: eventID = the PaymentIntent
// id (lets Meta dedupe a future server-side event), and a localStorage mark so
// a refresh or a bookmarked return doesn't count the sale twice.
export function PurchasePixel({ orderId, value, currency }: { orderId: string; value: number; currency: string }) {
  const data = JSON.stringify({
    content_name: funnel.product,
    content_type: "product",
    value,
    currency: currency.toUpperCase(),
  });
  return (
    <Script id="purchase-pixel" strategy="afterInteractive">{`
      (function () {
        var key = 'px-purchase-${orderId}';
        try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) {}
        ${BOOT}
        bootPixel('${funnel.tracking.metaPixelId}');
        fbq('track', 'Purchase', ${data}, { eventID: '${orderId}' });
      })();
    `}</Script>
  );
}
