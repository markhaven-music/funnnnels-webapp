"use client";

import { useEffect, useState } from "react";
import { BF_ENDS_MS } from "@/lib/blackFriday";

// The Black Friday clock (lib/blackFriday.ts): ticks in the browser only (the pages are cached),
// on dashes of the same width until then. Gone once the sale is over.

const two = (n: number) => String(n).padStart(2, "0");

function useLeft() {
  const [s, setS] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setS(Math.max(0, Math.floor((BF_ENDS_MS - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

const mono: React.CSSProperties = { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

/** " · ends in 3d 04h 12m 09s", to put after a bar's words. */
export function BfClock() {
  const s = useLeft();
  if (s === 0) return null;
  const txt = s == null ? "–d ––h ––m ––s" : `${Math.floor(s / 86400)}d ${two(Math.floor((s % 86400) / 3600))}h ${two(Math.floor((s % 3600) / 60))}m ${two(s % 60)}s`;
  return (
    <span style={mono} role="timer" aria-live="off">
      {" "}· ends in <b>{txt}</b>
    </span>
  );
}

/** A red bar of its own, for a page that has none. */
export function BfBar({ text = "BLACK FRIDAY: 90% Sale Ends Soon" }: { text?: string }) {
  if (Date.now() > BF_ENDS_MS) return null;
  return (
    <div style={{ background: "#d61f1f", color: "#fff", textAlign: "center", padding: "10px 12px", fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>
      {text}
      <BfClock />
    </div>
  );
}
