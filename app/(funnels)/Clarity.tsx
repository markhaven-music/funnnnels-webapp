"use client";

import Script from "next/script";
import { AFTER_LOAD } from "./jazz-midi-pack/Tracking";
import { BRAND } from "./_kit/brand";
import { PREVIEW_JS } from "@/lib/beacon";

// Clarity on the pages without a funnel's Tracking: the thank-you pages and
// /account. Same project and "landing" tag as the landings and order pages, so
// one recording runs from the ad to the download. `purchase` adds the
// "purchase" event (Clarity → Filters → Custom events) to find buyers' sessions.
// Loads once the page has shown (docs/page-speed.md rule 4); never on
// localhost, *.vercel.app or previews, like the funnels' Tracking. The buyer's
// email on these pages carries data-clarity-mask.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

export function Clarity({ purchase = false }: { purchase?: boolean }) {
  return (
    <Script id="clarity-page" strategy="afterInteractive">{`
      (function () {
        if (${OFF}.test(location.hostname) || ${PREVIEW_JS}) return;
        (function (c, l, a, r, i, t, y) {
          c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
          t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
          ${AFTER_LOAD}(function () { y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); });
        })(window, document, 'clarity', 'script', '${BRAND.tracking.clarityId}');
        clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
        ${purchase ? "clarity('event', 'purchase');" : ""}
      })();
    `}</Script>
  );
}
