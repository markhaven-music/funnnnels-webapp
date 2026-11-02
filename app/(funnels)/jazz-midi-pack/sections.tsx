// Renders the Jazz page's sections. Same components on the live page and in
// the editor: with `patch` every text is click-to-edit and lists get add /
// remove controls; without it they're plain server-rendered text.
import type { CSSProperties, ElementType, ReactNode } from "react";
import { EditableText } from "@/components/blocks/EditableText";
import { funnel } from "./funnel";
import { DEFAULT_SECTIONS, type ChartCell, type Section, type SectionProps, type SectionType } from "./content";
import { Cta } from "./Cta";
import { PlayableRoll } from "./PlayableRoll";
import { SoundPicker } from "./SoundPicker";
import { LoopList } from "./LoopList";
import { BonusPlayer } from "./BonusPlayer";
import { money } from "@/lib/launch";
import { ProductBox, Scene } from "./ProductBox";
import { CheckoutWidget } from "./CheckoutWidget";
import { Vsl } from "./Vsl";
import { PackBrowser } from "./PackBrowser";
import s from "./jazz.module.css";
import bn from "./bonus.module.css";
import vs from "./value.module.css";
import e from "./edit.module.css";

export type Ctx = {
  price: string; // "€27"
  amount: number;
  currency: "eur" | "usd";
  country: string;
  publishableKey: string | null;
  editing?: boolean;
  // An add-on given to Jazz in dashboard → Products (none since 2026-10-16).
  bump?: { name: string; price: number; pitch: string; cover: [string, string] } | null;
};

type Patch = (props: Record<string, unknown>) => void;

const n = funnel.counts;

export function fill(text: string, ctx: Ctx) {
  return text
    .replaceAll("{price}", ctx.price)
    .replaceAll("{files}", n.files.toLocaleString("en-US"))
    .replaceAll("{total}", n.total.toLocaleString("en-US"))
    .replaceAll("{days}", String(funnel.guaranteeDays));
}

/** Editable (with patch) or plain text with tokens filled in. `emph`: brass
 * highlights on the live page (see Emph). */
function T({
  v,
  set,
  ctx,
  as: Tag = "span",
  className,
  placeholder,
  emph,
}: {
  v: string;
  set?: (next: string) => void;
  ctx: Ctx;
  as?: ElementType;
  className?: string;
  placeholder?: string;
  emph?: boolean;
}) {
  if (set) return <EditableText as={Tag} value={v} onChange={set} className={`${className ?? ""} ${e.text}`} placeholder={placeholder} />;
  // An emptied text is gone from the page (no stray eyebrow rule or margins).
  if (!v.trim()) return null;
  return <Tag className={className}>{emph ? <Emph text={fill(v, ctx)} /> : fill(v, ctx)}</Tag>;
}

/** A title's highlight: *words* in brass, or with no markup, the last of two or
 * more sentences ("Five folders. Every one does a job."). */
function Emph({ text }: { text: string }) {
  if (/\*[^*]+\*/.test(text)) return <Marked text={text} />;
  const m = text.match(/^(.*[.!?:])\s+(\S[^]*)$/);
  if (!m) return <>{text}</>;
  return (
    <>
      {m[1]} <span className={s.hl2}>{m[2]}</span>
    </>
  );
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

// ─── removable parts ──────────────────────────────────────────
// Every element of a section has a key. The keys in the section's `hide` list
// (or a list item's) don't render, in the editor or on the live page. In the
// editor each part shows a × on hover, and "Removed:" under the section brings
// a part back.

type Parts = {
  edit: boolean;
  hidden: string[];
  on: (k: string) => boolean;
  /** Some of these parts still show. */
  any: (...k: string[]) => boolean;
  /** The ×'s click: removes part k. Undefined outside the editor. */
  x: (k: string) => (() => void) | undefined;
  back: (k: string) => void;
  /** An element that holds its own × (a list item, a box): its class plus edit.module.css .host. */
  host: (className?: string) => string | undefined;
};

function parts(p: { hide?: string[] }, patch?: Patch): Parts {
  const hidden = p.hide ?? [];
  const on = (k: string) => !hidden.includes(k);
  return {
    edit: !!patch,
    hidden,
    on,
    any: (...k) => k.some(on),
    x: (k) => patch && (() => patch({ hide: [...hidden, k] })),
    back: (k) => patch?.({ hide: hidden.filter((x) => x !== k) }),
    host: (className) => (patch ? `${className ?? ""} ${e.host}` : className),
  };
}

const ALL = parts({});

/** A part in its own box: in the editor a wrapper holds its ×. */
function Part({ k, h, children, left }: { k: string; h: Parts; children: ReactNode; left?: boolean }) {
  if (!h.on(k)) return null;
  const x = h.x(k);
  if (!x) return children;
  return (
    <div className={e.part}>
      {children}
      <Drop onClick={x} left={left} />
    </div>
  );
}

/** The × in the corner of a part, shown on hover. `left`: the left corner;
 * `inside`: within the box (a section's background picture). */
function Drop({ onClick, left, inside }: { onClick?: () => void; left?: boolean; inside?: boolean }) {
  if (!onClick) return null;
  const at = left ? e.dropLeft : inside ? e.dropIn : "";
  return (
    <button type="button" className={`${e.remove} ${e.drop} ${at}`} onClick={onClick} title="Remove" aria-label="Remove">
      ×
    </button>
  );
}

const PART_LABELS: Record<string, string> = {
  title: "headline",
  pre: "line above the headline",
  sub: "subheadline",
  cta: "button",
  worksIn: "“Works in”",
  daws: "DAW logos",
  producers: "2,847 producers",
  emailList: "4,700+ on the email list",
  guaranteeDays: "guarantee days",
  before: "before caption",
  beforeRoll: "before piano roll",
  after: "after caption",
  afterRoll: "after piano roll",
  box: "pack box",
  packName: "pack name",
  browser: "pack browser",
  shot: "DAW picture",
  n: "number",
  label: "bonus label",
  inside: "what’s inside",
  preview: "previews",
  total: "total value",
  payWays: "payment methods line",
  download: "download line",
  guarantee: "guarantee line",
  picture: "stage picture",
};

/** Editor only: what was removed, each a button that brings it back. `wrap`: a box around it. */
function Removed({ h, wrap }: { h: Parts; wrap?: string }) {
  if (!h.edit || !h.hidden.length) return null;
  const list = (
    <div className={e.removed}>
      <span>Removed:</span>
      {h.hidden.map((k) => (
        <button key={k} type="button" onClick={() => h.back(k)} title="Bring it back">
          ↺ {PART_LABELS[k] ?? k.replace("-", " ")}
        </button>
      ))}
    </div>
  );
  return wrap ? <div className={wrap}>{list}</div> : list;
}

// two: the left column of a two-column section on desktop (jazz.module.css .two).
// The eyebrow is kept in the data but no longer shown ("togli sti titoli sopra
// le headlines", 2026-11-02).
function Head({ title, sub, two, h, patch, ctx }: { eyebrow: string; title: string; sub?: string; two?: boolean; h: Parts; patch?: Patch; ctx: Ctx }) {
  return (
    <div className={two ? `${s.secHead} ${s.twoHead}` : s.secHead}>
      <Part k="title" h={h}>
        <T v={title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} emph />
      </Part>
      {sub !== undefined && (
        <Part k="sub" h={h}>
          <T v={sub} set={patch && ((v) => patch({ sub: v }))} ctx={ctx} as="p" className={s.sub} />
        </Part>
      )}
    </div>
  );
}

/** A two-column section keeps its columns while both sides show something. */
const twoIf = (both: boolean) => (both ? s.two : "");

function Tick() {
  return (
    <svg className={s.tick} viewBox="0 0 20 20" width="18" height="18" aria-hidden>
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Shield() {
  return (
    <svg className={s.shield} viewBox="0 0 24 24" aria-hidden>
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

const HERO_DEFAULT = DEFAULT_SECTIONS.find((x) => x.type === "s_hero")!.props as SectionProps["s_hero"];

/** "*a*" → highlighted, "_b_" → underlined (the hero headline). */
function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*|_[^_]+_)/).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <span key={i} className={s.hl2}>
            {part.slice(1, -1)}
          </span>
        ) : part.startsWith("_") && part.endsWith("_") && part.length > 2 ? (
          <u key={i}>{part.slice(1, -1)}</u>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Hero({ p: raw, patch, ctx }: { p: SectionProps["s_hero"]; patch?: Patch; ctx: Ctx }) {
  // Pages published before the centered hero have no `pre`: they get its default copy.
  const p = raw.pre === undefined ? { ...HERO_DEFAULT, tag: raw.tag, hud: raw.hud, daws: raw.daws, ticks: raw.ticks, hide: raw.hide } : raw;
  const set = (k: string) => patch && ((v: string) => patch({ ...p, [k]: v }));
  const bullets = listOps(p.bullets, "bullets", patch && ((x) => patch({ ...p, ...x })));
  const h = parts(p, patch && ((x) => patch({ ...p, ...x })));
  return (
    <section id="hero" className={s.hero}>
      <div className={s.heroBg} aria-hidden />
      <div className={s.topband}>
        <header className={`${s.wrap} ${s.topbar}`}>
          <Part k="logo" h={h}>
            <span className={s.logo}>
              <img src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={360} height={42} />
            </span>
          </Part>
          <Part k="tag" h={h}>
            <span className={s.tag}>
              <span className={s.dot} aria-hidden />
              <T v={p.tag} set={set("tag")} ctx={ctx} />
            </span>
          </Part>
        </header>
      </div>
      <div className={`${s.wrap} ${s.heroCenter}`}>
        <Part k="pre" h={h}>
          <T v={p.pre} set={set("pre")} ctx={ctx} as="p" className={s.heroPre} />
        </Part>
        <Part k="headline" h={h}>
          <h1 className={s.heroHead}>
            {patch ? <T v={p.headline} set={set("headline")} ctx={ctx} /> : <Marked text={fill(p.headline, ctx)} />}
          </h1>
          {patch && <p className={e.hint}>*word* = highlighted, _word_ = underlined</p>}
        </Part>
        <Part k="sub" h={h}>
          <T v={p.sub} set={set("sub")} ctx={ctx} as="p" className={s.heroSub} />
        </Part>
        <Part k="video" h={h}>
          <Vsl />
        </Part>
        <ul className={s.heroBullets}>
          {p.bullets.map((b, i) => (
            <li key={i}>
              <Tick />
              <T v={b} set={bullets.set && ((v) => bullets.set!(i, v))} ctx={ctx} />
              <Remove onClick={bullets.remove && (() => bullets.remove!(i))} />
            </li>
          ))}
        </ul>
        <Add onClick={bullets.add && (() => bullets.add!("New bullet"))} label="bullet" />
        {h.on("cta") && (
          <Cta className={h.host(s.heroCta)} inner={`${ctx.price} · instant download`}>
            <Drop onClick={h.x("cta")} />
          </Cta>
        )}
        <TickList items={p.ticks} k="ticks" patch={patch && ((x) => patch({ ...p, ...x }))} ctx={ctx} className={s.proofRow} />
      </div>
      {h.any("worksIn", "daws") && (
        <div className={`${s.wrap} ${s.dawStrip}`}>
          <Part k="worksIn" h={h}>
            <span className={s.mono}>Works in</span>
          </Part>
          {/* The DAW logos the Drum Kit shows; the typed list is their alt text. */}
          <Part k="daws" h={h}>
            <img className={s.dawLogos} src="/funnels/midi-drum-kit/daws.webp" alt={p.daws} width={1000} height={63} loading="lazy" />
            {patch && (
              <p className={e.hint}>
                The logos’ alt text, not shown on the page: <T v={p.daws} set={set("daws")} ctx={ctx} />
              </p>
            )}
          </Part>
        </div>
      )}
      <div className={s.wrap}>
        <Proof h={h} />
      </div>
    </section>
  );
}

const PARA_CLASS = { p: undefined, bold: undefined, pull: s.pull, hit: s.hit } as const;

function Letter({ p, patch, ctx }: { p: SectionProps["s_letter"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.paras, "paras", patch);
  const h = parts(p, patch);
  return (
    <section className={s.sec}>
      <div className={`${s.wrap} ${s.col}`}>
        <Part k="title" h={h}>
          <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} emph />
        </Part>
        <div className={s.letter}>
          {p.paras.map((para, i) => (
            <div key={i} className={e.row}>
              <T
                v={para.text}
                set={ops.set && ((v) => ops.set!(i, { ...para, text: v }))}
                ctx={ctx}
                as={para.style === "bold" ? "b" : "p"}
                className={PARA_CLASS[para.style]}
                emph={para.style === "pull"}
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
  const h = parts(p, patch);
  return (
    <section className={s.sec} style={{ paddingTop: 0 }}>
      <div className={`${s.wrap} ${s.ba}`} style={{ marginTop: 0 }}>
        {h.any("beforeRoll", "afterRoll") && <SoundPicker className={s.baSound} />}
        {h.any("before", "beforeRoll") && (
          <figure className={s.baItem}>
            <Part k="before" h={h}>
              <figcaption className={s.baCap}>
                <T v={p.beforeLabel} set={set("beforeLabel")} ctx={ctx} className={s.bad} />{" "}
                <T v={p.beforeText} set={set("beforeText")} ctx={ctx} />
              </figcaption>
            </Part>
            <Part k="beforeRoll" h={h}>
              <PlayableRoll id="before" tone="muted" playLabel="Play before" />
            </Part>
          </figure>
        )}
        {h.any("after", "afterRoll") && (
          <figure className={s.baItem}>
            <Part k="after" h={h}>
              <figcaption className={s.baCap}>
                <T v={p.afterLabel} set={set("afterLabel")} ctx={ctx} className={s.good} />{" "}
                <T v={p.afterText} set={set("afterText")} ctx={ctx} />
              </figcaption>
            </Part>
            <Part k="afterRoll" h={h}>
              <PlayableRoll id="after" playLabel="Play after" />
            </Part>
          </figure>
        )}
        <Part k="note" h={h}>
          <T v={p.note} set={set("note")} ctx={ctx} as="p" className={s.baNote} />
        </Part>
      </div>
    </section>
  );
}

function Product({ p, patch, ctx }: { p: SectionProps["s_product"]; patch?: Patch; ctx: Ctx }) {
  const set = (k: string) => patch && ((v: string) => patch({ [k]: v }));
  const h = parts(p, patch);
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={h.on("box") ? `${s.wrap} ${s.introGrid}` : s.wrap}>
        <Part k="box" h={h}>
          <ProductBox />
        </Part>
        <div>
          <Part k="title" h={h}>
            <h2 className={s.h2}>
              <T v={p.title} set={set("title")} ctx={ctx} /> <T v={p.titleEm} set={set("titleEm")} ctx={ctx} as="em" className={s.hl} />
            </h2>
          </Part>
          <Part k="lead" h={h}>
            <T v={p.lead} set={set("lead")} ctx={ctx} as="p" className={s.lead} />
          </Part>
          <TickList items={p.ticks} k="ticks" patch={patch} ctx={ctx} className={s.ticks} />
          {h.on("cta") && (
            <Cta className={h.host(s.ctaBlock)} inner={`${ctx.price} · instant download`}>
              <Drop onClick={h.x("cta")} />
            </Cta>
          )}
        </div>
      </div>
    </section>
  );
}

// The whole pack, browsable (PackBrowser). Since 2026-10-30 in place of five
// hand-picked previews ("either you allow the person to browse the whole pack
// or remove this"); old pages' `items` are ignored.
function Previews({ p, patch, ctx }: { p: SectionProps["s_previews"]; patch?: Patch; ctx: Ctx }) {
  const h = parts(p, patch);
  return (
    <section className={s.sec}>
      <div className={`${s.wrap} ${twoIf(h.any("title", "sub") && h.on("browser"))} ${s.twoWide}`}>
        <Head eyebrow={p.eyebrow} title={p.title} sub={p.sub} two h={h} patch={patch} ctx={ctx} />
        <div className={s.twoBody}>
          <Part k="browser" h={h}>
            <PackBrowser />
          </Part>
        </div>
      </div>
    </section>
  );
}

function Steps({ p, patch, ctx }: { p: SectionProps["s_steps"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.steps, "steps", patch);
  const h = parts(p, patch);
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} h={h} patch={patch} ctx={ctx} />
        <ol className={s.steps}>
          {p.steps.map((st, i) => {
            const ih = parts(st, ops.set && ((x) => ops.set!(i, { ...st, ...x })));
            return (
              <li key={i}>
                {ih.on("n") && (
                  <span className={ih.host(s.stepN)}>
                    {String(i + 1).padStart(2, "0")}
                    <Drop onClick={ih.x("n")} />
                  </span>
                )}
                <Part k="title" h={ih}>
                  <T v={st.title} set={ops.set && ((v) => ops.set!(i, { ...st, title: v }))} ctx={ctx} as="h3" />
                </Part>
                <Part k="text" h={ih}>
                  <T v={st.text} set={ops.set && ((v) => ops.set!(i, { ...st, text: v }))} ctx={ctx} as="p" />
                </Part>
                <Remove onClick={ops.remove && (() => ops.remove!(i))} />
                <Removed h={ih} />
              </li>
            );
          })}
        </ol>
        <Add onClick={ops.add && (() => ops.add!({ title: "New step", text: "What happens." }))} label="step" />
        <Part k="shot" h={h}>
          <figure className={s.dawShot}>
            <Scene name="daw" alt="A laptop with the DAW piano roll showing gold jazz voicings under Dm9, G13 and Cmaj9, next to the Jazz MIDI Pack box" />
          </figure>
        </Part>
      </div>
    </section>
  );
}

const VOICINGS = ["Best Voicing", "Best Voicing + Smooth Bass", "Rootless (Bill Evans)", "Spread (two-hand)", "Drop 2", "Voice-Led Close", "Quartal (So What)", "Shell (Bud Powell)", "Drop 3", "Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"];
const RHYTHMS = [["Ballad Arpeggios", "70"], ["Pads", "90"], ["Bossa Nova", "135"], ["Swing Comping", "150"], ["Charleston", "130"], ["Anticipations", "130"], ["Reverse Charleston", "130"], ["Freddie Green 4 to the Bar", "140"]];

function Inside({ p, patch, ctx }: { p: SectionProps["s_inside"]; patch?: Patch; ctx: Ctx }) {
  const h = parts(p, patch);
  const folders = funnel.folders.map((f, i) => ({ ...f, k: `folder-${i + 1}`, i })).filter((f) => h.on(f.k));
  return (
    <section className={s.sec}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} h={h} patch={patch} ctx={ctx} />
        {patch && <p className={e.hint}>The folders, voicings and progressions below come from the pack itself.</p>}
        {folders.length > 0 && (
          <div className={s.bento}>
            {folders.map((f) => (
              <div key={f.name} className={h.host(`${s.cell} ${f.i === 0 ? s.cellBig : ""}`)}>
                <span className={s.cellN}>{String(f.i + 1).padStart(2, "0")}</span>
                <span className={s.cellCount}>{f.files.toLocaleString("en-US")}</span>
                <h3>{f.name}</h3>
                <p>{f.what}</p>
                <Drop onClick={h.x(f.k)} />
              </div>
            ))}
          </div>
        )}
        {h.any("voicings", "rhythms", "progressions") && (
          <div className={s.lists}>
            {h.on("voicings") && (
              <div className={h.host(s.listBox)}>
                <h3>13 voicings</h3>
                <ol className={s.numList}>{VOICINGS.map((v) => <li key={v}>{v}</li>)}</ol>
                <Drop onClick={h.x("voicings")} />
              </div>
            )}
            {h.on("rhythms") && (
              <div className={h.host(s.listBox)}>
                <h3>8 rhythms</h3>
                <ul className={s.rhythms}>
                  {RHYTHMS.map(([r, bpm]) => (
                    <li key={r}>
                      <span>{r}</span>
                      <span className={s.mono}>{bpm} bpm</span>
                    </li>
                  ))}
                </ul>
                <Drop onClick={h.x("rhythms")} />
              </div>
            )}
            {h.on("progressions") && (
              <div className={h.host(`${s.listBox} ${s.listWide}`)}>
                <h3>The progressions everyone wants</h3>
                <ul className={s.progGrid}>{funnel.progressions.map((x) => <li key={x}>{x}</li>)}</ul>
                <Drop onClick={h.x("progressions")} />
              </div>
            )}
          </div>
        )}
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

// The chart. Desktop: a table whose last column (the pack) is a raised brass
// card behind its cells (chWinBg). Phone: each row's label on
// its own line, the alternatives as ✓/✗ only (their text stays for screen
// readers), the pack's answer in full.
function Math_({ p: raw, patch, ctx }: { p: SectionProps["s_math"]; patch?: Patch; ctx: Ctx }) {
  // Pages published before the chart hold cards, not rows: they show the default chart.
  const p = { ...raw, cols: raw.cols ?? MATH_DEFAULT.cols, rows: raw.rows ?? MATH_DEFAULT.rows, note: raw.note ?? MATH_DEFAULT.note };
  const last = p.cols.length - 1;
  const rows = listOps(p.rows, "rows", patch);
  const setCell = (r: number, c: number, cell: ChartCell) =>
    rows.set!(r, { ...p.rows[r], cells: p.rows[r].cells.map((x, j) => (j === c ? cell : x)) });
  const next = (ok: boolean | null) => (ok === true ? false : ok === false ? null : true);
  const win = (i: number) => (i === last ? s.chWin : "");
  const vars = { "--alts": last } as CSSProperties;
  const h = parts(p, patch);
  // A column goes with its cell in every row.
  const dropCol = (i: number) =>
    patch && p.cols.length > 1
      ? () => patch({ cols: p.cols.filter((_, j) => j !== i), rows: p.rows.map((r) => ({ ...r, cells: r.cells.filter((_, j) => j !== i) })) })
      : undefined;
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} h={h} patch={patch} ctx={ctx} />
        <Part k="chart" h={h} left>
          <div className={s.chart} role="table" aria-label={fill(p.title, ctx)} style={vars}>
            <span className={s.chWinBg} aria-hidden />
            <div className={s.chRow} role="row">
              <span className={s.chCorner} role="columnheader" />
              {p.cols.map((c, i) => (
                <span key={i} role="columnheader" className={h.host(`${s.chHead} ${win(i)}`)}>
                  {i === last && <img className={s.chBox} src={`${DIR}/box-160.webp`} width={160} height={228} alt="" loading="lazy" decoding="async" />}
                  <T v={c} set={patch && ((v) => patch({ cols: p.cols.map((x, j) => (j === i ? v : x)) }))} ctx={ctx} />
                  <Drop onClick={dropCol(i)} />
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
                    <span key={c} role="cell" className={`${s.chCell} ${win(c)}`}>
                      <Mark ok={cell.ok} onClick={patch && (() => setCell(r, c, { ...cell, ok: next(cell.ok) }))} />
                      <T
                        v={cell.text}
                        set={patch && ((v) => setCell(r, c, { ...cell, text: v }))}
                        ctx={ctx}
                        className={c === last ? undefined : s.chAlt}
                        placeholder="Text"
                      />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </Part>
        <Add
          onClick={rows.add && (() => rows.add!({ label: "New row", cells: p.cols.map(() => ({ ok: true, text: "" })) }))}
          label="row"
        />
        <Part k="note" h={h}>
          <T v={p.note} set={patch && ((v) => patch({ note: v }))} ctx={ctx} as="p" className={s.chNote} emph />
        </Part>
        {h.on("cta") && (
          <Cta className={h.host(s.ctaBlock)} inner={`${ctx.price} · instant download`}>
            <Drop onClick={h.x("cta")} />
          </Cta>
        )}
      </div>
    </section>
  );
}

const DIR = "/funnels/jazz-midi-pack";

const VALUE_TOTAL = funnel.value.pack + funnel.bonuses.reduce((sum, x) => sum + x.value, 0);

/** "€47" in the visitor's currency: the value stack's numbers. */
const worth = (n: number, ctx: Ctx) => money(n, ctx.currency);

/** Social proof from real numbers (BRIEF.md "Brand proof"): no Jazz reviews
 * exist yet, and invented ones never go on the page. Under the hero and next
 * to the checkout. */
export function Proof({ h = ALL }: { h?: Parts }) {
  const items: [string, ReactNode][] = [
    ["producers", <><b>2,847</b> producers have the GRIND STUDIO MIDI Drum Kit in their sessions</>],
    ["emailList", <><b>4,700+</b> producers on the GRIND STUDIO email list</>],
    ["guaranteeDays", <><b>{funnel.guaranteeDays} days</b> satisfaction guarantee on every file</>],
  ];
  const shown = items.filter(([k]) => h.on(k));
  if (!shown.length) return null;
  // --n: as many columns as numbers left (jazz.module.css .hero .proof)
  return (
    <ul className={s.proof} style={{ "--n": shown.length } as CSSProperties}>
      {shown.map(([k, body]) => (
        <li key={k} className={h.host()}>
          {body}
          <Drop onClick={h.x(k)} />
        </li>
      ))}
    </ul>
  );
}

// Each bonus: its cover, what it holds (counted from the files) and previews
// you can play: 5-6 real files on the synth, or for the drum loops four clips.
function Bonuses({ p, patch, ctx }: { p: SectionProps["s_bonuses"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.items, "items", patch);
  const h = parts(p, patch);
  return (
    <section className={s.sec}>
      <div className={`${s.wrap} ${twoIf(h.any("title", "sub"))} ${s.twoWide}`}>
        <Head eyebrow={p.eyebrow} title={p.title} sub={p.sub} two h={h} patch={patch} ctx={ctx} />
        <div className={s.twoBody}>
        <ol className={bn.bonuses}>
          {p.items.map((it, i) => {
            const known = funnel.bonuses[i];
            const ih = parts(it, ops.set && ((x) => ops.set!(i, { ...it, ...x })));
            return (
              <li key={i} className={ih.on("cover") ? bn.bonus : `${bn.bonus} ${bn.bare}`}>
                {ih.on("cover") && (
                  <div className={ih.host(bn.cover)}>
                    {i < 5 && (
                      <img
                        src={`${DIR}/bonus-${i + 1}-360.webp`}
                        srcSet={`${DIR}/bonus-${i + 1}-360.webp 360w, ${DIR}/bonus-${i + 1}-640.webp 640w`}
                        sizes="(min-width: 1000px) 200px, 96px"
                        width={640}
                        height={960}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <Drop onClick={ih.x("cover")} />
                  </div>
                )}
                <div className={bn.info}>
                  {ih.on("label") && (
                    <p className={ih.host(bn.label)}>
                      <span>Bonus {i + 1}</span>
                      {known && (
                        <span className={bn.price}>
                          <s>{worth(known.value, ctx)}</s> Free
                        </span>
                      )}
                      <Drop onClick={ih.x("label")} />
                    </p>
                  )}
                  <Part k="name" h={ih}>
                    <T v={it.name} set={ops.set && ((v) => ops.set!(i, { ...it, name: v }))} ctx={ctx} as="h3" />
                  </Part>
                  <Part k="text" h={ih}>
                    <T v={it.text} set={ops.set && ((v) => ops.set!(i, { ...it, text: v }))} ctx={ctx} as="p" className={bn.text} />
                  </Part>
                  {known && ih.on("inside") && (
                    <ul className={ih.host(bn.inside)}>
                      {known.inside.map((x) => (
                        <li key={x}>
                          <Tick /> {x}
                        </li>
                      ))}
                      <Drop onClick={ih.x("inside")} />
                    </ul>
                  )}
                </div>
                {ih.on("preview") && (
                  <div className={ih.host(bn.preview)}>
                    {i < 4 ? <BonusPlayer bonus={i} /> : i === 4 ? <LoopList /> : null}
                    <Drop onClick={ih.x("preview")} />
                  </div>
                )}
                <Remove onClick={ops.remove && (() => ops.remove!(i))} />
                <Removed h={ih} />
              </li>
            );
          })}
        </ol>
        <Add onClick={ops.add && (() => ops.add!({ name: "New bonus", text: "What it is." }))} label="bonus" />
        </div>
      </div>
    </section>
  );
}

/** The bundle, item by item with what each is worth, the total crossed out and
 * today's price: the offer summary, like the MIDI Drum Kit page's value stack. */
export function ValueStack({ p, patch, ctx, h = ALL }: { p: SectionProps["s_offer"]; patch?: Patch; ctx: Ctx; h?: Parts }) {
  const bonuses = funnel.bonuses.map((x, i) => ({ ...x, i, k: `bonus-${i + 1}` })).filter((x) => h.on(x.k));
  // The total adds up what's listed: a removed bonus row leaves it.
  const total = funnel.value.pack + bonuses.reduce((sum, x) => sum + x.value, 0);
  return (
    <div className={vs.stack}>
      <div className={vs.main}>
        {h.on("box") && (
          <div className={h.host(vs.mainBox)}>
            <span className={vs.ribbon}>{worth(funnel.value.pack, ctx)} value</span>
            <img src={`${DIR}/box-520.webp`} width={520} height={741} alt="The Jazz MIDI Pack box" loading="lazy" decoding="async" />
            <Drop onClick={h.x("box")} />
          </div>
        )}
        <div>
          <Part k="packName" h={h}>
            <p className={vs.kicker}>The pack</p>
            <p className={vs.mainName}>{funnel.product}</p>
          </Part>
          <TickList items={p.stack} k="stack" patch={patch} ctx={ctx} className={s.stack} />
        </div>
      </div>
      {bonuses.length > 0 && (
        <ol className={vs.list}>
          {bonuses.map((x) => (
            <li key={x.id} className={h.host()}>
              <img src={`${DIR}/bonus-${x.i + 1}-360.webp`} width={360} height={540} alt="" loading="lazy" decoding="async" />
              <span className={vs.itemText}>
                <span className={vs.kicker}>Bonus #{x.i + 1}</span>
                <span className={vs.itemName}>{x.name}</span>
                <span className={vs.itemCount}>{x.count}</span>
              </span>
              <span className={vs.itemValue}>{worth(x.value, ctx)} value</span>
              <Drop onClick={h.x(x.k)} />
            </li>
          ))}
        </ol>
      )}
      {h.on("total") && (
        <div className={h.host(vs.total)}>
          <span className={vs.bracket} aria-hidden />
          <p className={vs.totalLine}>
            Total value: <span>{worth(total, ctx)}</span>
          </p>
          <p className={vs.today}>
            <span className={vs.todayLabel}>Today</span>
            <s className={vs.old}>{worth(total, ctx)}</s>
            <span className={vs.now}>{ctx.price}</span>
          </p>
          <p className={vs.save}>You save {worth(total - ctx.amount, ctx)}</p>
          <Drop onClick={h.x("total")} />
        </div>
      )}
    </div>
  );
}

/** What the order includes: the box, the stack, the bonuses with their value, the total, the guarantee. On the order page. */
export function OrderSummary({ p, patch, ctx }: { p: SectionProps["s_offer"]; patch?: Patch; ctx: Ctx }) {
  return (
    <div className={s.orderSummary}>
      <ProductBox />
      <TickList items={p.stack} k="stack" patch={patch} ctx={ctx} className={s.stack} />
      <div className={s.bonusMini}>
        <p className={s.bonusMiniHead}>Plus {funnel.bonuses.length} free bonuses</p>
        <ul>
          {funnel.bonuses.map((x, i) => (
            <li key={x.id}>
              <img src={`${DIR}/bonus-${i + 1}-360.webp`} width={36} height={54} alt="" loading="lazy" />
              <span>{x.name}</span>
              <span className={s.bonusMiniValue}>
                <s>{worth(x.value, ctx)}</s> Free
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className={s.totalMini}>
        <span>
          Total value <s>{worth(VALUE_TOTAL, ctx)}</s>
        </span>
        <span>
          Today <b>{ctx.price}</b>
        </span>
      </p>
      <p className={s.guaranteeMini}>
        <Shield /> <T v={p.guarantee} set={patch && ((v) => patch({ guarantee: v }))} ctx={ctx} />
      </p>
    </div>
  );
}

/** The checkout itself, on the order page. */
export function Checkout({ ctx }: { ctx: Ctx }) {
  return (
    <CheckoutWidget
      funnel={funnel.slug}
      product={funnel.product}
      tagline={`${funnel.tagline} + ${funnel.bonuses.length} bonuses`}
      image="/funnels/jazz-midi-pack/box-520.webp"
      accent="#f5b800"
      currency={ctx.currency}
      country={ctx.country}
      price={ctx.amount}
      bump={ctx.bump ?? null}
      thankYou={funnel.checkout.thankYou}
      publishableKey={ctx.publishableKey}
      europe={ctx.currency === "eur"}
      deferStripe
      secureRow={false}
    />
  );
}

// The landing's offer: the value stack and one button to the order page (the
// checkout has its own page since 2026-10-16).
function Offer({ p, patch, ctx }: { p: SectionProps["s_offer"]; patch?: Patch; ctx: Ctx }) {
  const h = parts(p, patch);
  return (
    <section id="buy" className={`${s.sec} ${s.order}`}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} h={h} patch={patch} ctx={ctx} />
        <ValueStack p={p} patch={patch} ctx={ctx} h={h} />
        {h.on("cta") && (
          <Cta className={h.host(s.ctaBlock)} inner="Card or PayPal · secure checkout">
            <Drop onClick={h.x("cta")} />
          </Cta>
        )}
        {h.any("payWays", "download", "guarantee") && (
          <ul className={s.payList}>
            {h.on("payWays") && (
              <li className={h.host()}>
                <Tick /> Card, Apple Pay, Google Pay or PayPal
                <Drop onClick={h.x("payWays")} />
              </li>
            )}
            {h.on("download") && (
              <li className={h.host()}>
                <Tick /> Download buttons right after you pay
                <Drop onClick={h.x("download")} />
              </li>
            )}
            {h.on("guarantee") && (
              <li className={h.host()}>
                <Shield /> <T v={p.guarantee} set={patch && ((x) => patch({ guarantee: x }))} ctx={ctx} />
                <Drop onClick={h.x("guarantee")} />
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}

/** The guarantee seal: "{days} days" in a brass ring, the words around it. */
export function Seal() {
  const ring = "SATISFACTION GUARANTEE · SATISFACTION GUARANTEE · ";
  return (
    <svg className={s.seal} viewBox="0 0 200 200" role="img" aria-label={`${funnel.guaranteeDays}-day satisfaction guarantee`}>
      <defs>
        {/* the page's tokens (jazz.module.css .page / .jazz), via style: a
            presentation attribute can't hold var() */}
        <linearGradient id="jz-seal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brass-hi)" }} />
          <stop offset=".5" style={{ stopColor: "var(--brass)" }} />
          <stop offset="1" style={{ stopColor: "var(--brass-deep)" }} />
        </linearGradient>
        <path id="jz-seal-arc" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
      </defs>
      <circle cx="100" cy="100" r="98" fill="url(#jz-seal)" />
      <circle cx="100" cy="100" r="88" style={{ fill: "var(--ink)" }} />
      <circle cx="100" cy="100" r="60" fill="none" stroke="url(#jz-seal)" strokeWidth="1.5" />
      <text className={s.sealRing} style={{ fill: "var(--brass-hi)" }}>
        <textPath href="#jz-seal-arc" textLength="462">
          {ring}
        </textPath>
      </text>
      <text x="100" y="108" textAnchor="middle" className={s.sealDays} style={{ fill: "var(--brass-hi)" }}>
        {funnel.guaranteeDays}
      </text>
      <text x="100" y="134" textAnchor="middle" className={s.sealUnit} style={{ fill: "var(--cream)" }}>
        DAYS
      </text>
    </svg>
  );
}

function Guarantee({ p, patch, ctx }: { p: SectionProps["s_guarantee"]; patch?: Patch; ctx: Ctx }) {
  const h = parts(p, patch);
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={`${s.wrap} ${s.guarantee} ${twoIf(h.on("seal") && h.any("title", "text"))}`}>
        {h.on("seal") && (
          <div className={`${s.sealWrap} ${s.twoBody}`}>
            <Part k="seal" h={h}>
              <Seal />
            </Part>
          </div>
        )}
        <div className={s.twoHead}>
          <Part k="title" h={h}>
            <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
          </Part>
          <Part k="text" h={h}>
            <T v={p.text} set={patch && ((v) => patch({ text: v }))} ctx={ctx} as="p" className={s.sub} />
          </Part>
        </div>
      </div>
    </section>
  );
}

function After({ p, patch, ctx }: { p: SectionProps["s_after"]; patch?: Patch; ctx: Ctx }) {
  const ops = listOps(p.items, "items", patch);
  const h = parts(p, patch);
  return (
    <section className={s.sec}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} h={h} patch={patch} ctx={ctx} />
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
  const h = parts(p, patch);
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={`${s.wrap} ${s.col}`}>
        <Part k="title" h={h}>
          <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
        </Part>
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
                  <a href={funnel.checkout.orderPage} data-cta className={s.micro}>
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
  const h = parts(p, patch);
  // The stage picture is a background (no hover reaches it): its × sits in
  // the section's corner.
  return (
    <section className={h.host(h.on("picture") ? `${s.sec} ${s.final}` : `${s.sec} ${s.final} ${s.finalBare}`)}>
      {h.on("picture") && (
        <div className={s.finalBg} aria-hidden>
          <Scene name="stage" alt="" />
        </div>
      )}
      {h.on("picture") && <Drop onClick={h.x("picture")} inside />}
      <div className={`${s.wrap} ${s.finalIn}`}>
        <Part k="title" h={h}>
          <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} emph />
        </Part>
        {h.on("cta") && (
          <Cta className={h.host(s.ctaBlock)} inner={`${ctx.price} · instant download`} note={h.on("note") ? fill(p.note, ctx) : undefined}>
            <Drop onClick={h.x("cta")} />
          </Cta>
        )}
        {patch && (
          <Part k="note" h={h}>
            <T v={p.note} set={(v) => patch({ note: v })} ctx={ctx} as="p" className={e.hint} />
          </Part>
        )}
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
  s_bonuses: Bonuses,
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
  return (
    <>
      <View p={section.props} patch={patch} ctx={ctx} />
      <Removed h={parts(section.props, patch)} wrap={s.wrap} />
    </>
  );
}
