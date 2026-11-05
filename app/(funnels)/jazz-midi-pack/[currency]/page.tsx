import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { getPublishedBlocks } from "@/lib/pages";
import { funnel } from "../funnel";
import { DEFAULT_SECTIONS, type Section } from "../content";
import { AB, AB_CARRY_SCRIPT, AB_CSS, AB_SCRIPT } from "../abtest";
import { SectionView, isSectionType, type Ctx } from "../sections";
import { Tracking } from "../Tracking";
import { Beacon } from "../../Beacon";
import { display } from "../fonts";
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
    "The most used jazz progressions, voiced the way a pianist plays them. 11,152 MIDI files: 13 voicings, 8 rhythms, all 12 keys, bass lines, lofi / neo soul / trap soul / deep house loops.",
  openGraph: {
    title: "The jazz progressions everyone wants, as drag-and-drop MIDI.",
    description: "11,152 jazz MIDI files + 5 bonuses by GRIND STUDIO, voiced like a real pianist. Drag into your DAW.",
    type: "website",
    url: "https://m.thegrind.studio/jazz-midi-pack",
    images: [{ url: "https://m.thegrind.studio/funnels/jazz-midi-pack/vsl-en-1600.webp", width: 1600, height: 900 }],
  },
};

const valid = (b: unknown): b is Section =>
  !!b && typeof b === "object" && isSectionType((b as Section).type) && typeof (b as Section).props === "object";

export default async function JazzMidiPackPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // Its price as dashboard → Products has it.
  const amount = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency];
  const price = money(amount, currency);
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
    <main className={`${s.page} ${s.jazz} ${display.variable}`}>
      {/* The headline test: the visitor's variant is picked before the hero paints (../abtest.ts). */}
      <script dangerouslySetInnerHTML={{ __html: AB_SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: AB_CSS }} />
      {/* The Buy buttons take the headline and the ad tags to the order page (../abtest.ts AB_CARRY_SCRIPT). */}
      <script dangerouslySetInnerHTML={{ __html: AB_CARRY_SCRIPT }} />
      <Tracking value={amount} currency={currency} />
      <Beacon funnel={funnel.slug} page="landing" abCookie={AB.cookie} />
      {/* Red, on top, like TOP HITS' and the Drum Kit's ("aggiungi anche banner rossi sopra black friday come gli altri funnels"). */}
      <div className={s.bfbar}>
        <b>BLACK FRIDAY:</b> 90% Sale Ends Soon
      </div>
      {sections.map((section, i) => {
        // Desktop, like the Drum Kit page's copy-beside-a-picture blocks: the
        // letter beside the before/after rolls it talks about, text left, rolls
        // right (.pair in jazz.module.css). The rolls block that follows the
        // letter is drawn inside the pair and skipped on its own turn.
        const next = sections[i + 1];
        if (section.type === "s_letter" && next?.type === "s_compare_rolls") {
          return (
            <div key={section.id} className={s.pair}>
              <SectionView section={section} ctx={ctx} />
              <SectionView section={next} ctx={ctx} />
            </div>
          );
        }
        if (section.type === "s_compare_rolls" && sections[i - 1]?.type === "s_letter") return null;
        return <SectionView key={section.id} section={section} ctx={ctx} />;
      })}
      <footer className={s.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={funnel.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={funnel.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
        <p className={s.legal}>
          The previews play the MIDI files on a sine pluck or on piano samples (Salamander Grand Piano by Alexander Holm, CC BY 3.0). The MIDI files contain no audio. Individual
          results vary.
        </p>
      </footer>
    </main>
  );
}
