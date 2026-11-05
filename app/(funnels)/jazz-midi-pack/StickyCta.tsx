"use client";

import { useEffect, useState } from "react";
import b from "./btn.module.css";
import s from "./jazz.module.css";
import { funnel } from "./funnel";

// Bottom bar with the CTA, once the hero has scrolled away. Hidden while the
// offer recap (#buy) is on screen, which has its own big button.
export function StickyCta({ price }: { price: string }) {
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
  }, []);

  return (
    <div className={`${s.sticky} ${show ? s.stickyOn : ""}`} aria-hidden={!show}>
      <div className={s.stickyIn}>
        <div className={s.stickyText}>
          <p className={s.stickyTitle}>Jazz MIDI Pack · 6,256 .mid files</p>
          <p className={s.stickySub}>{price} · one payment</p>
        </div>
        <a href={funnel.checkout.orderPage} className={`${b.btn} ${b.sm}`} data-cta tabIndex={show ? 0 : -1}>
          <span className={b.shine} aria-hidden />
          <span className={b.label}>Get the pack</span>
        </a>
      </div>
    </div>
  );
}
