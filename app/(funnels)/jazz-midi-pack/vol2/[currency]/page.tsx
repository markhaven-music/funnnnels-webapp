import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency, priceIn } from "@/lib/geo";
import { money } from "@/lib/launch";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { Beacon } from "../../../Beacon";
import { UpsellButtons } from "../../../drunk-swing-grooves/UpsellButtons";
import { beaconStep, headScripts, stepsBar } from "../../../midi-drum-kit/upsell";
import u from "../../../midi-drum-kit/[lang]/jazz-offer/[currency]/jazzOffer.module.css";
import { display } from "../../fonts";
import { funnel } from "../../funnel";
import j from "../../jazz.module.css";
import shot from "../../shot.module.css";
import { vol2 } from "../vol2";
import { Vol2Player } from "../Vol2Player";
import v from "../vol2.module.css";

// Jazz MIDI Pack Vol. 2, the first one-click upsell after the Jazz MIDI Pack order (2026-11-15, "Sì, parti":
// a ladder, an upgrade of what was just bought first, at about its price). Sold only here.
// The page sells without the video: of the buyers who saw the Famous Beats upsell, 1 in 10 pressed play
// on its video and the median stay was 39 seconds, 6 in 10 on a phone. So the offer, the price and
// the Yes are on the first screen, and six real files play right under it.
// Yes / No: the React buttons of the Drunk Swing Grooves upsell (UpsellButtons.tsx), not upsell.ts' script:
// that one rewrites the button's line for a PayPal buyer before React wakes the page, which React then
// undoes (a hydration error, and the PayPal buyer read "one tap"). proxy.ts rewrites /jazz-midi-pack/vol2 here.
// Claims: ../vol2.ts, counted from ~/Desktop/Jazz MIDI Pack Vol. 2 (make_pack_vol2.py).

export const revalidate = 3600;

type Params = Promise<{ currency: string }>;

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = { title: "Add Jazz MIDI Pack Vol. 2 · GRIND STUDIO", robots: { index: false, follow: false } };

const OFFER = vol2.id;
const js = (tag: string) => tag.replace(/^\s*<script>/, "").replace(/<\/script>\s*$/, "");
const num = (n: number) => n.toLocaleString("en-US");

export default async function Vol2Offer({ params }: { params: Params }) {
  const { currency: cur } = await params;
  if (!CURRENCIES.includes(cur as Currency)) notFound();
  const currency = cur as Currency;
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  // Dashboard → Products decides whether it's on sale and at what price; before that, the code's entry (a preview).
  const offer = product.offers?.find((o) => o.id === OFFER) ?? funnel.offers.find((o) => o.id === OFFER);
  if (!offer) notFound();
  const price = money(priceIn(offer.price, currency), currency);
  const next = nextStep(product, "en", OFFER);
  const buttons = (
    <div className={v.buttons}>
      <UpsellButtons
        funnel={funnel.slug}
        offer={OFFER}
        next={next}
        yes="Yes, add Vol. 2 to my order"
        yesSub={`${price} · one tap, instant download`}
        no={`No thanks, I’ll stay with the ${vol2.progressions} I have`}
      />
    </div>
  );

  return (
    <main className={`${j.page} ${j.jazz} ${display.variable}`} lang="en">
      <script dangerouslySetInnerHTML={{ __html: ORIGIN_BOUNCE_JS }} />
      <script dangerouslySetInnerHTML={{ __html: js(headScripts()) }} />
      <Beacon funnel={funnel.slug} page={beaconStep(product, OFFER, "upsell-1")} lang="en" />
      <div dangerouslySetInnerHTML={{ __html: stepsBar(product, OFFER, "en") }} />

      <section className={u.top}>
        <div className={`${j.wrap} ${v.hero}`}>
          <div className={v.pitch}>
            {/* 2026-11-16, "frame this Vol.2 emotionally … cater to the feelings of the customer and their desires":
                the feeling a chord gives, then what Vol. 2 is, then the price. Facts: ../vol2.ts. */}
            <p className={u.pre}>Before your downloads: one offer, made for Jazz MIDI Pack buyers</p>
            <h1 className={u.head}>
              You know that feeling when a chord gives you chills? <em className={j.hl}>Here are {vol2.progressions} more of them.</em>
            </h1>
            <p className={u.sub}>
              {`Vol. 2 is for the nights you want your beat to make someone feel something. Late-night neo soul, Sunday-morning gospel, gritty blues, bossa, city pop sunsets and the chords from the last scene of a film. ${num(vol2.files)} MIDI files, ready to drag into your DAW. ${price}, added to the order you just paid.`}
            </p>
            {buttons}
            {/* The video under the buttons: the page sells without it (1 in 10 played the earlier upsell's), and on a
                phone it stays below the first screen. Lazy, so it costs the first screen nothing. */}
            <div className={`${j.vsl} ${v.video}`}>
              <iframe
                src={`https://fast.wistia.net/embed/iframe/${vol2.wistiaId}?playerColor=f5b800&videoFoam=false`}
                title="Jazz MIDI Pack Vol. 2: 82 more chords that give you chills"
                allow="autoplay; fullscreen"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
          {/* Vol. 2's own box (2026-11-15, "needs to be similar to the one we have but slightly different to indicate a
              vol.2": the pack's box and lettering, a guitar where the piano and saxophone were). Made on Higgsfield
              from the pack's box, cut from its black background by tools/cut_box.cjs. */}
          <div className={`${shot.stage} ${shot.box} ${v.box}`}>
            <img
              className={shot.img}
              src="/funnels/jazz-midi-pack/box-vol2-520.webp"
              srcSet="/funnels/jazz-midi-pack/box-vol2-340.webp 340w, /funnels/jazz-midi-pack/box-vol2-520.webp 520w, /funnels/jazz-midi-pack/box-vol2-680.webp 680w"
              sizes="(min-width: 960px) 340px, 64vw"
              width={680}
              height={1005}
              alt="Jazz MIDI Pack Vol. 2 box by GRIND STUDIO: 82 more jazz chord progressions as MIDI files"
              fetchPriority="high"
              decoding="async"
            />
            <span className={shot.floor} aria-hidden />
          </div>
        </div>
      </section>

      <section className={j.sec}>
        <div className={j.wrap}>
          <div className={j.secHead}>
            <h2 className={j.h2}>
              Put your headphones on. <em className={j.hl}>Then press play.</em>
            </h2>
            <p className={j.sub}>
              All {vol2.progressions} progressions, each with drums. Tap a style and let it loop. In your DAW they play through whatever sound you love.
            </p>
          </div>
          <Vol2Player blurbs={[...vol2.moods]} />
        </div>
      </section>

      <section className={j.sec}>
        <div className={`${j.wrap} ${v.inside}`}>
          <div>
            <h2 className={j.h2}>
              Everything you liked in Vol. 1, <em className={j.hl}>in {vol2.progressions} new moods.</em>
            </h2>
            <ul className={j.ticks}>
              {vol2.folders.map((f) => (
                <li key={f.name}>
                  <Tick />
                  <span>
                    <strong>{f.name}:</strong> {num(f.files)} files. {f.what}
                  </span>
                </li>
              ))}
              <li>
                <Tick />
                <span>
                  <strong>Chord colours Vol. 1 doesn’t have:</strong> {vol2.colours.join(", ")}.
                </span>
              </li>
              <li>
                <Tick />
                <span>Chord names written into every file, and the same commercial license: release and sell your music, no royalties.</span>
              </li>
            </ul>
          </div>
          <div className={v.only}>
            <h3 className={v.groupTitle}>Only on this page</h3>
            <p>
              Vol. 2 isn’t on the site or in the shop. It was made for people who just bought the Jazz MIDI Pack, and this page is the only place it’s
              sold.
            </p>
            <p>
              Same {funnel.guaranteeDays}-day satisfaction guarantee as your order: if a file doesn’t work, write to{" "}
              <a href={`mailto:${funnel.support}`}>{funnel.support}</a> and we make it right.
            </p>
          </div>
        </div>
      </section>

      <section className={u.end}>
        <div className={j.wrap}>
          <h2 className={j.h2}>
            Your next beat could start <em className={j.hl}>with one of these.</em>
          </h2>
          <p className={u.sub}>Add Vol. 2 for {price}. It lands on the same download page as your Jazz MIDI Pack.</p>
          {buttons}
        </div>
      </section>

      <footer className={j.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms}>Terms</a> · <a href={funnel.legal.privacy}>Privacy</a> ·{" "}
          <a href={funnel.legal.refund}>Refund policy</a> · <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
        <p className={j.legal}>
          The previews play the MIDI files on a sine pluck or on piano samples (Salamander Grand Piano by Alexander Holm, CC BY 3.0). The MIDI files
          contain no audio.
        </p>
      </footer>

    </main>
  );
}

function Tick() {
  return (
    <svg className={j.tick} width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
