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

// Each pack at the price our pages sell it for on its own (2026-11-16): the Jazz MIDI Pack's
// own funnel (37), Famous Beats' and TOP HITS' own funnels (27), the HUSTLE Bundle and the
// Expansions as order-form add-ons (27, 7). Pounds and francs take the euro number (lib/geo.ts).
const PACKS = [
  {
    name: "Jazz MIDI Pack",
    what: "10,496 jazz MIDI files: the chords under lofi, neo soul and trap soul, voiced like a pianist, with its seven bonuses.",
    price: { eur: 37, usd: 37 },
    image: "/funnels/jazz-midi-pack/box-520.webp",
  },
  {
    name: "Famous Beats Bundle",
    what: "320 drum beats from famous records, transcribed as MIDI.",
    price: { eur: 27, usd: 27 },
    image: "/funnels/home/famous-beats-box.webp",
  },
  {
    name: "TOP HITS MIDI Bundle",
    what: "1000 chord progressions from the biggest hits, as drag-and-drop MIDI files.",
    price: { eur: 27, usd: 27 },
    image: "/funnels/home/top-hits-box.webp",
  },
  {
    name: "HUSTLE Bundle",
    what: "31 MIDI packs: jazz, trap, hip-hop, lofi, pop and more.",
    price: { eur: 27, usd: 27 },
    image: "/funnels/midi-drum-kit/bump-hustle.webp",
  },
  {
    name: "MIDI Drum Kit Expansions",
    what: "172 MIDI drum files: complete beats for Lo-Fi, House and Afrobeat.",
    price: { eur: 7, usd: 7 },
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
  const sum = money(
    PACKS.reduce((n, p) => n + priceIn(p.price, currency), 0),
    currency,
  );

  return (
    <main className={`${j.page} ${j.jazz} ${display.variable}`} lang={lang}>
      <script dangerouslySetInnerHTML={{ __html: ORIGIN_BOUNCE_JS }} />
      <script dangerouslySetInnerHTML={{ __html: js(headScripts()) }} />
      <Beacon funnel={funnel.slug} page={beaconStep(product, OFFER, "upsell-1")} lang={lang} abCookie={LP.cookie} />

      {/* "✓ Payment received", where the downloads are, and the funnel's steps (upsell.ts stepsBar). */}
      <div dangerouslySetInnerHTML={{ __html: stepsBar(product, OFFER, lang) }} />

      <section className={u.top}>
        <div className={j.wrap}>
          <p className={u.pre}>One offer before your downloads</p>
          <h1 className={u.head}>
            Five more of our packs, in one download. <em className={j.hl}>{price} for all five.</em>
          </h1>
          <p className={u.sub}>
            You have the drums. These are the chords, the beats and the loops to go with them: five of our packs, {sum} one by one on our pages.
            Add all of them to your order for {price}.
          </p>

          <ul className={u.packs}>
            {PACKS.map((p, i) => (
              <li key={p.name} className={u.pack}>
                <img src={p.image} width={96} height={96} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
                <div>
                  <p className={u.name}>{p.name}</p>
                  <p className={u.what}>{p.what}</p>
                </div>
                <span className={u.alone}>{money(priceIn(p.price, currency), currency)} alone</span>
              </li>
            ))}
          </ul>

          <p className={u.sum}>
            Bought one by one: <s>{sum}</s>. With your order: <em className={j.hl}>{price}</em>.
          </p>
          <Buttons price={price} />
          <p className={u.note}>
            All five land on the same download page as your MIDI Drum Kit. 14-day quality guarantee: a file doesn’t work, we fix it, or you get a refund.
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
          <span className="elButtonMainText">Yes, add All Access to my order</span>
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
