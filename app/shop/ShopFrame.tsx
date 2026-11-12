import { BRAND } from "@/app/(funnels)/_kit/brand";
import type { Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import type { ShopItem } from "@/lib/shop";
import { CATEGORIES, fromShopItem, type StoreItem } from "@/lib/storefront";
import { GlassButton } from "@/components/ui/GlassButton";
import { AddToCart, CartLink } from "./ShopClient";
import { interTight, poppins } from "./fonts";
import s from "./shop.module.css";

// What the store's pages share (the homepage, the shop, its products and
// cart): the bar with the menu and the cart, the footer, and the product card
// of the grids. Server components; the cart parts are islands.

export function ShopFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={`${s.page} ${poppins.variable} ${interTight.variable} ${className}`}>
      <header className={s.top}>
        <div className={`${s.wrap} ${s.bar}`}>
          <a href="/" className={s.logo}>
            {/* The Grind Studio wordmark, white, at 2× its height here. */}
            <img src="/funnels/shop/logo.webp" alt={BRAND.name} width={360} height={42} />
          </a>
          <nav className={s.nav} aria-label="Store">
            <a href="/shop">All packs</a>
            {CATEGORIES.flatMap((c) =>
              c.nav ? [
                <a key={c.id} href={`/shop#${c.id}`}>
                  {c.nav}
                </a>,
              ] : [],
            )}
            <a href="/account">My downloads</a>
          </nav>
          <CartLink />
        </div>
      </header>
      {children}
      <footer className={s.footer}>
        <p>
          © {new Date().getFullYear()} {BRAND.name} · <a href={BRAND.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={BRAND.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={BRAND.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href="/blog">Blog</a> · <a href={`mailto:${BRAND.support}`}>{BRAND.support}</a>
        </p>
      </footer>
    </main>
  );
}

/** The product's picture, whole on a square tile, or its name set in type when it has none. */
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
      srcSet={item.image.sm === item.image.lg ? undefined : `${item.image.sm} 600w, ${item.image.lg} 1200w`}
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

/** A pack in a grid: its box on a dark tile, name, one line, price, and "See the pack" (funnel) or "Add to cart" (shop). */
export function StoreCard({ item, currency, eager }: { item: StoreItem; currency: Currency; eager?: boolean }) {
  const kind = CATEGORIES.find((c) => c.id === item.category)?.title;
  return (
    <article className={s.card}>
      <a href={item.href} className={s.cardLink}>
        <span className={s.tile}>
          {item.pic ? (
            <img
              className={item.pic.fade ? s.fade : undefined}
              src={item.pic.src}
              srcSet={item.pic.srcSet}
              sizes={item.pic.srcSet ? GRID_SIZES : undefined}
              width={item.pic.width}
              height={item.pic.height}
              alt={item.name}
              {...(eager ? { fetchPriority: "high" as const } : { loading: "lazy" as const, decoding: "async" as const })}
            />
          ) : (
            <span className={s.tileName} aria-hidden>
              {item.name}
            </span>
          )}
        </span>
        <span className={s.cardName}>{item.name}</span>
        <span className={s.cardTag}>{item.line || kind}</span>
        <span className={s.price}>{money(item.price, currency)}</span>
      </a>
      {item.funnel ? (
        <GlassButton href={item.href} variant="dark" size="md" label="See the pack" />
      ) : (
        <AddToCart slug={item.slug} name={item.name} price={item.price} currency={currency} small />
      )}
    </article>
  );
}

export function ProductCard({ item, currency, eager }: { item: ShopItem; currency: Currency; eager?: boolean }) {
  return <StoreCard item={fromShopItem(item, currency)} currency={currency} eager={eager} />;
}
