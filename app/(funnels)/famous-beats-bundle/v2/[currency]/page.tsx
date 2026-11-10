import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment, type CSSProperties } from "react";
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { fill } from "@/lib/words";
import { Beacon } from "../../../Beacon";
import { Cta } from "../../../jazz-midi-pack/Cta";
import { display } from "../../../jazz-midi-pack/fonts";
import { Tracking } from "../../../top-hits-midi-bundle/Tracking";
import { funnel } from "../../funnel";
import { BeatClip } from "../Beats";
import { PatternPlayer } from "../PatternPlayer";
import { LANDING as w } from "../words";
import roll from "../roll.json";
import s from "../../../jazz-midi-pack/jazz.module.css";
import bn from "../../../jazz-midi-pack/bonus.module.css";
import vs from "../../../jazz-midi-pack/value.module.css";
import shot from "../../../jazz-midi-pack/shot.module.css";
import f from "../fbb.module.css";

// The Famous Beats Bundle sales page, built on the Jazz page's own CSS and in its order
// (2026-11-09, "Ne crei uno più simile a quello jazz": the first version copied the Drunk Swing
// Grooves page and the user saw it: "sembra la pagina di Drunk Swing Grooves non MIDI Jazz").
// Jazz's sections, top to bottom: red bar, hero (logo + tag, pre-title, headline, sub, the
// video's place, bullets, big key, ticks, DAW strip, proof), the letter, the product panel,
// the letter beside the roll, the pack browser, how it works beside its picture, what's
// inside, the ✓/✗ chart, bonuses with covers, the value stack, the seal, after you pay beside
// the download list, FAQ, the final key. Words in ../words.ts, claims in ../../BRIEF.md.
// Built at /famous-beats-bundle/v2 beside the live page until the user switches.

export const revalidate = 3600;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Famous Beats Bundle · GRIND STUDIO",
  description: "The drums behind 320 hits, transcribed note for note into multi-track MIDI. Drake, Travis Scott, Future, Metro Boomin and more. Any DAW.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "The drums behind 320 hits. Note for note, in MIDI.",
    description: "320 drum transcriptions from hit records + 4 bonuses, by GRIND STUDIO. Drag into your DAW.",
    type: "website",
    images: [{ url: "/funnels/famous-beats-bundle/preview.webp", width: 720, height: 450 }],
  },
};

// The Buy buttons take the ad's tags to the order page, so neo credits the sale to the
// ad that sold (the Jazz page's lesson, ../../../jazz-midi-pack/abtest.ts AB_CARRY_SCRIPT).
const CARRY = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "campaign_id", "adset_id", "ad_id", "fbclid", "gclid"];
const CARRY_SCRIPT = `(function(){try{document.addEventListener('click',function(e){try{
var a=e.target&&e.target.closest&&e.target.closest('a[data-cta]');if(!a)return;
var u=new URL(a.getAttribute('href'),location.href);if(u.origin!==location.origin)return;
var q=new URLSearchParams(location.search),k=${JSON.stringify(CARRY)};
for(var i=0;i<k.length;i++){var x=q.get(k[i]);if(x&&!u.searchParams.has(k[i]))u.searchParams.set(k[i],x);}
a.setAttribute('href',u.pathname+u.search+u.hash);}catch(e){}},true);}catch(e){}})();`;

// Three of the 320, in the hero (their previews in public/funnels/famous-beats-bundle/beats).
const HERO_BEATS = [
  { id: "01-01154drakegodsplan", artist: "Drake", song: "Gods Plan", bpm: 154 },
  { id: "01-01117roddyricchthebox", artist: "Roddy Ricch", song: "The Box", bpm: 117 },
  { id: "20-2094pologmartinandgina", artist: "Polo G", song: "Martin And Gina", bpm: 94 },
];

const SIGN = { eur: "€", usd: "$" } as const;
const DIR = "/funnels/jazz-midi-pack";
// Values as the Jazz page counts them (jazz-midi-pack/funnel.ts bonuses).
const COVERS: Record<string, [string, string]> = {
  "essential-drums": ["/funnels/famous-beats-bundle/bonus-essential-360.webp", "/funnels/famous-beats-bundle/bonus-essential-640.webp"],
  "chord-pack": [`${DIR}/bonus-1-360.webp`, `${DIR}/bonus-1-640.webp`],
  "emotional-keys": [`${DIR}/bonus-4-360.webp`, `${DIR}/bonus-4-640.webp`],
  "drum-loops": [`${DIR}/bonus-5-360.webp`, `${DIR}/bonus-5-640.webp`],
  bible: [`${DIR}/bonus-2-360.webp`, `${DIR}/bonus-2-640.webp`],
  "anime-pack": [`${DIR}/bonus-3-360.webp`, `${DIR}/bonus-3-640.webp`],
};

export default async function FamousBeatsV2({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // The price as dashboard → Products has it.
  const amount = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency];
  const price = money(amount, currency);
  const t = (text: string) => fill(text, { price, c: SIGN[currency], email: funnel.support });
  const order = `/${funnel.slug}/v2/order`;
  const inner = `${price} · instant download`;
  const total = w.bonuses.items.reduce((sum, b) => sum + b.value, 0) + 27;
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
              2,067 MIDI files
            </span>
          </header>
        </div>
        <div className={`${s.wrap} ${s.heroCenter}`}>
          <p className={s.heroPre}>{w.hero.pre}</p>
          <h1 className={s.heroHead}>
            <Marked text={w.hero.title} />
          </h1>
          <p className={s.heroSub}>{w.hero.sub}</p>
          {/* The hero video, as on the Jazz page (vsl/script-en.md, tools/famous_vsl.py, 2026-11-10 "metti la VSL"), in Wistia's own player. */}
          <div className={s.vsl}>
            <iframe
              src={`https://fast.wistia.net/embed/iframe/${funnel.vsl.wistiaId}?playerColor=f5b800&videoFoam=false`}
              title="Famous Beats Bundle: the drums behind 320 hits, note for note in MIDI"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
          <div className={f.heroPlay}>
            <p>{w.hero.listen}</p>
            <ul className={f.beats}>
              {HERO_BEATS.map((b) => (
                <li key={b.id}>
                  <BeatClip {...b} />
                </li>
              ))}
            </ul>
          </div>
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
            <div className={`${shot.stage} ${shot.box}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={shot.img}
                src="/funnels/famous-beats-bundle/hero-600.webp"
                srcSet="/funnels/famous-beats-bundle/hero-600.webp 600w, /funnels/famous-beats-bundle/hero-960.webp 960w"
                sizes="(min-width: 1000px) 360px, 64vw"
                width={960}
                height={1286}
                alt="The Famous Beats Bundle box with MIDI drum lanes and .mid files coming out of it"
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
              <Marked text={`*That's the Famous Beats Bundle.* 320 of those grooves. 32 packs. One download.`} />
            </p>
          </div>
        </section>
        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={`${s.wrap} ${s.ba}`} style={{ marginTop: 0 }}>
            <Roll caption={t(fill(w.letter.rollCaption, { song: roll.song, artist: roll.artist, bpm: roll.bpm }))} />
          </div>
        </section>
      </div>

      <section className={s.sec}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{w.browse.title}</h2>
          <p className={s.sub}>{w.browse.sub}</p>
          <PatternPlayer />
        </div>
      </section>

      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={`${s.side} ${s.panel}`}>
            <div className={s.sideImg}>
              <div className={s.illus} aria-hidden>
                <ol className={s.tree}>
                  {["Famous Beats Bundle", "Famous Beats Vol.20", "01 - Patterns"].map((p, i) => (
                    <li key={p} style={{ paddingLeft: i * 14 }}>
                      <span className={s.treeIco}>▸</span>
                      {p}
                    </li>
                  ))}
                  <li className={s.treeFile} style={{ paddingLeft: 3 * 14 }}>
                    <span className={s.treeIco}>♪</span>
                    FamousBeats20_94_PoloG_MartinAndGina.mid
                  </li>
                </ol>
                <p className={s.illusArrow}>↓</p>
                <Roll bare />
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
            src="/funnels/famous-beats-bundle/daw-900.webp"
            srcSet="/funnels/famous-beats-bundle/daw-900.webp 900w, /funnels/famous-beats-bundle/daw-1600.webp 1600w"
            sizes="(min-width: 1160px) 1120px, 100vw"
            width={1600}
            height={905}
            alt="The Famous Beats Bundle box beside a laptop with a multi-track drum pattern: kick, snare, closed hat, open hat, perc"
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
          <h2 className={s.h2}>{w.quotes.title}</h2>
          <div className={s.letter}>
            {w.quotes.items.map(([q, who]) => (
              <Fragment key={who}>
                <p className={s.pull}>
                  &ldquo;{q}&rdquo; <b>{who}</b>
                </p>
              </Fragment>
            ))}
            <p className={s.baNote}>{w.quotes.note}</p>
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
                    <img className={s.chBox} src="/funnels/famous-beats-bundle/box3d-160.webp" width={160} height={197} alt="" loading="lazy" decoding="async" />
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
                    <span className={i === 2 ? undefined : s.chAlt}>{t(text)}</span>
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
          <h2 className={s.h2}>{t(w.bonuses.title)}</h2>
          <p className={s.sub}>{w.bonuses.sub}</p>
          <ol className={bn.bonuses}>
            {w.bonuses.items.map((b, i) => {
              const cover = COVERS[b.id];
              return (
                <li key={b.id} className={cover ? bn.bonus : `${bn.bonus} ${bn.bare}`}>
                  {cover && (
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
                  )}
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
          <p className={s.sub}>{t(w.stack.sub)}</p>
          <div className={vs.stack}>
            <div className={vs.main}>
              <div className={vs.mainBox}>
                <span className={vs.ribbon}>{worth(27)} value</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/funnels/famous-beats-bundle/box3d-520.webp" width={520} height={642} alt="The Famous Beats Bundle box" loading="lazy" decoding="async" />
              </div>
              <div>
                <p className={vs.kicker}>The bundle</p>
                <p className={vs.mainName}>{funnel.product}</p>
                <ul className={s.stack}>
                  {w.stack.items.slice(0, 7).map((x) => (
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
                <span className={vs.todayLabel}>Today</span>
                <s className={vs.old}>{worth(total)}</s>
                <span className={vs.now}>{price}</span>
              </p>
              <p className={vs.save}>You save {worth(total - amount)}</p>
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
              <Tick /> {t(w.guarantee.title)}
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
              <p className={s.sub}>{t(w.guarantee.text)}</p>
            </div>
          </div>
          <div className={`${s.guarantee} ${s.panel}`} style={{ marginTop: 24 }}>
            <div className={s.twoHead}>
              <h2 className={s.h2}>Commercial license.</h2>
              <p className={s.sub}>
                Use every file in your own music, commercial releases included: sell the beats, lease them, put them out. The money is yours, no royalties. You
                just can&rsquo;t resell or share the MIDI files themselves.
              </p>
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
                  {[
                    [funnel.product, "2,067 MIDI files · 32 packs · .zip"],
                    ...w.bonuses.items.map((b) => [b.name, b.inside[0]]),
                  ].map(([name, meta]) => (
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
                  {t(a)}{" "}
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
            src="/funnels/famous-beats-bundle/stage-1100.webp"
            srcSet="/funnels/famous-beats-bundle/stage-1100.webp 1100w, /funnels/famous-beats-bundle/stage-2200.webp 2200w"
            sizes="100vw"
            width={2200}
            height={943}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={`${s.wrap} ${s.finalIn}`}>
          <h2 className={s.h2}>{w.final.title}</h2>
          {key(s.ctaBlock, w.cta.label, `${w.final.sub} · ${t(w.cta.note)}`)}
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

// One bar of a real file (../roll.json, read from the pack's MIDI): a lane per drum, each
// hit where it lands, its height its velocity, yellow where it's off the grid.
function Roll({ caption, bare }: { caption?: string; bare?: boolean }) {
  const lanes: [string, [number, number][]][] = [
    ["Hats", roll.lanes.hats as [number, number][]],
    ["Snare", roll.lanes.snare as [number, number][]],
    ["Kick", roll.lanes.kick as [number, number][]],
  ];
  return (
    <figure className={bare ? `${f.roll} ${f.rollTight}` : f.roll} style={bare ? { background: "transparent", padding: 0 } : undefined}>
      {!bare && (
        <div className={f.rollHead}>
          <BeatClip id={roll.preview} artist={roll.artist} song={roll.song} bpm={roll.bpm} />
        </div>
      )}
      <div className={f.rollBody} aria-hidden>
        {lanes.map(([name, hits]) => (
          <div key={name} className={f.rollRow}>
            <span className={f.rollName}>{name}</span>
            <div className={f.rollLane}>
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} className={i % 4 === 0 ? f.beatLine : f.stepLine} style={{ left: `${(i / 16) * 100}%` }} />
              ))}
              {hits.map(([at, vel], i) => (
                <b
                  key={i}
                  className={Math.abs(at * 4 - Math.round(at * 4)) > 0.04 ? f.rollOff : f.rollHit}
                  style={{ left: `${(at / 4) * 100}%`, height: `${Math.round((vel / 127) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {caption && <figcaption className={f.rollCap}>{caption}</figcaption>}
    </figure>
  );
}
