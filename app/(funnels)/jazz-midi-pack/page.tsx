import type { Metadata } from "next";
import { headers } from "next/headers";
import { Instrument_Serif } from "next/font/google";
import { currencyFor, formatPrice, visitorCountry } from "@/lib/geo";
import { stripeConfigured } from "@/lib/stripe";
import { funnel } from "./funnel";
import { Cta } from "./Cta";
import { PlayableRoll } from "./PlayableRoll";
import { ProductBox } from "./ProductBox";
import { StickyCta } from "./StickyCta";
import { Tracking } from "./Tracking";
import { CheckoutWidget } from "./CheckoutWidget";
import s from "./jazz.module.css";

// Copy rules: grind-studio-landing-pages/docs/copy-style.md ("Diretto").
// Every claim on this page is in BRIEF.md.

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jazz MIDI Pack · GRIND STUDIO",
  description:
    "26 jazz progressions voiced the way a pianist plays them. 3,536 MIDI files: 13 voicings, 8 rhythms, all 12 keys, bass lines, lofi / neo soul / trap soul / deep house loops.",
  openGraph: {
    title: "Jazz chords that sound played, not programmed.",
    description: "3,536 MIDI files by GRIND STUDIO. Drag into your DAW.",
    type: "website",
  },
};

const PREVIEWS = [
  { id: "ballad", title: "Ballad Arpeggios · ii–V–I", meta: "C · 70 bpm" },
  { id: "neosoul", title: "Neo Soul loop · I–vi–ii–V", meta: "C · 88 bpm" },
  { id: "lofi", title: "Lofi loop · Autumn Leaves type", meta: "Gm · 82 bpm" },
  { id: "bossa", title: "Bossa Nova · Tritone Turnaround", meta: "C · 135 bpm" },
  { id: "blues", title: "Swing Comping · Jazz Blues in F", meta: "F · 150 bpm" },
] as const;

const VOICINGS = [
  "Best Voicing",
  "Best Voicing + Smooth Bass",
  "Rootless (Bill Evans)",
  "Spread (two-hand)",
  "Drop 2",
  "Voice-Led Close",
  "Quartal (So What)",
  "Shell (Bud Powell)",
  "Drop 3",
  "Root Position",
  "1st Inversion",
  "2nd Inversion",
  "3rd Inversion",
];

const RHYTHMS = [
  ["Ballad Arpeggios", "70"],
  ["Pads", "90"],
  ["Bossa Nova", "135"],
  ["Swing Comping", "150"],
  ["Charleston", "130"],
  ["Anticipations", "130"],
  ["Reverse Charleston", "130"],
  ["Freddie Green 4 to the Bar", "140"],
];

export default async function JazzMidiPackPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: override } = await searchParams;
  const country = visitorCountry(await headers(), override);
  const currency = currencyFor(country);
  const amount = funnel.price[currency];
  const price = formatPrice(amount, currency);
  const inner = `${price} · instant download`;
  const n = funnel.counts;

  return (
    <main className={`${s.page} ${serif.variable}`}>
      <Tracking value={amount} currency={currency} />

      {/* ================= HERO ================= */}
      <section id="hero" className={s.hero}>
        <div className={s.heroBg} aria-hidden />
        <header className={`${s.wrap} ${s.topbar}`}>
          <span className={s.logo}>
            GRIND <span className={s.dia}>◆</span> STUDIO
          </span>
          <span className={s.tag}>
            <span className={s.dot} aria-hidden />
            {n.files.toLocaleString("en-US")} MIDI files
          </span>
        </header>
        <div className={`${s.wrap} ${s.heroGrid}`}>
          <div className={s.heroCopy}>
            <h1 className={s.display}>
              Jazz chords that sound <em>played, not programmed.</em>
            </h1>
            <p className={s.lead}>
              {n.progressions} jazz progressions, voiced the way a pianist plays them. {n.voicings} voicings,{" "}
              {n.rhythms} rhythms, all 12 keys. Drag a .mid onto your track, load your keys, write on top.
            </p>
            <Cta className={s.heroCta} inner={inner} />
            <ul className={s.proofRow}>
              <li><Tick /> Any DAW</li>
              <li><Tick /> Chord names in every file</li>
              <li><Tick /> {funnel.guaranteeDays}-day guarantee</li>
            </ul>
          </div>
          <div className={s.heroVis}>
            <ProductBox />
            <span className={`${s.hud} ${s.hudA}`}>.mid · drag &amp; drop</span>
            <span className={`${s.hud} ${s.hudB}`}><b>13</b> voicings</span>
            <span className={`${s.hud} ${s.hudC}`}>chords <b>on the timeline</b></span>
          </div>
        </div>
        <div className={`${s.wrap} ${s.dawStrip}`}>
          <span className={s.mono}>Works in</span>
          <span>Ableton Live · Logic · FL Studio · Cubase · Studio One · Reaper · Bitwig · GarageBand</span>
        </div>
      </section>

      {/* ================= PROBLEM → TURN ================= */}
      <section className={s.sec}>
        <div className={`${s.wrap} ${s.col}`}>
          <p className={s.eyebrow}>Why your chords sound stiff</p>
          <h2 className={s.h2}>Your chords aren&rsquo;t wrong. They just jump.</h2>
          <div className={s.letter}>
            <p><b>Dear producer,</b></p>
            <p>You found the chords. Dm7, G7, Cmaj7. The right notes.</p>
            <p>You put them in the piano roll and it sounds like a ringtone.</p>
            <p>Every chord is a block. Every block lands somewhere new on the keyboard. Nothing connects.</p>
            <p className={s.pull}>Pianists don&rsquo;t play chords. They play lines.</p>
            <p>
              When a jazz player moves from Dm7 to G7, two fingers stay put. The seventh drops a half step. The
              hand barely moves.
            </p>
            <p>
              That&rsquo;s voice leading. It&rsquo;s why a player sounds smooth and a chord plugin sounds like a
              grid. Learning it takes months of theory and a piano you might not play.
            </p>
            <p>
              We&rsquo;re GRIND STUDIO. Our MIDI Drum Kit is in the sessions of 2,847 producers. This one is for
              what sits on top of the drums.
            </p>
            <p className={s.hit}>So we voiced 26 jazz progressions the way a pianist would. Note by note.</p>
            <p>Same chords. Hear the difference.</p>
          </div>
        </div>
        <div className={`${s.wrap} ${s.ba}`}>
          <figure className={s.baItem}>
            <figcaption className={s.baCap}>
              <span className={s.bad}>Before</span> Root position. The way most chord tools hand it to you.
            </figcaption>
            <PlayableRoll id="before" tone="muted" playLabel="Play before" />
          </figure>
          <figure className={s.baItem}>
            <figcaption className={s.baCap}>
              <span className={s.good}>After</span> Best Voicing. The first folder of every progression.
            </figcaption>
            <PlayableRoll id="after" playLabel="Play after" />
          </figure>
          <p className={s.baNote}>
            Same eight chords, same rhythm. Watch the top note. Before, it jumps up to seven semitones from
            chord to chord. After, it only moves between B and C, while the roots hold the bottom.
          </p>
        </div>
      </section>

      {/* ================= INTRODUCING ================= */}
      <section className={`${s.sec} ${s.band}`}>
        <div className={`${s.wrap} ${s.introGrid}`}>
          <ProductBox size="md" />
          <div>
            <p className={s.eyebrow}>Introducing</p>
            <h2 className={s.h2}>
              The Jazz <em className={s.hl}>MIDI Pack</em>
            </h2>
            <p className={s.lead}>
              {n.files.toLocaleString("en-US")} MIDI files. {n.progressions} jazz progressions, each voiced{" "}
              {n.voicings} ways, in {n.rhythms} rhythms and all 12 keys. Plus bass lines, combo loops and full
              lofi, neo soul, trap soul and deep house loops.
            </p>
            <ul className={s.ticks}>
              <li><Tick /> No theory needed: every file shows its chord names</li>
              <li><Tick /> Your sounds: Rhodes, piano, pads, synths</li>
              <li><Tick /> One payment, yours to keep</li>
            </ul>
            <Cta className={s.ctaBlock} inner={inner} />
          </div>
        </div>
      </section>

      {/* ================= HEAR IT ================= */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <p className={s.eyebrow}>Real files, real piano</p>
            <h2 className={s.h2}>Press play. This is the MIDI you get.</h2>
            <p className={s.sub}>
              Each preview is a file from the pack, note for note, played on a grand piano sample. In your DAW it
              plays through your sound. The genre loops also ship with their drum MIDI.
            </p>
          </div>
          <div className={s.previews}>
            {PREVIEWS.map((p) => (
              <PlayableRoll key={p.id} id={p.id} title={p.title} meta={p.meta} variant="mini" />
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW ================= */}
      <section className={`${s.sec} ${s.band}`}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <p className={s.eyebrow}>How it works</p>
            <h2 className={s.h2}>From empty session to jazz chords in three moves.</h2>
          </div>
          <ol className={s.steps}>
            <li>
              <span className={s.stepN}>01</span>
              <h3>Pick a progression</h3>
              <p>Folders and files are numbered best-sounding first. Start at 01.</p>
            </li>
            <li>
              <span className={s.stepN}>02</span>
              <h3>Drag the .mid onto your keys</h3>
              <p>Rhodes, piano, pad, anything. The chord names show up on the timeline.</p>
            </li>
            <li>
              <span className={s.stepN}>03</span>
              <h3>Make it yours</h3>
              <p>Change the key, swap the rhythm, add drums. The voice leading stays.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* ================= INSIDE ================= */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <p className={s.eyebrow}>What&rsquo;s inside</p>
            <h2 className={s.h2}>Five folders. Every one does a job.</h2>
          </div>
          <div className={s.bento}>
            {funnel.folders.map((f, i) => (
              <div key={f.name} className={`${s.cell} ${i === 0 ? s.cellBig : ""}`}>
                <span className={s.cellN}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.cellCount}>{f.files.toLocaleString("en-US")}</span>
                <h3>{f.name}</h3>
                <p>{f.what}</p>
              </div>
            ))}
          </div>
          <div className={s.lists}>
            <div className={s.listBox}>
              <h3>13 voicings</h3>
              <ol className={s.numList}>
                {VOICINGS.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ol>
            </div>
            <div className={s.listBox}>
              <h3>8 rhythms</h3>
              <ul className={s.rhythms}>
                {RHYTHMS.map(([r, bpm]) => (
                  <li key={r}>
                    <span>{r}</span>
                    <span className={s.mono}>{bpm} bpm</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${s.listBox} ${s.listWide}`}>
              <h3>26 progressions</h3>
              <ol className={s.progGrid}>
                {funnel.progressions.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MATH ================= */}
      <section className={`${s.sec} ${s.band}`}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <p className={s.eyebrow}>Do the math</p>
            <h2 className={s.h2}>Other ways to get jazz voicings.</h2>
          </div>
          <div className={s.compare}>
            <div className={s.cmp}>
              <h3>Learn jazz piano</h3>
              <p>Months of lessons and theory. Then you still have to play every chord in.</p>
            </div>
            <div className={s.cmp}>
              <h3>Book a keys player</h3>
              <p>Paid per session, every song. Your chords wait on their calendar.</p>
            </div>
            <div className={s.cmp}>
              <h3>Chord plugins</h3>
              <p>One voicing, block chords. The exact jump you&rsquo;re trying to get rid of.</p>
            </div>
            <div className={`${s.cmp} ${s.cmpWin}`}>
              <h3>This pack</h3>
              <p>
                {price} once. {n.files.toLocaleString("en-US")} files. Less than a cent a file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OFFER + CHECKOUT ================= */}
      <section id="buy" className={`${s.sec} ${s.order}`}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <p className={s.eyebrow}>Get the pack</p>
            <h2 className={s.h2}>Everything in the pack. {price}.</h2>
          </div>
          <div className={s.orderGrid}>
            <div className={s.orderSummary}>
              <ProductBox size="md" />
              <ul className={s.stack}>
                <li><Tick /> {n.files.toLocaleString("en-US")} MIDI files in 5 folders</li>
                <li><Tick /> {n.progressions} progressions × {n.voicings} voicings × {n.rhythms} rhythms</li>
                <li><Tick /> All 12 keys, as voice-led pads</li>
                <li><Tick /> Walking, two-feel and bossa bass lines</li>
                <li><Tick /> Lofi, neo soul, trap soul and deep house loops, drums included</li>
                <li><Tick /> Chord names written into every file</li>
              </ul>
              <p className={s.guaranteeMini}>
                <Shield /> {funnel.guaranteeDays}-day satisfaction guarantee. A file doesn&rsquo;t work? We fix it.
              </p>
            </div>
            <div className={s.orderForm}>
              <CheckoutWidget
                funnel={funnel.slug}
                product={funnel.product}
                tagline={funnel.tagline}
                currency={currency}
                country={country}
                price={amount}
                bump={{
                  name: funnel.bump.name,
                  price: funnel.bump.price[currency],
                  pitch: funnel.bump.pitch,
                }}
                thankYou={funnel.checkout.thankYou}
                publishableKey={stripeConfigured() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY! : null}
                europe={currency === "eur"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= GUARANTEE ================= */}
      <section className={`${s.sec} ${s.band}`}>
        <div className={`${s.wrap} ${s.col} ${s.guarantee}`}>
          <Shield big />
          <h2 className={s.h2}>{funnel.guaranteeDays}-day satisfaction guarantee.</h2>
          <p className={s.sub}>
            Every file is tested before release. If anything&rsquo;s wrong with your files, email{" "}
            <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
            {` within ${funnel.guaranteeDays} days and we make it right`}: a fresh download, a replacement, or a refund if we can&rsquo;t fix it.
          </p>
        </div>
      </section>

      {/* ================= AFTER THE CLICK ================= */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.secHead}>
            <p className={s.eyebrow}>After you pay</p>
            <h2 className={s.h2}>From the click to your first chord in two minutes.</h2>
          </div>
          <ol className={s.after}>
            <li><b>Pay by card.</b> Secured by Stripe. One payment, no subscription.</li>
            <li><b>Download right away.</b> The download buttons appear on the next page.</li>
            <li><b>Receipt by email.</b> Stripe sends it to the address you entered.</li>
            <li><b>Unzip, drag, play.</b> Start with folder 01, file 01.</li>
          </ol>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className={`${s.sec} ${s.band}`}>
        <div className={`${s.wrap} ${s.col}`}>
          <p className={s.eyebrow}>FAQ</p>
          <h2 className={s.h2}>Before you grab it.</h2>
          <div className={s.faq}>
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>
                  {a} <a href="#buy" data-cta className={s.micro}>Get the pack</a>
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL ================= */}
      <section className={`${s.sec} ${s.final}`}>
        <div className={`${s.wrap} ${s.col} ${s.finalIn}`}>
          <h2 className={s.h2}>
            26 progressions. 13 voicings. Your sounds. {price}.
          </h2>
          <Cta className={s.ctaBlock} inner={inner} note={`${funnel.guaranteeDays}-day satisfaction guarantee · instant download`} />
        </div>
      </section>

      <footer className={s.footer}>
        <p>
          © 2026 {funnel.brand} ·{" "}
          <a href={funnel.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={funnel.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={funnel.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
        <p className={s.legal}>
          Piano previews use the Salamander Grand Piano samples by Alexander Holm (CC BY 3.0). The MIDI files
          contain no audio. Individual results vary.
        </p>
      </footer>

      <StickyCta price={price} />
    </main>
  );
}

const FAQ: [string, string][] = [
  [
    "Which DAWs does it work in?",
    "Any DAW that opens .mid files: Ableton Live, Logic, FL Studio, Cubase, Studio One, Reaper, Bitwig, GarageBand. Drag a file onto an instrument track.",
  ],
  [
    "I don't know jazz theory. Will I get lost?",
    "No. Files are numbered best-sounding first and every file shows its chord names on the timeline. Start at 01.",
  ],
  [
    "I don't play piano.",
    "You don't need to. The voicings are already played into the MIDI. You choose the sound.",
  ],
  [
    "Can I use them in my releases?",
    "Yes. Use them in your own music, commercial releases included, with no royalties. You can't resell or share the files themselves.",
  ],
  [
    "Is it only in C?",
    "The main folder is in each progression's original key, and the All 12 Keys folder has every progression in every key. Or transpose in your DAW: the voice leading stays.",
  ],
  [
    "Do the genre loops have drums?",
    "Yes. Every lofi, neo soul, trap soul and deep house loop comes as separate chords, bass and drum MIDI, plus a full multitrack file. Drums use the GM map (kick C1, snare D1, hat F#1).",
  ],
  [
    "What if a file doesn't load?",
    `Email ${funnel.support}. We fix it, replace it, or refund you if we can't.`,
  ],
];

function Tick() {
  return (
    <svg className={s.tick} viewBox="0 0 20 20" width="18" height="18" aria-hidden>
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Shield({ big }: { big?: boolean }) {
  return (
    <svg className={big ? s.shieldBig : s.shield} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="currentColor" opacity=".18" />
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
