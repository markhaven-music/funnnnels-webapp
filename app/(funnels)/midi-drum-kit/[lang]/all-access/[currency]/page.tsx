import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { checkoutPages, getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { money } from "@/lib/launch";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { Arrow } from "../../../../jazz-midi-pack/Cta";
import { display } from "../../../../jazz-midi-pack/fonts";
import j from "../../../../jazz-midi-pack/jazz.module.css";
import b from "../../../../jazz-midi-pack/btn.module.css";
import { funnel } from "../../../funnel";
import { isLang, LANGS } from "../../../i18n";
import { LP } from "../../../landingTest";
import { beaconStep, headScripts, script, stepsBar } from "../../../upsell";
import { Beacon } from "../../../../Beacon";
import u from "./allAccess.module.css";
import { Listen } from "./Listen";

// GRIND STUDIO All Access, the Drum Kit's first one-click upsell since 2026-11-16 ("vai avanti": the
// €97 "everything" offer agreed on 11-15 to bring the average order to €45). Every pack we sell on its
// own, in one download: the Jazz MIDI Pack with its bonuses, the Famous Beats Bundle, the TOP HITS MIDI
// Bundle, the HUSTLE Bundle and the Drum Kit Expansions (funnel.ts includes["all-access"]). Bought, the
// buyer goes to the downloads (the offer is `last`); declined, Famous Beats then TOP HITS as before.
// English in every language for now, like the Jazz upsell. Yes / No are upsell.ts' buttons (a[data-oto]).

export const revalidate = 3600;

type Params = Promise<{ lang: string; currency: string }>;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export const metadata: Metadata = { title: "GRIND STUDIO All Access", robots: { index: false, follow: false } };

const OFFER = "all-access";

// Each pack at its full price, as our own pages state it (2026-11-16, "devi fare confronto prezzo con
// prezzi non scontati dei packs"): the Jazz MIDI Pack's value stack (97, jazz-midi-pack/funnel.ts
// value.pack), TOP HITS' regular price after its launch (97, top-hits-chords/funnel.ts launch.after),
// HUSTLE's "31 MIDI packs at 29, total 899" and the Expansions' "Usually 147" (the Drum Kit's order-form
// add-on words), and Famous Beats' "€97 Value" (the Astro MIDI Drum Kit page's offer list). Pounds and francs take the euro number.
// 2026-11-16 evening, the long page ("non puoi aspettarti di vendere 97 euro senza una pagina da scrollare,
// ascoltare, che convinca", "linguaggio emotivo", "i produttori amano vedere i box software"): each pack
// a panel with its software box (HUSTLE's box and the All Access stack generated with Higgsfield from the
// real covers), the moment it is for, what it does for you, and what's in it (counts from each BRIEF.md).
const PACKS = [
  {
    name: "Jazz MIDI Pack",
    feel: "For the nights you want it warm.",
    head: "Chords that sound like someone who studied for years.",
    body: "You hear it in neo soul, lofi, the records that make you stop and replay a bar: chords that move like a pianist plays them. Here they are, already voiced, already in time. Drag one under your drums and the loop stops sounding like a loop.",
    inside: [
      "10,496 jazz MIDI files: 82 progressions × 12 voicings × 8 rhythms, best-sounding first",
      "Every progression in every key, bass lines, combo loops",
      "Lofi, neo soul, trap soul and deep house loops with chords, bass and drums split",
      "Its seven bonuses: Chord Pack (Jazz Edition), Chord Progressions Bible, Anime & Video Games pack, Emotional Keys, Drum Loops, Jazz Record Samples, the PDF guide",
    ],
    full: { eur: 97, usd: 97 },
    image: "/funnels/jazz-midi-pack/box-520.webp",
    w: 520,
    h: 741,
  },
  {
    name: "Famous Beats Bundle",
    feel: "For the groove you heard on a record and can’t get out of your head.",
    head: "The drums from the songs you grew up on.",
    body: "Every producer has tried to rebuild a famous beat by ear and lost a whole night to it. These are the grooves themselves, as MIDI: open the file, swap in your own sounds, and learn from the inside why those records hit the way they do.",
    inside: [
      "320 hit drum grooves from 76 artists, in 32 packs",
      "2,067 MIDI files: multi-track, every drum on its own, and one-track on the General MIDI drum map",
    ],
    full: { eur: 97, usd: 97 },
    image: "/funnels/famous-beats-bundle/box3d-520.webp",
    w: 520,
    h: 642,
  },
  {
    name: "TOP HITS MIDI Bundle",
    feel: "For when a beat needs to feel familiar.",
    head: "The progressions under the biggest hits.",
    body: "There’s a reason some songs feel like home the first time you hear them. It’s often the chords. Start from the progression under a hit you love, make it yours, and your beat carries that same pull.",
    inside: ["1,000 chord progressions from the biggest hits", "Four folders: Modern Pop & Ballads; Hiphop, Trap & Urban; Dance & Electronic; Vintage Classics, Rock & Country"],
    full: { eur: 97, usd: 97 },
    image: "/funnels/top-hits-midi-bundle/box3d-520.webp",
    w: 520,
    h: 684,
  },
  {
    name: "HUSTLE Bundle",
    feel: "For when nothing comes.",
    head: "31 packs for the days your ideas run dry.",
    body: "Some days you sit down, open the session and nothing comes. That’s when you need a pile of ideas you can try one after the other until something clicks. Thirty-one packs of chords and melodies, ready to drag in.",
    inside: ["31 MIDI packs of chords and melodies", "Jazz, trap, hip-hop, lofi, pop"],
    full: { eur: 899, usd: 899 },
    image: "/funnels/midi-drum-kit/hustle-box-440.webp",
    w: 440,
    h: 440,
  },
  {
    name: "MIDI Drum Kit Expansions",
    feel: "For when the session wants a different floor.",
    head: "Your Drum Kit, in three more worlds.",
    body: "The Drum Kit you just got gives your beats bounce. The Expansions take that feeling somewhere else: a lazy Lo-Fi pocket, a House night, an Afrobeat groove that makes people move. Complete beats, ready to go.",
    inside: ["172 MIDI drum files", "Complete beats for Lo-Fi, House and Afrobeat"],
    full: { eur: 147, usd: 147 },
    image: "/funnels/midi-drum-kit/bump-expansions.webp",
    w: 500,
    h: 500,
  },
];

const js = (tag: string) => tag.replace(/^\s*<script>/, "").replace(/<\/script>\s*$/, "");

export default async function AllAccess({ params }: { params: Params }) {
  const { lang, currency: cur } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(cur as Currency)) notFound();
  const currency = cur as Currency;
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = product.offers?.find((o) => o.id === OFFER);
  if (!offer) notFound();
  const price = money(priceIn(offer.price, currency), currency);
  const fullN = PACKS.reduce((n, p) => n + priceIn(p.full, currency), 0);
  const fmt = (n: number) => money(n, currency).replace(/(\d)(\d{3})$/, "$1,$2");
  const full = fmt(fullN);
  const save = fmt(fullN - priceIn(offer.price, currency));

  return (
    <main className={`${j.page} ${j.jazz} ${display.variable}`} lang={lang}>
      <script dangerouslySetInnerHTML={{ __html: ORIGIN_BOUNCE_JS }} />
      <script dangerouslySetInnerHTML={{ __html: js(headScripts()) }} />
      <Beacon funnel={funnel.slug} page={beaconStep(product, OFFER, "upsell-1")} lang={lang} abCookie={LP.cookie} />

      {/* "✓ Payment received", where the downloads are, and the funnel's steps (upsell.ts stepsBar). */}
      <div dangerouslySetInnerHTML={{ __html: stepsBar(product, OFFER, lang) }} />

      <section className={u.top}>
        <div className={j.wrap}>
          <p className={u.pre}>This offer exists on this page only.</p>
          <h1 className={u.head}>
            <span className={u.line}>The drums are done.</span>{" "}
            <em className={`${j.hl} ${u.line}`}>Now the part where most beats die.</em>
          </h1>
          <p className={u.sub}>
            The chords, the melody, the groove that makes a loop feel like a song. All Access is five of our packs in one download, for
            every night you sit down and want the beat to finally sound like the music in your head.
          </p>
          <img
            className={u.hero}
            src="/funnels/midi-drum-kit/all-access-1024.webp"
            srcSet="/funnels/midi-drum-kit/all-access-640.webp 640w, /funnels/midi-drum-kit/all-access-1024.webp 1024w"
            sizes="(max-width: 760px) 100vw, 760px"
            width={1024}
            height={688}
            alt="GRIND STUDIO All Access: the Jazz MIDI Pack, Famous Beats Bundle, TOP HITS MIDI Bundle, HUSTLE Bundle and Drum Kit Expansions"
            fetchPriority="high"
          />
          <p className={u.sum}>
            Five packs. <s>{full}</s> at full price. Yours today for <em className={j.hl}>{price}</em>.
          </p>
          <Buttons price={price} />
        </div>
      </section>

      <section className={`${j.sec} ${u.sec}`}>
        <div className={u.col}>
          <h2 className={u.h2}>
            <span className={u.line}>You know that night.</span>
          </h2>
          <div className={u.letter}>
            <p>The drums knock. You’re nodding. For ten minutes you feel like this is the one.</p>
            <p>
              Then you need chords. You try a few. They sound like homework. You scroll through a folder of free packs you downloaded two years
              ago, and nothing fits. The loop plays for the twentieth time and the feeling is gone.
            </p>
            <p>So you save it as “beat idea 47” and close the laptop. Another one for the folder.</p>
            <p className={u.pull}>It’s not talent you’re missing. It’s material.</p>
            <p>
              The producers you look up to don’t start from silence every night. They have years of chords in their hands, grooves in their ears,
              records they’ve taken apart. That’s what makes them fast. That’s what makes it sound finished.
            </p>
            <p>
              All Access hands you that library. Warm jazz chords for the late nights, the drums from the records you love, the progressions
              under the biggest hits, 31 packs for the days nothing comes, and your Drum Kit in three new styles. Whatever the beat asks for,
              it’s already in your folder.
            </p>
          </div>
        </div>
      </section>

      <section className={`${j.sec} ${u.sec} ${u.dark}`}>
        <div className={u.col}>
          <h2 className={u.h2}>
            <span className={u.line}>Don’t take our word for it.</span> <em className={`${j.hl} ${u.line}`}>Press play.</em>
          </h2>
          <p className={u.lead}>Real files from the packs. Put your headphones on.</p>
          <Listen />
        </div>
      </section>

      <section className={`${j.sec} ${u.sec}`}>
        <div className={j.wrap}>
          <h2 className={`${u.h2} ${u.center}`}>
            <span className={u.line}>Five packs.</span> <em className={`${j.hl} ${u.line}`}>One for every mood a beat can have.</em>
          </h2>
          <div className={u.panels}>
            {PACKS.map((p) => (
              <article key={p.name} className={u.panel}>
                <div className={u.cover}>
                  <img src={p.image} width={p.w} height={p.h} alt={`${p.name} box`} loading="lazy" decoding="async" />
                </div>
                <div className={u.copy}>
                  <p className={u.feel}>{p.feel}</p>
                  <h3 className={u.h3}>{p.name}</h3>
                  <p className={u.pHead}>{p.head}</p>
                  <p className={u.pBody}>{p.body}</p>
                  <ul className={u.ticks}>
                    {p.inside.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className={u.alone}>
                    On its own: <s>{fmt(priceIn(p.full, currency))}</s> <span>· included</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${j.sec} ${u.sec} ${u.dark}`}>
        <div className={u.col}>
          <h2 className={`${u.h2} ${u.center}`}>
            <span className={u.line}>Five packs.</span> <em className={`${j.hl} ${u.line}`}>For the price of one.</em>
          </h2>
          <ul className={u.stack}>
            {PACKS.map((p) => (
              <li key={p.name}>
                <span>{p.name}</span>
                <s>{fmt(priceIn(p.full, currency))}</s>
              </li>
            ))}
            <li className={u.total}>
              <span>At full price</span>
              <s>{full}</s>
            </li>
            <li className={u.today}>
              <span>With your Drum Kit, today</span>
              <b>{price}</b>
            </li>
          </ul>
          <p className={u.save}>You save {save}.</p>
          <p className={u.lead}>
            One payment, nothing monthly. This offer lives on this page only, right after your Drum Kit: once you leave it, it’s gone.
          </p>
          <Buttons price={price} />
        </div>
      </section>

      <section className={`${j.sec} ${u.sec}`}>
        <div className={u.col}>
          <h2 className={`${u.h2} ${u.center}`}>
            <span className={u.line}>Next week, two ways.</span>
          </h2>
          <div className={u.ba}>
            <div>
              <p className={u.badL}>Without it</p>
              <ul className={u.baList}>
                <li>You open a session with a great drum loop and nothing to put on it.</li>
                <li>You lose another night hunting for chords that don’t sound like a lesson.</li>
                <li>You try to rebuild a beat you love by ear and give up halfway.</li>
                <li>The folder of unfinished ideas keeps growing.</li>
              </ul>
            </div>
            <div>
              <p className={u.goodL}>With All Access</p>
              <ul className={u.baList}>
                <li>You open a session and drag in chords that already sound like a record.</li>
                <li>You pick the mood first, jazz, a hit, trap, lofi, and the material is there.</li>
                <li>You open the actual groove of a song you love and see how it works.</li>
                <li>You finish beats. And you play them for people.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={`${j.sec} ${u.sec} ${u.dark}`}>
        <div className={`${u.col} ${u.center}`}>
          <img className={u.seal} src="/funnels/midi-drum-kit/badge-quality.webp" width={200} height={200} alt="14-day quality guarantee" loading="lazy" decoding="async" />
          <h2 className={u.h2}>
            <span className={u.line}>14-day quality guarantee.</span>
          </h2>
          <p className={u.lead}>
            Open every pack, use the files in your sessions. If a file doesn’t work in your DAW, write to us and we fix it. If we can’t, you get a
            refund.
          </p>
        </div>
      </section>

      <section className={`${j.sec} ${u.sec}`}>
        <div className={u.col}>
          <h2 className={`${u.h2} ${u.center}`}>
            <span className={u.line}>Questions</span>
          </h2>
          <dl className={u.faq}>
            <dt>Do I have to enter my card again?</dt>
            <dd>No. Yes charges the payment you just used for the Drum Kit. If you paid with PayPal, PayPal may ask you to confirm once.</dd>
            <dt>Where do I get the files?</dt>
            <dd>On your download page, right after this one, next to your Drum Kit. Each pack is its own download, yours to keep.</dd>
            <dt>Will it work in my DAW?</dt>
            <dd>
              They’re MIDI files, so they open in any DAW that reads .mid: FL Studio, Ableton Live, Logic, Cubase, Studio One, Reaper, Bitwig,
              GarageBand. The Jazz pack’s loops and record samples are WAV.
            </dd>
            <dt>Is it a subscription?</dt>
            <dd>No. One payment, {price}, and the packs are yours.</dd>
          </dl>
        </div>
      </section>

      <section className={`${u.top} ${u.end}`}>
        <div className={j.wrap}>
          <h2 className={u.h2}>
            <span className={u.line}>You already made the first move tonight.</span>{" "}
            <em className={`${j.hl} ${u.line}`}>Give your beats everything else.</em>
          </h2>
          <img
            className={u.heroSm}
            src="/funnels/midi-drum-kit/all-access-640.webp"
            width={640}
            height={430}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <p className={u.sum}>
            <s>{full}</s> → <em className={j.hl}>{price}</em>, one payment, instant download.
          </p>
          <Buttons price={price} />
        </div>
      </section>

      <footer className={j.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms}>Terms</a> · <a href={funnel.legal.privacy}>Privacy</a> ·{" "}
          <a href={funnel.legal.refund}>Refund policy</a> · <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
      </footer>

      <script
        dangerouslySetInnerHTML={{ __html: js(script(funnel.slug, OFFER, lang, nextStep(product, lang, OFFER), checkoutPages(product, lang).thankYou)) }}
      />
    </main>
  );
}

function Buttons({ price }: { price: string }) {
  return (
    <div className={u.buttons}>
      <a href="#yes" data-oto="yes" className={b.btn}>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span className="elButtonMainText">Yes, I want all five</span>
          <Arrow className={b.arrow} />
        </span>
        <span className={b.inner}>{price} · instant download</span>
      </a>
      <a href="#no" data-oto="no" className={u.no}>
        No thanks, just the Drum Kit
      </a>
    </div>
  );
}
