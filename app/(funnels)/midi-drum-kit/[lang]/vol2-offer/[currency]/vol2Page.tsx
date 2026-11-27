import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
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
import { SHOP_SLUG } from "@/lib/shop";
import u from "../../jazz-offer/[currency]/jazzOffer.module.css";
import v from "./vol2Offer.module.css";
import { Previews, type Preview } from "./Previews";

// MIDI Drum Kit Vol.2 as the Drum Kit's first one-click upsell (2026-11-23, "xkè poi lo mettiamo come oto
// upsell di midi drum kit vol1", then "Yes, make the OTO"). English in every language for now, like the Jazz
// upsell. The Yes / No links are upsell.ts' buttons (a[data-oto]): Yes charges the card the Drum Kit was paid
// with, or sends a PayPal buyer to confirm. proxy.ts rewrites /<lang>/midi-drum-kit/vol2-offer here.
// Claims: ../../../BRIEF.md (Vol.2). Previews: beat 01 of each style; the picture of a whole beat is Trap
// beat 01's FULL SONG EXTENDED (Desktop/MIDI Drum Kit 2 Tools/vol2_song_svg.py).

type Params = Promise<{ lang: string; currency: string }>;

const OFFER = "vol2";

const PREVIEWS: Preview[] = [
  { slug: "trap", name: "Trap", bpm: 154, secs: 45 },
  { slug: "atlanta-trap", name: "Atlanta Trap", bpm: 131, secs: 53 },
  { slug: "dark-trap", name: "Dark Trap", bpm: 118, secs: 58 },
  { slug: "melodic-trap", name: "Melodic Trap", bpm: 162, secs: 43 },
  { slug: "drill", name: "Drill", bpm: 144, secs: 48 },
  { slug: "rage-and-plugg", name: "Rage & Plugg", bpm: 150, secs: 46 },
  { slug: "detroit", name: "Detroit", bpm: 95, secs: 72 },
  { slug: "west-coast", name: "West Coast", bpm: 100, secs: 69 },
  { slug: "phonk", name: "Phonk", bpm: 139, secs: 50 },
  { slug: "boom-bap", name: "Boom Bap", bpm: 94, secs: 73 },
  { slug: "rnb-trapsoul", name: "R&B Trapsoul", bpm: 121, secs: 57 },
  { slug: "slow-bounce", name: "Slow Bounce", bpm: 102, secs: 67 },
];

// The 40 beats of each style span these tempos (their file names).
const STYLES: [string, string][] = [
  ["Trap", "120 to 164 bpm"],
  ["Atlanta Trap", "118 to 160 bpm"],
  ["Dark Trap", "112 to 167 bpm"],
  ["Melodic Trap", "121 to 163 bpm"],
  ["Drill", "140 to 146 bpm"],
  ["Rage & Plugg", "134 to 160 bpm"],
  ["Detroit", "88 to 102 bpm"],
  ["West Coast", "94 to 101 bpm"],
  ["Phonk", "117 to 150 bpm"],
  ["Boom Bap", "86 to 95 bpm"],
  ["R&B Trapsoul", "120 to 154 bpm"],
  ["Slow Bounce", "83 to 106 bpm"],
];

const js = (tag: string) => tag.replace(/^\s*<script>/, "").replace(/<\/script>\s*$/, "");

// alone: the same page as a normal sales page, for someone with no order to add it to (../../vol2, sent by
// link to Vol.1 buyers, 2026-11-27: "semplicemente rendila pagina funnel normale che lui può usare"). No steps
// bar, no "No thanks", no one-click script; the button opens the shop checkout with Vol.2 in the cart (the
// catalog row midi-drum-kit-vol2, live but unlisted: lib/shop.ts UNLISTED). Counted as the shop's, not the funnel's.
export async function Vol2Page({ params, alone }: { params: Params; alone: boolean }) {
  const { lang, currency: cur } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(cur as Currency)) notFound();
  const currency = cur as Currency;
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = product.offers?.find((o) => o.id === OFFER);
  if (!offer) notFound();
  const price = money(priceIn(offer.price, currency), currency);

  return (
    <main className={`${j.page} ${j.jazz} ${display.variable}`} lang="en">
      <script dangerouslySetInnerHTML={{ __html: ORIGIN_BOUNCE_JS }} />
      {alone ? (
        <Beacon funnel={SHOP_SLUG} page="landing" />
      ) : (
        <>
          <script dangerouslySetInnerHTML={{ __html: js(headScripts()) }} />
          <Beacon funnel={funnel.slug} page={beaconStep(product, OFFER, "upsell-1")} lang={lang} abCookie={LP.cookie} />
        </>
      )}

      {!alone && <div dangerouslySetInnerHTML={{ __html: stepsBar(product, OFFER, lang) }} />}

      <section className={u.top}>
        <div className={j.wrap}>
          <h1 className={u.head}>
            <span className={v.lines}>Your drums bounce now.</span>
            <em className={`${j.hl} ${v.lines}`}>Turn them into whole songs.</em>
          </h1>
          <p className={u.sub}>
            MIDI Drum Kit Vol.2: 480 beats already arranged from intro to outro, in 12 hip-hop styles. Drag one in and the drums play the
            whole song: verse, hook, switch-up, breakdown, outro. {alone ? `Get it for ${price}.` : `Add it to your order for ${price}.`}
          </p>
          <img className={v.box} src="/funnels/midi-drum-kit/vol2/box-480.webp" srcSet="/funnels/midi-drum-kit/vol2/box-480.webp 480w, /funnels/midi-drum-kit/vol2/box-720.webp 720w" sizes="300px" width={480} height={638} alt="MIDI Drum Kit Vol.2 box" fetchPriority="high" />
          <Buttons price={price} alone={alone} />
        </div>
      </section>

      <section className={`${v.section} ${v.alt}`}>
        <div className={`${v.narrow} ${v.center}`}>
          <h2 className={j.h2}>
            <span className={v.lines}>Hear a whole beat,</span>
            <em className={`${j.hl} ${v.lines}`}>not a loop.</em>
          </h2>
          <p className={j.lead} style={{ marginInline: "auto" }}>
            One beat from each style. Every preview runs through the song: the hook, a verse, the switch-up, the build, the hook lifting, the
            outro.
          </p>
        </div>
        <div className={v.narrow}>
          <Previews items={PREVIEWS} />
          <p className={v.small}>The previews play the MIDI files on our drum sounds. You get the MIDI files: put your own sounds on them.</p>
        </div>
      </section>

      <section className={v.section}>
        <div className={`${v.narrow} ${v.text}`}>
          <h2 className={j.h2} style={{ marginBottom: 28 }}>
            <span className={v.lines}>The loop sounds good.</span>
            <em className={`${j.hl} ${v.lines}`}>The song never comes.</em>
          </h2>
          <p>You make eight bars that knock. You play them for an hour. Then you try to turn them into a song and you don’t know where the drums should drop out, when the hook should hit harder, how the verse should sit back so the vocal has room.</p>
          <p>So the loop stays a loop. The folder fills up with eight-bar ideas, and none of them is a finished beat you can send to an artist.</p>
          <p>Vol.2 is the part after the loop. Every beat is already a song: the intro builds, the verse leaves space, the hook comes in full, the switch-up changes the bounce, the breakdown takes the drums away, the last hook lifts after four bars. You put your melody on top and the beat is done.</p>
        </div>
      </section>

      <section className={`${v.section} ${v.alt}`}>
        <div className={`${v.narrow} ${v.center}`}>
          <h2 className={j.h2}>Every beat is a whole song.</h2>
          <p className={j.lead} style={{ marginInline: "auto" }}>
            This is one of the 480: Trap at 154 bpm, from the first bar to the last. Every yellow mark is a drum hit.
          </p>
        </div>
        <div className={v.song}>
          <div className={v.songScroll}>
            <img src="/funnels/midi-drum-kit/vol2/whole-beat.svg" width={1352} height={256} alt="One Vol.2 beat from start to finish: intro, hook, verses, pre-hook, hook, switch-up, verse, hook lifting, breakdown, hook, outro, 104 bars" loading="lazy" decoding="async" />
          </div>
          <p className={v.hint}>104 bars. Swipe to see the whole beat.</p>
        </div>
        <div className={`${v.narrow}`} style={{ marginTop: 48 }}>
          <h3 className={j.h2} style={{ fontSize: "clamp(24px, 4vw, 32px)" }}>In each beat’s folder</h3>
          <ul className={v.list}>
            <li><span><b>The full song</b>, intro to outro, 72 or 80 bars.</span></li>
            <li><span><b>The extended song</b>, 96 or 104 bars, with the switch-up and the breakdown in it.</span></li>
            <li><span><b>Intro, verse, hook, bridge and outro</b>, each on its own, to loop or rearrange.</span></li>
            <li><span><b>Seven more sections:</b> a long intro, a pre-hook, a hook that lifts after 4 bars, a hook that lifts after 8, the switch-up, the breakdown, a long outro.</span></li>
            <li><span><b>Every drum of the verse and the hook on its own</b>: kick, snare, hats, 808 and the rest, one file each.</span></li>
            <li><span><b>A General MIDI copy</b> of every file, so it plays right on any DAW’s drum kit.</span></li>
          </ul>
        </div>
      </section>

      <section className={v.section}>
        <div className={v.narrow}>
          <h2 className={`${j.h2} ${v.center}`}>12 hip-hop styles, 40 beats each.</h2>
          <ul className={v.styles}>
            {STYLES.map(([name, bpm]) => (
              <li key={name}>
                {name} <span>{bpm}</span>
              </li>
            ))}
          </ul>
          <div className={v.numbers}>
            <div><b>480</b><span>whole beats</span></div>
            <div><b>12</b><span>styles</span></div>
            <div><b>18,701</b><span>MIDI files</span></div>
          </div>
          <p className={v.small} style={{ fontSize: 17 }}>None of these beats are in your MIDI Drum Kit. Vol.1 gave you the bounce. Vol.2 gives you the song.</p>
        </div>
      </section>

      <section className={`${v.section} ${v.alt}`}>
        <div className={`${v.narrow} ${v.center} ${v.text}`}>
          <div className={v.numbers} style={{ marginTop: 0 }}>
            <div><b>60</b><span>days</span></div>
          </div>
          <h2 className={j.h2} style={{ margin: "24px 0" }}>60-day quality guarantee.</h2>
          <p>If a file doesn’t open or play right in your DAW and we can’t fix it, you get a refund. Write to {funnel.support}.</p>
        </div>
      </section>

      <section className={u.end}>
        <div className={j.wrap}>
          <h2 className={j.h2}>
            {alone ? "Get" : "Add"} MIDI Drum Kit Vol.2 for <em className={j.hl}>{price}</em>.
          </h2>
          <p className={u.sub}>{alone ? "Instant download, right after you pay." : "It goes on the same download page as your MIDI Drum Kit."}</p>
          <Buttons price={price} alone={alone} />
        </div>
      </section>

      <footer className={j.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms}>Terms</a> · <a href={funnel.legal.privacy}>Privacy</a> ·{" "}
          <a href={funnel.legal.refund}>Refund policy</a> · <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
        <p className={j.legal}>The previews play the MIDI files on drum samples. The MIDI files contain no audio.</p>
      </footer>

      {!alone && <script dangerouslySetInnerHTML={{ __html: js(script(funnel.slug, OFFER, lang, nextStep(product, lang, OFFER))) }} />}
    </main>
  );
}

function Buttons({ price, alone }: { price: string; alone: boolean }) {
  if (alone)
    return (
      <div className={u.buttons}>
        <a href="/shop/cart?add=midi-drum-kit-vol2" className={b.btn}>
          <span className={b.shine} aria-hidden />
          <span className={b.label}>
            <span className="elButtonMainText">Get MIDI Drum Kit Vol.2</span>
            <Arrow className={b.arrow} />
          </span>
          <span className={b.inner}>{price} · instant download</span>
        </a>
      </div>
    );
  return (
    <div className={u.buttons}>
      <a href="#yes" data-oto="yes" className={b.btn}>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span className="elButtonMainText">Yes, add Vol.2 to my order</span>
          <Arrow className={b.arrow} />
        </span>
        <span className={b.inner}>{price} · one tap, instant download</span>
      </a>
      <a href="#no" data-oto="no" className={u.no}>
        No thanks, my beats stay loops
      </a>
    </div>
  );
}
