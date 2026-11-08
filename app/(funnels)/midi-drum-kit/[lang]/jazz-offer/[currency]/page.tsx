import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFunnel, nextStep, resolveFunnel } from "@/lib/funnels";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { getPublishedBlocks } from "@/lib/pages";
import { ORIGIN_BOUNCE_JS } from "@/lib/originBounce";
import { funnel as jazz } from "../../../../jazz-midi-pack/funnel";
import { DEFAULT_SECTIONS, type Section } from "../../../../jazz-midi-pack/content";
import { SectionView, fill, isSectionType, type Ctx } from "../../../../jazz-midi-pack/sections";
import { Vsl } from "../../../../jazz-midi-pack/Vsl";
import { Arrow } from "../../../../jazz-midi-pack/Cta";
import { display } from "../../../../jazz-midi-pack/fonts";
import j from "../../../../jazz-midi-pack/jazz.module.css";
import b from "../../../../jazz-midi-pack/btn.module.css";
import { funnel } from "../../../funnel";
import { isLang, LANGS } from "../../../i18n";
import { PAY } from "../../../payTest";
import { beaconStep, headScripts, script } from "../../../upsell";
import { Beacon } from "../../../../Beacon";
import u from "./jazzOffer.module.css";

// The Jazz MIDI Pack as the Drum Kit's first one-click upsell (2026-11-08, "metti
// MIDI Jazz Pack come oto upsell in MIDI Drum Kit": first, €27, a short page in
// the Jazz look). English in every language for now. The sections under the top
// are the Jazz landing's own published blocks (the box, the before/after rolls,
// the bonuses, the guarantee), so an edit there shows here too; their buttons
// to the Jazz order page are hidden. The Yes / No links are upsell.ts' buttons
// (a[data-oto]): Yes charges the card the Drum Kit was paid with, or sends a
// PayPal buyer to confirm. proxy.ts rewrites /<lang>/midi-drum-kit/jazz-offer here.
// Claims: jazz-midi-pack/BRIEF.md.

export const revalidate = 3600;

type Params = Promise<{ lang: string; currency: string }>;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => CURRENCIES.map((currency) => ({ lang, currency })));
}

export const metadata: Metadata = { title: "Add the Jazz MIDI Pack · GRIND STUDIO", robots: { index: false, follow: false } };

const OFFER = "jazz";
// The Jazz landing's blocks shown here, in this order.
const KEEP = ["product", "voicing", "compare", "bonuses", "guarantee"];

const valid = (x: unknown): x is Section =>
  !!x && typeof x === "object" && isSectionType((x as Section).type) && typeof (x as Section).props === "object";

const js = (tag: string) => tag.replace(/^\s*<script>/, "").replace(/<\/script>\s*$/, "");

export default async function JazzOffer({ params }: { params: Params }) {
  const { lang, currency: cur } = await params;
  if (!isLang(lang) || !CURRENCIES.includes(cur as Currency)) notFound();
  const currency = cur as Currency;
  const product = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const offer = product.offers?.find((o) => o.id === OFFER);
  if (!offer) notFound();
  const amount = offer.price[currency];
  const ctx: Ctx = { price: money(amount, currency), amount, currency, country: currency === "usd" ? "US" : "FR", publishableKey: null };

  const blocks = await getPublishedBlocks(jazz.slug, DEFAULT_SECTIONS, valid, { strict: true });
  const shown = KEEP.flatMap((id) => {
    const found = blocks.find((x) => x.id === id) ?? DEFAULT_SECTIONS.find((x) => x.id === id);
    if (!found) return [];
    const hide = [...((found.props as { hide?: string[] }).hide ?? []), "cta"];
    return [{ ...found, props: { ...found.props, hide } } as Section];
  });
  const voicing = shown.find((x) => x.id === "voicing");
  const compare = shown.find((x) => x.id === "compare");

  return (
    <main className={`${j.page} ${j.jazz} ${display.variable}`} lang={lang}>
      <script dangerouslySetInnerHTML={{ __html: ORIGIN_BOUNCE_JS }} />
      <script dangerouslySetInnerHTML={{ __html: js(headScripts()) }} />
      <Beacon funnel={funnel.slug} page={beaconStep(product, OFFER, "upsell-1")} lang={lang} abCookie={PAY.cookie} />

      <p className={u.done}>
        <span className={u.check} aria-hidden>
          ✓
        </span>
        Order complete. Your MIDI Drum Kit is paid and waiting for you.
      </p>

      <section className={u.top}>
        <div className={j.wrap}>
          <p className={u.pre}>One more thing for your beats</p>
          <h1 className={u.head}>
            Your drums bounce now. <em className={j.hl}>Put jazz chords on top of them.</em>
          </h1>
          <p className={u.sub}>
            {fill(
              "The Jazz MIDI Pack: {files} MIDI files of the chords under lofi, neo soul and trap soul, played the way a pianist plays them. Add it to your order for {price}, with its six bonuses. One tap, paid the way you just paid.",
              ctx,
            )}
          </p>
          <Vsl />
          <Buttons price={ctx.price} />
        </div>
      </section>

      {shown.map((section) => {
        if (section === compare && voicing) return null;
        if (section === voicing && compare) {
          return (
            <div key={section.id} className={j.pair}>
              <SectionView section={voicing} ctx={ctx} />
              <SectionView section={compare} ctx={ctx} />
            </div>
          );
        }
        return <SectionView key={section.id} section={section} ctx={ctx} />;
      })}

      <section className={u.end}>
        <div className={j.wrap}>
          <h2 className={j.h2}>
            Add the Jazz MIDI Pack for <em className={j.hl}>{ctx.price}</em>.
          </h2>
          <p className={u.sub}>The pack and its six bonuses go on the same download page as your MIDI Drum Kit.</p>
          <Buttons price={ctx.price} />
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

      <script dangerouslySetInnerHTML={{ __html: js(script(funnel.slug, OFFER, lang, nextStep(product, lang, OFFER))) }} />
    </main>
  );
}

function Buttons({ price }: { price: string }) {
  return (
    <div className={u.buttons}>
      <a href="#yes" data-oto="yes" className={b.btn}>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span className="elButtonMainText">Yes, add it to my order</span>
          <Arrow className={b.arrow} />
        </span>
        <span className={b.inner}>{price} · one tap, instant download</span>
      </a>
      <a href="#no" data-oto="no" className={u.no}>
        No thanks, I’ll skip the jazz chords
      </a>
    </div>
  );
}
