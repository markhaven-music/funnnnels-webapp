"use client";

import { SIGN, type Currency } from "@/lib/geo";
import type { CustomerCard } from "@/lib/supportCustomer";
import c from "./supportCustomer.module.css";

// Dashboard → Support, on top of a conversation: what this person spent, in
// big numbers, then every purchase by name (lib/supportCustomer.ts).

const money = (cents: number, currency: string | null) => {
  const v = cents / 100;
  return `${SIGN[(currency ?? "eur") as Currency] ?? "€"}${v.toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
};
const euros = (cents: number) => `€${Math.round(cents / 100).toLocaleString("en-US")}`;
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const month = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
function ago(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 60) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months < 24 ? `${months} months ago` : `${Math.round(days / 365)} years ago`;
}

export function SupportCustomer({ email, card }: { email: string; card: CustomerCard }) {
  const buyer = card.orders > 0;
  return (
    <div className={c.card}>
      <div className={c.top}>
        <span className={c.email}>{email}</span>
        <span className={`${c.tag} ${buyer ? c.tagBuyer : c.tagLead}`}>{buyer ? "Customer" : "Never bought"}</span>
      </div>

      <div className={c.stats}>
        <div className={`${c.stat} ${c.main}`}>
          <b className={c.big}>{euros(card.spentEurCents)}</b>
          <span className={c.label}>spent in total</span>
        </div>
        <div className={c.stat}>
          <b className={c.mid}>{card.orders}</b>
          <span className={c.label}>{card.orders === 1 ? "order" : "orders"}</span>
        </div>
        {card.firstAt && (
          <div className={c.stat}>
            <b className={c.mid}>{month(card.firstAt)}</b>
            <span className={c.label}>first purchase</span>
          </div>
        )}
        {card.lastAt && (
          <div className={c.stat}>
            <b className={c.mid}>{ago(card.lastAt)}</b>
            <span className={c.label}>last purchase</span>
          </div>
        )}
      </div>

      {card.flags.length > 0 && (
        <div className={c.flags}>
          {card.flags.map((f, i) => (
            <span key={i} className={`${c.flag} ${f.tone === "bad" ? c.bad : c.warn}`}>
              {f.text}
            </span>
          ))}
        </div>
      )}

      {card.purchases.length > 0 && (
        <div className={c.list}>
          {card.purchases.map((p, i) => (
            <div key={`${p.ref ?? "x"}-${i}`} className={`${c.row} ${p.status !== "paid" ? c.off : ""}`} title={p.ref ? `${p.via} ${p.ref}` : p.via}>
              <span className={c.name}>{p.name}</span>
              <span className={c.meta}>
                {p.via} · {date(p.at)}
                {p.status !== "paid" && <span className={c.status}>{p.status}</span>}
              </span>
              <span className={c.amount}>{p.cents != null ? money(p.cents, p.currency) : "–"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
