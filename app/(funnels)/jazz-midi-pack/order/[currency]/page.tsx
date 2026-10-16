import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { CURRENCIES, formatPrice, type Currency } from "@/lib/geo";
import { getPublishedBlocks } from "@/lib/pages";
import { funnel } from "../../funnel";
import { DEFAULT_SECTIONS, type Section, type SectionProps } from "../../content";
import { Checkout, OrderSummary, Shield, fill, isSectionType, type Ctx } from "../../sections";
import { Tracking } from "../../Tracking";
import s from "../../jazz.module.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

// The order page, like the ClickFunnels funnels: every CTA on the landing comes
// here. Cached on the CDN per currency like the landing (proxy.ts rewrites
// /jazz-midi-pack/order); publishing from the editor refreshes it too. The
// stack, guarantee and bonuses are the landing's own sections, so an edit there
// shows here. No reviews (none exist yet) and no timer (the brief rules out
// fake urgency).

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };

export const metadata: Metadata = {
  title: "Order · Jazz MIDI Pack · GRIND STUDIO",
  robots: { index: false, follow: false },
};

const valid = (b: unknown): b is Section =>
  !!b && typeof b === "object" && isSectionType((b as Section).type) && typeof (b as Section).props === "object";

function pick<T extends Section["type"]>(sections: Section[], type: T): SectionProps[T] {
  const hit = sections.find((x) => x.type === type) ?? DEFAULT_SECTIONS.find((x) => x.type === type)!;
  return hit.props as SectionProps[T];
}

export default async function OrderPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const amount = funnel.price[currency];
  const sections = await getPublishedBlocks(funnel.slug, DEFAULT_SECTIONS, valid, { strict: true });
  const ctx: Ctx = {
    price: formatPrice(amount, currency),
    amount,
    currency,
    country: FALLBACK_COUNTRY[currency],
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
  };
  const offer = pick(sections, "s_offer");
  const guarantee = pick(sections, "s_guarantee");

  return (
    <main className={`${s.page} ${serif.variable}`}>
      <Tracking value={amount} currency={currency} page="order" />
      <div className={s.topband}>
        <header className={`${s.wrap} ${s.topbar}`}>
          <a href={`/${funnel.slug}`} className={s.logo} style={{ textDecoration: "none" }}>
            GRIND <span className={s.dia}>◆</span> STUDIO
          </a>
          <span className={s.tag}>
            <LockGlyph /> Secure checkout
          </span>
        </header>
      </div>

      <section id="buy" className={`${s.sec} ${s.order} ${s.orderPage}`}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <p className={s.eyebrow}>{funnel.product}</p>
            <h1 className={s.h2}>Complete your order.</h1>
            <p className={s.sub}>
              {ctx.price}, one payment. Your download buttons appear right after you pay.
            </p>
          </div>
          <div className={s.orderGrid}>
            <OrderSummary p={offer} ctx={ctx} />
            <div className={s.orderForm}>
              <Checkout ctx={ctx} />
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.sec} ${s.band}`}>
        <div className={`${s.wrap} ${s.col} ${s.guarantee}`}>
          <Shield big />
          <h2 className={s.h2}>{fill(guarantee.title, ctx)}</h2>
          <p className={s.sub}>{fill(guarantee.text, ctx)}</p>
        </div>
      </section>

      <footer className={s.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={funnel.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={funnel.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
      </footer>
    </main>
  );
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7zm2 0h4V5a2 2 0 0 0-4 0z" fill="currentColor" />
    </svg>
  );
}
