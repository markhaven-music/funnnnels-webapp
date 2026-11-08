import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Beacon } from "@/app/(funnels)/Beacon";
import { Clarity } from "@/app/(funnels)/Clarity";
import { ShopFrame, StoreCard } from "@/app/shop/ShopFrame";
import { GlassButton } from "@/components/ui/GlassButton";
import s from "@/app/shop/shop.module.css";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import { storeItems } from "@/lib/storefront";
import h from "../home.module.css";

// Grind Studio's homepage, a store like the sample-pack sites': the shop's
// bar (menu, cart), a banner for the MIDI Drum Kit, the packs on dark tiles
// (the funnels' open their sales page, the shop's go in the cart), the
// producers' quotes on bounce, reviews, how MIDI works, and the way back to
// past purchases. m.thegrind.studio/ forwards here (rewrite in
// grind-studio-landing-pages/vercel.json), later thegrind.studio.
// One cached page per currency, like the funnels: proxy.ts rewrites /home to
// /home/eur|usd by the visitor's country (docs/page-speed.md rule 9). Prices
// and the shop's products are read from the database, so it's refreshed every
// hour and at once when they're saved (lib/shop.ts revalidateShop, lib/pages.ts).

export const revalidate = 3600; // saves in the dashboard refresh it at once (revalidatePath)

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

export const metadata: Metadata = {
  title: "Grind Studio · MIDI packs that make beats bounce",
  description: "Drag-and-drop MIDI drum patterns, chord progressions and complete beats for producers. Works in every DAW, Mac and PC. Instant download.",
};

// The home's grid: the first ones of the shop's, the whole shop one click away.
const GRID = 8;

// Interview quotes, as checked for the MIDI Drum Kit page (copy/landing/en.json t044–t061).
const QUOTES = [
  { who: "Metro Boomin", text: "I start with the drums to secure a bounce. You wanna move people." },
  { who: "Tay Keith", text: "I always focus on the bounce." },
  { who: "Timbaland", text: "I knew I had my own bounce…" },
  { who: "Pharrell", text: "We got a kick out of making people dance, and that was the intention." },
];

// The MIDI Drum Kit page's reviews (copy/landing/en.json t191–t212).
const REVIEWS = [
  { who: "Arlen Kovak", role: "Trap producer", text: "I realized how dumb it was to program every single drum from scratch. Thank you." },
  { who: "Dario Mensah", role: "Beginner producer", text: "I've started closing 10 beats a day just like you said." },
  { who: "Luca Marberg", role: "Beat maker", text: "Finally found MIDI patterns that actually sound like the beats on the radio." },
  { who: "Stefan Kožar", role: "Advanced beatmaker", text: "Can't explain but they sound like money." },
];

const STEPS = [
  { title: "Download", text: "One zip, folders sorted by what's inside. In your inbox and on your account page." },
  { title: "Drag & drop", text: "Drag a MIDI file onto a track in your DAW. Any sound you like plays it." },
  { title: "Make it yours", text: "Change notes, swap sounds, stack patterns until the beat is yours." },
];

export default async function Home({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const items = await storeItems(currency);
  const kit = items.find((i) => i.slug === "midi-drum-kit")!;
  const grid = items.slice(0, GRID);

  return (
    <ShopFrame className={h.home}>
      <Clarity />
      <Beacon funnel="home" page="landing" />

      <section className={h.hero}>
        <div className={h.heroIn}>
          <div className={h.heroText}>
            <h1 className={h.h1}>
              MIDI That Makes Your Beats <span className={h.y}>Bounce</span>
            </h1>
            <p className={h.lead}>Drag-and-drop drum patterns, chord progressions and complete beats. Works in every DAW, on Mac and PC.</p>
            <a href={kit.href} className={h.heroPic} tabIndex={-1} aria-hidden>
              <img src={kit.pic!.src} width={kit.pic!.width} height={kit.pic!.height} alt="" fetchPriority="high" />
            </a>
            <GlassButton href={kit.href} variant="clear" size="xl" label="Get the kit" sub={`${kit.name} · ${money(kit.price, currency)}`} cta />
            <p className={h.note}>Instant download · {BRAND.guaranteeDays}-day quality guarantee</p>
          </div>
        </div>
      </section>

      <section className={`${s.wrap} ${s.row}`} id="packs">
        <div className={s.rowHead}>
          <h2 className={s.rowTitle}>
            Our MIDI <span className={h.y}>Packs</span>
          </h2>
          <a href="/shop" className={s.rowLink}>
            See all →
          </a>
        </div>
        <div className={s.grid}>
          {grid.map((p) => (
            <StoreCard key={p.slug} item={p} currency={currency} />
          ))}
        </div>
      </section>

      <section className={`${h.band} ${h.lazy}`}>
        <h2 className={h.h2}>
          The Best Producers Are Obsessed With <span className={h.y}>Bounce</span>
        </h2>
        <ul className={h.quotes}>
          {QUOTES.map((q) => (
            <li key={q.who}>
              <blockquote className={h.quote}>“{q.text}”</blockquote>
              <p className={h.who}>{q.who}</p>
            </li>
          ))}
        </ul>
        <p className={h.after}>Bounce comes from the pattern, not the sound. That&apos;s what every pack is built on.</p>
      </section>

      <section className={`${h.section} ${h.lazy}`}>
        <h2 className={h.h2}>
          What <span className={h.y}>Producers</span> Say
        </h2>
        <ul className={h.reviews}>
          {REVIEWS.map((r) => (
            <li key={r.who}>
              <p className={h.stars} aria-label="5 stars">
                ★★★★★
              </p>
              <blockquote className={h.review}>“{r.text}”</blockquote>
              <p className={h.who}>
                {r.who} <span className={h.role}>· {r.role}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${h.band} ${h.lazy}`}>
        <h2 className={h.h2}>
          How <span className={h.y}>MIDI</span> Works
        </h2>
        <ol className={h.steps}>
          {STEPS.map((st, i) => (
            <li key={st.title}>
              <span className={h.num}>{i + 1}</span>
              <h3 className={h.h3}>{st.title}</h3>
              <p>{st.text}</p>
            </li>
          ))}
        </ol>
        <img className={h.daws} src="/funnels/midi-drum-kit/daws.webp" alt="Works with FL Studio, Ableton Live, Logic Pro and every DAW" loading="lazy" decoding="async" width={1000} height={63} />
      </section>

      <section className={`${h.yband} ${h.lazy}`}>
        <h2 className={h.h2}>Already Bought From Us?</h2>
        <p>Every pack you bought is on your downloads page. Sign in with the email you paid with.</p>
        <GlassButton href="/account" variant="clear" size="md" label="Get my downloads" />
      </section>
    </ShopFrame>
  );
}
