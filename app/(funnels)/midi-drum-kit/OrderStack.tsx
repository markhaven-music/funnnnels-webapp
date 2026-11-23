import type { CSSProperties } from "react";
import type { Currency } from "@/lib/geo";
import { fillSign } from "@/lib/geo";
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

/** The bonuses' boxes, in the order of order.stack.bonuses. Since 2026-11-17 real 3D software boxes like the
 *  TOP HITS MIDI Bundle's ("metti solo le box invece di questi quadrati 2D. genera le box e mettile come TOP HITS
 *  MIDI Bundle"): bonus3-*-120.webp, 120px wide, transparent, shown 52px wide; Famous Beats and Drunk Swing Grooves
 *  are their own funnels' boxes, the other four generated with Higgsfield from the bonus2 covers (bonus2-*: the
 *  flat-looking front-on boxes at 36px, before). [key, height of the 120px-wide file]. */
const COVERS: [string, number][] = [
  ["famous", 148],
  ["starters", 179],
  ["drums", 179],
  ["grooves", 174],
  ["hooks", 178],
  ["guide", 179],
];
/** How wide a box is drawn in the list (the Jazz class draws 36px; inline so the Jazz page keeps its own). */
const BOX_W = 52;
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

// was: the Black Friday copy's regular price, struck before today's (lib/blackFriday.ts).
export function OrderStack({ w, price, currency, lang, was }: { w: Copy["order"]["stack"]; price: number; currency: Currency; lang: Lang; was?: number }) {
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
              {COVERS[i] && (
                <img
                  src={`${IMG}/bonus3-${COVERS[i][0]}-120.webp?v=2`}
                  alt=""
                  width={120}
                  height={COVERS[i][1]}
                  style={{ width: BOX_W, height: "auto", filter: "drop-shadow(0 4px 8px rgb(0 0 0 / 0.5))" }}
                  loading="lazy"
                  decoding="async"
                />
              )}
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
          {w.today} {was ? <s>{money(was, currency, lang, !Number.isInteger(was))}</s> : null} <b>{money(price, currency, lang, !Number.isInteger(price))}</b>
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
  return (
    <ul className={j.proof} style={{ "--n": w.proof.length } as CSSProperties}>
      {w.proof.map((line) => (
        <li key={line}>
          {fillSign(line, currency)
            .split(/\*\*(.+?)\*\*/)
            .map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}
        </li>
      ))}
    </ul>
  );
}
