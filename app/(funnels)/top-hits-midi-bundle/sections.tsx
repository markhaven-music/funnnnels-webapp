import type { Currency } from "@/lib/geo";
import { restate, restateEach } from "@/lib/restate";
import { fill } from "@/lib/words";
import { compare } from "./copy";
import { funnel } from "./funnel";
import { Rich, sign } from "./Rich";
import { LANDING, type CompareWords, type StackWords } from "./words";
import s from "./landing.module.css";

// The landing's repeated blocks: the value stack, the two green buttons, the comparison table.
// `price`: the bundle's, as dashboard → Products has it; the words that say
// the code's price say this one (lib/restate.ts). Their words: ./words.ts,
// with the dashboard's edits when the page hands them in.

export function ValueStack({ currency, price, w = LANDING.stack }: { currency: Currency; price: number; w?: StackWords }) {
  const c = sign(currency);
  const t = (text: string) => fill(text, { price }).replaceAll("{c}", c);
  return (
    <div className={s.stack}>
      <div className={s.stackHead}>{w.head}</div>
      <div className={s.stackCtx}>
        <p>
          <Rich text={fill(w.hired, { price })} currency={currency} />
        </p>
        <p>
          <Rich text={fill(w.now, { price })} currency={currency} hl={s.green} />
        </p>
      </div>
      {w.rows.map(([label, value], i) => (
        <div key={i} className={s.stackRow}>
          <span>{t(label)}</span>
          <span>{t(value)}</span>
        </div>
      ))}
      <div className={s.stackTotal}>
        <span>{t(w.total[0])}</span>
        <span>{t(w.total[1])}</span>
      </div>
      <div className={s.stackFinal}>{t(w.final)}</div>
      <div className={s.stackPer}>
        <Rich text={restateEach(fill(w.per, { price }), funnel.price[currency], price, 1000)} currency={currency} />
      </div>
      <div className={s.stackScarcity}>
        <span className={s.pulse} />
        {w.scarcity}
      </div>
    </div>
  );
}

const ORDER = funnel.checkout.orderPage;

export function GetThePack({ w = LANDING.cta }: { w?: { main: string; sub: string } }) {
  return (
    <a href={ORDER} className={s.cta} data-cta>
      <span className={s.ctaMain}>{w.main}</span>
      <span className={s.ctaSub}>{w.sub}</span>
    </a>
  );
}

export function YesButton({ text = LANDING.yes }: { text?: string }) {
  return (
    <a href={ORDER} className={s.yes} data-cta>
      <span className={s.yesText}>{text}</span>
      <svg className={s.yesArrow} viewBox="0 0 448 512" aria-hidden>
        <path
          fill="currentColor"
          d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"
        />
      </svg>
    </a>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden>
      <path
        fill="currentColor"
        d="M173.9 439.4l-166.4-166.4c-10-10-10-26.2 0-36.2l36.2-36.2c10-10 26.2-10 36.2 0L192 312.7 432.1 72.6c10-10 26.2-10 36.2 0l36.2 36.2c10 10 10 26.2 0 36.2L210.1 439.4c-10 10-26.2 10-36.2 0z"
      />
    </svg>
  );
}

function Mark({ cell, currency }: { cell: string; currency: Currency }) {
  if (cell === "yes")
    return (
      <span className={`${s.icon} ${s.yesIcon}`} aria-label="Yes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  if (cell === "no")
    return (
      <span className={`${s.icon} ${s.noIcon}`} aria-label="No">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </span>
    );
  if (cell === "partial")
    return (
      <span className={`${s.icon} ${s.partialIcon}`} aria-label="Partly">
        −
      </span>
    );
  return <Rich text={cell} currency={currency} />;
}

export function Compare({ currency, price, w = LANDING.compare }: { currency: Currency; price: number; w?: CompareWords }) {
  // The words of the code's table, the ✓ ✗ − cells as the code has them.
  const columns = compare.columns.map((col, i) => ({ ...col, name: w.columns[i]?.name ?? col.name, sub: w.columns[i]?.sub ?? col.sub }));
  const rows = compare.rows.map((row, r) => ({
    label: w.rows[r]?.label ?? row.label,
    values: row.values.map((v, i) => w.rows[r]?.values[i] ?? v),
  }));
  // A price cell (and "{c}0.03" per progression) at dashboard → Products' price, in the table and the phone cards alike.
  const cell = (v: (typeof rows)[number]["values"][number]) =>
    typeof v === "string" ? restateEach(restate(v, funnel.price[currency], price), funnel.price[currency], price, 1000) : v;
  return (
    <div className={s.cmp}>
      <p className={s.eyebrow}>{w.eyebrow}</p>
      <h2 className={s.cmpTitle}>
        <Rich text={w.title} currency={currency} />
      </h2>
      <p className={s.cmpSub}>{w.sub}</p>
      <table className={s.table}>
        <thead>
          <tr>
            <th />
            {columns.map((col, i) => (
              <th key={i} className={col.bundle ? s.isBundle : undefined}>
                <span className={s.headName}>{col.name}</span>
                <span className={s.headSub}>{col.sub}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <td className={s.isLabel}>{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className={columns[i].bundle ? s.isBundle : undefined}>
                  <Mark cell={cell(v)} currency={currency} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={s.cards}>
        {columns.map((col, i) => (
          <div key={i} className={`${s.card} ${col.bundle ? s.isBundle : ""}`}>
            <div className={s.cardHead}>
              <span className={s.cardName}>{col.name}</span>
              <span className={s.cardSub}>{col.sub}</span>
            </div>
            <ul className={s.cardList}>
              {rows.map((row, r) => (
                <li key={r}>
                  <span>{row.label}</span>
                  <span>
                    <Mark cell={cell(row.values[i])} currency={currency} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
