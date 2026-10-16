import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Instrument_Serif, Poppins } from "next/font/google";
import { CURRENCIES, formatPrice, type Currency } from "@/lib/geo";
import { getPublishedBlocks } from "@/lib/pages";
import { funnel } from "../funnel";
import { DEFAULT_SECTIONS, type Section } from "../content";
import { SectionView, isSectionType, type Ctx } from "../sections";
import { StickyCta } from "../StickyCta";
import { Tracking } from "../Tracking";
import s from "../jazz.module.css";

// Copy rules: grind-studio-landing-pages/docs/copy-style.md ("Diretto").
// Every claim is in BRIEF.md. The sections are edited in the dashboard
// editor (funnnnels.com); content.ts holds the defaults / fallback.
//
// Served from Vercel's CDN, not rendered per visit: one prebuilt page per
// currency (/jazz-midi-pack/eur, /jazz-midi-pack/usd). proxy.ts picks the
// visitor's one and rewrites /jazz-midi-pack to it, so the address bar never
// changes. Publishing from the editor refreshes both (lib/pages.ts
// revalidateFunnelPages); the hourly revalidate is only a safety net.

// The hero headline: a heavy geometric sans, like the Grind Studio Drum Kit page.
const display = Poppins({ subsets: ["latin"], weight: "800", variable: "--font-display" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

// The country the checkout reports when the browser has no visitor_country
// cookie (proxy.ts sets it): one that maps to the page's currency.
const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };

export const metadata: Metadata = {
  title: "Jazz MIDI Pack · GRIND STUDIO",
  description:
    "26 jazz progressions voiced the way a pianist plays them. 3,536 MIDI files: 13 voicings, 8 rhythms, all 12 keys, bass lines, lofi / neo soul / trap soul / deep house loops.",
  openGraph: {
    title: "Jazz chords that sound played, not programmed.",
    description: "3,536 MIDI files by GRIND STUDIO. Drag into your DAW.",
    type: "website",
  },
};

const valid = (b: unknown): b is Section =>
  !!b && typeof b === "object" && isSectionType((b as Section).type) && typeof (b as Section).props === "object";

export default async function JazzMidiPackPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const amount = funnel.price[currency];
  const price = formatPrice(amount, currency);
  // strict: a failed read keeps the last good page in the cache instead of
  // caching the coded defaults over the published copy.
  const sections = await getPublishedBlocks(funnel.slug, DEFAULT_SECTIONS, valid, { strict: true });
  const ctx: Ctx = {
    price,
    amount,
    currency,
    country: FALLBACK_COUNTRY[currency],
    // Read at build time, so only the public key: the secret one is the
    // checkout API's business (it answers "not connected" without it).
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
  };

  return (
    <main className={`${s.page} ${serif.variable} ${display.variable}`}>
      <Tracking value={amount} currency={currency} />
      {sections.map((section) => (
        <SectionView key={section.id} section={section} ctx={ctx} />
      ))}
      <footer className={s.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={funnel.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={funnel.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
        <p className={s.legal}>
          Piano previews use the Salamander Grand Piano samples by Alexander Holm (CC BY 3.0). The MIDI files
          contain no audio. Individual results vary.
        </p>
      </footer>
      <StickyCta price={price} />
    </main>
  );
}
