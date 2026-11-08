import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preconnect } from "react-dom";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Beacon } from "@/app/(funnels)/Beacon";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { SHOP_SLUG, shopSettings } from "@/lib/shop";
import { CATEGORIES, storeItems } from "@/lib/storefront";
import { ShopFrame, StoreCard } from "../ShopFrame";
import { ShopTracking } from "../ShopClient";
import s from "../shop.module.css";

// The shop: every pack for sale, in rows by kind (Drum MIDI, Chord MIDI,
// Bundles & More). The funnels' packs open their sales page; the Live
// products of dashboard → Products open their shop page and go in the cart.
// Served like the launch-kit pages: from Vercel's CDN, one cached page per
// currency; proxy.ts rewrites /shop to /shop/eur|usd by the visitor's
// country. Nothing here reads headers, cookies or searchParams, so it stays
// cacheable. Saving in the dashboard revalidates (lib/shop.ts revalidateShop).

export const revalidate = 3600; // saves in the dashboard refresh it at once (revalidatePath)

// Rendered on the first visit, then cached (ISR).
export function generateStaticParams() {
  return [];
}

type Params = { currency: string };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await shopSettings().catch(() => null);
  return {
    title: `${settings?.title ?? "Shop"} · ${BRAND.name}`,
    description: settings?.intro || "Drag-and-drop MIDI drum patterns, chord progressions and complete beats. Works in every DAW, Mac and PC. Instant download.",
  };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const [settings, items] = await Promise.all([shopSettings(), storeItems(currency)]);
  if (items.some((p) => p.pic && /^https?:/.test(p.pic.src))) preconnect(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin);
  const rows = CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.id) })).filter((r) => r.items.length);
  let n = 0; // cards drawn so far: the first row's are on the first screen

  return (
    <ShopFrame>
      <Beacon funnel={SHOP_SLUG} page="landing" />
      <ShopTracking name={settings.title} value={0} currency={currency} />
      <section className={`${s.wrap} ${s.hero}`}>
        <h1 className={s.title}>{settings.title}</h1>
        {settings.intro && <p className={s.intro}>{settings.intro}</p>}
        {rows.length > 1 && (
          <nav className={s.chips} aria-label="Categories">
            {rows.map((r) => (
              <a key={r.id} href={`#${r.id}`}>
                {r.title}
              </a>
            ))}
          </nav>
        )}
      </section>
      <div className={s.wrap}>
        {rows.length === 0 ? (
          <p className={s.empty}>Nothing for sale here yet. Check back soon.</p>
        ) : (
          rows.map((r) => (
            <section key={r.id} id={r.id} className={s.row}>
              <div className={s.rowHead}>
                <h2 className={s.rowTitle}>{r.title}</h2>
              </div>
              <div className={s.grid}>
                {r.items.map((p) => (
                  <StoreCard key={p.slug} item={p} currency={currency} eager={n++ < 2} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <div className={s.gap} />
    </ShopFrame>
  );
}
