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
// feel: the moment each pack is for (the copy is feeling-based, "make the copy of the page emotion based").
const PACKS = [
  {
    name: "Jazz MIDI Pack",
    feel: "For the nights you want it warm.",
    what: "10,496 jazz MIDI files, voiced the way a pianist plays, with its seven bonuses.",
    full: { eur: 97, usd: 97 },
    image: "/funnels/jazz-midi-pack/box-520.webp",
  },
  {
    name: "Famous Beats Bundle",
    feel: "For the groove you heard on a record and can’t get out of your head.",
    what: "320 famous drum beats, as MIDI.",
    full: { eur: 97, usd: 97 },
    image: "/funnels/home/famous-beats-box.webp",
  },
  {
    name: "TOP HITS MIDI Bundle",
    feel: "For when a beat needs to feel familiar.",
    what: "1000 chord progressions from the biggest hits.",
    full: { eur: 97, usd: 97 },
    image: "/funnels/home/top-hits-box.webp",
  },
  {
    name: "HUSTLE Bundle",
    feel: "For when nothing comes.",
    what: "31 MIDI packs of chords and melodies: jazz, trap, hip-hop, lofi, pop.",
    full: { eur: 899, usd: 899 },
    image: "/funnels/midi-drum-kit/bump-hustle.webp",
  },
  {
    name: "MIDI Drum Kit Expansions",
    feel: "For when the session wants a different floor.",
    what: "172 MIDI drum files: Lo-Fi, House and Afrobeat.",
    full: { eur: 147, usd: 147 },
    image: "/funnels/midi-drum-kit/bump-expansions.webp",
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
  const full = money(
    PACKS.reduce((n, p) => n + priceIn(p.full, currency), 0),
    currency,
  ).replace(/(\d)(\d{3})$/, "$1,$2");

  return (
    <main className={`${j.page} ${j.jazz} ${display.variable}`} lang={lang}>
      <script dangerouslySetInnerHTML={{ __html: ORIGIN_BOUNCE_JS }} />
      <script dangerouslySetInnerHTML={{ __html: js(headScripts()) }} />
      <Beacon funnel={funnel.slug} page={beaconStep(product, OFFER, "upsell-1")} lang={lang} abCookie={LP.cookie} />

      {/* "✓ Payment received", where the downloads are, and the funnel's steps (upsell.ts stepsBar). */}
      <div dangerouslySetInnerHTML={{ __html: stepsBar(product, OFFER, lang) }} />

      <section className={u.top}>
        <div className={j.wrap}>
          <p className={u.pre}>Before your downloads</p>
          <h1 className={u.head}>
            The drums are done. <em className={j.hl}>Now the part where most beats die.</em>
          </h1>
          <p className={u.sub}>
            You know that night: the drums knock, the loop plays for the twentieth time, and you can’t find the chords that make it feel like something.
            So you close the laptop. All Access is five packs for that moment. Drag one in, and the loop turns into a song you want to finish.
          </p>

          <ul className={u.packs}>
            {PACKS.map((p, i) => (
              <li key={p.name} className={u.pack}>
                <img src={p.image} width={96} height={96} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
                <div>
                  <p className={u.name}>{p.name}</p>
                  <p className={u.feel}>{p.feel}</p>
                  <p className={u.what}>{p.what}</p>
                </div>
                <span className={u.alone}>{money(priceIn(p.full, currency), currency)} full price</span>
              </li>
            ))}
          </ul>

          <p className={u.sum}>
            At full price: <s>{full}</s>. With your order today: <em className={j.hl}>{price}</em>.
          </p>
          <Buttons price={price} />
          <p className={u.note}>
            One download page, next to your Drum Kit. The next time you open an empty session, you start with something.
            <br />
            14-day quality guarantee: a file doesn’t work, we fix it, or you get a refund.
          </p>
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
