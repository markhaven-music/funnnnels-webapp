import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preconnect, preload } from "react-dom";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Beacon } from "@/app/(funnels)/Beacon";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { SHOP_SLUG, descriptionBlocks, liveProduct, liveProducts } from "@/lib/shop";
import { Cover, ProductCard, ShopFrame } from "../../ShopFrame";
import { AddToCart, ShopTracking } from "../../ShopClient";
import s from "../../shop.module.css";

// One product of the shop: /shop/<slug>, rewritten by proxy.ts to
// /shop/<currency>/<slug> and cached per currency like the shop page.

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

type Params = { currency: string; product: string };

const HERO_SIZES = "(min-width: 1160px) 552px, (min-width: 900px) 46vw, calc(100vw - 40px)";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { product } = await params;
  const p = await liveProduct(product).catch(() => null);
  if (!p) return {};
  return {
    title: `${p.name} · ${BRAND.name}`,
    description: p.tagline || undefined,
    openGraph: { title: p.name, description: p.tagline || undefined, type: "website", ...(p.image ? { images: [p.image.lg] } : {}) },
  };
}

export default async function ShopProductPage({ params }: { params: Promise<Params> }) {
  const { currency, product } = (await params) as { currency: Currency; product: string };
  if (!CURRENCIES.includes(currency)) notFound();
  const [p, all] = await Promise.all([liveProduct(product), liveProducts()]);
  if (!p) notFound();
  const more = all.filter((x) => x.slug !== p.slug).slice(0, 4);
  if (p.image) {
    // The first screen's picture is found at once (docs/page-speed.md rule 2).
    // An uploaded one is on Supabase; a funnel's own is on this site.
    if (/^https?:/.test(p.image.lg)) preconnect(new URL(p.image.lg).origin);
    preload(p.image.lg, { as: "image", fetchPriority: "high", imageSrcSet: `${p.image.sm} 600w, ${p.image.lg} 1200w`, imageSizes: HERO_SIZES });
  }
  const price = p.price[currency];

  return (
    <ShopFrame>
      <Beacon funnel={SHOP_SLUG} page="landing" />
      <ShopTracking name={p.name} value={price} currency={currency} ids={[p.slug]} />
      <div className={s.wrap}>
        <a href="/shop" className={s.back}>
          ← All products
        </a>
        <section className={s.product}>
          <Cover item={p} sizes={HERO_SIZES} eager className={s.bigPic} />
          <div>
            <h1 className={s.name}>{p.name}</h1>
            {p.tagline && <p className={s.tagline}>{p.tagline}</p>}
            <p className={s.bigPrice}>{money(price, currency)}</p>
            <AddToCart slug={p.slug} name={p.name} price={price} currency={currency} />
            {p.description && (
              <div className={s.desc}>
                {descriptionBlocks(p.description).map((block, i) =>
                  "ul" in block ? (
                    <ul key={i}>
                      {block.ul.map((li, j) => (
                        <li key={j}>{li}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{block.p}</p>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>
      {more.length > 0 && (
        <section className={s.more}>
          <div className={s.wrap}>
            <h2 className={s.moreTitle}>More from the shop</h2>
            <div className={s.grid}>
              {more.map((m) => (
                <ProductCard key={m.slug} item={m} currency={currency} />
              ))}
            </div>
          </div>
        </section>
      )}
    </ShopFrame>
  );
}
