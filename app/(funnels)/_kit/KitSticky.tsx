"use client";

import { useEffect, useState } from "react";
import b from "../jazz-midi-pack/btn.module.css";
import s from "../jazz-midi-pack/jazz.module.css";
import { Price, useClock } from "./LaunchClock";

// Bottom bar with the CTA once the hero has scrolled away, hidden while the
// checkout is on screen (same as the Jazz page's StickyCta). Sales phases only.
export function KitSticky({ name }: { name: string }) {
  const { phase } = useClock();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let pastHero = false;
    let atCheckout = false;
    const update = () => setShow(pastHero && !atCheckout);
    const hero = document.getElementById("hero");
    const buy = document.getElementById("buy");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) pastHero = !e.isIntersecting;
        if (e.target === buy) atCheckout = e.isIntersecting;
      }
      update();
    });
    if (hero) io.observe(hero);
    if (buy) io.observe(buy);
    return () => io.disconnect();
  }, [phase]);

  const on = show && phase !== "waitlist";
  return (
    <div className={`${s.sticky} ${on ? s.stickyOn : ""}`} aria-hidden={!on}>
      <div className={s.stickyIn}>
        <div className={s.stickyText}>
          <p className={s.stickyTitle}>{name}</p>
          <p className={s.stickySub}>
            <Price /> · {phase === "early" ? "early-bird" : "one payment"}
          </p>
        </div>
        <a href="#buy" className={`${b.btn} ${b.sm}`} data-cta tabIndex={on ? 0 : -1}>
          <span className={b.shine} aria-hidden />
          <span className={b.label}>Get the pack</span>
        </a>
      </div>
    </div>
  );
}
