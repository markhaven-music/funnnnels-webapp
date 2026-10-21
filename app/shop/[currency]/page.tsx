import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preconnect } from "react-dom";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Beacon } from "@/app/(funnels)/Beacon";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { SHOP_SLUG, liveProducts, shopSettings } from "@/lib/shop";
import { ProductCard, ShopFrame } from "../ShopFrame";
import { ShopTracking } from "../ShopClient";
import s from "../shop.module.css";

// The shop: every live product (dashboard → Shop), in its order. Served like
// the launch-kit pages: from Vercel's CDN, one cached page per currency;
// proxy.ts rewrites /shop to /shop/eur|usd by the visitor's country. Nothing
// here reads headers, cookies or searchParams, so it stays cacheable. Saving
// in the dashboard revalidates (lib/shop.ts revalidateShop).

export const revalidate = 60;

// Rendered on the first visit, then cached (ISR).
export function generateStaticParams() {
  return [];
}

type Params = { currency: string };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await shopSettings().catch(() => null);
  return {
    title: `${settings?.title ?? "Shop"} · ${BRAND.name}`,
    description: settings?.intro || undefined,
  };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const [settings, products] = await Promise.all([shopSettings(), liveProducts()]);
  if (products.some((p) => p.image)) preconnect(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin);

  return (
    <ShopFrame>
      <Beacon funnel={SHOP_SLUG} page="landing" />
      <ShopTracking name={settings.title} value={0} currency={currency} />
      <section className={`${s.wrap} ${s.hero}`}>
        <p className={s.eyebrow}>{BRAND.name} · Shop</p>
        <h1 className={s.title}>{settings.title}</h1>
        {settings.intro && <p className={s.intro}>{settings.intro}</p>}
      </section>
      <section className={s.wrap}>
        {products.length === 0 ? (
          <p className={s.empty}>Nothing for sale here yet. Check back soon.</p>
        ) : (
          <div className={s.grid}>
            {products.map((p, i) => (
              // The first row is on the first screen: fetched at once, never lazily.
              <ProductCard key={p.slug} item={p} currency={currency} eager={i < 2} />
            ))}
          </div>
        )}
      </section>
    </ShopFrame>
  );
}
