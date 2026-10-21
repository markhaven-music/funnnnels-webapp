"use client";

import { useState } from "react";
import type { Currency } from "@/lib/geo";
import { restate } from "@/lib/restate";
import { faq } from "./copy";
import { funnel } from "./funnel";
import { Rich } from "./Rich";
import s from "./landing.module.css";

// price: the bundle's, as dashboard → Products has it (the answers say it).
export function Faq({ currency, price }: { currency: Currency; price: number }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={s.faq}>
      <p className={s.eyebrow}>FREQUENTLY ASKED</p>
      <h2 className={s.faqTitle}>
        GOT <em>QUESTIONS?</em>
      </h2>
      <p className={s.faqSub}>Everything you need to know before grabbing the pack.</p>
      <div className={s.faqList}>
        {faq.map((item, i) => (
          <div key={item.q} className={`${s.faqItem} ${open === i ? s.faqOpen : ""}`}>
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
