"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckoutWidget } from "@/app/(funnels)/jazz-midi-pack/CheckoutWidget";
import { GlassButton } from "@/components/ui/GlassButton";
import type { Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { EXPANSIONS_BUMP, EXPANSION_WORDS, expansionsBump } from "./bump";
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
        <GlassButton href="/shop" variant="clear" size="md" label="Browse the shop" />
      </div>
    );
  }

  const total = Math.round(lines.reduce((sum, l) => sum + l.price, 0) * 100) / 100;
  const offer = expansionsBump(slugs);
  const extra = offer ? offer.missing.flatMap((x) => bySlug.get(x) ?? []) : [];
  const bumps = offer && extra.length === offer.missing.length ? [expansionsOffer(offer.price, extra, currency)] : [];
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
          bumps={bumps}
          thankYou="/shop/thank-you"
          publishableKey={publishableKey}
          cart={lines.map(({ slug, name, price }) => ({ slug, name, price }))}
          deferStripe
        />
      </section>
    </div>
  );
}


// The Expansions the cart lacks, as a tick box (./bump.ts). Words to the feeling first, the numbers after.
function expansionsOffer(price: number, extra: CartLine[], currency: Currency) {
  const names = extra.map((l) => EXPANSION_WORDS[l.slug]?.short ?? l.name);
  const both = names.join(" + ");
  const grooves = extra.reduce((n, l) => n + (EXPANSION_WORDS[l.slug]?.grooves ?? 0), 0);
  const full = Math.round(extra.reduce((sum, l) => sum + l.price, 0) * 100) / 100;
  return {
    id: EXPANSIONS_BUMP,
    name: `${both} Expansion${extra.length > 1 ? "s" : ""}`,
    price,
    full,
    pitch: "",
    image: extra[0].image ?? undefined,
    headline: `YES! Add ${both} too!`,
    body: [
      `**You know that feeling when your drums finally move.** Get it in every beat you make: ${both}, ${grooves.toLocaleString("en-US")} more drum grooves you just drag in, for **${money(price, currency)}** instead of ${money(full, currency)}. Only with this order.`,
    ],
  };
}
