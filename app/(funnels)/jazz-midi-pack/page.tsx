import type { Metadata } from "next";
import { headers } from "next/headers";
import { Instrument_Serif } from "next/font/google";
import { currencyFor, formatPrice, visitorCountry } from "@/lib/geo";
import { stripeConfigured } from "@/lib/stripe";
import { funnel } from "./funnel";
import previews from "@/public/funnels/jazz-midi-pack/audio/index.json";
import { Previews } from "./Previews";
import { OptinForm } from "./OptinForm";
import { CheckoutWidget } from "./CheckoutWidget";
import s from "./jazz.module.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jazz MIDI Pack — 26 progressions, voiced 13 ways",
  description:
    "3,536 jazz MIDI files: 26 progressions in 13 voicings, 8 rhythms, all 12 keys, bass lines and lofi / neo soul / trap soul / deep house loops.",
  openGraph: {
    title: "Jazz MIDI Pack",
    description: "26 jazz progressions, voiced 13 ways. Drag into your DAW and write.",
    type: "website",
  },
};

export default async function JazzMidiPackPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: override } = await searchParams;
  const country = visitorCountry(await headers(), override);
  const currency = currencyFor(country);
  const price = formatPrice(funnel.price[currency], currency);
  const n = funnel.counts;

  return (
    <main className={`${s.page} ${serif.variable}`}>
      <header className={s.hero}>
        <p className={s.eyebrow}>
          MIDI pack · {n.files.toLocaleString("en-US")} files · .mid
        </p>
        <h1 className={s.title}>
          Jazz harmony, <em>already voiced.</em>
        </h1>
        <p className={s.lede}>
          The {n.progressions} progressions every jazz player knows, voiced {n.voicings} ways,
          played in {n.rhythms} rhythms and transposed to all 12 keys. Plus bass lines and
          loops for lofi, neo soul, trap soul and deep house. Drag a file into your DAW
          and start writing.
        </p>
        <div className={s.heroActions}>
          <a href="#buy" className={s.primary}>
            Get the pack — {price}
          </a>
          <a href="#listen" className={s.ghost}>
            Listen first
          </a>
        </div>
      </header>

      <section id="listen" className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.h2}>Hear it</h2>
          <p className={s.note}>
            Rendered straight from the pack&rsquo;s MIDI with a plain electric piano. In your
            DAW they play through your own sounds.
          </p>
        </div>
        <Previews items={previews} />
      </section>

      <section className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.h2}>What&rsquo;s inside</h2>
          <p className={s.note}>Five folders, numbered best-sounding first.</p>
        </div>
        <ol className={s.folders}>
          {funnel.folders.map((f, i) => (
            <li key={f.name} className={s.folder}>
              <span className={s.folderNum}>{i + 1}</span>
              <div>
                <h3 className={s.folderName}>{f.name}</h3>
                <p className={s.folderWhat}>{f.what}</p>
              </div>
              <span className={s.folderCount}>{f.files.toLocaleString("en-US")}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${s.section} ${s.split}`}>
        <div>
          <h2 className={s.h2}>Voiced like a pianist would</h2>
          <p className={s.body}>
            Every progression leads with <strong>Best Voicing</strong>: four voices over a
            root bass, each moving like a melody. Common tones hold, sevenths resolve down,
            no parallel fifths, and the last chord flows back into the first so loops are
            seamless.
          </p>
          <p className={s.body}>
            Then the classics: rootless Bill Evans voicings, drop 2 and drop 3, shells,
            quartal So What chords, two-hand spreads and every inversion. Chord names are
            written into each file as markers, so your DAW shows them on the timeline.
          </p>
        </div>
        <ul className={s.chips} aria-label="The 26 progressions">
          {funnel.progressions.map((p) => (
            <li key={p} className={s.chip}>
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section id="sample" className={`${s.section} ${s.sample}`}>
        <div>
          <h2 className={s.h2}>Try five files free</h2>
          <p className={s.body}>
            A full neo soul loop (chords, bass, drums and the combined file) and a Best
            Voicing ballad. Leave your email and the download starts right here.
          </p>
        </div>
        <OptinForm funnel={funnel.slug} />
      </section>

      <section id="buy" className={`${s.section} ${s.order}`}>
        <div className={s.orderSummary}>
          <p className={s.eyebrow}>Order summary</p>
          <div className={s.sleeve} aria-hidden>
            <span className={s.sleeveBrand}>MIDI · {n.files.toLocaleString("en-US")} files</span>
            <span className={s.sleeveTitle}>
              Jazz
              <br />
              <em>MIDI Pack</em>
            </span>
            <span className={s.sleeveKeys} />
          </div>
          <ul className={s.includes}>
            <li>{n.files.toLocaleString("en-US")} MIDI files in 5 folders</li>
            <li>
              {n.progressions} progressions × {n.voicings} voicings × {n.rhythms} rhythms
            </li>
            <li>All 12 keys, bass lines, combo and genre loops</li>
            <li>Chord names written into every file</li>
            <li>Works in Ableton, Logic, FL Studio, Cubase, Reaper, GarageBand</li>
            <li>One payment, instant download, yours to keep</li>
          </ul>
        </div>
        <div className={s.orderForm}>
          <CheckoutWidget
            funnel={funnel.slug}
            product={funnel.product}
            tagline={funnel.tagline}
            currency={currency}
            country={country}
            price={funnel.price[currency]}
            bump={{
              name: funnel.bump.name,
              price: funnel.bump.price[currency],
              pitch: funnel.bump.pitch,
            }}
            thankYou={funnel.checkout.thankYou}
            publishableKey={
              stripeConfigured() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY! : null
            }
            europe={currency === "eur"}
          />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>Questions</h2>
        <dl className={s.faq}>
          <div>
            <dt>Which DAWs does it work in?</dt>
            <dd>
              Any that opens standard .mid files: Ableton Live, Logic, FL Studio, Cubase,
              Studio One, Reaper, Bitwig, GarageBand. Drag a file onto an instrument track.
            </dd>
          </div>
          <div>
            <dt>Can I use these in my releases?</dt>
            <dd>
              Yes. Use them in your own music, commercial releases included, with no royalties
              to pay. You can&rsquo;t resell or share the files themselves.
            </dd>
          </div>
          <div>
            <dt>Do I need to know theory?</dt>
            <dd>
              No. Folders and files are numbered best-sounding first, and every file shows
              its chord names. Start at file 01 and go.
            </dd>
          </div>
          <div>
            <dt>How do I get the files?</dt>
            <dd>A zip download right after payment, and a link by email you can come back to.</dd>
          </div>
        </dl>
      </section>

      <footer className={s.footer}>© 2026 Jazz MIDI Pack</footer>
    </main>
  );
}
