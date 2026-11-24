"use client";

import { useEffect, useState } from "react";
import { BF_ENDS_MS } from "@/lib/blackFriday";
import { SIGN, type Currency } from "@/lib/geo";

// The Black Friday deal line on every front-end's red bar (lib/blackFriday.ts), above the fold:
// "it must be immediately clear on the page that it's a Black Friday deal, limited time" (2026-11-24).
// The clock ticks in the browser only (the pages are cached), on dashes until then.

const two = (n: number) => String(n).padStart(2, "0");
const amt = (n: number, c: Currency) => `${SIGN[c]}${Number.isInteger(n) ? n : n.toFixed(2)}`;

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

const fmt = (s: number | null) =>
  s == null ? "–d ––h ––m ––s" : `${Math.floor(s / 86400)}d ${two(Math.floor((s % 86400) / 3600))}h ${two(Math.floor((s % 3600) / 60))}m ${two(s % 60)}s`;

/** " · ends in 3d 04h 12m 09s", to put after a bar's words. */
export function BfClock() {
  const s = useLeft();
  if (s === 0) return null;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }} role="timer" aria-live="off">
      {" "}· ends in <b>{fmt(s)}</b>
    </span>
  );
}

const WORDS = {
  en: { deal: "BLACK FRIDAY DEAL", limited: "Limited time only", ends: "Ends in" },
  it: { deal: "OFFERTA BLACK FRIDAY", limited: "Solo per pochi giorni", ends: "Finisce tra" },
};

/** The whole deal, for a red bar: BLACK FRIDAY DEAL · €27 struck → €9.99 · Limited time only · Ends in … */
export function BfDeal({ currency, regular, sale = 9.99, lang = "en" }: { currency: Currency; regular: number; sale?: number; lang?: string }) {
  const s = useLeft();
  const w = WORDS[lang === "it" ? "it" : "en"];
  if (s === 0) return null;
  return (
    <span style={{ display: "block", fontSize: "clamp(15px, 2.2vw, 19px)", lineHeight: 1.4, padding: "4px 0", letterSpacing: ".01em" }}>
      <b style={{ fontWeight: 900 }}>{w.deal}</b>
      <span style={{ whiteSpace: "nowrap" }}>
        {" "}· <s style={{ opacity: 0.75 }}>{amt(regular, currency)}</s> <b style={{ fontWeight: 900 }}>{amt(sale, currency)}</b>
      </span>{" "}
      <span style={{ display: "inline-block" }}>
        · {w.limited} · {w.ends}{" "}
        <b style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }} role="timer" aria-live="off">
          {fmt(s)}
        </b>
      </span>
    </span>
  );
}
