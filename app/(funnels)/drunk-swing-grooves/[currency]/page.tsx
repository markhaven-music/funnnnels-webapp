import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { fill, wordsFor } from "@/lib/words";
import { Beacon } from "../../Beacon";
import { Cta } from "../../jazz-midi-pack/Cta";
import { display } from "../../jazz-midi-pack/fonts";
import { Tracking } from "../../top-hits-midi-bundle/Tracking";
import { funnel } from "../funnel";
import { AbPlayer, Clip } from "../Players";
import { Rich } from "../Rich";
import { LANDING } from "../words";
import s from "../landing.module.css";

// The Drunk Swing Grooves sales page. Words in ../words.ts (claims in ../BRIEF.md),
// with the dashboard's edits. One prebuilt page per currency on Vercel's CDN, like
// the other funnels: proxy.ts rewrites /drunk-swing-grooves to /drunk-swing-grooves/eur|usd.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Drunk Swing Grooves · GRIND STUDIO",
  description: "That drunk feeling, in MIDI: 80 drum grooves with the J Dilla-style swing of lofi and neo soul. Snare on the beat, everything else laid back.",
  openGraph: {
    title: "That drunk feeling. In MIDI, ready to drag in.",
    description: "80 MIDI drum grooves in 4 feels, 31 groove templates. By GRIND STUDIO.",
    type: "website",
    images: [{ url: "/funnels/drunk-swing-grooves/share.webp", width: 1200, height: 630 }],
  },
};

const FEEL_FILES = ["feel-light", "feel-medium", "feel-heavy", "feel-quintuplet"];

export default async function DrunkSwingGrooves({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // The price as dashboard → Products has it; saving there revalidates the page.
  const price = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency];
  const w = await wordsFor(funnel.slug, "landing", LANDING, { strict: true });
  const note = fill(w.cta.note, { price: money(price, currency) });
  const cta = <Cta label={w.cta.label} note={note} href={funnel.checkout.orderPage} className={s.cta} />;

  return (
    <main className={`${s.page} ${display.variable}`}>
      <Tracking value={price} currency={currency} product={funnel.product} />
      <Beacon funnel={funnel.slug} page="landing" />

      <section className={s.hero}>
        <div className={s.narrow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.logo} src="/funnels/drunk-swing-grooves/logo.webp" alt="GRIND STUDIO" width={180} height={21} />
          <h1 className={s.h1}>
            <Rich text={w.hero.title} />
          </h1>
          <p className={s.sub}>
            <Rich text={w.hero.sub} />
          </p>
          <AbPlayer words={w.ab} />
          <ul className={s.bullets}>
            {w.bullets.map((b, i) => (
              <li key={i}>
                <Tick />
                <span>
                  <Rich text={b} />
                </span>
              </li>
            ))}
          </ul>
          {cta}
          <div className={s.proof}>
            {w.proof.map(([big, small], i) => (
              <p key={i}>
                <b>{big}</b> {small}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.panel}>
          <GrooveGrid straight={w.why.straight} drunk={w.why.drunk} />
          <div className={s.panelCopy}>
            <h2 className={s.h2}>{w.why.title}</h2>
            {w.why.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.feels.title}</h2>
          <ul className={s.feels}>
            {w.feels.items.map(([name, text], i) => (
              <li key={name}>
                <Clip file={FEEL_FILES[i]} label={name} />
                <div>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className={s.caption}>{w.feels.caption}</p>
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.inside.title}</h2>
          <ol className={s.inside}>
            {w.inside.items.map(([name, text], i) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
                {i === 2 && (
                  <div className={s.inlineClip}>
                    <Clip file="bonus" label={name} />
                    <span>{w.inside.bonusCaption}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.versions.title}</h2>
          <div className={s.versions}>
            {w.versions.items.map(([name, text]) => (
              <div key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          {cta}
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.narrow}>
          <div className={s.promise}>
            <div>
              <h2 className={s.h3}>{w.guarantee.title}</h2>
              <p>{fill(w.guarantee.text, { email: funnel.support })}</p>
            </div>
            <div>
              <h2 className={s.h3}>{w.license.title}</h2>
              <p>{w.license.text}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.faq.title}</h2>
          <div className={s.faq}>
            {w.faq.items.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.final} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h1}>{w.final.title}</h2>
          {cta}
        </div>
      </section>

      <footer className={s.footer}>
        © 2026 {funnel.brand} · <a href={funnel.legal.terms}>Terms</a> · <a href={funnel.legal.privacy}>Privacy</a> ·{" "}
        <a href={funnel.legal.refund}>Refund policy</a> · <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
      </footer>
    </main>
  );
}

function Tick() {
  return (
    <svg className={s.tick} viewBox="0 0 24 24" aria-hidden width="22" height="22">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// One bar of Dusty Boom Bap, quantized and drunk (its Medium feel's shape, rounded):
// the snare stays on the grid, the hats and the kick move. Drawn in HTML, no image.
const HATS = [0, 2, 4, 6, 8, 10, 12, 14];
const HAT_OFF = [-0.03, 0.26, -0.02, 0.3, -0.04, 0.24, -0.01, 0.28];
const KICKS = [0, 10];
const KICK_OFF = [0.04, 0.2];

function GrooveGrid({ straight, drunk }: { straight: string; drunk: string }) {
  const rows = (late: boolean) => [
    { name: "Hats", hits: HATS.map((step, i) => ({ step, off: late ? HAT_OFF[i] : 0 })) },
    { name: "Snare", hits: [4, 12].map((step) => ({ step, off: 0, snare: true })) },
    { name: "Kick", hits: KICKS.map((step, i) => ({ step, off: late ? KICK_OFF[i] : 0 })) },
  ];
  return (
    <div className={s.gridPair} aria-hidden>
      {[false, true].map((late) => (
        <div key={String(late)} className={s.grid}>
          <p className={late ? s.gridDrunk : s.gridStraight}>{late ? drunk : straight}</p>
          {rows(late).map((r) => (
            <div key={r.name} className={s.gridRow}>
              <span className={s.gridName}>{r.name}</span>
              <div className={s.gridLane}>
                {Array.from({ length: 16 }, (_, i) => (
                  <i key={i} className={i % 4 === 0 ? s.beatLine : s.stepLine} style={{ left: `${(i / 16) * 100}%` }} />
                ))}
                {r.hits.map((h, i) => (
                  <b
                    key={i}
                    className={"snare" in h ? s.hitSnare : late ? s.hitDrunk : s.hit}
                    style={{ left: `${((h.step + h.off) / 16) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
