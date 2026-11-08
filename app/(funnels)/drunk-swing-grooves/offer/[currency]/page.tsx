import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { fill, wordsFor } from "@/lib/words";
import { Beacon } from "../../../Beacon";
import { display } from "../../../jazz-midi-pack/fonts";
import { Tracking } from "../../../top-hits-midi-bundle/Tracking";
import { funnel } from "../../funnel";
import { Clip } from "../../Players";
import { Rich } from "../../Rich";
import { UpsellButtons } from "../../UpsellButtons";
import { UPSELL } from "../../words";
import s from "../../landing.module.css";

// Upsell 1 after the Drunk Swing Grooves order: the Jazz MIDI Pack ("jazz-pack"),
// one click on the card or PayPal just used (../../UpsellButtons.tsx). Its claims
// are the Jazz MIDI Pack's (../../../jazz-midi-pack/BRIEF.md). The price is
// dashboard → Products' (funnel_items upsell row). One page per currency;
// proxy.ts rewrites /drunk-swing-grooves/offer here.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "One more thing · Drunk Swing Grooves",
  robots: { index: false, follow: false },
};

const OFFER = "jazz-pack";

export default async function JazzUpsell({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = product.offers?.find((o) => o.id === OFFER);
  if (!offer) notFound();
  const w = await wordsFor(funnel.slug, "offer", UPSELL, { strict: true });
  const price = money(offer.price[currency], currency);

  return (
    <main className={`${s.page} ${display.variable}`}>
      <Tracking value={offer.price[currency]} currency={currency} event={null} product={offer.name} />
      <Beacon funnel={funnel.slug} page="upsell-1" />
      <p className={s.upBar}>{w.bar}</p>
      <section className={s.hero}>
        <div className={s.narrow}>
          <h1 className={s.h1}>
            <Rich text={w.title} />
          </h1>
          <p className={s.sub}>{w.sub}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.upBox} src="/funnels/jazz-midi-pack/box-520.webp" alt="Jazz MIDI Pack by GRIND STUDIO" width={520} height={520} fetchPriority="high" />
          <ul className={s.bullets}>
            {w.bullets.map((b, i) => (
              <li key={i}>
                <svg className={s.tick} viewBox="0 0 24 24" aria-hidden width="22" height="22">
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  <Rich text={b} />
                </span>
              </li>
            ))}
          </ul>
          <div className={s.inlineClip} style={{ justifyContent: "center", margin: "0 auto 34px", maxWidth: 520, textAlign: "left" }}>
            <Clip file="bonus" label="Royal Road over a Drunk Swing groove" />
            <span>{w.listen}</span>
          </div>
          <UpsellButtons
            funnel={funnel.slug}
            offer={OFFER}
            next={nextStep(product, "en", OFFER)}
            yes={fill(w.yes, { price })}
            yesSub={w.yesSub}
            no={w.no}
          />
        </div>
      </section>
    </main>
  );
}
