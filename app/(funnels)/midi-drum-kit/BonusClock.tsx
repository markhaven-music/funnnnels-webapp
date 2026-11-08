"use client";

import { useEffect, useState } from "react";
import type { Currency } from "@/lib/geo";
import { BONUS, BONUS_END_KEY, readBonus, type BonusWords } from "./bonusTest";
import { money as fmt, type Lang } from "./i18n";
import d from "./order.module.css";

// The 5-minute bonus on the Drum Kit order page (./bonusTest.ts): one clock for
// the banner, the card in the order summary and the form. Its end comes from
// the server (/api/checkout/bonus, a signed cookie), counted on this device's
// clock with the server's offset. The pieces are in the cached HTML for
// everyone and shown by CSS only for the "bonus-on" half (<html data-ab-bonus>),
// so nothing moves when the clock arrives.

type Clock = { on: boolean; end: number | null; dead: boolean };
let clock: Clock = { on: false, end: null, dead: false };
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function start() {
  if (started) return;
  started = true;
  // React has the countdown from here (BONUS_TIME_SCRIPT stops).
  (window as unknown as { __bonusLive?: boolean }).__bonusLive = true;
  if (readBonus() !== "bonus-on") return;
  // The end this browser already knows, until the server confirms it: no 05:00 on a refresh.
  let known: number | null = null;
  try {
    known = Number(localStorage.getItem(BONUS_END_KEY)) || null;
  } catch {}
  clock = { ...clock, on: true, end: known };
  emit();
  fetch("/api/checkout/bonus", { method: "POST" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { end: number; now: number } | null) => {
      // No answer: no bonus shown (the server wouldn't give it either).
      const end = j ? Date.now() + (j.end - j.now) : null;
      clock = end ? { ...clock, end } : { ...clock, dead: true };
      try {
        if (end) localStorage.setItem(BONUS_END_KEY, String(end));
      } catch {}
      emit();
    })
    .catch(() => {
      clock = { ...clock, dead: true };
      emit();
    });
}

/** The server said the 5 minutes are over (a clock that ran slow): the bonus goes now. */
export function endBonus() {
  clock = { ...clock, dead: true };
  emit();
}

/** on: this visitor is in the bonus half; left: ms to go (null until known); live: the bonus is in the order. */
export function useBonus(): { on: boolean; left: number | null; live: boolean } {
  const [, render] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const l = () => render((n) => n + 1);
    listeners.add(l);
    start();
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  const ticking = clock.on && clock.end !== null && !clock.dead;
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (clock.end !== null && t >= clock.end) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [ticking]);
  if (!clock.on) return { on: false, left: null, live: false };
  if (clock.dead) return { on: true, left: 0, live: false };
  if (clock.end === null) return { on: true, left: null, live: false };
  const left = Math.max(0, clock.end - now);
  return { on: true, left, live: left > 0 };
}

const pad = (n: number) => String(n).padStart(2, "0");
/** "04:56"; 05:00 until the server answers. */
export const mmss = (left: number | null) => {
  const s = Math.ceil((left ?? BONUS.minutes * 60_000) / 1000);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

function Lead({ text, left }: { text: string; left: number | null }) {
  const [before, after = ""] = text.split("{time}");
  return (
    <>
      {before}
      <span className={d.bonusTime} role="timer" data-bonus-time suppressHydrationWarning>
        {mmss(left)}
      </span>
      {after}
    </>
  );
}

/** Under the header: "Order in the next 04:56 and get the Expansions free." */
export function BonusBanner({ w }: { w: BonusWords }) {
  const { left, live } = useBonus();
  const over = left === 0 && !live;
  return (
    <div className={`${d.bonusBar} ${over ? d.bonusBarOver : ""}`} aria-live="polite">
      {over ? (
        <p className={d.bonusLead}>{w.over}</p>
      ) : (
        <>
          <p className={d.bonusLead}>
            <span className={d.bonusBadge}>{w.badge}</span> <Lead text={w.lead} left={left} />
          </p>
          <p className={d.bonusSub}>{w.sub}</p>
        </>
      )}
    </div>
  );
}

/** The bonus as a line of the order: picture, BONUS, name, €7 struck, FREE, the clock. Gone at 00:00. */
export function BonusItem({ w, image, price, currency, lang, compact }: { w: BonusWords; image: string; price: number; currency: Currency; lang: Lang; compact?: boolean }) {
  const { left, live } = useBonus();
  if (left === 0 && !live) return null;
  return (
    <div className={`${d.bonusItem} ${compact ? d.bonusItemCompact : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" width={80} height={80} className={d.bonusImg} />
      <div className={d.bonusInfo}>
        <span className={d.bonusName}>
          <span className={d.bonusBadge}>{w.badge}</span> {w.name}
        </span>
        {!compact && <span className={d.bonusLine}>{w.line}</span>}
        <span className={d.bonusAdded}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
            <path fill="currentColor" d="M6.2 11.6 2.8 8.2l1.1-1.1 2.3 2.3 5.9-5.9 1.1 1.1z" />
          </svg>
          {w.added} · <span className={d.bonusTimeSmall} data-bonus-time suppressHydrationWarning>
            {mmss(left)}
          </span>
        </span>
      </div>
      <span className={d.bonusPrice}>
        <s>{fmt(price, currency, lang)}</s>
        <b>{w.free}</b>
      </span>
    </div>
  );
}
