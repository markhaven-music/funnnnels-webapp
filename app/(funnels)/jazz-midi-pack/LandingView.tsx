// The Jazz MIDI Pack landing, shared by its route (./[currency]/page.tsx) and the Black Friday copy's
// (./black-friday/[currency]/page.tsx). What the page is: see the route.
import { getFunnel, resolveFunnel } from "@/lib/funnels";
import { type Currency, priceIn } from "@/lib/geo";
import { money } from "@/lib/launch";
import { getPublishedBlocks } from "@/lib/pages";
import { funnel } from "./funnel";
import { DEFAULT_SECTIONS, type Section } from "./content";
import { AB_CARRY_SCRIPT } from "./abtest";
import { JZH, JZH_CARRY_SCRIPT, JZH_SCRIPT } from "./rhodesTest";
import { SectionView, isSectionType, type Ctx } from "./sections";
import { Tracking } from "./Tracking";
import { Beacon } from "../Beacon";
import { display } from "./fonts";
import s from "./jazz.module.css";
import { BF, BF_CLOCK_JS, bfBarHtml } from "@/lib/blackFriday";

/** The Black Friday copy's order page (lib/blackFriday.ts). */
export const BF_ORDER = `${funnel.checkout.orderPage.replace(/\/order$/, "")}/${BF.path}/order`;

// The country the checkout reports when the browser has no visitor_country
// cookie (proxy.ts sets it): one that maps to the page's currency.
const FALLBACK_COUNTRY: Record<Currency, string> = { eur: "IT", usd: "US", gbp: "GB", chf: "CH" };

const valid = (b: unknown): b is Section =>
  !!b && typeof b === "object" && isSectionType((b as Section).type) && typeof (b as Section).props === "object";

// bf: the Black Friday copy (lib/blackFriday.ts, ./black-friday): BF.price with the regular one struck, a countdown in
// the red bar, every button to its own order page, no headline test (the Rhodes headline), its views under its letter.
export async function JazzLanding({ currency, bf = false }: { currency: Currency; bf?: boolean }) {
  // Its price as dashboard → Products has it.
  const f = (await resolveFunnel(funnel.slug)) ?? getFunnel(funnel.slug)!;
  const regular = priceIn(f.price, currency);
  const amount = bf ? priceIn(BF.price, currency) : regular;
  const price = money(amount, currency);
  // strict: a failed read keeps the last good page in the cache instead of
  // caching the coded defaults over the published copy.
  const sections = await getPublishedBlocks(funnel.slug, DEFAULT_SECTIONS, valid, { strict: true });
  const ctx: Ctx = {
    price,
    amount,
    currency,
    country: FALLBACK_COUNTRY[currency],
    // Read at build time, so only the public key: the secret one is the
    // checkout API's business (it answers "not connected" without it).
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    ...(bf ? { bf: { was: money(regular, currency), wasAmount: regular, order: BF_ORDER } } : {}),
  };

  return (
    <main className={`${s.page} ${s.jazz} ${display.variable}`}>
      {/* The Buy buttons take the ad tags to the order page (../abtest.ts AB_CARRY_SCRIPT). */}
      <script dangerouslySetInnerHTML={{ __html: AB_CARRY_SCRIPT }} />
      {/* The Rhodes vs beat headline test (../rhodesTest.ts): the visitor's picked before the hero paints, carried by the buttons. */}
      {!bf && <script dangerouslySetInnerHTML={{ __html: JZH_SCRIPT + JZH_CARRY_SCRIPT }} />}
      <Tracking value={amount} currency={currency} />
      {/* No pop-up on the buttons since 2026-11-19 ("togli popup upsell e availability check. si va all'order page
          normale com'era prima"): neither the Drunk Swing Grooves offer (../offerPopup.ts) nor "Checking availability…". */}
      <Beacon funnel={funnel.slug} page="landing" abCookie={bf ? BF.cookie : JZH.cookie} noAvailability />
      {/* Red, on top, like TOP HITS' and the Drum Kit's ("aggiungi anche banner rossi sopra black friday come gli altri funnels"). */}
      {bf ? (
        <>
          <div className={s.bfbar} dangerouslySetInnerHTML={{ __html: bfBarHtml("en", money(regular, currency), price) }} />
          <script dangerouslySetInnerHTML={{ __html: BF_CLOCK_JS }} />
        </>
      ) : (
        <div className={s.bfbar}>
          <b>BLACK FRIDAY:</b> 90% Sale Ends Soon
        </div>
      )}
      {sections.map((section, i) => {
        // Desktop, like the Drum Kit page's copy-beside-a-picture blocks: the
        // letter beside the before/after rolls it talks about, text left, rolls
        // right (.pair in jazz.module.css). The rolls block that follows the
        // letter is drawn inside the pair and skipped on its own turn.
        const next = sections[i + 1];
        if (section.type === "s_letter" && next?.type === "s_compare_rolls") {
          return (
            <div key={section.id} className={s.pair}>
              <SectionView section={section} ctx={ctx} />
              <SectionView section={next} ctx={ctx} />
            </div>
          );
        }
        if (section.type === "s_compare_rolls" && sections[i - 1]?.type === "s_letter") return null;
        return <SectionView key={section.id} section={section} ctx={ctx} />;
      })}
      <footer className={s.footer}>
        <p>
          © 2026 {funnel.brand} · <a href={funnel.legal.terms} rel="noopener">Terms</a> ·{" "}
          <a href={funnel.legal.privacy} rel="noopener">Privacy</a> ·{" "}
          <a href={funnel.legal.refund} rel="noopener">Refund policy</a> ·{" "}
          <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
        <p className={s.legal}>
          The previews play the MIDI files on a sine pluck or on piano samples (Salamander Grand Piano by Alexander Holm, CC BY 3.0). The MIDI files contain no audio. Individual
          results vary.
        </p>
      </footer>
    </main>
  );
}
