"use client";

import { isPreview } from "@/lib/beacon";
import { useEffect, useState } from "react";
import { JAZZ_BONUS, type JazzBonusWords } from "./fiveMinBonus";

/** Which funnel's clock: its slug, the browser key for the end it last heard, the add-on's picture. Jazz's by default. */
export type BonusCfg = { funnel: string; endKey: string; image: string; minutes: number };
import c from "./fiveMinBonus.module.css";

// The Jazz order page's 5-minute bonus (./fiveMinBonus.ts): one clock for the
// banner, the row in the order summary and the checkout's step 2. Its end comes
// from the server (/api/checkout/bonus, the signed cookie fv_bonus_jazz),
// counted on this device's clock with the server's offset. A copy of the Drum
// Kit's (../midi-drum-kit/BonusClock.tsx) with its own clock and cookie.
//
// gone: the 5 minutes were already over when the page opened (an earlier visit)
// or ?bonus=off: nothing about the bonus shows, the checkout is the normal one.
// Over while on the page instead: "Time's up" where it was, then the normal checkout.

type Clock = { on: boolean; end: number | null; dead: boolean; gone: boolean };
let clock: Clock = { on: false, end: null, dead: false, gone: false };
let started = false;
// The page's one bonus (the Jazz one unless the page says another, e.g. Famous Beats since 2026-11-09).
let cfg: BonusCfg = JAZZ_BONUS;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function markGone() {
  clock = { ...clock, gone: true };
  document.documentElement.setAttribute("data-jazz-bonus", "over");
}

function start(k: BonusCfg) {
  if (started) return;
  started = true;
  cfg = k;
  (window as unknown as { __jazzBonusLive?: boolean }).__jazzBonusLive = true;
  if (/[?&]bonus=off(?:&|$)/.test(location.search)) {
    clock = { on: true, end: null, dead: true, gone: true };
    markGone();
    emit();
    return;
  }
  let known: number | null = null;
  try {
    known = Number(localStorage.getItem(cfg.endKey)) || null;
  } catch {}
  clock = { ...clock, on: true, end: known };
  if (known !== null && known <= Date.now()) markGone();
  emit();
  fetch("/api/checkout/bonus", { method: "POST", body: JSON.stringify({ funnel: cfg.funnel, own: isPreview() }) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { end: number; now: number } | null) => {
      // No answer: no bonus shown (the server wouldn't give it either).
      const end = j ? Date.now() + (j.end - j.now) : null;
      clock = end ? { ...clock, end } : { ...clock, dead: true };
      if (end !== null && end <= Date.now() && (known === null || known <= Date.now())) markGone();
      try {
        if (end) localStorage.setItem(cfg.endKey, String(end));
      } catch {}
      emit();
    })
    .catch(() => {
      clock = { ...clock, dead: true };
      emit();
    });
}

/** The server said the 5 minutes are over (a clock that ran slow): the bonus goes now. */
export function endJazzBonus() {
  clock = { ...clock, dead: true };
  emit();
}

/** enabled: this checkout is the Jazz order page's. left: ms to go (null until known); live: the bonus is in the order. */
export function useJazzBonus(enabled = true, k: BonusCfg = JAZZ_BONUS): { on: boolean; left: number | null; live: boolean; gone: boolean } {
  const [, render] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const l = () => render((n) => n + 1);
    listeners.add(l);
    start(k);
    l();
    return () => {
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  const ticking = enabled && clock.on && clock.end !== null && !clock.dead;
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (clock.end !== null && t >= clock.end) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [ticking]);
  if (!enabled || !clock.on) return { on: false, left: null, live: false, gone: false };
  if (clock.gone) return { on: true, left: 0, live: false, gone: true };
  if (clock.dead) return { on: true, left: 0, live: false, gone: false };
  if (clock.end === null) return { on: true, left: null, live: false, gone: false };
  const left = Math.max(0, clock.end - now);
  return { on: true, left, live: left > 0, gone: false };
}

const pad = (n: number) => String(n).padStart(2, "0");
const mmss = (left: number | null) => {
  const s = Math.ceil((left ?? cfg.minutes * 60_000) / 1000);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

function Time({ left, small }: { left: number | null; small?: boolean }) {
  return (
    <span className={small ? c.timeSmall : c.time} role={small ? undefined : "timer"} data-jazz-bonus-time suppressHydrationWarning>
      {mmss(left)}
    </span>
  );
}

/** Under the header: "Order in the next 04:56 and get the Jazz Record Samples free." */
export function JazzBonusBanner({ w, cfg: k = JAZZ_BONUS }: { w: JazzBonusWords; cfg?: BonusCfg }) {
  const { left, live, gone } = useJazzBonus(true, k);
  if (gone) return null;
  const over = left === 0 && !live;
  const [before, after = ""] = w.lead.split("{time}");
  return (
    <div className={`${c.bar} ${over ? c.barOver : ""}`} aria-live="polite">
      {over ? (
        <p className={c.lead}>{w.over}</p>
      ) : (
        <>
          <p className={c.lead}>
            <span className={c.badge}>{w.badge}</span> {before}
            <Time left={left} />
            {after}
          </p>
          <p className={c.sub}>{w.sub}</p>
        </>
      )}
    </div>
  );
}

/** The bonus as a line of the order: picture, BONUS, name, what's inside, price struck, FREE, the clock. */
export function JazzBonusItem({ w, price, compact, light, cfg: k = JAZZ_BONUS }: { w: JazzBonusWords; price: string; compact?: boolean; light?: boolean; cfg?: BonusCfg }) {
  const { left, live, gone, on } = useJazzBonus(true, k);
  if (gone || (compact && !on)) return null;
  const cls = `${compact ? c.compact : ""} ${light ? c.light : ""}`;
  if (left === 0 && !live)
    return (
      <p className={`${c.gone} ${cls}`} role="status">
        {w.over}
      </p>
    );
  return (
    <div className={`${c.item} ${cls}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={k.image} alt="" width={80} height={80} className={c.img} />
      <div className={c.info}>
        <span className={c.name}>
          <span className={c.badge}>{w.badge}</span> {w.name}
        </span>
        <span className={c.line}>{w.line}</span>
        <ul className={c.list}>
          {w.list.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <span className={c.added}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
            <path fill="currentColor" d="M6.2 11.6 2.8 8.2l1.1-1.1 2.3 2.3 5.9-5.9 1.1 1.1z" />
          </svg>
          {w.added} · <Time left={left} small />
        </span>
      </div>
      <span className={c.price}>
        <s>{price}</s>
        <b>{w.free}</b>
      </span>
    </div>
  );
}
