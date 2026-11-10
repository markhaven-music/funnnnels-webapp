import type { Currency } from "@/lib/geo";
import { Rich } from "../top-hits-midi-bundle/Rich";
import { Check } from "../top-hits-midi-bundle/sections";
import type { Copy } from "./copy";
import { money } from "./i18n";
import type { Lang } from "./i18n";
import { STACK_VALUES } from "./stackSwitch";
import d from "./order.module.css";

// The order page's "what you get" box (./stackSwitch.ts): in the cached HTML for
// everyone, shown from ORDER_STACK.from on (html[data-order-stack="on"]).
// Every screen size, phones included, unlike the 12 claims it replaces.

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
    </div>
  );
}
