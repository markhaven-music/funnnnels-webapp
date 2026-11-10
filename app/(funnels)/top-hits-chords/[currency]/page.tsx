import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment, type CSSProperties } from "react";
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { fill, wordsFor } from "@/lib/words";
import { Beacon } from "../../Beacon";
import { Cta } from "../../jazz-midi-pack/Cta";
import { display } from "../../jazz-midi-pack/fonts";
import { Tracking } from "../../top-hits-midi-bundle/Tracking";
import { funnel } from "../funnel";
import { BigRoll, HeroRolls } from "../Rolls";
import { SongPlayer } from "../SongPlayer";
import { LANDING } from "../words";
import first from "../rolls.json";
import s from "../../jazz-midi-pack/jazz.module.css";
import bn from "../../jazz-midi-pack/bonus.module.css";
import vs from "../../jazz-midi-pack/value.module.css";
import t from "../th.module.css";

// The TOP HITS MIDI Bundle sales page of its new funnel (2026-11-10, "crea nuovo funnel per
// TOP HITS MIDI Bundle con TUTTO", "crea un funnel a parte"): built on the Jazz page's own CSS
// and in its order, as the Famous Beats page is (../../famous-beats-bundle/[currency]). Top to
// bottom: red bar, hero (logo + tag,
// pre-title, headline, sub, the video, four playable files, bullets, big key, ticks, DAW
// strip, proof), the letter, the product panel, what you get beside a playable roll, the
// player of every file, how it works beside the folder path, what's inside, the ✓/✗ chart,
// six bonuses with covers, the value stack, the seal and the license, after you pay beside
// the download list, FAQ, the final key. Words in ../words.ts (with the
// dashboard's edits: funnel map → Edit), claims in ../BRIEF.md.
// The ClickFunnels copy of this product's page is its own funnel (../../top-hits-midi-bundle).

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

const DIR = "/funnels/top-hits-midi-bundle";

export const metadata: Metadata = {
  title: "TOP HITS MIDI Bundle · GRIND STUDIO",
  description: "The chords behind 1,000 hits, transcribed note for note into MIDI. The Weeknd, Taylor Swift, SZA, Drake, Bad Bunny and more. Any DAW.",
  openGraph: {
    title: "The chords behind 1,000 hits. Note for note, in MIDI.",
    description: "1,000 chord progressions from hit songs + 6 bonuses, by GRIND STUDIO. Drag into your DAW.",
    type: "website",
    url: "https://m.thegrind.studio/top-hits-chords",
    images: [{ url: `https://m.thegrind.studio${DIR}/hero-880.webp`, width: 880, height: 663 }],
  },
};

// The Buy buttons take the ad's tags to the order page, so neo credits the sale to the
// ad that sold (the Jazz page's lesson, ../../jazz-midi-pack/abtest.ts AB_CARRY_SCRIPT).
const CARRY = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "fbclid", "gclid"];
const CARRY_SCRIPT = `(function(){try{document.addEventListener('click',function(e){try{
var a=e.target&&e.target.closest&&e.target.closest('a[data-cta]');if(!a)return;
var u=new URL(a.getAttribute('href'),location.href);if(u.origin!==location.origin)return;
var q=new URLSearchParams(location.search),k=${JSON.stringify(CARRY)};
for(var i=0;i<k.length;i++){var x=q.get(k[i]);if(x&&!u.searchParams.has(k[i]))u.searchParams.set(k[i],x);}
a.setAttribute('href',u.pathname+u.search+u.hash);}catch(e){}},true);}catch(e){}})();`;

const SIGN = { eur: "€", usd: "$" } as const;
const JAZZ = "/funnels/jazz-midi-pack";
// The bonuses' covers, as the Jazz and Famous Beats pages have them.
const COVERS: Record<string, [string, string]> = {
  bible: [`${JAZZ}/bonus-2-360.webp`, `${JAZZ}/bonus-2-640.webp`],
  "chord-pack": [`${JAZZ}/bonus-1-360.webp`, `${JAZZ}/bonus-1-640.webp`],
  "anime-pack": [`${JAZZ}/bonus-3-360.webp`, `${JAZZ}/bonus-3-640.webp`],
  "emotional-keys": [`${JAZZ}/bonus-4-360.webp`, `${JAZZ}/bonus-4-640.webp`],
  "drum-loops": [`${JAZZ}/bonus-5-360.webp`, `${JAZZ}/bonus-5-640.webp`],
  "essential-drums": ["/funnels/famous-beats-bundle/bonus-essential-360.webp", "/funnels/famous-beats-bundle/bonus-essential-640.webp"],
};
// The file the "how it works" picture shows: its place in the bundle and its first notes.
const TREE = first.blinding;

export default async function TopHitsLanding({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // The page's words, with the dashboard's edits (funnel map → Edit).
  const w = await wordsFor(funnel.slug, "landing", LANDING, { strict: true });
  // The price as dashboard → Products has it.
  const amount = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency];
  const price = money(amount, currency);
  // What one progression costs at that price (1,000 files).
  const per = `${SIGN[currency]}${(amount / funnel.counts.progressions).toFixed(2)}`;
  const tx = (text: string) => fill(text, { price, per, c: SIGN[currency], email: funnel.support });
  const order = `/${funnel.slug}/order`;
  const inner = `${price} · instant download`;
  const bonusValue = w.bonuses.items.reduce((sum, b) => sum + b.value, 0);
  const total = bonusValue + amount;
  const worth = (n: number) => money(n, currency);
  const key = (className: string, label = w.cta.label, note?: string) => <Cta label={label} inner={inner} href={order} className={className} note={note} />;

  return (
    <main className={`${s.page} ${s.jazz} ${display.variable}`}>
      <Tracking value={amount} currency={currency} product={funnel.product} />
      <Beacon funnel={funnel.slug} page="landing" />
      <script dangerouslySetInnerHTML={{ __html: CARRY_SCRIPT }} />
      {/* Red, on top, like the Jazz page's. */}
      <div className={s.bfbar}>
        <b>BLACK FRIDAY:</b> 90% Sale Ends Soon
      </div>

      <section id="hero" className={s.hero}>
        <div className={s.heroBg} aria-hidden />
        <div className={s.topband}>
          <header className={`${s.wrap} ${s.topbar}`}>
            <span className={s.logo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={360} height={42} />
            </span>
            <span className={s.tag}>
              <span className={s.dot} aria-hidden />
              1,000 MIDI files
            </span>
          </header>
        </div>
        <div className={`${s.wrap} ${s.heroCenter}`}>
          <p className={s.heroPre}>{w.hero.pre}</p>
          <h1 className={s.heroHead}>
            <Marked text={w.hero.title} />
          </h1>
          <p className={s.heroSub}>{w.hero.sub}</p>
          {/* The hero video, as on the Jazz page (../vsl/script-en.md), in Wistia's own player. */}
          {funnel.vsl.wistiaId && (
            <div className={s.vsl}>
              <iframe
                src={`https://fast.wistia.net/embed/iframe/${funnel.vsl.wistiaId}?playerColor=f5b800&videoFoam=false`}
                title="TOP HITS MIDI Bundle: the chords behind 1,000 hits, note for note in MIDI"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          )}
          <HeroRolls lead={w.hero.listen} />
          <ul className={s.heroBullets}>
            {w.hero.bullets.map((b) => (
              <li key={b}>
                <Tick />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {key(s.heroCta)}
          <ul className={s.proofRow}>
            {w.hero.ticks.map((x) => (
              <li key={x}>
                <Tick /> {x}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${s.wrap} ${s.dawStrip}`}>
          <span className={s.mono}>Works in</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.dawLogos}
            src="/funnels/midi-drum-kit/daws.webp"
            alt="Ableton Live · Logic · FL Studio · Cubase · Studio One · Reaper · Bitwig · GarageBand"
            width={1000}
            height={63}
            loading="lazy"
          />
        </div>
        <div className={s.wrap}>
          <ul className={s.proof} style={{ "--n": 3 } as CSSProperties}>
            {w.hero.proof.map(([big, small]) => (
              <li key={big}>
                <b>{big}</b> {small}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.sec}>
        <div className={`${s.wrap} ${s.col}`}>
          <h2 className={s.h2}>
            <Marked text={w.letter.title} />
          </h2>
          <div className={s.letter}>
            {w.letter.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={`${s.panel} ${s.introGrid}`}>
            <div className={t.shot}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${DIR}/hero-600.webp`}
                srcSet={`${DIR}/hero-600.webp 600w, ${DIR}/hero-880.webp 880w`}
                sizes="(min-width: 1000px) 500px, 92vw"
                width={880}
                height={663}
                alt="The TOP HITS MIDI Bundle box with a piano roll of chords and four of its .mid files"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <h2 className={s.h2}>
                {w.product.title} <em className={s.hl}>{w.product.titleEm}</em>
              </h2>
              <p className={s.lead}>{w.product.lead}</p>
              <ul className={s.ticks}>
                {w.product.ticks.map((x) => (
                  <li key={x}>
                    <Tick />
                    {x}
                  </li>
                ))}
              </ul>
              {key(s.ctaBlock)}
            </div>
          </div>
        </div>
      </section>

      <div className={s.pair}>
        <section className={s.sec}>
          <div className={`${s.wrap} ${s.col}`}>
            <h2 className={s.h2}>{w.getting.title}</h2>
            <ol className={s.steps}>
              {w.getting.steps.map(([name, text], i) => (
                <li key={name}>
                  <span className={s.stepN}>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
            <p className={s.pull}>
              <Marked text={w.getting.total} />
            </p>
          </div>
        </section>
        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={`${s.wrap} ${s.ba}`} style={{ marginTop: 0 }}>
            <BigRoll caption={w.letter.rollCaption} />
          </div>
        </section>
      </div>

      <section className={s.sec}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{w.browse.title}</h2>
          <p className={s.sub}>{w.browse.sub}</p>
          <SongPlayer />
        </div>
      </section>

      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={`${s.side} ${s.panel}`}>
            <div className={s.sideImg}>
              <div className={s.illus} aria-hidden>
                <ol className={s.tree}>
                  {["TOP HITS MIDI Bundle", "1. Modern Pop & Ballads"].map((p, i) => (
                    <li key={p} style={{ paddingLeft: i * 14 }}>
                      <span className={s.treeIco}>▸</span>
                      {p}
                    </li>
                  ))}
                  <li className={s.treeFile} style={{ paddingLeft: 2 * 14 }}>
                    <span className={s.treeIco}>♪</span>
                    {TREE.file}
                  </li>
                </ol>
                <p className={s.illusArrow}>↓</p>
                <MiniRoll notes={TREE.notes} beats={TREE.beats} />
              </div>
            </div>
            <div className={s.sideText}>
              <h2 className={s.h2}>{w.steps.title}</h2>
              <ol className={s.steps}>
                {w.steps.items.map(([name, text], i) => (
                  <li key={name}>
                    <span className={s.stepN}>{String(i + 1).padStart(2, "0")}</span>
                    <h3>{name}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className={s.sec}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{w.inside.title}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${DIR}/daw-900.webp`}
            srcSet={`${DIR}/daw-900.webp 900w, ${DIR}/daw-1344.webp 1344w`}
            sizes="(min-width: 1160px) 1120px, 100vw"
            width={1344}
            height={752}
            alt="The TOP HITS MIDI Bundle box beside a laptop with a piano roll of chords"
            loading="lazy"
            decoding="async"
            style={{ display: "block", width: "100%", height: "auto", borderRadius: 12, marginBottom: 24 }}
          />
          <div className={s.panel}>
            <ol className={s.steps}>
              {w.inside.items.map(([name, text], i) => (
                <li key={name}>
                  <span className={s.stepN}>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={`${s.sec} ${s.band}`}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{w.compare.title}</h2>
          <div className={s.chart} role="table" aria-label={w.compare.title} style={{ "--alts": 2 } as CSSProperties}>
            <span className={s.chWinBg} aria-hidden />
            <div className={s.chRow} role="row">
              <span className={s.chCorner} role="columnheader" />
              {w.compare.cols.map((c, i) => (
                <span key={c} role="columnheader" className={i === 2 ? `${s.chHead} ${s.chWin}` : s.chHead}>
                  {i === 2 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={s.chBox} src={`${DIR}/box3d-160.webp`} width={160} height={210} alt="" loading="lazy" decoding="async" />
                  )}
                  {c}
                </span>
              ))}
            </div>
            {w.compare.rows.map(([label, ...cells]) => (
              <div key={label} className={s.chRow} role="row">
                <span role="rowheader" className={s.chLabel}>
                  {label}
                </span>
                {cells.map(([ok, text], i) => (
                  <span key={i} role="cell" className={i === 2 ? `${s.chCell} ${s.chWin}` : s.chCell}>
                    <Mark ok={ok} />
                    <span className={i === 2 ? undefined : s.chAlt}>{tx(text)}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
          {key(s.ctaBlock)}
        </div>
      </section>

      <section className={s.sec}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{tx(w.bonuses.title)}</h2>
          <p className={s.sub}>{w.bonuses.sub}</p>
          <ol className={bn.bonuses}>
            {w.bonuses.items.map((b, i) => {
              const cover = COVERS[b.id];
              return (
                <li key={b.id} className={bn.bonus}>
                  <div className={bn.cover}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover[0]}
                      srcSet={`${cover[0]} 360w, ${cover[1]} 640w`}
                      sizes="(min-width: 1000px) 200px, 96px"
                      width={640}
                      height={960}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className={bn.info}>
                    <p className={bn.label}>
                      <span>Bonus {i + 1}</span>
                      <span className={bn.price}>
                        <s>{worth(b.value)}</s> {w.bonuses.free}
                      </span>
                    </p>
                    <h3>{b.name}</h3>
                    <p className={bn.text}>{b.text}</p>
                    <ul className={bn.inside}>
                      {b.inside.map((x) => (
                        <li key={x}>
                          <Tick /> {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="buy" className={`${s.sec} ${s.order}`}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{w.stack.title}</h2>
          <p className={s.sub}>{tx(w.stack.sub)}</p>
          <div className={vs.stack}>
            <div className={vs.main}>
              <div className={vs.mainBox}>
                <span className={vs.ribbon}>{price} value</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${DIR}/box3d-520.webp`} width={520} height={684} alt="The TOP HITS MIDI Bundle box" loading="lazy" decoding="async" />
              </div>
              <div>
                <p className={vs.kicker}>The bundle</p>
                <p className={vs.mainName}>{funnel.product}</p>
                <ul className={s.stack}>
                  {w.stack.items.map((x) => (
                    <li key={x}>
                      <Tick />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <ol className={vs.list}>
              {w.bonuses.items.map((b, i) => (
                <li key={b.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={COVERS[b.id][0]} width={360} height={540} alt="" loading="lazy" decoding="async" />
                  <span className={vs.itemText}>
                    <span className={vs.kicker}>Bonus #{i + 1}</span>
                    <span className={vs.itemName}>{b.name}</span>
                    <span className={vs.itemCount}>{b.inside[0]}</span>
                  </span>
                  <span className={vs.itemValue}>{worth(b.value)} value</span>
                </li>
              ))}
            </ol>
            <div className={vs.total}>
              <span className={vs.bracket} aria-hidden />
              <p className={vs.totalLine}>
                Total value: <span>{worth(total)}</span>
              </p>
              <p className={vs.today}>
                <span className={vs.todayLabel}>{w.stack.today}</span>
                <s className={vs.old}>{worth(total)}</s>
                <span className={vs.now}>{price}</span>
              </p>
              <p className={vs.save}>You save {worth(bonusValue)}</p>
            </div>
          </div>
          {key(s.ctaBlock)}
          <ul className={s.payList}>
            <li>
              <Tick /> Card, Apple Pay, Google Pay or PayPal
            </li>
            <li>
              <Tick /> Download buttons right after you pay
            </li>
            <li>
              <Tick /> {w.guarantee.title}
            </li>
          </ul>
        </div>
      </section>

      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={`${s.guarantee} ${s.panel} ${s.two}`}>
            <div className={`${s.sealWrap} ${s.twoBody}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/funnels/midi-drum-kit/badge-quality-sm.webp" alt="14-day quality guarantee" width={172} height={172} loading="lazy" decoding="async" />
            </div>
            <div className={s.twoHead}>
              <h2 className={s.h2}>{w.guarantee.title}</h2>
              <p className={s.sub}>{tx(w.guarantee.text)}</p>
            </div>
          </div>
          <div className={`${s.guarantee} ${s.panel}`} style={{ marginTop: 24 }}>
            <div className={s.twoHead}>
              <h2 className={s.h2}>{w.license.title}</h2>
              <p className={s.sub}>{w.license.text}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={`${s.side} ${s.panel}`}>
            <div className={s.sideImg}>
              <div className={s.illus} aria-hidden>
                <p className={s.illusTitle}>Your files are ready</p>
                <ul className={s.dl}>
                  {[[funnel.product, "1,000 MIDI files · 4 folders · .zip"], ...w.bonuses.items.map((b) => [b.name, b.inside[0]])].map(([name, meta]) => (
                    <li key={name}>
                      <span className={s.dlIco}>↓</span>
                      <span>
                        <b>{name}</b>
                        <small>{meta}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={s.sideText}>
              <h2 className={s.h2}>{w.after.title}</h2>
              <ol className={s.after}>
                {w.after.items.map(([lead, text]) => (
                  <li key={lead}>
                    <b>{lead}</b> {text}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.sec} ${s.band}`}>
        <div className={`${s.wrap} ${s.col}`}>
          <h2 className={s.h2}>{w.faq.title}</h2>
          <div className={s.faq}>
            {w.faq.items.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>
                  {tx(a)}{" "}
                  <a href={order} data-cta className={s.micro}>
                    Get the bundle
                  </a>
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.sec} ${s.final}`}>
        <div className={s.finalBg} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${DIR}/stage-1100.webp`}
            srcSet={`${DIR}/stage-1100.webp 1100w, ${DIR}/stage-1344.webp 1344w`}
            sizes="100vw"
            width={1344}
            height={576}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={`${s.wrap} ${s.finalIn}`}>
          <h2 className={s.h2}>{w.final.title}</h2>
          {key(s.ctaBlock, w.cta.label, `${w.final.sub} · ${tx(w.cta.note)}`)}
        </div>
      </section>

      <footer className={s.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={funnel.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={funnel.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
        {w.disclaimer.map((d, i) => (
          <p key={i} className={s.legal}>
            {d}
          </p>
        ))}
      </footer>
    </main>
  );
}

/** "*a*" → yellow, as the Jazz headlines. */
function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((p, i) =>
        p.startsWith("*") ? (
          <span key={i} className={s.hl}>
            {p.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
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

function Mark({ ok }: { ok: boolean | null }) {
  return (
    <span className={ok === true ? s.markYes : ok === false ? s.markNo : s.markMeh} role="img" aria-label={ok === true ? "Yes" : ok === false ? "No" : "Partly"}>
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
        {ok === true ? (
          <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        ) : ok === false ? (
          <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        ) : (
          <path d="M5.5 10h9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}

// The file's first notes as its piano roll, drawn in HTML from the real MIDI (../rolls.json).
function MiniRoll({ notes, beats }: { notes: number[][]; beats: number }) {
  const pitches = notes.map((n) => n[2]);
  const lo = Math.min(...pitches);
  const span = Math.max(...pitches) - lo + 1;
  return (
    <div className={t.treeRoll}>
      {Array.from({ length: beats / 4 - 1 }, (_, i) => (
        <b key={i} style={{ left: `${((i + 1) * 4 * 100) / beats}%` }} />
      ))}
      {notes.map(([start, len, p], i) => (
        <i key={i} style={{ left: `${(start / beats) * 100}%`, width: `calc(${(len / beats) * 100}% - 2px)`, bottom: `${6 + ((p - lo) / span) * 78}%` }} />
      ))}
    </div>
  );
}
