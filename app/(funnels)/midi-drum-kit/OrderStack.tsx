import type { Currency } from "@/lib/geo";
import { Rich } from "../top-hits-midi-bundle/Rich";
import { Check } from "../top-hits-midi-bundle/sections";
import type { Copy } from "./copy";
import { money } from "./i18n";
import type { Lang } from "./i18n";
import { STACK_VALUES } from "./stackSwitch";
import d from "./order.module.css";

// The order page's left column, as the Jazz MIDI Pack's order page has it
// (jazz-midi-pack/sections.tsx OrderSummary; 2026-11-12, "praticamente uguale a MIDI Jazz
// Pack ma con i prodotti cambiati e i colori di MIDI Drum Kit"): what's inside as a tick
// list, the six bonuses each with its cover and its value struck out, total value against
// today's price, the guarantee in a line. Words: copy/<lang>.ts order.stack.

/** The bonuses' covers, in the order of order.stack.bonuses (132px squares of the landing's). */
const COVERS = ["famous", "starters", "drums", "grooves", "hooks", "guide"];
const IMG = "/funnels/midi-drum-kit";

export function OrderStack({ w, price, currency, lang }: { w: Copy["order"]["stack"]; price: number; currency: Currency; lang: Lang }) {
  const fmt = (n: number) => money(n, currency, lang, false);
  return (
    <div className={d.stack}>
      <p className={d.stackTitle}>
        <Rich text={w.title} currency={currency} />
      </p>
      <ul className={d.stackList}>
        {w.items.map((item) => (
          <li key={item}>
            <Check />
            <span>
              <Rich text={item} currency={currency} />
            </span>
          </li>
        ))}
      </ul>
      <div className={d.stackBonuses}>
        <p className={d.stackBonusesTitle}>{w.bonusesTitle}</p>
        <ul>
          {w.bonuses.map((name, i) => (
            <li key={name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {COVERS[i] && <img src={`${IMG}/bonus-${COVERS[i]}-132.webp`} alt="" width={44} height={44} loading="lazy" decoding="async" />}
              <span>{name}</span>
              <span className={d.stackFree}>
                <s>{fmt(STACK_VALUES.bonuses[i])}</s> {w.free}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className={d.stackTotal}>
        <span>
          {w.totalValue} <s>{fmt(STACK_VALUES.total)}</s>
        </span>
        <span>
          {w.today} <b>{money(price, currency, lang, !Number.isInteger(price))}</b>
        </span>
      </p>
      <p className={d.stackGuarantee}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.600-1.600 8-6 8-11V5l-8-3Zm-1.200 14.200-3.500-3.500 1.400-1.400 2.100 2.100 4.500-4.500 1.400 1.400-5.900 5.900Z" />
        </svg>
        {w.guarantee}
      </p>
    </div>
  );
}

/** Under the form: three real numbers (the Jazz order page's Proof). */
export function OrderProof({ w, currency }: { w: Copy["order"]["stack"]; currency: Currency }) {
  return (
    <ul className={d.proof}>
      {w.proof.map((line) => (
        <li key={line}>
          <Rich text={line} currency={currency} />
        </li>
      ))}
    </ul>
  );
}
