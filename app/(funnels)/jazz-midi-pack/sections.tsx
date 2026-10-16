// Renders the Jazz page's sections. Same components on the live page and in
// the editor: with `patch` every text is click-to-edit and lists get add /
// remove controls; without it they're plain server-rendered text.
import type { CSSProperties, ElementType, ReactNode } from "react";
import { EditableText } from "@/components/blocks/EditableText";
import { funnel } from "./funnel";
import { DEFAULT_SECTIONS, type ChartCell, type Section, type SectionProps, type SectionType } from "./content";
import { Cta } from "./Cta";
import { PlayableRoll } from "./PlayableRoll";
import { ProductBox, Scene } from "./ProductBox";
import { CheckoutWidget } from "./CheckoutWidget";
import s from "./jazz.module.css";
import e from "./edit.module.css";

export type Ctx = {
  price: string; // "€27"
  amount: number;
  currency: "eur" | "usd";
  country: string;
  publishableKey: string | null;
  editing?: boolean;
};

type Patch = (props: Record<string, unknown>) => void;

const n = funnel.counts;

export function fill(text: string, ctx: Ctx) {
  return text
    .replaceAll("{price}", ctx.price)
    .replaceAll("{files}", n.files.toLocaleString("en-US"))
    .replaceAll("{days}", String(funnel.guaranteeDays));
}

/** Editable (with patch) or plain text with tokens filled in. */
function T({
  v,
  set,
  ctx,
  as: Tag = "span",
  className,
  placeholder,
}: {
  v: string;
  set?: (next: string) => void;
  ctx: Ctx;
  as?: ElementType;
  className?: string;
  placeholder?: string;
}) {
  if (set) return <EditableText as={Tag} value={v} onChange={set} className={`${className ?? ""} ${e.text}`} placeholder={placeholder} />;
  return <Tag className={className}>{fill(v, ctx)}</Tag>;
}

/** Helpers to edit one item of a list prop. */
function listOps<I>(list: I[], key: string, patch?: Patch) {
  return {
    set: patch ? (i: number, item: I) => patch({ [key]: list.map((x, j) => (j === i ? item : x)) }) : undefined,
    add: patch ? (item: I) => patch({ [key]: [...list, item] }) : undefined,
    remove: patch ? (i: number) => patch({ [key]: list.filter((_, j) => j !== i) }) : undefined,
  };
}

function Remove({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null;
  return (
    <button type="button" className={e.remove} onClick={onClick} title="Remove" aria-label="Remove">
      ×
    </button>
  );
}

function Add({ onClick, label }: { onClick?: () => void; label: string }) {
  if (!onClick) return null;
  return (
    <button type="button" className={e.add} onClick={onClick}>
      + {label}
    </button>
  );
}

function Head({ eyebrow, title, sub, patch, ctx }: { eyebrow: string; title: string; sub?: string; patch?: Patch; ctx: Ctx }) {
  return (
    <div className={s.secHead}>
      <T v={eyebrow} set={patch && ((v) => patch({ eyebrow: v }))} ctx={ctx} as="p" className={s.eyebrow} />
      <T v={title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
      {sub !== undefined && <T v={sub} set={patch && ((v) => patch({ sub: v }))} ctx={ctx} as="p" className={s.sub} />}
    </div>
  );
}

function Tick() {
  return (
    <svg className={s.tick} viewBox="0 0 20 20" width="18" height="18" aria-hidden>
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Shield({ big }: { big?: boolean }) {
  return (
    <svg className={big ? s.shieldBig : s.shield} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="currentColor" opacity=".18" />
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TickList({ items, k, patch, ctx, className }: { items: string[]; k: string; patch?: Patch; ctx: Ctx; className: string }) {
  const ops = listOps(items, k, patch);
  return (
    <>
      <ul className={className}>
        {items.map((t, i) => (
          <li key={i}>
            <Tick />
            <T v={t} set={ops.set && ((v) => ops.set!(i, v))} ctx={ctx} />
            <Remove onClick={ops.remove && (() => ops.remove!(i))} />
          </li>
        ))}
      </ul>
      <Add onClick={ops.add && (() => ops.add!("New line"))} label="line" />
    </>
  );
}

// ─── the sections ─────────────────────────────────────────────

function Hero({ p, patch, ctx }: { p: SectionProps["s_hero"]; patch?: Patch; ctx: Ctx }) {
  const set = (k: string) => patch && ((v: string) => patch({ [k]: v }));
  const hud = listOps(p.hud, "hud", patch);
  return (
    <section id="hero" className={s.hero}>
      <div className={s.heroBg} aria-hidden />
      <header className={`${s.wrap} ${s.topbar}`}>
        <span className={s.logo}>
          GRIND <span className={s.dia}>◆</span> STUDIO
        </span>
        <span className={s.tag}>
          <span className={s.dot} aria-hidden />
          <T v={p.tag} set={set("tag")} ctx={ctx} />
        </span>
      </header>
      <div className={`${s.wrap} ${s.heroGrid}`}>
        <div className={s.heroCopy}>
          <h1 className={s.display}>
            <T v={p.headline} set={set("headline")} ctx={ctx} /> <T v={p.headlineEm} set={set("headlineEm")} ctx={ctx} as="em" />
          </h1>
          <T v={p.lead} set={set("lead")} ctx={ctx} as="p" className={s.lead} />
          <Cta className={s.heroCta} inner={`${ctx.price} · instant download`} />
          <TickList items={p.ticks} k="ticks" patch={patch} ctx={ctx} className={s.proofRow} />
        </div>
        <div className={s.heroVis}>
          <ProductBox variant="hero" priority />
          {[s.hudA, s.hudB, s.hudC].map((cls, i) =>
            p.hud[i] !== undefined ? (
              <span key={i} className={`${s.hud} ${cls}`}>
                <T v={p.hud[i]} set={hud.set && ((v) => hud.set!(i, v))} ctx={ctx} />
              </span>
            ) : null,
          )}
        </div>
      </div>
      <div className={`${s.wrap} ${s.dawStrip}`}>
        <span className={s.mono}>Works in</span>
        <T v={p.daws} set={set("daws")} ctx={ctx} />
      </div>
    </section>
  );
}

const PARA_CLASS = { p: undefined, bold: undefined, pull: s.pull, hit: s.hit } as const;

function Letter({ p, patch, ctx }: { p: SectionProps["s_letter"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.paras, "paras", patch);
  return (
    <section className={s.sec}>
      <div className={`${s.wrap} ${s.col}`}>
        <T v={p.eyebrow} set={patch && ((v) => patch({ eyebrow: v }))} ctx={ctx} as="p" className={s.eyebrow} />
        <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
        <div className={s.letter}>
          {p.paras.map((para, i) => (
            <div key={i} className={e.row}>
              <T
                v={para.text}
                set={ops.set && ((v) => ops.set!(i, { ...para, text: v }))}
                ctx={ctx}
                as={para.style === "bold" ? "b" : "p"}
                className={PARA_CLASS[para.style]}
              />
              {patch && (
                <select
                  className={e.style}
                  value={para.style}
                  onChange={(ev) => ops.set!(i, { ...para, style: ev.target.value as typeof para.style })}
                  title="Paragraph style"
                >
                  <option value="p">Text</option>
                  <option value="bold">Bold</option>
                  <option value="pull">Quote</option>
                  <option value="hit">Big line</option>
                </select>
              )}
              <Remove onClick={ops.remove && (() => ops.remove!(i))} />
            </div>
          ))}
          <Add onClick={ops.add && (() => ops.add!({ style: "p", text: "New paragraph." }))} label="paragraph" />
        </div>
      </div>
    </section>
  );
}

function CompareRolls({ p, patch, ctx }: { p: SectionProps["s_compare_rolls"]; patch?: Patch; ctx: Ctx }) {
  const set = (k: string) => patch && ((v: string) => patch({ [k]: v }));
  return (
    <section className={s.sec} style={{ paddingTop: 0 }}>
      <div className={`${s.wrap} ${s.ba}`} style={{ marginTop: 0 }}>
        <figure className={s.baItem}>
          <figcaption className={s.baCap}>
            <T v={p.beforeLabel} set={set("beforeLabel")} ctx={ctx} className={s.bad} />{" "}
            <T v={p.beforeText} set={set("beforeText")} ctx={ctx} />
          </figcaption>
          <PlayableRoll id="before" tone="muted" playLabel="Play before" />
        </figure>
        <figure className={s.baItem}>
          <figcaption className={s.baCap}>
            <T v={p.afterLabel} set={set("afterLabel")} ctx={ctx} className={s.good} />{" "}
            <T v={p.afterText} set={set("afterText")} ctx={ctx} />
          </figcaption>
          <PlayableRoll id="after" playLabel="Play after" />
        </figure>
        <T v={p.note} set={set("note")} ctx={ctx} as="p" className={s.baNote} />
      </div>
    </section>
  );
}

function Product({ p, patch, ctx }: { p: SectionProps["s_product"]; patch?: Patch; ctx: Ctx }) {
  const set = (k: string) => patch && ((v: string) => patch({ [k]: v }));
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={`${s.wrap} ${s.introGrid}`}>
        <ProductBox />
        <div>
          <T v={p.eyebrow} set={set("eyebrow")} ctx={ctx} as="p" className={s.eyebrow} />
          <h2 className={s.h2}>
            <T v={p.title} set={set("title")} ctx={ctx} /> <T v={p.titleEm} set={set("titleEm")} ctx={ctx} as="em" className={s.hl} />
          </h2>
          <T v={p.lead} set={set("lead")} ctx={ctx} as="p" className={s.lead} />
          <TickList items={p.ticks} k="ticks" patch={patch} ctx={ctx} className={s.ticks} />
          <Cta className={s.ctaBlock} inner={`${ctx.price} · instant download`} />
        </div>
      </div>
    </section>
  );
}

function Previews({ p, patch, ctx }: { p: SectionProps["s_previews"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.items, "items", patch);
  return (
    <section className={s.sec}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} sub={p.sub} patch={patch} ctx={ctx} />
        <div className={s.previews}>
          {p.items.map((it, i) => (
            <div key={i} className={e.item}>
              <PlayableRoll id={it.roll} title={fill(it.title, ctx)} meta={it.meta} variant="mini" />
              {patch && (
                <div className={e.itemBar}>
                  <T v={it.title} set={(v) => ops.set!(i, { ...it, title: v })} ctx={ctx} />
                  <T v={it.meta} set={(v) => ops.set!(i, { ...it, meta: v })} ctx={ctx} />
                  <Remove onClick={() => ops.remove!(i)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps({ p, patch, ctx }: { p: SectionProps["s_steps"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.steps, "steps", patch);
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} patch={patch} ctx={ctx} />
        <ol className={s.steps}>
          {p.steps.map((st, i) => (
            <li key={i}>
              <span className={s.stepN}>{String(i + 1).padStart(2, "0")}</span>
              <T v={st.title} set={ops.set && ((v) => ops.set!(i, { ...st, title: v }))} ctx={ctx} as="h3" />
              <T v={st.text} set={ops.set && ((v) => ops.set!(i, { ...st, text: v }))} ctx={ctx} as="p" />
              <Remove onClick={ops.remove && (() => ops.remove!(i))} />
            </li>
          ))}
        </ol>
        <Add onClick={ops.add && (() => ops.add!({ title: "New step", text: "What happens." }))} label="step" />
        <figure className={s.dawShot}>
          <Scene name="daw" alt="A laptop with the DAW piano roll showing gold jazz voicings under Dm9, G13 and Cmaj9, next to the Jazz MIDI Pack box" />
        </figure>
      </div>
    </section>
  );
}

const VOICINGS = ["Best Voicing", "Best Voicing + Smooth Bass", "Rootless (Bill Evans)", "Spread (two-hand)", "Drop 2", "Voice-Led Close", "Quartal (So What)", "Shell (Bud Powell)", "Drop 3", "Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"];
const RHYTHMS = [["Ballad Arpeggios", "70"], ["Pads", "90"], ["Bossa Nova", "135"], ["Swing Comping", "150"], ["Charleston", "130"], ["Anticipations", "130"], ["Reverse Charleston", "130"], ["Freddie Green 4 to the Bar", "140"]];

function Inside({ p, patch, ctx }: { p: SectionProps["s_inside"]; patch?: Patch; ctx: Ctx }) {
  return (
    <section className={s.sec}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} patch={patch} ctx={ctx} />
        {patch && <p className={e.hint}>The folders, voicings and progressions below come from the pack itself.</p>}
        <div className={s.bento}>
          {funnel.folders.map((f, i) => (
            <div key={f.name} className={`${s.cell} ${i === 0 ? s.cellBig : ""}`}>
              <span className={s.cellN}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.cellCount}>{f.files.toLocaleString("en-US")}</span>
              <h3>{f.name}</h3>
              <p>{f.what}</p>
            </div>
          ))}
        </div>
        <div className={s.lists}>
          <div className={s.listBox}>
            <h3>13 voicings</h3>
            <ol className={s.numList}>{VOICINGS.map((v) => <li key={v}>{v}</li>)}</ol>
          </div>
          <div className={s.listBox}>
            <h3>8 rhythms</h3>
            <ul className={s.rhythms}>
              {RHYTHMS.map(([r, bpm]) => (
                <li key={r}>
                  <span>{r}</span>
                  <span className={s.mono}>{bpm} bpm</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${s.listBox} ${s.listWide}`}>
            <h3>26 progressions</h3>
            <ol className={s.progGrid}>{funnel.progressions.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        </div>
      </div>
    </section>
  );
}

const MATH_DEFAULT = DEFAULT_SECTIONS.find((x) => x.type === "s_math")!.props as SectionProps["s_math"];

/** ✓ / ✗ / – in a chart cell. In the editor a click cycles through them. */
function Mark({ ok, onClick }: { ok: boolean | null; onClick?: () => void }) {
  const cls = ok === true ? s.markYes : ok === false ? s.markNo : s.markMeh;
  const icon = (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
      {ok === true ? (
        <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : ok === false ? (
        <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      ) : (
        <path d="M5.5 10h9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      )}
    </svg>
  );
  const label = ok === true ? "Yes" : ok === false ? "No" : "Partly";
  if (onClick)
    return (
      <button type="button" className={`${s.mark} ${cls} ${e.markBtn}`} onClick={onClick} title="Click: ✓ / ✗ / –" aria-label={label}>
        {icon}
      </button>
    );
  return (
    <span className={`${s.mark} ${cls}`} role="img" aria-label={label}>
      {icon}
    </span>
  );
}

function Math_({ p: raw, patch, ctx }: { p: SectionProps["s_math"]; patch?: Patch; ctx: Ctx }) {
  // Pages published before the chart hold cards, not rows: they show the default chart.
  const p = { ...raw, cols: raw.cols ?? MATH_DEFAULT.cols, rows: raw.rows ?? MATH_DEFAULT.rows, note: raw.note ?? MATH_DEFAULT.note };
  const last = p.cols.length - 1;
  const rows = listOps(p.rows, "rows", patch);
  const setCell = (r: number, c: number, cell: ChartCell) =>
    rows.set!(r, { ...p.rows[r], cells: p.rows[r].cells.map((x, j) => (j === c ? cell : x)) });
  const next = (ok: boolean | null) => (ok === true ? false : ok === false ? null : true);
  const win = (i: number) => (i === last ? s.chWin : "");
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} patch={patch} ctx={ctx} />
        <div className={s.chart} role="table" aria-label={fill(p.title, ctx)} style={{ "--cols": p.cols.length } as CSSProperties}>
          <div className={s.chRow} role="row">
            <span className={s.chCorner} role="columnheader" />
            {p.cols.map((c, i) => (
              <span key={i} role="columnheader" className={`${s.chHead} ${win(i)}`}>
                <T v={c} set={patch && ((v) => patch({ cols: p.cols.map((x, j) => (j === i ? v : x)) }))} ctx={ctx} />
              </span>
            ))}
          </div>
          {p.rows.map((row, r) => (
            <div key={r} className={s.chRow} role="row">
              <span role="rowheader" className={s.chLabel}>
                <T v={row.label} set={rows.set && ((v) => rows.set!(r, { ...row, label: v }))} ctx={ctx} />
                <Remove onClick={rows.remove && (() => rows.remove!(r))} />
              </span>
              {p.cols.map((_, c) => {
                const cell = row.cells[c] ?? { ok: null, text: "" };
                return (
                  <span key={c} role="cell" className={`${s.chCell} ${win(c)} ${r === p.rows.length - 1 ? s.chEnd : ""}`}>
                    <Mark ok={cell.ok} onClick={patch && (() => setCell(r, c, { ...cell, ok: next(cell.ok) }))} />
                    <T v={cell.text} set={patch && ((v) => setCell(r, c, { ...cell, text: v }))} ctx={ctx} placeholder="Text" />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <Add
          onClick={rows.add && (() => rows.add!({ label: "New row", cells: p.cols.map(() => ({ ok: true, text: "" })) }))}
          label="row"
        />
        <T v={p.note} set={patch && ((v) => patch({ note: v }))} ctx={ctx} as="p" className={s.chNote} />
      </div>
    </section>
  );
}

function Offer({ p, patch, ctx }: { p: SectionProps["s_offer"]; patch?: Patch; ctx: Ctx }) {
  return (
    <section id="buy" className={`${s.sec} ${s.order}`}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} patch={patch} ctx={ctx} />
        <div className={s.orderGrid}>
          <div className={s.orderSummary}>
            <ProductBox />
            <TickList items={p.stack} k="stack" patch={patch} ctx={ctx} className={s.stack} />
            <p className={s.guaranteeMini}>
              <Shield /> <T v={p.guarantee} set={patch && ((v) => patch({ guarantee: v }))} ctx={ctx} />
            </p>
          </div>
          <div className={s.orderForm}>
            {ctx.editing ? (
              <div className={e.locked}>
                <b>Checkout</b>
                <span>Locked in the editor so a payment can never break. Prices and the Chord Pack add-on are in the funnel settings.</span>
              </div>
            ) : (
              <CheckoutWidget
                funnel={funnel.slug}
                product={funnel.product}
                tagline={funnel.tagline}
                image="/funnels/jazz-midi-pack/box-520.webp"
                currency={ctx.currency}
                country={ctx.country}
                price={ctx.amount}
                bump={{ name: funnel.bump.name, price: funnel.bump.price[ctx.currency], pitch: funnel.bump.pitch }}
                thankYou={funnel.checkout.thankYou}
                publishableKey={ctx.publishableKey}
                europe={ctx.currency === "eur"}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Guarantee({ p, patch, ctx }: { p: SectionProps["s_guarantee"]; patch?: Patch; ctx: Ctx }) {
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={`${s.wrap} ${s.col} ${s.guarantee}`}>
        <Shield big />
        <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
        <T v={p.text} set={patch && ((v) => patch({ text: v }))} ctx={ctx} as="p" className={s.sub} />
      </div>
    </section>
  );
}

function After({ p, patch, ctx }: { p: SectionProps["s_after"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.items, "items", patch);
  return (
    <section className={s.sec}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} patch={patch} ctx={ctx} />
        <ol className={s.after}>
          {p.items.map((it, i) => (
            <li key={i}>
              <T v={it.lead} set={ops.set && ((v) => ops.set!(i, { ...it, lead: v }))} ctx={ctx} as="b" />{" "}
              <T v={it.text} set={ops.set && ((v) => ops.set!(i, { ...it, text: v }))} ctx={ctx} />
              <Remove onClick={ops.remove && (() => ops.remove!(i))} />
            </li>
          ))}
        </ol>
        <Add onClick={ops.add && (() => ops.add!({ lead: "Next.", text: "What happens." }))} label="step" />
      </div>
    </section>
  );
}

function Faq({ p, patch, ctx }: { p: SectionProps["s_faq"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.items, "items", patch);
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={`${s.wrap} ${s.col}`}>
        <T v={p.eyebrow} set={patch && ((v) => patch({ eyebrow: v }))} ctx={ctx} as="p" className={s.eyebrow} />
        <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
        <div className={s.faq}>
          {p.items.map((it, i) =>
            patch ? (
              <div key={i} className={e.faqItem}>
                <T v={it.q} set={(v) => ops.set!(i, { ...it, q: v })} ctx={ctx} as="p" className={e.faqQ} />
                <T v={it.a} set={(v) => ops.set!(i, { ...it, a: v })} ctx={ctx} as="p" />
                <Remove onClick={() => ops.remove!(i)} />
              </div>
            ) : (
              <details key={i}>
                <summary>{fill(it.q, ctx)}</summary>
                <p>
                  {fill(it.a, ctx)}{" "}
                  <a href="#buy" data-cta className={s.micro}>
                    Get the pack
                  </a>
                </p>
              </details>
            ),
          )}
        </div>
        <Add onClick={ops.add && (() => ops.add!({ q: "New question?", a: "The answer." }))} label="question" />
      </div>
    </section>
  );
}

function Final({ p, patch, ctx }: { p: SectionProps["s_final"]; patch?: Patch; ctx: Ctx }) {
  return (
    <section className={`${s.sec} ${s.final}`}>
      <div className={s.finalBg} aria-hidden>
        <Scene name="stage" alt="" />
      </div>
      <div className={`${s.wrap} ${s.finalIn}`}>
        <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
        <Cta className={s.ctaBlock} inner={`${ctx.price} · instant download`} note={fill(p.note, ctx)} />
        {patch && <T v={p.note} set={(v) => patch({ note: v })} ctx={ctx} as="p" className={e.hint} />}
      </div>
    </section>
  );
}

const VIEWS: { [K in SectionType]: (a: { p: SectionProps[K]; patch?: Patch; ctx: Ctx }) => ReactNode } = {
  s_hero: Hero,
  s_letter: Letter,
  s_compare_rolls: CompareRolls,
  s_product: Product,
  s_previews: Previews,
  s_steps: Steps,
  s_inside: Inside,
  s_math: Math_,
  s_offer: Offer,
  s_guarantee: Guarantee,
  s_after: After,
  s_faq: Faq,
  s_final: Final,
};

export function isSectionType(t: string): t is SectionType {
  return t in VIEWS;
}

export function SectionView({ section, patch, ctx }: { section: Section; patch?: Patch; ctx: Ctx }) {
  const View = VIEWS[section.type] as (a: { p: unknown; patch?: Patch; ctx: Ctx }) => ReactNode;
  return <View p={section.props} patch={patch} ctx={ctx} />;
}
