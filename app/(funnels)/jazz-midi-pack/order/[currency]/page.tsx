import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { getPublishedBlocks } from "@/lib/pages";
import { funnel } from "../../funnel";
import { DEFAULT_SECTIONS, type Section, type SectionProps } from "../../content";
import { Checkout, OrderSummary, Proof, Seal, fill, isSectionType, type Ctx } from "../../sections";
import { Tracking } from "../../Tracking";
import { splitName } from "../../../_kit/KitBox";
import { Beacon } from "../../../Beacon";
import { display } from "../../fonts";
import s from "../../jazz.module.css";

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
  // Its price (and an add-on, if Jazz is given one) as dashboard → Products has it.
  const f = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const amount = f.price[currency];
  const sections = await getPublishedBlocks(funnel.slug, DEFAULT_SECTIONS, valid, { strict: true });
  const ctx: Ctx = {
    price: money(amount, currency),
    amount,
    currency,
    country: FALLBACK_COUNTRY[currency],
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    bump: f.bump ? { name: f.bump.name, price: f.bump.price[currency], pitch: f.bump.pitch, cover: splitName(f.bump.name) } : null,
  };
  const offer = pick(sections, "s_offer");
  const guarantee = pick(sections, "s_guarantee");

  return (
    <main className={`${s.page} ${s.jazz} ${s.orderMain} ${display.variable}`}>
      <Tracking value={amount} currency={currency} page="order" />
      <Beacon funnel={funnel.slug} page="order" />
      <div className={s.topband}>
        <header className={`${s.wrap} ${s.topbar}`}>
          <a href={`/${funnel.slug}`} className={s.logo} style={{ textDecoration: "none" }}>
            <img src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={360} height={42} />
          </a>
          <span className={s.tag}>
            <LockGlyph /> Secure checkout
          </span>
        </header>
      </div>

      <section id="buy" className={`${s.sec} ${s.order} ${s.orderPage}`}>
        <div className={s.wrap}>
          {/* No heading above the box and the form ("you can eliminate it"); the h1 stays for screen readers. */}
          <h1 className={s.srOnly}>Complete your Jazz MIDI Pack order</h1>
          <div className={s.orderGrid}>
            <OrderSummary p={offer} ctx={ctx} />
            <div className={s.orderForm}>
              <Checkout ctx={ctx} />
              <Proof />
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.sec} ${s.band}`}>
        <div className={s.wrap}>
          <div className={s.guarantee}>
            <Seal />
            <div>
              <h2 className={s.h2}>{fill(guarantee.title, ctx)}</h2>
              <p className={s.sub}>{fill(guarantee.text, ctx)}</p>
            </div>
          </div>
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
