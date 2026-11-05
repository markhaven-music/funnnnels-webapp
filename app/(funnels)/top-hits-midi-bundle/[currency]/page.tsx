import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { wordsFor } from "@/lib/words";
import { funnel } from "../funnel";
import { fontVars } from "../fonts";
import { B, Lines } from "../Lines";
import { Rich } from "../Rich";
import { Check, Compare, GetThePack, ValueStack, YesButton } from "../sections";
import { Faq } from "../Faq";
import { StockDate } from "../StockDate";
import { Tracklist } from "../Tracklist";
import { Tracking } from "../Tracking";
import { Beacon } from "../../Beacon";
import { Wistia } from "../Wistia";
import { LANDING } from "../words";
import s from "../landing.module.css";

// The TOP HITS MIDI Bundle sales page, a 1:1 copy of the ClickFunnels one
// (thegrind.studio/top-hits-midi-bundle--2ff37). Words in ../words.ts (lists in
// ../copy.ts), with the dashboard's edits (funnel map → Edit; saving revalidates).
// Served from Vercel's CDN like the Jazz page: one prebuilt page per currency;
// proxy.ts rewrites /top-hits-midi-bundle to /top-hits-midi-bundle/eur|usd.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "TOP HITS MIDI Bundle",
  description: "We copied the chord progressions of 1,000 top hits so you can use them. 1,000 MIDI chord progressions from 496 artists.",
  openGraph: {
    title: "We copied the chord progressions of top hits so you can use them.",
    description: "1,000 MIDI chord progressions, transcribed 1:1 from top hits. By GRIND STUDIO.",
    type: "website",
  },
};

export default async function TopHitsPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // The bundle's price as dashboard → Products has it; saving there revalidates the page.
  const price = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency];
  const w = await wordsFor(funnel.slug, "landing", LANDING, { strict: true });

  return (
    <main className={`${s.page} ${fontVars}`}>
      <Tracking value={price} currency={currency} />
      <Beacon funnel={funnel.slug} page="landing" />
      <div className={s.topbar}>{w.topbar}</div>

      <section className={s.hero}>
        <div className={s.wrap}>
          <p className={s.for}>{w.hero.for}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.logo} src="/funnels/top-hits-midi-bundle/logo.png" alt="GRIND STUDIO" width={900} height={103} />
          <h1 className={s.h1}>
            <Lines text={w.hero.title} />
          </h1>
          <p className={s.swear}>{w.hero.swear}</p>
          <Wistia id={funnel.wistiaId} className={s.video} />

          <div className={s.bullets}>
            <ul>
              <li className={s.lead}>
                <span>
                  <B text={w.bullets.lead} />
                </span>
              </li>
              {w.bullets.left.map((b, i) => (
                <li key={i}>
                  <Check className={s.check} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <ul>
              {w.bullets.right.map((b, i) => (
                <li key={i}>
                  <Check className={s.check} />
                  <span>
                    <Rich text={b} currency={currency} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <ValueStack currency={currency} price={price} w={w.stack} />
          <div className={s.ctaBox}>
            <GetThePack w={w.cta} />
          </div>
          <StockDate className={s.hurry} text={w.stock} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.stockBar} src="/funnels/top-hits-midi-bundle/stock-bar.gif" alt="" width={850} height={54} />
        </div>
      </section>

      <section className={s.dark}>
        <div className={s.wrap}>
          <h2 className={s.quote}>{w.quote}</h2>
        </div>

        <div className={s.letter}>
          <p className={s.today}>{w.today}</p>
          {w.letter.map((line, i) =>
            line.startsWith("# ") ? (
              <p key={i} className={s.letterHead}>
                {line
                  .slice(2)
                  .split("|")
                  .map((part, j) => (
                    <span key={j} style={{ display: "block" }}>
                      {part}
                    </span>
                  ))}
              </p>
            ) : (
              <p key={i}>
                <Rich text={line} currency={currency} hl={s.hl} />
              </p>
            ),
          )}
          <p className={s.sign}>{w.sign}</p>
        </div>

        <div className={s.wrap}>
          <ValueStack currency={currency} price={price} w={w.stack} />
          <YesButton text={w.yes} />

          <div className={s.songsSection}>
            <h2 className={s.songsTitle}>
              <Lines text={w.songsTitle} />
            </h2>
            <Tracklist />
          </div>

          <ValueStack currency={currency} price={price} w={w.stack} />
          <YesButton text={w.yes} />

          <Compare currency={currency} price={price} w={w.compare} />
        </div>
      </section>

      <section className={s.light}>
        <Faq currency={currency} price={price} w={w.faq} />
      </section>

      <footer className={s.footer}>
        © 2026 {funnel.brand} - <a href={funnel.legal.terms}>Terms and Conditions</a> -{" "}
        <a href={funnel.legal.privacy}>Privacy Policy</a> - <a href={funnel.legal.refund}>Refund Policy</a> -{" "}
        <b>Contact:</b> <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
      </footer>
    </main>
  );
}
