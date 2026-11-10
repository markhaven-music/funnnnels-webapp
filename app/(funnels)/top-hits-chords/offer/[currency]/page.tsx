import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { getPublishedBlocks } from "@/lib/pages";
import { fill } from "@/lib/words";
import { Beacon } from "../../../Beacon";
import { display } from "../../../jazz-midi-pack/fonts";
import { funnel as jazz } from "../../../jazz-midi-pack/funnel";
import { DEFAULT_SECTIONS, type Section } from "../../../jazz-midi-pack/content";
import { SectionView, isSectionType, type Ctx } from "../../../jazz-midi-pack/sections";
import { Vsl } from "../../../jazz-midi-pack/Vsl";
import j from "../../../jazz-midi-pack/jazz.module.css";
import { Rich } from "../../../drunk-swing-grooves/Rich";
import { UpsellButtons } from "../../../drunk-swing-grooves/UpsellButtons";
import s from "../../../drunk-swing-grooves/landing.module.css";
import { Tracking } from "../../../top-hits-midi-bundle/Tracking";
import { funnel } from "../../funnel";
import { UPSELL as w } from "../../words";

// Upsell 1 after this funnel's TOP HITS order (2026-11-10, "crea nuovo funnel … con TUTTO"): the Jazz
// MIDI Pack ("jazz-pack"), one click on the card or PayPal just used, the page the Drunk
// Swing Grooves funnel has (../../../drunk-swing-grooves/offer): this page's top, the Jazz
// VSL, then the Jazz landing's own published blocks with every button to the Jazz order page
// hidden; the only buttons are this page's Yes / No, at the top and the end. Its claims are
// the Jazz MIDI Pack's (../../../jazz-midi-pack/BRIEF.md). The price is dashboard → Products'
// (funnel_items upsell row "jazz-pack"): until that row exists the offer isn't part of the
// funnel and this page is a 404. One page per currency; proxy.ts rewrites
// /top-hits-chords/offer here.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "One more thing · TOP HITS MIDI Bundle",
  robots: { index: false, follow: false },
};

const OFFER = "jazz-pack";
// Not shown: the Jazz hero (this page's top replaces it), "After you pay" (the order is paid
// already), the final call (this page's own end), and the Jazz pack's bonuses and value
// stack: a TOP HITS buyer has five of those six bonuses already.
const SKIP = new Set(["s_hero", "s_after", "s_final", "s_bonuses", "s_offer"]);
const valid = (x: unknown): x is Section =>
  !!x && typeof x === "object" && isSectionType((x as Section).type) && typeof (x as Section).props === "object";

export default async function JazzUpsell({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = product.offers?.find((o) => o.id === OFFER);
  if (!offer) notFound();
  const amount = offer.price[currency];
  const price = money(amount, currency);
  const ctx: Ctx = { price, amount, currency, country: currency === "usd" ? "US" : "FR", publishableKey: null, upsell: true };
  const blocks = await getPublishedBlocks(jazz.slug, DEFAULT_SECTIONS, valid, { strict: true });
  const shown = blocks
    .filter((x) => !SKIP.has(x.type))
    .map((found) => {
      const hide = [...((found.props as { hide?: string[] }).hide ?? []), "cta"];
      return { ...found, props: { ...found.props, hide } } as Section;
    });
  const voicing = shown.find((x) => x.id === "voicing");
  const compare = shown.find((x) => x.id === "compare");
  const next = nextStep(product, "en", OFFER);
  const buttons = <UpsellButtons funnel={funnel.slug} offer={OFFER} next={next} yes={fill(w.yes, { price })} yesSub={w.yesSub} no={w.no} />;

  return (
    <main className={`${s.page} ${display.variable}`}>
      <Tracking value={amount} currency={currency} event={null} product={offer.name} />
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
          <p className={s.sub}>{w.end}</p>
          {buttons}
        </div>
      </section>
    </main>
  );
}
