import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { poppins } from "@/app/shop/fonts";
import { resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { storeItems, type StoreItem } from "@/lib/storefront";
import l from "../links.module.css";

// Grind Studio's link in bio (Instagram): one page, a row per pack that opens
// its sales page. m.thegrind.studio/links forwards here (a rewrite in
// grind-studio-landing-pages/vercel.json, like /shop). The packs and prices
// are the store's (lib/storefront.ts), plus the funnels it doesn't list.
// Every link carries utm_source=instagram&utm_medium=bio and the pack's slug
// as utm_content, so dashboard → Analytics tells the bio's clicks apart.
// One cached page per currency, like the home (proxy.ts, docs/page-speed.md rule 9).

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Grind Studio · Links",
  description: "Drag-and-drop MIDI packs for producers: drums, chords and complete beats. Instant download.",
  robots: { index: false },
};

// Funnels the store doesn't show, after its packs.
const EXTRA: { slug: string; funnel: string; href: string; line: string; pic: StoreItem["pic"] }[] = [
  {
    slug: "drunk-swing-grooves",
    funnel: "drunk-swing-grooves",
    href: "/drunk-swing-grooves",
    line: "J Dilla-style drunk drums, as MIDI grooves.",
    pic: { src: "/funnels/drunk-swing-grooves/pack-square-600.webp", width: 600, height: 600 },
  },
];

const tagged = (href: string, slug: string) =>
  `${href}${href.includes("?") ? "&" : "?"}utm_source=instagram&utm_medium=bio&utm_campaign=link-in-bio&utm_content=${slug}`;

export default async function Links({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const store = await storeItems(currency);
  const extra = await Promise.all(
    EXTRA.map(async (p) => {
      const f = await resolveFunnel(p.funnel);
      return f ? { ...p, name: f.product, price: f.price[currency] } : null;
    }),
  );
  const items = [...store, ...extra.filter((x) => x !== null)];

  return (
    <main className={`${l.page} ${poppins.variable}`}>
      <header className={l.head}>
        <img className={l.logo} src="/funnels/shop/logo.webp" alt={BRAND.name} width={360} height={42} fetchPriority="high" />
        <p className={l.lead}>MIDI packs that make your beats bounce. Any DAW, instant download.</p>
      </header>

      <ul className={l.list}>
        {items.map((p, i) => (
          <li key={p.slug}>
            <a className={l.row} href={tagged(p.href, p.slug)} data-cta="">
              {p.pic ? (
                <img
                  className={`${l.pic} ${"fade" in p && p.fade ? l.fade : ""}`}
                  src={p.pic.src}
                  width={p.pic.width}
                  height={p.pic.height}
                  alt=""
                  {...(i < 3 ? {} : { loading: "lazy" as const, decoding: "async" as const })}
                />
              ) : (
                <span className={l.pic} aria-hidden />
              )}
              <span className={l.text}>
                <span className={l.name}>{p.name}</span>
                {p.line && <span className={l.line}>{p.line}</span>}
              </span>
              <span className={l.price}>{money(p.price, currency)}</span>
            </a>
          </li>
        ))}
      </ul>

      <nav className={l.more} aria-label="More">
        <a href={tagged("/shop", "shop")}>All packs</a>
        <a href="/account">My downloads</a>
        <a href={`mailto:${BRAND.support}`}>Support</a>
      </nav>
    </main>
  );
}
