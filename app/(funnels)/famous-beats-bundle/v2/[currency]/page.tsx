import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { fill } from "@/lib/words";
import { Beacon } from "../../../Beacon";
import { Cta } from "../../../jazz-midi-pack/Cta";
import { display } from "../../../jazz-midi-pack/fonts";
import { Tracking } from "../../../top-hits-midi-bundle/Tracking";
import { funnel } from "../../funnel";
import { BeatBrowser, BeatClip } from "../Beats";
import { Rich } from "../Rich";
import { LANDING as w } from "../words";
import roll from "../roll.json";
import s from "../landing.module.css";

// The Famous Beats Bundle sales page in the Jazz page's style and order (2026-11-09,
// "Ne crei uno più simile a quello jazz per famous beats bundle? Offerta + simile e
// stile pagina più simile"): red Black Friday bar, centred hero, copy beside a real
// roll, every song playable, ✓/✗ chart, four bonuses, the stack, the seal, FAQ.
// Words in ../words.ts (claims in ../../BRIEF.md). One prebuilt page per currency.
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

// Three of the 320, on the hero (their previews in public/funnels/famous-beats-bundle/beats).
const HERO_BEATS = [
  { id: "01-01154drakegodsplan", artist: "Drake", song: "Gods Plan", bpm: 154 },
  { id: "01-01117roddyricchthebox", artist: "Roddy Ricch", song: "The Box", bpm: 117 },
  { id: "20-2094pologmartinandgina", artist: "Polo G", song: "Martin And Gina", bpm: 94 },
];

const SIGN = { eur: "€", usd: "$" } as const;

export default async function FamousBeatsV2({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  // The price as dashboard → Products has it.
  const amount = ((await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!).price[currency];
  const price = money(amount, currency);
  const t = (text: string) => fill(text, { price, c: SIGN[currency], email: funnel.support });
  const order = `/${funnel.slug}/v2/order`;
  const cta = <Cta label={w.cta.label} note={t(w.cta.note)} href={order} className={s.cta} />;

  return (
    <main className={`${s.page} ${display.variable}`}>
      <Tracking value={amount} currency={currency} product={funnel.product} />
      <Beacon funnel={funnel.slug} page="landing" />
      <script dangerouslySetInnerHTML={{ __html: CARRY_SCRIPT }} />
      {/* Red, on top, like the Jazz page's. */}
      <div className={s.bfbar}>
        <b>BLACK FRIDAY:</b> 90% Sale Ends Soon
      </div>

      <section className={s.hero}>
        <div className={s.narrow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.logo} src="/funnels/famous-beats-bundle/logo.webp" alt="GRIND STUDIO" width={180} height={21} />
          <p className={s.pre}>{w.hero.pre}</p>
          <h1 className={s.h1}>
            <Rich text={w.hero.title} />
          </h1>
          <p className={s.sub}>
            <Rich text={w.hero.sub} />
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.heroBox}
            src="/funnels/famous-beats-bundle/box-480.webp"
            srcSet="/funnels/famous-beats-bundle/box-240.webp 240w, /funnels/famous-beats-bundle/box-480.webp 480w"
            sizes="(min-width: 900px) 380px, 76vw"
            width={480}
            height={480}
            alt="The Famous Beats Bundle box: 320 transcriptions, 32 packs, MIDI format"
            fetchPriority="high"
          />
          <div className={s.heroBeats}>
            <p className={s.caption}>{w.hero.listen}</p>
            <ul className={s.beats}>
              {HERO_BEATS.map((b) => (
                <li key={b.id}>
                  <BeatClip {...b} />
                </li>
              ))}
            </ul>
          </div>
          <ul className={s.bullets}>
            {w.hero.bullets.map((b, i) => (
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
            {w.hero.proof.map(([big, small], i) => (
              <p key={i}>
                <b>{big}</b> {small}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.panel}>
          <Roll caption={t(fill(w.letter.rollCaption, { song: roll.song, artist: roll.artist, bpm: roll.bpm }))} />
          <div className={s.panelCopy}>
            <h2 className={s.h2}>
              <Rich text={w.letter.title} />
            </h2>
            {w.letter.body.map((p, i) => (
              <p key={i}>
                <Rich text={p} />
              </p>
            ))}
            {cta}
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.getting.title}</h2>
          <ol className={s.inside}>
            {w.getting.steps.map(([name, text]) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <p className={s.equals}>{w.getting.total}</p>
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.browse.title}</h2>
          <p>{w.browse.sub}</p>
          <BeatBrowser words={w.browse} />
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.panel}>
          <Box className={s.panelBox} />
          <div className={s.panelCopy}>
            <h2 className={s.h2}>{w.inside.title}</h2>
            <ol className={s.inside}>
              {w.inside.items.map(([name, text]) => (
                <li key={name}>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.quotes.title}</h2>
          <ul className={s.quotes}>
            {w.quotes.items.map(([q, who]) => (
              <li key={who}>
                <p className={s.quote}>&ldquo;{q}&rdquo;</p>
                <p className={s.who}>
                  <b>{who}</b> <span>Producer</span>
                </p>
              </li>
            ))}
          </ul>
          <p className={s.caption}>{w.quotes.note}</p>
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.steps.title}</h2>
          <ol className={s.inside}>
            {w.steps.items.map(([name, text]) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          {cta}
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.wide}>
          <h2 className={`${s.h2} ${s.center}`}>{w.compare.title}</h2>
          <div className={s.chart} role="table" aria-label={w.compare.title}>
            <div className={s.chRow} role="row">
              <span role="columnheader" />
              {w.compare.cols.map((c, i) => (
                <span key={c} role="columnheader" className={i === 2 ? `${s.chHead} ${s.chWin}` : s.chHead}>
                  {i === 2 && <Box className={s.chBox} small />}
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
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{t(w.bonuses.title)}</h2>
          <p>{w.bonuses.sub}</p>
        </div>
        <div className={s.bonusList}>
          {w.bonuses.items.map((b, i) => (
            <div key={b.id} className={s.panel}>
              <BonusCover id={b.id} name={b.name} />
              <div className={s.panelCopy}>
                <p className={s.bonusNo}>Bonus {i + 1}</p>
                <h3 className={s.h3}>{b.name}</h3>
                <p>{b.text}</p>
                <p className={s.bonusValue}>
                  <s>{money(b.value, currency)}</s> <b>{w.bonuses.free}</b>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="buy" className={`${s.band} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={`${s.h2} ${s.center}`}>{w.stack.title}</h2>
          <p className={s.center}>{t(w.stack.sub)}</p>
          <div className={s.stack}>
            <Box className={s.stackBox} />
            <ul className={s.stackList}>
              {w.stack.items.map((name) => (
                <li key={name}>
                  <Tick />
                  <span>
                    <b>{name}</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className={s.today}>
            <span>{w.stack.today}</span> <b>{price}</b>
          </p>
          <p className={`${s.caption} ${s.center}`}>{t(w.stack.perGroove)}</p>
          {cta}
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <div className={s.sealRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/funnels/midi-drum-kit/badge-quality-sm.webp" alt="14-day quality guarantee" width={172} height={172} loading="lazy" decoding="async" />
            <div>
              <h2 className={s.h3}>{w.guarantee.title}</h2>
              <p>{t(w.guarantee.text)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.band} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.after.title}</h2>
          <ol className={s.after}>
            {w.after.items.map(([lead, text]) => (
              <li key={lead}>
                <b>{lead}</b> {text}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${s.section} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>{w.faq.title}</h2>
          <div className={s.faq}>
            {w.faq.items.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{t(a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.final} ${s.lazy}`}>
        <div className={s.narrow}>
          <h2 className={s.h1}>{w.final.title}</h2>
          <p className={s.sub}>{w.final.sub}</p>
          {cta}
        </div>
      </section>

      <footer className={s.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms}>Terms</a> · <a href={funnel.legal.privacy}>Privacy</a> ·{" "}
          <a href={funnel.legal.refund}>Refund policy</a> · <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
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

function Box({ className, small }: { className?: string; small?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`/funnels/famous-beats-bundle/box-${small ? 240 : 480}.webp`}
      width={small ? 240 : 480}
      height={small ? 240 : 480}
      alt={small ? "" : "The Famous Beats Bundle box"}
      loading="lazy"
      decoding="async"
    />
  );
}

// The bonuses' covers: the ones the Jazz page uses; the ESSENTIAL patterns have none,
// so their folders are drawn from the zip's own (counted 2026-11-09).
const COVERS: Record<string, string> = {
  "drum-loops": "/funnels/jazz-midi-pack/bonus-5-640.webp",
  bible: "/funnels/jazz-midi-pack/bonus-2-640.webp",
  "anime-pack": "/funnels/jazz-midi-pack/bonus-3-640.webp",
};
const ESSENTIAL_FOLDERS: [string, number][] = [
  ["808", 36],
  ["Hihat Closed", 72],
  ["Hihat Open", 8],
  ["Kick", 21],
  ["Snare or Clap", 20],
  ["Accents (clap, rim, perc)", 8],
  ["Kick and Snare (Multi-Track)", 12],
  ["Kick and 808 (Multi-Track)", 6],
  ["Complete Beats (Multi-Track)", 5],
];

function BonusCover({ id, name }: { id: string; name: string }) {
  if (COVERS[id])
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={s.bonusCover} src={COVERS[id]} width={640} height={960} alt={`${name} cover`} loading="lazy" decoding="async" />
    );
  return (
    <div className={s.folders} aria-label={`${name}: the folders in the zip`}>
      <p className={s.foldersHead}>ESSENTIAL MIDI Drum Patterns</p>
      <ul>
        {ESSENTIAL_FOLDERS.map(([f, n], i) => (
          <li key={f}>
            <span>
              {i + 1}. {f}
            </span>
            <span>{n} .mid</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// One bar of a real file (../roll.json, read from the pack's MIDI): a lane per drum,
// each hit where it lands, its height its velocity. Drawn in HTML, no image.
function Roll({ caption }: { caption: string }) {
  const lanes: [string, [number, number][]][] = [
    ["Hats", roll.lanes.hats as [number, number][]],
    ["Snare", roll.lanes.snare as [number, number][]],
    ["Kick", roll.lanes.kick as [number, number][]],
  ];
  return (
    <figure className={s.roll}>
      <div className={s.rollHead}>
        <BeatClip id={roll.preview} artist={roll.artist} song={roll.song} bpm={roll.bpm} />
      </div>
      <div className={s.rollBody} aria-hidden>
        {lanes.map(([name, hits]) => (
          <div key={name} className={s.rollRow}>
            <span className={s.rollName}>{name}</span>
            <div className={s.rollLane}>
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} className={i % 4 === 0 ? s.beatLine : s.stepLine} style={{ left: `${(i / 16) * 100}%` }} />
              ))}
              {hits.map(([at, vel], i) => (
                <b
                  key={i}
                  className={Math.abs(at * 4 - Math.round(at * 4)) > 0.04 ? s.rollOff : s.rollHit}
                  style={{ left: `${(at / 4) * 100}%`, height: `${Math.round((vel / 127) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <figcaption className={s.caption}>{caption}</figcaption>
    </figure>
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

function Tick() {
  return (
    <svg className={s.tick} viewBox="0 0 24 24" aria-hidden width="22" height="22">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
