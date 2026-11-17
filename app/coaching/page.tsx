import type { Metadata } from "next";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { poppins } from "@/app/shop/fonts";
import Apply from "./Apply";
import c from "./coaching.module.css";

// 1:1 coaching with the owner, €2,000 a month, by application only
// (2026-11-17: "coaching from myself 2k a month"; sold through a call, not a
// one-click upsell, because there aren't enough buyers for an OTO).
// m.thegrind.studio/coaching forwards here (grind-studio-landing-pages/vercel.json).
// Offer details (weekly call, feedback between calls, 5 seats) are the
// proposed shape: change them here when the owner sets them.

export const metadata: Metadata = {
  title: "Grind Studio · Work with me 1:1",
  description: "1:1 coaching for producers who are done making loops and ready to finish records.",
  robots: { index: false },
};

export default function Coaching() {
  return (
    <main className={`${c.page} ${poppins.variable}`}>
      <img className={c.logo} src="/funnels/shop/logo.webp" alt={BRAND.name} width={360} height={42} fetchPriority="high" />

      <h1 className={c.h1}>
        <span className="block">You have the loops.</span>
        <span className="block">
          Let&apos;s turn them into <em>records</em>.
        </span>
      </h1>

      <p className={c.lead}>
        You know the feeling. A folder full of 8 bars that sounded great at 2am. Nothing finished. Nothing out. And a quiet
        voice asking if you&apos;ll ever sound like the records you love.
      </p>
      <h2 className={c.h2}>Who you&apos;d work with</h2>
      <p className={c.lead}>
        I&apos;m a <b>gold and platinum</b> producer from Italy. I produced <b>Fuego</b> (Neve17, Geolier, Lele Blade) and{" "}
        <b>Sui Muri</b> by Psicologi, plus other records with millions of streams. My own artist project has{" "}
        <b>67k monthly listeners</b> on Spotify.
      </p>
      <p className={c.lead}>
        <a className={c.ig} href="https://instagram.com/markhaven">
          @markhaven on Instagram
        </a>
      </p>

      <p className={c.lead}>
        I work 1:1 with <b>5 producers a month</b>. We take your beats, find exactly what holds them back, and fix it
        together until you finish music you&apos;re proud to send.
      </p>

      <h2 className={c.h2}>What you get</h2>
      <ul className={c.list}>
        <li>
          <b>A 1:1 call with me every week.</b> Your screen, your session, your beats.
        </li>
        <li>
          <b>Feedback on your beats between calls.</b> Send a bounce, get my notes back.
        </li>
        <li>
          <b>A plan built around your sound,</b> not a course made for everyone.
        </li>
        <li>
          <b>Every Grind Studio pack, free</b> while you work with me.
        </li>
      </ul>

      <h2 className={c.h2}>Who this is for</h2>
      <p className={c.text}>
        Producers who already make beats and are tired of being stuck. If you want a shortcut without doing the work, this
        isn&apos;t for you. If you want someone in your corner who tells you the truth about your music, apply.
      </p>

      <p className={c.price}>
        <b>€2,000 a month.</b> 5 seats. Apply below, and if we&apos;re a fit I&apos;ll book a call with you.
      </p>

      <Apply />
    </main>
  );
}
