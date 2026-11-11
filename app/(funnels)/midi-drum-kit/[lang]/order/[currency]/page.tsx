import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel, upsellsOn } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { Rich } from "../../../../top-hits-midi-bundle/Rich";
import { fontVars } from "../../../../top-hits-midi-bundle/fonts";
import { poppins } from "../../../fonts";
import s from "../../../../top-hits-midi-bundle/order.module.css";
import d from "../../../order.module.css";
import { copyWith } from "../../../copy";
import { pageEdits } from "@/lib/pageTexts";
import { copyEdits } from "../../../texts";
import { funnel } from "../../../funnel";
import { AB, AB_SCRIPT } from "../../../abtest";
import { PAY_SCRIPT } from "../../../payTest";
import { BONUS, BONUS_SCRIPT, BONUS_TIME_SCRIPT, BONUS_WORDS } from "../../../bonusTest";
import { BonusBanner, BonusItem } from "../../../BonusClock";
import { Beacon } from "../../../../Beacon";
import { isLang, LANGS, paths } from "../../../i18n";
import { orderOffer } from "../../../offer";
import { OrderForm } from "../../../OrderForm";
import { ReservedTimer } from "../../../ReservedTimer";
import { Tracking } from "../../../Tracking";
import { OrderProof, OrderStack } from "../../../OrderStack";

// The order page, a copy of ClickFunnels' /spot-available-midi-drum-kit-ad-15m30
// (the same template as the TOP HITS one, so it shares its stylesheet).
// Cached per language and currency; proxy.ts rewrites /midi-drum-kit/order and
// /<lang>/midi-drum-kit/order here. Its prices and add-ons are dashboard →
// Products' (../../../offer.ts), its words can be edited from the funnel map
// (../../../texts.ts); saving either revalidates it.

export const revalidate = 3600;

// The page runs under the iPhone's home bar, so the docked pay bar reaches the
// screen's edge (its own padding keeps the words above the bar: order.module.css .payBarBtn).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

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
  const stack = copyWith(lang, currency, edits).order.stack;

  return (
    <main className={`${s.page} ${d.jazzLike} ${fontVars} ${poppins.variable}`} lang={lang}>
      {/* The button-colour test: before the buttons paint (see ../../../abtest.ts). */}
      <script dangerouslySetInnerHTML={{ __html: AB_SCRIPT }} />
      {/* The step-2 test (../../../payTest.ts): its letter is what the visit counts under. */}
      <script dangerouslySetInnerHTML={{ __html: PAY_SCRIPT }} />
      {/* The 5-minute bonus test (../../../bonusTest.ts): its letter is what the visit counts under. */}
      <script dangerouslySetInnerHTML={{ __html: BONUS_SCRIPT }} />
      <Tracking value={offer.price} currency={currency} event={null} />
      <Beacon funnel={funnel.slug} page="order" lang={lang} abCookie={AB.cookie} />
      <div className={s.redbar}>
        <Rich text={t.orderTopbar} currency={currency} />
      </div>
      {/* The Jazz order page's header: the wordmark on the left, "Secure checkout" on the right. */}
      <div className={d.topband}>
        <header className={d.topbar}>
          <a href={paths(lang).landing} className={d.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/logo.webp`} alt="GRIND STUDIO" width={360} height={42} />
          </a>
          <span className={d.tag}>
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
              <path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7zm2 0h4V5a2 2 0 0 0-4 0z" fill="currentColor" />
            </svg>
            {t.order.secure}
          </span>
        </header>
      </div>
      {xp && <BonusBanner w={bonusWords} />}

      {/* As the Jazz order page (2026-11-12): the summary on the left, the checkout on the right and
          sticky on a computer; on a phone the checkout first. No column titles; the h1 is for screen readers. */}
      <h1 className={d.srOnly}>{t.meta.orderTitle}</h1>
      <div className={d.grid}>
        <section className={d.summary}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={d.kitBox} src={`${IMG}/kit-box-640.webp`} alt={t.order.productAlt} width={640} height={879} fetchPriority="high" />
          {/* The bonus, already in the order while its 5 minutes run (shown to the "bonus-on" half only). */}
          {xp && (
            <div className={d.bonusSlot}>
              <BonusItem w={bonusWords} image={xp.image} price={xp.price} currency={currency} lang={lang} />
              {/* The countdown from this browser's known end, before the page's scripts run (no 05:00 on a refresh). */}
              <script dangerouslySetInnerHTML={{ __html: BONUS_TIME_SCRIPT }} />
            </div>
          )}
          <OrderStack w={stack} price={offer.price} currency={currency} lang={lang} />
        </section>

        <section id="complete-order" className={d.checkout}>
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
          <OrderProof w={stack} currency={currency} />
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
