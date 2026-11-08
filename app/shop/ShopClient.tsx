"use client";

import { useEffect } from "react";
import Script from "next/script";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { BOOT, pixel } from "@/app/(funnels)/jazz-midi-pack/Tracking";
import { CartIcon, GlassButton } from "@/components/ui/GlassButton";
import type { Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { cart, useCart } from "./cart";
import s from "./shop.module.css";

// The shop's moving parts: the cart link, "Add to cart" and the trackers.
// The cart page's checkout is CartView.tsx, apart, so Stripe never loads on
// the shop's other pages. The rest of the shop is server-rendered and cached
// (app/shop/[currency]).

export function CartLink() {
  const n = useCart().length;
  return (
    <a href="/shop/cart" className={s.cartLink} aria-label={n ? `Cart, ${n} product${n === 1 ? "" : "s"}` : "Cart"}>
      <BagGlyph />
      <span>Cart</span>
      {n > 0 && <span className={s.count}>{n}</span>}
    </a>
  );
}

export function AddToCart({
  slug,
  name,
  price,
  currency,
  small = false,
}: {
  slug: string;
  name: string;
  price: number;
  currency: Currency;
  small?: boolean;
}) {
  const slugs = useCart();
  const inCart = slugs.includes(slug);
  const add = () => {
    cart.add([slug]);
    pixel("AddToCart", { content_name: name, content_ids: [slug], content_type: "product", value: price, currency: currency.toUpperCase() });
  };

  if (small) {
    return inCart ? (
      <GlassButton href="/shop/cart" variant="clear" size="md" label="In your cart ✓" />
    ) : (
      <GlassButton onClick={add} variant="dark" size="md" label="Add to cart" icon={<CartIcon />} />
    );
  }
  // Both states are the same height, so nothing below moves once the cart is read.
  return (
    <div className={s.buy}>
      {inCart ? (
        <GlassButton
          href="/shop/cart"
          variant="clear"
          size="xl"
          label="Checkout"
          sub={`In your cart · ${slugs.length} product${slugs.length === 1 ? "" : "s"}`}
          cta
        />
      ) : (
        <GlassButton onClick={add} variant="glass" size="lg" label="Add to cart" price={money(price, currency)} cta />
      )}
      <p className={s.buyNote}>
        {inCart ? (
          <>
            Added. <a href="/shop">Keep shopping</a> or check out now.
          </>
        ) : (
          "One payment, no subscription. Card, Apple Pay, Google Pay or PayPal."
        )}
      </p>
    </div>
  );
}

/** On the thank-you page: what was just bought leaves the cart. */
export function ClearCart({ slugs }: { slugs: string[] }) {
  const key = slugs.join(",");
  useEffect(() => {
    if (key) cart.remove(key.split(","));
  }, [key]);
  return null;
}

// Meta Pixel + Clarity + neo, as the launch kit's (app/(funnels)/_kit/KitTracking.tsx),
// loaded once the page has shown (docs/page-speed.md rule 4). Never on
// localhost, *.local or *.vercel.app, so tests can't pollute the ad account.
const OFF = String(/^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/);

export function ShopTracking({
  name,
  value,
  currency,
  ids,
  page = "landing",
}: {
  name: string;
  value: number;
  currency: Currency;
  ids?: string[];
  page?: "landing" | "order";
}) {
  const { metaPixelId, clarityId, neoSnippet } = BRAND.tracking;
  const params = JSON.stringify({
    content_name: name,
    content_type: "product",
    ...(ids ? { content_ids: ids } : {}),
    value,
    currency: currency.toUpperCase(),
  });
  return (
    <Script id="shop-tracking" strategy="afterInteractive">{`
      (function () {
        if (${OFF}.test(location.hostname)) return;
        function go() {
          (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
          })(window, document, 'clarity', 'script', '${clarityId}');
          clarity('set', 'landing', location.pathname.replace(/\\/$/, '') || '/');
          var params = ${params};
          ${BOOT}
          bootPixel('${metaPixelId}');
          ${page === "order" ? "fbq('trackCustom', 'OrderPageView', params);" : "fbq('track', 'ViewContent', params);"}
          var s = document.createElement('script'); s.async = true; s.src = '${neoSnippet}';
          document.head.appendChild(s);
        }
        if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
      })();
    `}</Script>
  );
}

function BagGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
