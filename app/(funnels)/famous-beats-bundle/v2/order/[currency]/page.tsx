import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel, upsellsOn, type Bump } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { restate } from "@/lib/restate";
import { fill } from "@/lib/words";
import { CheckoutWidget } from "../../../../jazz-midi-pack/CheckoutWidget";
import { JazzBonusBanner, JazzBonusItem } from "../../../../jazz-midi-pack/BonusClock";
import { bonusScript, bonusTimeScript } from "../../../../jazz-midi-pack/fiveMinBonus";
import { Shield } from "../../../../jazz-midi-pack/sections";
import { Tracking } from "../../../../top-hits-midi-bundle/Tracking";
import { Beacon } from "../../../../Beacon";
import { display } from "../../../../jazz-midi-pack/fonts";
import c from "../../../../jazz-midi-pack/fiveMinBonus.module.css";
import s from "../../../../jazz-midi-pack/jazz.module.css";
import { funnel } from "../../../funnel";
import { FBB_BONUS, FBB_BONUS_WORDS } from "../../../fiveMinBonus";
import { BUMP_COPY, LANDING, ORDER as w } from "../../words";

// The order page, the Jazz order page's (../../../../jazz-midi-pack/order): red bar, the
// 5-minute bonus (the MIDI Drum Kit Expansions, ../../../fiveMinBonus.ts), the box and
// what's in the order beside the white two-step checkout (card / PayPal, tick boxes),
// the guarantee under it. Built at /famous-beats-bundle/v2/order beside the live page.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US" };
const SIGN = { eur: "€", usd: "$" } as const;

export const metadata: Metadata = {
  title: "Order · Famous Beats Bundle · GRIND STUDIO",
  robots: { index: false, follow: false },
};

// The tick boxes, in this order (2026-11-09: the Jazz page's €7 Drunk Swing Grooves, HUSTLE;
// Emotional Keys is one of the six bonuses since "add more bonuses just like midi jazz pack"). Their prices are dashboard → Products'; until Products lists the new ones,
// the code's (preview only: the checkout charges what Products says).
const ORDER_BUMPS = ["swing-grooves", "hustle"];

const BONUS_THUMBS: Record<string, string | null> = {
  "essential-drums": "/funnels/famous-beats-bundle/bonus-essential-360.webp",
  "chord-pack": "/funnels/jazz-midi-pack/bonus-1-360.webp",
  "emotional-keys": "/funnels/jazz-midi-pack/bonus-4-360.webp",
  "drum-loops": "/funnels/jazz-midi-pack/bonus-5-360.webp",
  bible: "/funnels/jazz-midi-pack/bonus-2-360.webp",
  "anime-pack": "/funnels/jazz-midi-pack/bonus-3-360.webp",
};

export default async function OrderPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const f = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const amount = f.price[currency];
  const price = money(amount, currency);
  const t = (text: string) => fill(text, { price, c: SIGN[currency], email: funnel.support });

  const live = f.bumps ?? [];
  const code = funnel.bumps as readonly (Bump & { headline: string })[];
  const bumps = ORDER_BUMPS.flatMap((id) => {
    const b = live.find((x) => x.id === id) ?? code.find((x) => x.id === id);
    if (!b) return [];
    const was = code.find((x) => x.id === id)?.price[currency] ?? b.price[currency];
    const copy = BUMP_COPY[id];
    const known = code.find((x) => x.id === id);
    return [
      {
        id: b.id,
        name: b.name,
        price: b.price[currency],
        pitch: b.pitch,
        image: known?.image ?? b.image,
        ...(copy ? { headline: copy.headline, body: copy.body.map((p) => restate(p, was, b.price[currency])) } : {}),
      },
    ];
  });
  // The add-on the 5-minute bonus gives (Products' price; the code's until it's there).
  const ex = live.find((b) => b.id === FBB_BONUS.item) ?? code.find((b) => b.id === FBB_BONUS.item);
  const fiveMinBonus = ex ? { price: ex.price[currency], cfg: FBB_BONUS, words: FBB_BONUS_WORDS } : undefined;

  return (
    <main className={`${s.page} ${s.jazz} ${s.orderMain} ${display.variable}`}>
      <Tracking value={amount} currency={currency} event={null} product={funnel.product} />
      <Beacon funnel={funnel.slug} page="order" />
      {/* Before anything paints: the normal page for a browser whose 5 minutes are over. */}
      {ex && <script dangerouslySetInnerHTML={{ __html: bonusScript(FBB_BONUS.endKey) }} />}
      <div className={s.bfbar}>
        <b>BLACK FRIDAY:</b> {w.bfbar}
      </div>
      <div className={s.topband}>
        <header className={`${s.wrap} ${s.topbar}`}>
          <a href={`/${funnel.slug}/v2`} className={s.logo} style={{ textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={360} height={42} />
          </a>
          <span className={s.tag}>
            <LockGlyph /> {w.secure}
          </span>
        </header>
      </div>
      {ex && <JazzBonusBanner w={FBB_BONUS_WORDS} cfg={FBB_BONUS} />}

      <section id="buy" className={`${s.sec} ${s.order} ${s.orderPage}`}>
        <div className={s.wrap}>
          <h1 className={s.srOnly}>{w.srTitle}</h1>
          <div className={s.orderGrid}>
            <div className={s.orderSummary}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/funnels/famous-beats-bundle/box3d-520.webp"
                srcSet="/funnels/famous-beats-bundle/box3d-520.webp 520w, /funnels/famous-beats-bundle/box3d-900.webp 900w"
                sizes="(min-width: 1000px) 300px, 56vw"
                width={900}
                height={1110}
                alt="The Famous Beats Bundle box: 320 transcriptions, 32 packs, MIDI format"
                fetchPriority="high"
                style={{ display: "block", width: "min(300px, 56vw)", height: "auto", margin: "0 auto 8px", filter: "drop-shadow(0 24px 36px rgb(0 0 0 / 0.6))" }}
              />
              {ex && fiveMinBonus && (
                <div className={c.slot}>
                  <JazzBonusItem w={FBB_BONUS_WORDS} cfg={FBB_BONUS} price={money(fiveMinBonus.price, currency)} />
                  <script dangerouslySetInnerHTML={{ __html: bonusTimeScript(FBB_BONUS.endKey) }} />
                </div>
              )}
              <ul className={s.stack}>
                {w.stack.map((x) => (
                  <li key={x}>
                    <Tick />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <div className={s.bonusMini}>
                <p className={s.bonusMiniHead}>{w.bonusHead}</p>
                <ul>
                  {LANDING.bonuses.items.map((x) => (
                    <li key={x.id}>
                      {BONUS_THUMBS[x.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={BONUS_THUMBS[x.id]!} width={36} height={54} alt="" loading="lazy" />
                      ) : (
                        <span aria-hidden style={{ display: "grid", placeItems: "center", width: 36, height: 54, background: "#000", color: "#f5b800", fontSize: 10, fontWeight: 800, borderRadius: 2 }}>
                          MIDI
                        </span>
                      )}
                      <span>{x.name}</span>
                      <span className={s.bonusMiniValue}>
                        <s>{money(x.value, currency)}</s> Free
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className={s.totalMini}>
                <span />
                <span>
                  {w.today} <b>{price}</b>
                </span>
              </p>
              <p className={s.guaranteeMini}>
                <Shield /> {w.guarantee}
              </p>
            </div>
            <div className={s.orderForm}>
              <CheckoutWidget
                funnel={funnel.slug}
                product={funnel.product}
                tagline="320 MIDI drum transcriptions from hit records + 6 bonuses"
                image="/funnels/famous-beats-bundle/box3d-160.webp"
                currency={currency}
                country={FALLBACK_COUNTRY[currency]}
                price={amount}
                bump={null}
                bumps={bumps}
                thankYou={funnel.checkout.thankYou}
                afterOrder={nextStep(f, "en", null)}
                keepCard={upsellsOn(f)}
                publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null}
                fiveMinBonus={fiveMinBonus}
                deferStripe
                secureRow={false}
                light
              />
              <ul className={s.proof} style={{ "--n": 3 } as CSSProperties}>
                {w.proof.map((p) => (
                  <li key={p}>
                    <Bold text={p} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.sec} ${s.band}`}>
        <div className={s.wrap}>
          <div className={s.guarantee}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/funnels/midi-drum-kit/badge-quality-sm.webp" alt="14-day quality guarantee" width={150} height={150} loading="lazy" decoding="async" />
            <div>
              <h2 className={s.h2}>{LANDING.guarantee.title}</h2>
              <p className={s.sub}>{t(LANDING.guarantee.text)}</p>
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

function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p))}
    </>
  );
}

function Tick() {
  return (
    <svg className={s.tick} viewBox="0 0 20 20" width="18" height="18" aria-hidden>
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
      <path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7zm2 0h4V5a2 2 0 0 0-4 0z" fill="currentColor" />
    </svg>
  );
}
