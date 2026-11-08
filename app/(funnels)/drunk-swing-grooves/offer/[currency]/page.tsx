import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { getPublishedBlocks } from "@/lib/pages";
import { fill, wordsFor } from "@/lib/words";
import { Beacon } from "../../../Beacon";
import { display } from "../../../jazz-midi-pack/fonts";
import { funnel as jazz } from "../../../jazz-midi-pack/funnel";
import { DEFAULT_SECTIONS, type Section } from "../../../jazz-midi-pack/content";
import { SectionView, isSectionType, type Ctx } from "../../../jazz-midi-pack/sections";
import { Vsl } from "../../../jazz-midi-pack/Vsl";
import j from "../../../jazz-midi-pack/jazz.module.css";
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
// The whole Jazz landing under the top (2026-11-08, "devi mettere tutta la pagina
// funnel dei prodotti... solo con bottoni si e no"): the Jazz VSL, then the
// landing's own published blocks, as the Drum Kit's Jazz upsell shows them
// (midi-drum-kit/[lang]/jazz-offer), with every button to the Jazz order page
// hidden; the only buttons are this page's Yes / No, at the top and the end.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "One more thing · Drunk Swing Grooves",
  robots: { index: false, follow: false },
};

const OFFER = "jazz-pack";
// Not shown: the Jazz hero (this page's top replaces it), "After you pay" (the order
// is paid already) and the final call (this page's own end, with Yes / No).
const SKIP = new Set(["s_hero", "s_after", "s_final"]);
const HIDE: Record<string, string[]> = { s_offer: ["cta", "payWays", "download"] };
const valid = (x: unknown): x is Section =>
  !!x && typeof x === "object" && isSectionType((x as Section).type) && typeof (x as Section).props === "object";

export default async function JazzUpsell({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = product.offers?.find((o) => o.id === OFFER);
  if (!offer) notFound();
  const w = await wordsFor(funnel.slug, "offer", UPSELL, { strict: true });
  const amount = offer.price[currency];
  const price = money(amount, currency);
  const ctx: Ctx = { price, amount, currency, country: currency === "usd" ? "US" : "FR", publishableKey: null, upsell: true };
  const blocks = await getPublishedBlocks(jazz.slug, DEFAULT_SECTIONS, valid, { strict: true });
  const shown = blocks
    .filter((x) => !SKIP.has(x.type))
    .map((found) => {
      const hide = [...((found.props as { hide?: string[] }).hide ?? []), "cta", ...(HIDE[found.type] ?? [])];
      return { ...found, props: { ...found.props, hide } } as Section;
    });
  const voicing = shown.find((x) => x.id === "voicing");
  const compare = shown.find((x) => x.id === "compare");
  const next = nextStep(product, "en", OFFER);
  const buttons = <UpsellButtons funnel={funnel.slug} offer={OFFER} next={next} yes={fill(w.yes, { price })} yesSub={w.yesSub} no={w.no} />;

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
          <div style={{ display: "flex", justifyContent: "center", margin: "0 0 34px" }}>
            <Vsl />
          </div>
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
          {buttons}
        </div>
      </section>

      <div className={`${j.page} ${j.jazz}`}>
        {shown.map((section) => {
          if (section === compare && voicing) return null;
          if (section === voicing && compare) {
            return (
              <div key={section.id} className={j.pair}>
                <SectionView section={voicing} ctx={ctx} />
                <SectionView section={compare} ctx={ctx} />
              </div>
            );
          }
          return <SectionView key={section.id} section={section} ctx={ctx} />;
        })}
      </div>

      <section className={s.hero}>
        <div className={s.narrow}>
          <h2 className={s.h1}>
            Add the Jazz MIDI Pack for <span className={s.hl}>{price}</span>.
          </h2>
          <p className={s.sub}>The pack and its six bonuses go on the same download page as your Drunk Swing Grooves.</p>
          {buttons}
        </div>
      </section>
    </main>
  );
}
