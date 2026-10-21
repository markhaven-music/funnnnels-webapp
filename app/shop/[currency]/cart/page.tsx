import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Beacon } from "@/app/(funnels)/Beacon";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { SHOP_SLUG, liveProducts } from "@/lib/shop";
import { ShopFrame } from "../../ShopFrame";
import { CartView, type CartLine } from "../../CartView";
import { ShopTracking } from "../../ShopClient";
import s from "../../shop.module.css";

// The cart and its checkout: /shop/cart, rewritten to /shop/<currency>/cart.
// Cached like the shop page: it carries today's live products and prices,
// and the browser picks the ones in its cart (app/shop/cart.ts). The
// checkout's server prices the cart again before any payment.

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = { title: `Your cart · ${BRAND.name}`, robots: { index: false, follow: false } };

const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };

export default async function CartPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const catalog: CartLine[] = (await liveProducts()).map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.price[currency],
    image: p.image?.sm ?? null,
  }));

  return (
    <ShopFrame>
      <Beacon funnel={SHOP_SLUG} page="order" />
      <ShopTracking name="Cart" value={0} currency={currency} page="order" />
      <div className={s.wrap}>
        <CartView
          catalog={catalog}
          currency={currency}
          country={FALLBACK_COUNTRY[currency]}
          publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null}
        />
      </div>
    </ShopFrame>
  );
}
