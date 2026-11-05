"use client";

import { useState } from "react";
import type { Currency } from "@/lib/geo";
import { restate } from "@/lib/restate";
import { funnel } from "./funnel";
import { Rich } from "./Rich";
import { LANDING, type FaqWords } from "./words";
import s from "./landing.module.css";

// price: the bundle's, as dashboard → Products has it (the answers say it).
// w: its words (./words.ts), with the dashboard's edits.
export function Faq({ currency, price, w = LANDING.faq }: { currency: Currency; price: number; w?: FaqWords }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={s.faq}>
      <p className={s.eyebrow}>{w.eyebrow}</p>
      <h2 className={s.faqTitle}>
        <Rich text={w.title} currency={currency} />
      </h2>
      <p className={s.faqSub}>{w.sub}</p>
      <div className={s.faqList}>
        {w.items.map((item, i) => (
          <div key={i} className={`${s.faqItem} ${open === i ? s.faqOpen : ""}`}>
            <button type="button" className={s.faqTrigger} aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span>{item.q}</span>
              <span className={s.faqIcon} aria-hidden />
            </button>
            <div className={s.faqPanel} hidden={open !== i}>
              <div className={s.faqPanelInner}>
                {item.a.map((p, j) => (
                  <p key={j}>
                    <Rich text={restate(p, funnel.price[currency], price)} currency={currency} />
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
