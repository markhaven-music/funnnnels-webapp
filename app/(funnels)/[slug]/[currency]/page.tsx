import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { getPublishedBlocks } from "@/lib/pages";
import { getKitProduct } from "@/lib/products";
import { DEFAULT_KIT_SECTIONS, WAITLIST_ONLY, isKitSection, type KitSection } from "../../_kit/content";
import { KitSectionView, type KitCtx } from "../../_kit/sections";
import { EarlyBirdBar, LaunchClock, Phased } from "../../_kit/LaunchClock";
import { KitSticky } from "../../_kit/KitSticky";
import { KitTracking } from "../../_kit/KitTracking";
import { BRAND } from "../../_kit/brand";
import s from "../../jazz-midi-pack/jazz.module.css";

// A product made from the launch kit (dashboard → Launches). Served like the
// Jazz page: from Vercel's CDN, one cached page per currency; proxy.ts
// rewrites /<slug> to /<slug>/eur|usd. Nothing here reads headers, cookies
// or searchParams, so it stays cacheable.
//
// The launch phase is NOT baked into the cache: the HTML carries the real
// dates and both prices, and the LaunchClock in the browser shows the
// waitlist or the sales sections and the right price for the moment it's
// read. The checkout's server applies the same dates on its own clock.
// Saving a launch or publishing the page revalidates; the 60 s revalidate
// only keeps the HTML's starting phase close to the truth.

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const revalidate = 60;

// Every product is rendered on its first visit, then cached (ISR).
export function generateStaticParams() {
  return [];
}

const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };

type Params = { slug: string; currency: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getKitProduct(slug).catch(() => null);
  if (!product) return {};
  return {
    title: `${product.product} · ${BRAND.name}`,
    description: product.tagline || undefined,
    openGraph: { title: product.product, description: product.tagline || undefined, type: "website" },
  };
}

export default async function KitProductPage({ params }: { params: Promise<Params> }) {
  const { slug, currency } = (await params) as { slug: string; currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const product = await getKitProduct(slug);
  if (!product) notFound();

  const published = await getPublishedBlocks<KitSection>(slug, DEFAULT_KIT_SECTIONS, isKitSection, { strict: true });
  // A launch always needs its waitlist section, even if it was deleted in the editor.
  const sections = published.some((x) => x.type === "k_waitlist") || !product.launch
    ? published
    : [DEFAULT_KIT_SECTIONS[0], ...published];

  const ctx: KitCtx = {
    product: {
      slug,
      name: product.product,
      tagline: product.tagline,
      price: product.price,
      bump: product.bump,
      launch: product.launch,
    },
    country: FALLBACK_COUNTRY[currency],
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    guaranteeDays: BRAND.guaranteeDays,
  };

  return (
    <main className={`${s.page} ${serif.variable}`}>
      <LaunchClock launch={product.launch} price={product.price} currency={currency} renderedAt={Date.now()}>
        <KitTracking product={product.product} value={product.price[currency]} currency={currency} />
        <EarlyBirdBar />
        {sections.map((section) => (
          <Phased key={section.id} show={WAITLIST_ONLY.includes(section.type) ? ["waitlist"] : ["early", "open"]}>
            <KitSectionView section={section} ctx={ctx} />
          </Phased>
        ))}
        <footer className={s.footer}>
          <p>
            © {new Date().getFullYear()} {BRAND.name} · <a href={BRAND.legal.terms} rel="noopener">Terms</a> ·{" "}
            <a href={BRAND.legal.privacy} rel="noopener">Privacy</a> ·{" "}
            <a href={BRAND.legal.refund} rel="noopener">Refund policy</a> ·{" "}
            <a href={`mailto:${BRAND.support}`}>{BRAND.support}</a>
          </p>
          <p className={s.legal}>The MIDI files contain no audio. Individual results vary.</p>
        </footer>
        <KitSticky name={product.product} />
      </LaunchClock>
    </main>
  );
}
