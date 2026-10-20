"use client";

import Script from "next/script";
import { BOOT } from "../jazz-midi-pack/Tracking";
import { BRAND } from "./brand";
import { purchaseEventId } from "@/lib/neoIds";

// Meta Pixel + Clarity + Neo, as on the Jazz page (../jazz-midi-pack/Tracking.tsx),
// for template products. Fires only where real buyers are: never on localhost,
// *.local or *.vercel.app (preview deployments, and the origin the brand domain
// forwards to), so testing a launch can't pollute the ad account.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

export function KitTracking({ product, value, currency }: { product: string; value: number; currency: string }) {
  const { metaPixelId, clarityId, neoSnippet } = BRAND.tracking;
  const params = JSON.stringify({ content_name: product, content_type: "product", value, currency: currency.toUpperCase() });
  return (
    <>
      <Script id="kit-tracking" strategy="afterInteractive">{`
        (function () {
          if (${OFF}.test(location.hostname)) return;
          (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
          })(window, document, 'clarity', 'script', '${clarityId}');
          clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
          var params = ${params};
          ${BOOT}
          bootPixel('${metaPixelId}');
          fbq('track', 'ViewContent', params);
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
    </>
  );
}

/** Purchase, once per order (eventID = neo's "purchase_<order id>", lib/neo.ts), on the thank-you page. Same host rule. */
export function KitPurchasePixel({ product, orderId, value, currency }: { product: string; orderId: string; value: number; currency: string }) {
  const data = JSON.stringify({ content_name: product, content_type: "product", value, currency: currency.toUpperCase() });
  return (
    <Script id="kit-purchase" strategy="afterInteractive">{`
      (function () {
        if (${OFF}.test(location.hostname)) return;
        var key = 'px-purchase-${orderId}';
        try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) {}
        ${BOOT}
        bootPixel('${BRAND.tracking.metaPixelId}');
        fbq('track', 'Purchase', ${data}, { eventID: '${purchaseEventId(orderId)}' });
      })();
    `}</Script>
  );
}
