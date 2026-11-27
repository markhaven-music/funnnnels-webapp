"use client";
import { useEffect, useState } from "react";
import s from "./bible.module.css";

// Time left until the pack comes out (LAUNCH.open), ticking each second.
// Rendered empty on the server so the numbers never mismatch on hydration.
export default function Countdown({ to, label }: { to: string; label: string }) {
  const end = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, end - now);
  const parts: [string, number | null][] = [
    ["days", left === null ? null : Math.floor(left / 86_400_000)],
    ["hours", left === null ? null : Math.floor(left / 3_600_000) % 24],
    ["min", left === null ? null : Math.floor(left / 60_000) % 60],
    ["sec", left === null ? null : Math.floor(left / 1000) % 60],
  ];
  return (
    <div className={s.count} aria-label={label}>
      <span className={s.countLabel}>{label}</span>
      <div className={s.countRow}>
        {parts.map(([k, v]) => (
          <span key={k} className={s.countCell}>
            <b>{v === null ? "--" : String(v).padStart(2, "0")}</b>
            <small>{k}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
