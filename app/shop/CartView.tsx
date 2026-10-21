"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckoutWidget } from "@/app/(funnels)/jazz-midi-pack/CheckoutWidget";
import type { Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { cart, useCart } from "./cart";
import s from "./shop.module.css";

// The cart page: what's in the cart (app/shop/cart.ts), at today's prices,
// and the two-step checkout for all of it. Its own module so that only this
// page carries the checkout and Stripe.

/** A product as the cart page needs it, at the page's currency. */
export type CartLine = { slug: string; name: string; price: number; image: string | null };

export function CartView({
  catalog,
  currency,
  country,
  publishableKey,
}: {
  catalog: CartLine[];
  currency: Currency;
  country: string;
  publishableKey: string | null;
}) {
  const slugs = useCart();
  const [ready, setReady] = useState(false);
  const bySlug = useMemo(() => new Map(catalog.map((l) => [l.slug, l])), [catalog]);

  useEffect(() => {
    // /shop/cart?add=a,b (a link in an email or an ad) puts those products in the cart.
    const add = new URLSearchParams(window.location.search).get("add");
    if (add) {
      cart.add(add.split(",").filter((x) => bySlug.has(x)));
      window.history.replaceState(null, "", window.location.pathname);
    }
    setReady(true);
  }, [bySlug]);

  // Products taken off sale since they were added drop out.
  useEffect(() => {
    const gone = slugs.filter((x) => !bySlug.has(x));
    if (ready && gone.length) cart.remove(gone);
  }, [ready, slugs, bySlug]);

  if (!ready) return <div className={s.cartWait} aria-busy />;

  const lines = slugs.flatMap((x) => bySlug.get(x) ?? []);
  if (lines.length === 0) {
    return (
      <div className={s.emptyCart}>
        <h1 className={s.h1}>Your cart is empty.</h1>
        <p className={s.intro}>Everything in the shop is an instant download.</p>
        <a href="/shop" className={s.ghost}>
          Browse the shop
        </a>
      </div>
    );
  }

  const total = Math.round(lines.reduce((sum, l) => sum + l.price, 0) * 100) / 100;
  return (
    <div className={s.cartPage}>
      <section>
        <h1 className={s.h1}>Your cart</h1>
        <ul className={s.lines}>
          {lines.map((l) => (
            <li key={l.slug} className={s.line}>
              {l.image ? (
                <img className={s.linePic} src={l.image} alt="" width={64} height={64} />
              ) : (
                <span className={s.linePic} aria-hidden />
              )}
              <span>
                <a href={`/shop/${l.slug}`} className={s.lineName}>
                  {l.name}
                </a>
                <span className={s.lineTag}>Instant download</span>
              </span>
              <span className={s.lineEnd}>
                <span className={s.linePrice}>{money(l.price, currency)}</span>
                <button type="button" className={s.remove} onClick={() => cart.remove([l.slug])}>
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className={s.total}>
          <span>Total</span>
          <span>{money(total, currency)}</span>
        </div>
        <a className={s.keep} href="/shop">
          ← Keep shopping
        </a>
      </section>
      <section className={s.pay}>
        <CheckoutWidget
          funnel="shop"
          product={lines.length === 1 ? lines[0].name : `${lines.length} products`}
          tagline=""
          currency={currency}
          country={country}
          price={total}
          bump={null}
          thankYou="/shop/thank-you"
          publishableKey={publishableKey}
          europe={currency === "eur"}
          cart={lines.map(({ slug, name, price }) => ({ slug, name, price }))}
          deferStripe
        />
      </section>
    </div>
  );
}

