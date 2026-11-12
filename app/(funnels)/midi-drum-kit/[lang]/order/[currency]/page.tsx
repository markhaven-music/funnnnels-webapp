import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel, upsellsOn } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { Rich } from "../../../../top-hits-midi-bundle/Rich";
import { fontVars } from "../../../../top-hits-midi-bundle/fonts";
import { display } from "../../../../jazz-midi-pack/fonts";
import j from "../../../../jazz-midi-pack/jazz.module.css";
import rv from "../../../../jazz-midi-pack/reviews.module.css";
import shot from "../../../../jazz-midi-pack/shot.module.css";
import { poppins } from "../../../fonts";
import d from "../../../order.module.css";
import { copyWith } from "../../../copy";
import { pageEdits } from "@/lib/pageTexts";
import { copyEdits } from "../../../texts";
import { funnel } from "../../../funnel";
import { BUTTON_SCRIPT } from "../../../abtest";
import { LP } from "../../../landingTest";
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

// The order page. Until 2026-11-12 a copy of ClickFunnels' /spot-available-midi-drum-kit-ad-15m30;
// now the Jazz MIDI Pack's order page with the Drum Kit's products, words and orange: it is drawn
// with the Jazz page's own stylesheets (jazz.module.css, checkout.module.css, btn.module.css,
// reviews.module.css), so font sizes and column widths are the Jazz page's and stay so ("font sizes
// of the page are different between the two. Also column widths. Make them the same as JAZZ MIDI
// PACK ORDER PAGE"). No card logos ("remove card images").
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
    <main className={`${j.page} ${j.jazz} ${j.orderMain} ${d.dk} ${fontVars} ${poppins.variable} ${display.variable}`} lang={lang}>
      {/* The button colour the test kept (orange), before the buttons paint (../../../abtest.ts). */}
      <script dangerouslySetInnerHTML={{ __html: BUTTON_SCRIPT }} />
      {/* The step-2 test (../../../payTest.ts): its letter is what the visit counts under. */}
      <script dangerouslySetInnerHTML={{ __html: PAY_SCRIPT }} />
      {/* The 5-minute bonus test (../../../bonusTest.ts): its letter is what the visit counts under. */}
      <script dangerouslySetInnerHTML={{ __html: BONUS_SCRIPT }} />
      <Tracking value={offer.price} currency={currency} event={null} />
      <Beacon funnel={funnel.slug} page="order" lang={lang} abCookie={LP.cookie} />
      <div className={j.bfbar}>
        <Rich text={t.orderTopbar} currency={currency} />
      </div>
      <div className={j.topband}>
        <header className={`${j.wrap} ${j.topbar}`}>
          <a href={paths(lang).landing} className={j.logo} style={{ textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/logo.webp`} alt="GRIND STUDIO" width={360} height={42} />
          </a>
          <span className={j.tag}>
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
              <path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7zm2 0h4V5a2 2 0 0 0-4 0z" fill="currentColor" />
            </svg>
            {t.order.secure}
          </span>
        </header>
      </div>
      {xp && <BonusBanner w={bonusWords} />}

      <section className={`${j.sec} ${j.order} ${j.orderPage}`}>
        <div className={j.wrap}>
          {/* No heading above the box and the form; the h1 is for screen readers. */}
          <h1 className={j.srOnly}>{t.meta.orderTitle}</h1>
          <div className={j.orderGrid}>
            <div className={j.orderSummary}>
              {/* The kit's box (the one on the new landing), set as the Jazz page sets its own. */}
              <div className={`${shot.stage} ${shot.box}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={shot.img} src={`${IMG}/kit-box-v3-640.webp`} alt={t.order.productAlt} width={640} height={824} fetchPriority="high" />
                <span className={shot.floor} aria-hidden />
              </div>
              {/* The bonus, already in the order while its 5 minutes run (shown to the "bonus-on" half only). */}
              {xp && (
                <div className={d.bonusSlot}>
                  <BonusItem w={bonusWords} image={xp.image} price={xp.price} currency={currency} lang={lang} />
                  {/* The countdown from this browser's known end, before the page's scripts run (no 05:00 on a refresh). */}
                  <script dangerouslySetInnerHTML={{ __html: BONUS_TIME_SCRIPT }} />
                </div>
              )}
              <OrderStack w={stack} price={offer.price} currency={currency} lang={lang} />
            </div>

            <div id="complete-order" className={j.orderForm}>
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
              <OrderProof w={stack} currency={currency} />
            </div>
          </div>
        </div>
      </section>

      {/* The reviews as the Jazz page sets them: stars, the quote, the name and role. */}
      <section className={j.sec}>
        <div className={j.wrap}>
          <h2 className={j.h2}>{t.order.reviewsTitle}</h2>
          <ul className={rv.grid}>
            {t.order.reviews.map((r) => (
              <li key={r.name} className={rv.item}>
                <span className={rv.stars} role="img" aria-label={t.order.starsAlt}>
                  ★★★★★
                </span>
                <p className={rv.quote}>{r.quote.replace(/^["“”]|["“”]$/g, "")}</p>
                <p className={rv.who}>
                  <b>{r.name}</b>
                  <span className={rv.role}>{r.role}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The guarantee with the Jazz page's seal (14 days, in the page's language), then how the payment is handled. */}
      <section className={`${j.sec} ${j.band}`}>
        <div className={`${j.wrap} ${d.pledges}`}>
          <div className={j.guarantee}>
            <svg className={j.seal} viewBox="0 0 200 200" role="img" aria-label={t.order.guaranteeTitle}>
              <defs>
                <linearGradient id="dk-seal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffb866" />
                  <stop offset=".5" stopColor="#f5851f" />
                  <stop offset="1" stopColor="#c85a06" />
                </linearGradient>
                <path id="dk-seal-arc" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
              </defs>
              <circle cx="100" cy="100" r="98" fill="url(#dk-seal)" />
              <circle cx="100" cy="100" r="88" fill="#111" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="url(#dk-seal)" strokeWidth="1.5" />
              <text className={j.sealRing} fill="#ffa13d">
                <textPath href="#dk-seal-arc" textLength="462">
                  {t.order.sealRing}
                </textPath>
              </text>
              <text x="100" y="108" textAnchor="middle" className={j.sealDays} fill="#ffa13d">
                14
              </text>
              <text x="100" y="134" textAnchor="middle" className={j.sealUnit} fill="#fff">
                {t.order.sealDays}
              </text>
            </svg>
            <div>
              <h2 className={j.h2}>{t.order.guaranteeTitle}</h2>
              <p className={j.sub}>{t.order.guaranteeText}</p>
            </div>
          </div>
          <div className={j.guarantee}>
            <svg className={j.seal} viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r="98" fill="url(#dk-seal)" />
              <circle cx="100" cy="100" r="88" fill="#111" />
              <path d="M72 92V76a28 28 0 0 1 56 0v16h6a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6H66a6 6 0 0 1-6-6V98a6 6 0 0 1 6-6zm14 0h28V76a14 14 0 0 0-28 0z" fill="#ffa13d" />
            </svg>
            <div>
              <h2 className={j.h2}>{t.order.secureTitle}</h2>
              <p className={j.sub}>{t.order.secureText}</p>
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

      <footer className={`${j.footer} ${d.footer}`}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms}>{t.footer.terms}</a> · <a href={funnel.legal.privacy}>{t.footer.privacy}</a> ·{" "}
          <a href={funnel.legal.refund}>{t.footer.refund}</a> · <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
      </footer>
      <ReservedTimer t={t.order.timer} />
    </main>
  );
}
