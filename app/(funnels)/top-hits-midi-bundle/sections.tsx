import type { Currency } from "@/lib/geo";
import { restate } from "@/lib/restate";
import { compare, type Cell } from "./copy";
import { funnel } from "./funnel";
import { Rich, sign } from "./Rich";
import s from "./landing.module.css";

// The landing's repeated blocks: the value stack, the two green buttons, the comparison table.
// `price`: the bundle's, as dashboard → Products has it; the words that say
// the code's price say this one (lib/restate.ts).

export function ValueStack({ currency, price }: { currency: Currency; price: number }) {
  const c = sign(currency);
  return (
    <div className={s.stack}>
      <div className={s.stackHead}>Here&apos;s What You Get Today</div>
      <div className={s.stackCtx}>
        <p>
          If you hired a world-class transcription service to rip these chord progressions note-for-note, you&apos;d
          pay <strong>at least {c}20 per transcription.</strong> That&apos;s <strong>{c}20,000 for all 1,000.</strong>
        </p>
        <p>
          Right now, you&apos;re getting all of them for just{" "}
          <span className={s.green}>
            {c}
            {price}.
          </span>
        </p>
      </div>
      <div className={s.stackRow}>
        <span>1,000 Chord Progressions</span>
        <span>Included</span>
      </div>
      <div className={s.stackRow}>
        <span>Transcribed 1:1 From Top Hits</span>
        <span>496 Artists</span>
      </div>
      <div className={s.stackRow}>
        <span>Pro Transcription Cost ({c}20 each)</span>
        <span>{c}20,000</span>
      </div>
      <div className={s.stackTotal}>
        <span>Total Real Value</span>
        <span>{c}20,000</span>
      </div>
      <div className={s.stackFinal}>
        YOUR PRICE TODAY: {c}
        {price}
      </div>
      <div className={s.stackPer}>
        That&apos;s just <strong>{c}0.03 per chord progression</strong>
      </div>
      <div className={s.stackScarcity}>
        <span className={s.pulse} />
        Limited To The First 100 Copies
      </div>
    </div>
  );
}

const ORDER = funnel.checkout.orderPage;

export function GetThePack() {
  return (
    <a href={ORDER} className={s.cta} data-cta>
      <span className={s.ctaMain}>GET THE PACK!</span>
      <span className={s.ctaSub}>90% OFF - Instant Download &amp; Email Link</span>
    </a>
  );
}

export function YesButton() {
  return (
    <a href={ORDER} className={s.yes} data-cta>
      <span className={s.yesText}>YES!! I WANT THE BUNDLE</span>
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

function Mark({ cell, currency }: { cell: Cell; currency: Currency }) {
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

export function Compare({ currency, price }: { currency: Currency; price: number }) {
  return (
    <div className={s.cmp}>
      <p className={s.eyebrow}>DO THE MATH</p>
      <h2 className={s.cmpTitle}>
        WHY THIS BEATS <em>EVERY ALTERNATIVE</em>
      </h2>
      <p className={s.cmpSub}>There are other ways to get hit chord progressions. None of them stack up.</p>
      <table className={s.table}>
        <thead>
          <tr>
            <th />
            {compare.columns.map((col) => (
              <th key={col.name} className={col.bundle ? s.isBundle : undefined}>
                <span className={s.headName}>{col.name}</span>
                <span className={s.headSub}>{col.sub}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {compare.rows.map((row) => (
            <tr key={row.label}>
              <td className={s.isLabel}>{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className={compare.columns[i].bundle ? s.isBundle : undefined}>
                  <Mark cell={typeof v === "string" ? restate(v, funnel.price[currency], price) : v} currency={currency} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={s.cards}>
        {compare.columns.map((col, i) => (
          <div key={col.name} className={`${s.card} ${col.bundle ? s.isBundle : ""}`}>
            <div className={s.cardHead}>
              <span className={s.cardName}>{col.name}</span>
              <span className={s.cardSub}>{col.sub}</span>
            </div>
            <ul className={s.cardList}>
              {compare.rows.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <span>
                    <Mark cell={row.values[i]} currency={currency} />
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
