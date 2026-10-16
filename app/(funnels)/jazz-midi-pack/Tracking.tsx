"use client";

import Script from "next/script";
import { funnel } from "./funnel";

// Meta Pixel + Clarity + Neo, as on the Grind Studio landings
// (grind-studio-landing-pages/src/components/Tracking.astro). Browser events:
//   PageView + ViewContent on load, LandingCTAClick on any [data-cta] click.
// Unlike the Grind landings, checkout and purchase happen on THIS page, not
// in ClickFunnels, so nothing else sends them: InitiateCheckout fires from the
// checkout widget (step 1 → 2) and Purchase from the thank-you page, with the
// Stripe PaymentIntent id as eventID.
// Local previews never reach Meta / Clarity / Neo.
// page="order": the order page sends PageView + OrderPageView instead of ViewContent.
export function Tracking({ value, currency, page = "landing" }: { value: number; currency: string; page?: "landing" | "order" }) {
  const { metaPixelId, clarityId, neoSnippet } = funnel.tracking;
  const params = JSON.stringify({
    content_name: funnel.product,
    content_type: "product",
    value,
    currency: currency.toUpperCase(),
  });
  return (
    <>
      <Script id="clarity" strategy="afterInteractive">{`
        (function () {
          if (${LOCAL}.test(location.hostname)) return;
          (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
          })(window, document, 'clarity', 'script', '${clarityId}');
          var q = new URLSearchParams(location.search);
          clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
          ['utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
            if (q.get(k)) clarity('set', k, q.get(k));
          });
          document.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('[data-cta]')) clarity('event', 'cta_click');
          }, { capture: true });
        })();
      `}</Script>
      <Script id="meta-pixel" strategy="afterInteractive">{`
        (function () {
          var params = ${params};
          ${BOOT}
          bootPixel('${metaPixelId}');
          ${page === "order" ? "fbq('trackCustom', 'OrderPageView', params);" : "fbq('track', 'ViewContent', params);"}
          document.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('[data-cta]')) fbq('trackCustom', 'LandingCTAClick', params);
          }, { capture: true });
        })();
      `}</Script>
      <Script id="neo" strategy="afterInteractive">{`
        if (!${LOCAL}.test(location.hostname)) {
          var s = document.createElement('script'); s.async = true; s.src = '${neoSnippet}';
          document.head.appendChild(s);
        }
      `}</Script>
    </>
  );
}

const LOCAL = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$/);

// Creates fbq synchronously (so events queue) and loads fbevents.js off localhost.
export const BOOT = `
  function bootPixel(id) {
    if (window.fbq) return;
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (!${LOCAL}.test(location.hostname)) s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', id);
    fbq('track', 'PageView');
  }
`;

/** Fire a standard Pixel event from React code (no-op if the pixel never booted). */
export function pixel(event: string, data: Record<string, unknown>, eventID?: string) {
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
  if (fbq) fbq("track", event, data, eventID ? { eventID } : undefined);
}
