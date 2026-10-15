import type { Metadata } from "next";
import { headers } from "next/headers";
import { Instrument_Serif } from "next/font/google";
import { currencyFor, formatPrice, visitorCountry } from "@/lib/geo";
import { stripeConfigured } from "@/lib/stripe";
import { getPublishedBlocks } from "@/lib/pages";
import { funnel } from "./funnel";
import { DEFAULT_SECTIONS, type Section } from "./content";
import { SectionView, isSectionType, type Ctx } from "./sections";
import { StickyCta } from "./StickyCta";
import { Tracking } from "./Tracking";
import s from "./jazz.module.css";

// Copy rules: grind-studio-landing-pages/docs/copy-style.md ("Diretto").
// Every claim is in BRIEF.md. The sections are edited in the dashboard
// editor (funnnnels.com); content.ts holds the defaults / fallback.

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const dynamic = "force-dynamic";

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

export default async function JazzMidiPackPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: override } = await searchParams;
  const country = visitorCountry(await headers(), override);
  const currency = currencyFor(country);
  const amount = funnel.price[currency];
  const price = formatPrice(amount, currency);
  const sections = await getPublishedBlocks(funnel.slug, DEFAULT_SECTIONS, valid);
  const ctx: Ctx = {
    price,
    amount,
    currency,
    country,
    publishableKey: stripeConfigured() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY! : null,
  };

  return (
    <main className={`${s.page} ${serif.variable}`}>
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
