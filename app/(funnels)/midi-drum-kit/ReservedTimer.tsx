"use client";

import { useEffect, useState } from "react";
import type { Copy } from "./copy";
import s from "./order.module.css";

// The Drum Kit order page's "YOUR COPY IS RESERVED FOR:" box: ten minutes from
// page load, counting down to 00:00:00 (it only stops; nothing expires).
const START = 10 * 60 * 1000;

export function ReservedTimer({ t }: { t: Copy["order"]["timer"] }) {
  const [left, setLeft] = useState(START);
  useEffect(() => {
    const end = Date.now() + START;
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
      <div className={s.timerTitle}>{t.title}</div>
      <div className={s.timerDigits}>
        {units.map(([n, label]) => (
          <span key={label} className={s.timerUnit}>
            <span className={s.timerNum}>{n}</span>
            <span className={s.timerLabel}>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
