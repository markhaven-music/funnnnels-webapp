"use client";

import { useEffect, useState } from "react";
import s from "./order.module.css";

// ClickFunnels' "YOUR COPY IS RESERVED FOR" box: ten minutes from page load,
// counting down to 00:00:00 (it only stops; nothing expires).
const START = 10 * 60 * 1000;

export function ReservedTimer() {
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
  const min = Math.floor(left / 60000);
  const sec = Math.floor((left % 60000) / 1000);
  const cs = Math.floor((left % 1000) / 10);
  return (
    <div className={s.timer} role="timer" aria-label="Your copy is reserved">
      <div className={s.timerTitle}>YOUR COPY IS RESERVED FOR</div>
      <div className={s.timerDigits}>
        <span className={s.timerUnit}>
          <span className={s.timerNum}>{pad(min)}</span>
          <span className={s.timerLabel}>MIN</span>
        </span>
        <span className={s.timerSep}>:</span>
        <span className={s.timerUnit}>
          <span className={s.timerNum}>{pad(sec)}</span>
          <span className={s.timerLabel}>SEC</span>
        </span>
        <span className={s.timerSep}>:</span>
        <span className={s.timerUnit}>
          <span className={s.timerNum}>{pad(cs)}</span>
          <span className={s.timerLabel}>MS</span>
        </span>
      </div>
    </div>
  );
}
