"use client";

import { useEffect, useState } from "react";
import { reservedUntil } from "../reservedUntil";
import type { Copy } from "./copy";
import s from "./order.module.css";

// The Drum Kit order page's "YOUR COPY IS RESERVED FOR:" box: ten minutes from
// the first visit (a refresh doesn't restart it, ../reservedUntil.ts), counting down to 00:00:00, then it says time's up (nothing actually expires: the order still goes through).
const START = 10 * 60 * 1000;

export function ReservedTimer({ t }: { t: Copy["order"]["timer"] }) {
  const [left, setLeft] = useState(START);
  useEffect(() => {
    const end = reservedUntil(START);
    const id = setInterval(() => {
      const ms = Math.max(0, end - Date.now());
      setLeft(ms);
      if (!ms) clearInterval(id);
    }, 37);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const units = [
    [pad(Math.floor(left / 60000)), t.min],
    [pad(Math.floor((left % 60000) / 1000)), t.sec],
    [pad(Math.floor((left % 1000) / 10)), t.ms],
  ];
  return (
    <div className={s.timer} role="timer" aria-label={t.label}>
      <div className={s.timerTitle}>{left ? t.title : t.ended}</div>
      {!left ? (
        <div className={s.timerEnded}>{t.endedNote}</div>
      ) : (
        <div className={s.timerDigits}>
          {units.map(([n, label]) => (
            <span key={label} className={s.timerUnit}>
              <span className={s.timerNum}>{n}</span>
              <span className={s.timerLabel}>{label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
