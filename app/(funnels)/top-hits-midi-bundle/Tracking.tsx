"use client";

import Script from "next/script";
import { BOOT } from "../jazz-midi-pack/Tracking";
import { funnel } from "./funnel";
import { PREVIEW_JS } from "@/lib/beacon";
import { purchaseEventId } from "@/lib/neoIds";

// Meta Pixel + Clarity + Neo, as on the Jazz page. Never on localhost, *.local
// or *.vercel.app (previews, and the origin m.thegrind.studio forwards to), so
// tests don't reach the ad account. `event`: ViewContent on the landing,
// InitiateCheckout fires from the order form, Purchase from the thank-you page.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

export function Tracking({ value, currency, event = "ViewContent" }: { value: number; currency: string; event?: string | null }) {
  const { metaPixelId, clarityId, neoSnippet } = funnel.tracking;
  const params = JSON.stringify({ content_name: funnel.product, content_type: "product", value, currency: currency.toUpperCase() });
  return (
    <Script id="top-hits-tracking" strategy="afterInteractive">{`
      (function () {
        if (${OFF}.test(location.hostname) || ${PREVIEW_JS}) return;
        (function (c, l, a, r, i, t, y) {
          c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
          t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
          y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, 'clarity', 'script', '${clarityId}');
        clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
        var params = ${params};
        ${BOOT}
        bootPixel('${metaPixelId}');
        ${event ? `fbq('track', '${event}', params);` : ""}
        document.addEventListener('click', function (e) {
          if (e.target && e.target.closest && e.target.closest('[data-cta]')) {
            fbq('trackCustom', 'LandingCTAClick', params);
            clarity('event', 'cta_click');
          }
        }, { capture: true });
        var s = document.createElement('script'); s.async = true; s.src = '${neoSnippet}';
        document.head.appendChild(s);
      })();
    `}</Script>
  );
}

/** Purchase, once per order (eventID = neo's "purchase_<order id>", lib/neo.ts), on the thank-you page. */
export function PurchasePixel({ orderId, value, currency }: { orderId: string; value: number; currency: string }) {
  const data = JSON.stringify({ content_name: funnel.product, content_type: "product", value, currency: currency.toUpperCase() });
  return (
    <Script id="top-hits-purchase" strategy="afterInteractive">{`
      (function () {
        if (${OFF}.test(location.hostname) || ${PREVIEW_JS}) return;
        var key = 'px-purchase-${orderId}';
        try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) {}
        ${BOOT}
        bootPixel('${funnel.tracking.metaPixelId}');
        fbq('track', 'Purchase', ${data}, { eventID: '${purchaseEventId(orderId)}' });
      })();
    `}</Script>
  );
}
