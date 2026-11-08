import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel, upsellsOn } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { Rich } from "../../../../top-hits-midi-bundle/Rich";
import { fontVars } from "../../../../top-hits-midi-bundle/fonts";
import { poppins } from "../../../fonts";
import { Check } from "../../../../top-hits-midi-bundle/sections";
import s from "../../../../top-hits-midi-bundle/order.module.css";
import d from "../../../order.module.css";
import { copyWith } from "../../../copy";
import { pageEdits } from "@/lib/pageTexts";
import { copyEdits } from "../../../texts";
import { funnel } from "../../../funnel";
import { AB_SCRIPT } from "../../../abtest";
import { PAY_SCRIPT } from "../../../payTest";
import { BONUS, BONUS_SCRIPT, BONUS_WORDS } from "../../../bonusTest";
import { BonusBanner, BonusItem } from "../../../BonusClock";
import { Beacon } from "../../../../Beacon";
import { isLang, LANGS } from "../../../i18n";
import { orderOffer } from "../../../offer";
import { OrderForm } from "../../../OrderForm";
import { ReservedTimer } from "../../../ReservedTimer";
import { Tracking } from "../../../Tracking";

// The order page, a copy of ClickFunnels' /spot-available-midi-drum-kit-ad-15m30
// (the same template as the TOP HITS one, so it shares its stylesheet).
// Cached per language and currency; proxy.ts rewrites /midi-drum-kit/order and
// /<lang>/midi-drum-kit/order here. Its prices and add-ons are dashboard →
// Products' (../../../offer.ts), its words can be edited from the funnel map
// (../../../texts.ts); saving either revalidates it.

export const revalidate = 3600;

type Params = Promise<{ lang: string; currency: string }>;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

// The country the checkout reports when the cookie is missing, per currency.
const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "FR", usd: "US" };
const IMG = "/funnels/midi-drum-kit";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const edits = copyEdits(await pageEdits(funnel.slug, lang, true));
  return { title: copyWith(lang, undefined, edits).meta.orderTitle, robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: { params: Params }) {
  const { lang, currency: cur } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(cur as Currency)) notFound();
  const currency = cur as Currency;
  const edits = copyEdits(await pageEdits(funnel.slug, lang, true));
  const t = copyWith(lang, undefined, edits);
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = await orderOffer(lang, currency, product, edits);
  // The add-on the 5-minute bonus gives (none if it's off the form in Products).
  const xp = offer.bumps.find((b) => b.id === BONUS.item);
  const bonusWords = BONUS_WORDS[lang];

  return (
    <main className={`${s.page} ${fontVars} ${poppins.variable}`} lang={lang}>
      {/* The button-colour test: before the buttons paint (see ../../../abtest.ts). */}
      <script dangerouslySetInnerHTML={{ __html: AB_SCRIPT }} />
      {/* The step-2 test (../../../payTest.ts): its letter is what the visit counts under. */}
      <script dangerouslySetInnerHTML={{ __html: PAY_SCRIPT }} />
      {/* The 5-minute bonus test (../../../bonusTest.ts): its letter is what the visit counts under. */}
      <script dangerouslySetInnerHTML={{ __html: BONUS_SCRIPT }} />
      <Tracking value={offer.price} currency={currency} event={null} />
      <Beacon funnel={funnel.slug} page="order" lang={lang} abCookie={BONUS.cookie} />
      <div className={s.redbar}>
        <Rich text={t.orderTopbar} currency={currency} />
      </div>
      <header className={s.header}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.logo} src={`${IMG}/logo.webp`} alt="GRIND STUDIO" width={900} height={103} />
      </header>
      {xp && <BonusBanner w={bonusWords} />}

      <div className={s.secure}>
        <svg viewBox="0 0 448 512" aria-hidden>
          <path
            fill="currentColor"
            d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"
          />
        </svg>
        {t.order.secure}
      </div>

      <div className={`${s.cols} ${d.cols}`}>
        <section className={s.summaryCol}>
          <h2 className={s.colTitle}>{t.order.summaryTitle}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.productImg} src={`${IMG}/product.webp`} alt={t.order.productAlt} width={896} height={1200} fetchPriority="high" />
          {/* The bonus, already in the order while its 5 minutes run (shown to the "bonus-on" half only). */}
          {xp && (
            <div className={d.bonusSlot}>
              <BonusItem w={bonusWords} image={xp.image} price={xp.price} currency={currency} lang={lang} />
            </div>
          )}
          <p className={s.dl}>{t.order.dl}</p>
          <ul className={s.list}>
            {t.order.bullets.map((b) => (
              <li key={b}>
                <Check />
                {b}
              </li>
            ))}
          </ul>
        </section>

        <section id="complete-order">
          <h2 className={s.colTitle}>{t.order.completeTitle}</h2>
          <OrderForm
            form={copyWith(lang, currency, edits).form}
            lang={lang}
            currency={currency}
            country={FALLBACK_COUNTRY[currency]}
            publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null}
            afterOrder={nextStep(product, lang, null)}
            keepCard={upsellsOn(product)}
            offer={offer}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.paylogos} src={`${IMG}/paylogos.webp`} alt={t.order.paylogosAlt} width={190} height={22} />
        </section>
      </div>

      <section className={s.reviews}>
        <div className={s.reviewGrid}>
          {t.order.reviews.map((r) => (
            <figure key={r.name} className={`${s.review} ${d.review}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={`${s.stars} ${d.stars}`} src={`${IMG}/stars.webp`} alt={t.order.starsAlt} width={300} height={99} />
              <blockquote className={`${s.quote} ${d.quote}`}>{r.quote}</blockquote>
              <figcaption className={`${s.who} ${d.who}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${IMG}/${r.avatar}.webp`} alt="" width={50} height={50} />
                <span>
                  <span className={`${s.name} ${d.name}`}>{r.name}</span>
                  <span className={`${s.role} ${d.role}`}>{r.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={s.guarantee}>
        <div className={s.gGrid}>
          <div className={`${s.g} ${d.g}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* The seal says "quality guarantee" in the page's language (tools/quality_badges.js). */}
            <img src={`${IMG}/badge-quality-sm${lang === "en" ? "" : `-${lang}`}.webp`} alt="" width={86} height={86} />
            <div>
              <h3>{t.order.guaranteeTitle}</h3>
              <p>{t.order.guaranteeText}</p>
            </div>
          </div>
          <div className={`${s.g} ${d.g}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/badge-secure.webp`} alt="" width={86} height={86} />
            <div>
              <h3>{t.order.secureTitle}</h3>
              <p>{t.order.secureText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who's behind it (11-06): people, not a faceless store. */}
      <section className={d.about}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo.webp`} alt="GRIND STUDIO" width={900} height={103} loading="lazy" decoding="async" />
        <h3>{t.order.aboutTitle}</h3>
        <p>{t.order.aboutText}</p>
      </section>

      <footer className={`${s.footer} ${d.footer}`}>
        © 2026 {funnel.brand} - <a href={funnel.legal.terms}>{t.footer.terms}</a> - <a href={funnel.legal.privacy}>{t.footer.privacy}</a> -{" "}
        <a href={funnel.legal.refund}>{t.footer.refund}</a> - <b>{t.footer.contact}</b> <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
      </footer>
      <ReservedTimer t={t.order.timer} />
    </main>
  );
}
