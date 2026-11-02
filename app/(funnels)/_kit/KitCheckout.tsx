"use client";

import { CheckoutWidget } from "../jazz-midi-pack/CheckoutWidget";
import type { Bump } from "@/lib/funnels";
import { useClock, useUnitPrice } from "./LaunchClock";
import { splitName } from "./KitBox";

// The Jazz checkout, fed the price in force right now: when the early-bird
// ends while the page is open, the total on the button changes with it.
export function KitCheckout({
  slug,
  name,
  tagline,
  bump,
  country,
  publishableKey,
}: {
  slug: string;
  name: string;
  tagline: string;
  bump: Bump | null;
  country: string;
  publishableKey: string | null;
}) {
  const { currency } = useClock();
  const price = useUnitPrice();
  return (
    <CheckoutWidget
      funnel={slug}
      product={name}
      tagline={tagline}
      currency={currency}
      country={country}
      price={price}
      bump={bump && { name: bump.name, price: bump.price[currency], pitch: bump.pitch, cover: splitName(bump.name) }}
      thankYou={`/${slug}/thank-you`}
      publishableKey={publishableKey}
      deferStripe
    />
  );
}
