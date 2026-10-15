import { Fragment, type ReactNode } from "react";
import type { Currency } from "@/lib/geo";

// Renders copy.ts's inline marks: **bold**, _italic_, __underline__,
// ==highlight==, and {c} → the visitor's currency sign.
const TOKEN = /(\*\*.+?\*\*|__.+?__|==.+?==|_.+?_)/g;

export function Rich({ text, currency, hl }: { text: string; currency: Currency; hl?: string }): ReactNode {
  const sign = currency === "eur" ? "€" : "$";
  const parts = text.replaceAll("{c}", sign).split(TOKEN);
  return parts.map((p, i) => {
    if (p.startsWith("**")) return <strong key={i}><Rich text={p.slice(2, -2)} currency={currency} hl={hl} /></strong>;
    if (p.startsWith("__")) return <u key={i}>{p.slice(2, -2)}</u>;
    if (p.startsWith("==")) return <span key={i} className={hl}>{p.slice(2, -2)}</span>;
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export const sign = (currency: Currency) => (currency === "eur" ? "€" : "$");
