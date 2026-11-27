import type { Metadata } from "next";
import { poppins } from "@/app/shop/fonts";
import { VIDEOS } from "../[n]/videos";
import { CONSENT_TEXT } from "../launch";
import Join from "./Join";
import s from "../[n]/bible.module.css";

// m.thegrind.studio/free/bible/notify: the early-access list for the launch (user, 11-27: "e dove si
// registrano per l'evento? per precedenza"). Modelled on Cymatics' early-access pages: a fixed release
// moment, a 1-hour head start as the reason to join, email + phone with an SMS consent box, few texts.
export const metadata: Metadata = { title: "Get in first · MIDI DRUMS BIBLE · Grind Studio", robots: { index: false } };

export default function Notify() {
  const live = VIDEOS.filter((v) => v.wistiaId);
  return (
    <main className={`${s.page} ${poppins.variable}`}>
      <div className={s.glow} aria-hidden />
      <img className={s.logo} src="/funnels/shop/logo.webp" alt="Grind Studio" width={300} height={35} fetchPriority="high" />
      <h1 className={s.h1}>Get in 1 hour before everyone</h1>
      <div className={s.lines}>
        <p>On December 21 at 12 PM New York time we open the MIDI DRUMS BIBLE.</p>
        <p>The people on this list get in at 11 AM, one hour before everyone else, with every launch bonus still there.</p>
      </div>
      <Join consent={CONSENT_TEXT} />
      {live.length > 0 && (
        <p className={s.foot}>
          While you wait, watch <a href={`/free/bible/${live[live.length - 1].n}`}>video {live[live.length - 1].n}</a>.
        </p>
      )}
    </main>
  );
}
