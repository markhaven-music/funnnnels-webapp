import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Poppins } from "next/font/google";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Beacon } from "@/app/(funnels)/Beacon";
import { Clarity } from "@/app/(funnels)/Clarity";
import { Arrow } from "@/app/(funnels)/jazz-midi-pack/Cta";
import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { funnel as topHits } from "@/app/(funnels)/top-hits-midi-bundle/funnel";
import { funnel as famousBeats } from "@/app/(funnels)/famous-beats-bundle/funnel";
import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import b from "@/app/(funnels)/jazz-midi-pack/btn.module.css";
import { CURRENCIES, type Currency } from "@/lib/geo";
import { money } from "@/lib/launch";
import h from "../home.module.css";

// Grind Studio's homepage, a storefront for the packs sold through their
// funnels: what the brand makes, each pack beside its picture with a button to
// its sales page, the producers' quotes on bounce, how MIDI works, reviews and
// the way back to past purchases. m.thegrind.studio/ forwards here (rewrite in
// grind-studio-landing-pages/vercel.json), later thegrind.studio.
// One cached page per currency, like the funnels: proxy.ts rewrites /home to
// /home/eur|usd by the visitor's country (docs/page-speed.md rule 9).

export const dynamic = "force-static";

export function generateStaticParams() {
  return CURRENCIES.map((currency) => ({ currency }));
}

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "Grind Studio · MIDI packs that make beats bounce",
  description: "Drag-and-drop MIDI drum patterns, chord progressions and complete beats for producers. Works in every DAW, Mac and PC. Instant download.",
};

type Pack = {
  name: string;
  line: string;
  points: string[];
  price: Record<Currency, number>;
  href: string; // the pack's sales page
  pic: { src: string; width: number; height: number; fade?: boolean }; // fade: a picture on its own black, blended into the band
};

const PACKS: Pack[] = [
  {
    name: drumKit.product,
    line: "1050 drag-and-drop MIDI drum patterns, built around bounce.",
    points: ["Kicks, hats, snares, 808s, rolls and complete beats", "4-bar patterns plus fragments to add variation", "3 bonuses: Famous Beats, Beat Starters, Hit-Maker Drums"],
    price: drumKit.price,
    href: "/en/midi-drum-kit",
    pic: { src: "/funnels/midi-drum-kit/kit-box.webp", width: 786, height: 1080 },
  },
  {
    name: topHits.product,
    line: "The chord progressions of 1,000 top hits, in MIDI.",
    points: ["1,000 progressions from 496 artists", "Copied from the hits themselves", "Drag a progression in, write over it"],
    price: topHits.price,
    href: `/${topHits.slug}`,
    pic: { src: "/funnels/home/top-hits-box.webp", width: 440, height: 440, fade: true },
  },
  {
    name: famousBeats.product,
    line: "The drums behind 320 hits, note for note.",
    points: ["320 grooves in 32 packs", "Kick, snare, hats and 808 on separate tracks", "Start from a beat you already know works"],
    price: famousBeats.price,
    href: `/${famousBeats.slug}`,
    pic: { src: "/funnels/home/famous-beats-box.webp", width: 440, height: 440, fade: true },
  },
  {
    name: jazz.product,
    line: "The most used jazz progressions, voiced like a pianist plays them.",
    points: ["13 voicings × 8 rhythms, all 12 keys", "3,536 MIDI files with bass lines", "Lofi, neo soul, trap soul and deep house loops"],
    price: jazz.price,
    href: `/${jazz.slug}`,
    pic: { src: "/funnels/jazz-midi-pack/box-520.webp", width: 520, height: 741 },
  },
];

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

function Button({ href, inner }: { href: string; inner: string }) {
  return (
    <a href={href} className={b.btn} data-cta>
      <span className={b.shine} aria-hidden />
      <span className={b.label}>
        <span>GET THE PACK</span>
        <Arrow className={b.arrow} />
      </span>
      <span className={b.inner}>{inner}</span>
    </a>
  );
}

function Tick() {
  return (
    <svg className={h.tick} viewBox="0 0 20 20" width="20" height="20" aria-hidden>
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function Home({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = (await params) as { currency: Currency };
  if (!CURRENCIES.includes(currency)) notFound();
  const kit = PACKS[0];

  return (
    <main className={`${h.page} ${poppins.variable}`}>
      <Clarity />
      <Beacon funnel="home" page="landing" />

      <header className={h.top}>
        <a href="/" className={h.logo}>
          <img src="/funnels/shop/logo.webp" alt={BRAND.name} width={360} height={42} />
        </a>
        <a href="/account" className={h.account}>
          My downloads
        </a>
      </header>

      <section className={h.hero}>
        <h1 className={h.h1}>
          MIDI That Makes Your Beats <span className={h.y}>Bounce</span>
        </h1>
        <p className={h.lead}>Drag-and-drop drum patterns, chord progressions and complete beats. Works in every DAW, on Mac and PC.</p>
        <img className={h.heroPic} src={kit.pic.src} width={kit.pic.width} height={kit.pic.height} alt={`${kit.name} box`} fetchPriority="high" />
        <Button href={kit.href} inner={`${kit.name} · ${money(kit.price[currency], currency)}`} />
        <p className={h.note}>Instant download · {BRAND.guaranteeDays}-day money-back guarantee</p>
      </section>

      <section className={`${h.band} ${h.lazy}`} id="packs">
        <h2 className={h.h2}>
          Pick Your <span className={h.y}>Pack</span>
        </h2>
        <div className={h.packs}>
          {PACKS.map((p, i) => (
            <article key={p.name} className={`${h.pack} ${i % 2 ? h.flip : ""}`}>
              <a href={p.href} className={h.packPic} tabIndex={-1} aria-hidden>
                <img className={p.pic.fade ? h.fade : undefined} src={p.pic.src} width={p.pic.width} height={p.pic.height} alt="" loading="lazy" decoding="async" />
              </a>
              <div className={h.packText}>
                <h3 className={h.h3}>
                  <a href={p.href}>{p.name}</a>
                </h3>
                <p className={h.line}>{p.line}</p>
                <ul className={h.points}>
                  {p.points.map((t) => (
                    <li key={t}>
                      <Tick />
                      {t}
                    </li>
                  ))}
                </ul>
                <Button href={p.href} inner={`${p.name} · ${money(p.price[currency], currency)}`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${h.section} ${h.lazy}`}>
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

      <section className={`${h.band} ${h.lazy}`}>
        <h2 className={h.h2}>
          How <span className={h.y}>MIDI</span> Works
        </h2>
        <ol className={h.steps}>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className={h.num}>{i + 1}</span>
              <h3 className={h.h3}>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <img className={h.daws} src="/funnels/midi-drum-kit/daws.webp" alt="Works with FL Studio, Ableton Live, Logic Pro and every DAW" loading="lazy" decoding="async" width={1000} height={63} />
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

      <section className={`${h.yband} ${h.lazy}`}>
        <h2 className={h.h2}>Already Bought From Us?</h2>
        <p>Every pack you bought is on your downloads page. Sign in with the email you paid with.</p>
        <a href="/account" className={h.dark}>
          Get my downloads
        </a>
      </section>

      <footer className={h.footer}>
        <p>
          © {new Date().getFullYear()} {BRAND.name} · <a href={BRAND.legal.terms}>Terms</a> · <a href={BRAND.legal.privacy}>Privacy</a> ·{" "}
          <a href={BRAND.legal.refund}>Refund policy</a> · <a href={`mailto:${BRAND.support}`}>{BRAND.support}</a>
        </p>
      </footer>
    </main>
  );
}
