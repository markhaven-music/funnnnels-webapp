import type { CSSProperties } from "react";
import type { Currency } from "@/lib/geo";
import { Rich } from "../top-hits-midi-bundle/Rich";
import j from "../jazz-midi-pack/jazz.module.css";
import type { Copy } from "./copy";
import { money } from "./i18n";
import type { Lang } from "./i18n";
import { STACK_VALUES } from "./stackSwitch";

// The order page's left column, as the Jazz MIDI Pack's order page has it
// (jazz-midi-pack/sections.tsx OrderSummary; 2026-11-12, "praticamente uguale a MIDI Jazz
// Pack ma con i prodotti cambiati e i colori di MIDI Drum Kit"): what's inside as a tick
// list, the six bonuses each with its cover and its value struck out, total value against
// today's price, the guarantee in a line. Words: copy/<lang>.ts order.stack.
// Since the same evening it is drawn with the Jazz page's own classes (jazz.module.css .stack,
// .bonusMini, .totalMini, .guaranteeMini, .proof), so its sizes are the Jazz page's and stay
// so ("font sizes of the page are different between the two… make them the same"): the first
// line of the list is what used to be a title over it, as the Jazz list opens with its files.

/** The bonuses' boxes, in the order of order.stack.bonuses: the ones in the Jazz bonuses' style (2026-11-12,
 *  bonus2-*-132.webp, 132 × 196, shown 36px wide as on the Jazz order page); bonus-*-132 were the old square covers. */
const COVERS = ["famous", "starters", "drums", "grooves", "hooks", "guide"];
const IMG = "/funnels/midi-drum-kit";

const Tick = () => (
  <svg className={j.tick} viewBox="0 0 20 20" width="18" height="18" aria-hidden>
    <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Shield = () => (
  <svg className={j.shield} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="currentColor" opacity=".18" />
    <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function OrderStack({ w, price, currency, lang }: { w: Copy["order"]["stack"]; price: number; currency: Currency; lang: Lang }) {
  const fmt = (n: number) => money(n, currency, lang, false);
  return (
    <>
      <ul className={j.stack}>
        {[w.title, ...w.items].map((item) => (
          <li key={item}>
            <Tick />
            <span>
              <Rich text={item} currency={currency} />
            </span>
          </li>
        ))}
      </ul>
      <div className={j.bonusMini}>
        <p className={j.bonusMiniHead}>{w.bonusesTitle}</p>
        <ul>
          {w.bonuses.map((name, i) => (
            <li key={name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {COVERS[i] && <img src={`${IMG}/bonus2-${COVERS[i]}-132.webp`} alt="" width={36} height={54} loading="lazy" decoding="async" />}
              <span>{name}</span>
              <span className={j.bonusMiniValue}>
                <s>{fmt(STACK_VALUES.bonuses[i])}</s> {w.free}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className={j.totalMini}>
        <span>
          {w.totalValue} <s>{fmt(STACK_VALUES.total)}</s>
        </span>
        <span>
          {w.today} <b>{money(price, currency, lang, !Number.isInteger(price))}</b>
        </span>
      </p>
      <p className={j.guaranteeMini}>
        <Shield /> {w.guarantee}
      </p>
    </>
  );
}

/** Under the form: three real numbers (the Jazz order page's Proof); a line's **number** is the big one. */
export function OrderProof({ w, currency }: { w: Copy["order"]["stack"]; currency: Currency }) {
  const sign = currency === "eur" ? "€" : "$";
  return (
    <ul className={j.proof} style={{ "--n": w.proof.length } as CSSProperties}>
      {w.proof.map((line) => (
        <li key={line}>
          {line
            .replaceAll("{c}", sign)
            .split(/\*\*(.+?)\*\*/)
            .map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}
        </li>
      ))}
    </ul>
  );
}
