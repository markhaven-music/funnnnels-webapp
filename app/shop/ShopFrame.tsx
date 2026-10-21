import { BRAND } from "@/app/(funnels)/_kit/brand";
import type { Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import type { ShopItem } from "@/lib/shop";
import { AddToCart, CartLink } from "./ShopClient";
import { serif } from "./fonts";
import s from "./shop.module.css";

// What every shop page shares: the bar with the cart, the footer, and the
// product card of the grids. Server components; the cart parts are islands.

export function ShopFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className={`${s.page} ${serif.variable}`}>
      <header className={s.top}>
        <div className={`${s.wrap} ${s.bar}`}>
          <a href="/shop" className={s.logo}>
            {/* The Grind Studio wordmark, white, at 2× its height here. */}
            <img src="/funnels/shop/logo.webp" alt={BRAND.name} width={360} height={42} />
          </a>
          <CartLink />
        </div>
      </header>
      {children}
      <footer className={s.footer}>
        <p>
          © {new Date().getFullYear()} {BRAND.name} · <a href={BRAND.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={BRAND.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={BRAND.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href={`mailto:${BRAND.support}`}>{BRAND.support}</a>
        </p>
      </footer>
    </main>
  );
}

/** The product's square picture, or its name set in type when it has none. */
export function Cover({
  item,
  sizes,
  eager = false,
  className = s.pic,
}: {
  item: Pick<ShopItem, "name" | "image">;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  if (!item.image) {
    return (
      <span className={`${className} ${s.noPic}`} aria-hidden>
        {item.name}
      </span>
    );
  }
  return (
    <img
      className={className}
      src={item.image.sm}
      srcSet={`${item.image.sm} 600w, ${item.image.lg} 1200w`}
      sizes={sizes}
      width={600}
      height={600}
      alt={item.name}
      {...(eager ? { fetchPriority: "high" as const } : { loading: "lazy" as const, decoding: "async" as const })}
    />
  );
}

// Two columns on a phone, three on a tablet, four on a wide screen.
const GRID_SIZES = "(min-width: 1160px) 270px, (min-width: 1040px) 23vw, (min-width: 720px) 31vw, 47vw";

export function ProductCard({ item, currency, eager }: { item: ShopItem; currency: Currency; eager?: boolean }) {
  return (
    <article className={s.card}>
      <a href={`/shop/${item.slug}`} className={s.cardLink}>
        <Cover item={item} sizes={GRID_SIZES} eager={eager} />
        <span className={s.cardName}>{item.name}</span>
        {item.tagline && <span className={s.cardTag}>{item.tagline}</span>}
        <span className={s.price}>{money(item.price[currency], currency)}</span>
      </a>
      <AddToCart slug={item.slug} name={item.name} price={item.price[currency]} currency={currency} small />
    </article>
  );
}
