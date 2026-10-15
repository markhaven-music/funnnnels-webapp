// Renders the template's sections. Same components on the live page and in
// the editor: with `patch` every text is click-to-edit and lists get add /
// remove controls; without it they're plain server-rendered text with the
// tokens filled in (prices and dates through the LaunchClock, so they follow
// the launch phase live).
import { Fragment, type ElementType, type ReactNode } from "react";
import { EditableText } from "@/components/blocks/EditableText";
import type { Bump } from "@/lib/funnels";
import type { Launch, Money } from "@/lib/launch";
import type { KitSection, KitSectionProps, KitSectionType } from "./content";
import { Countdown, Price, When } from "./LaunchClock";
import { KitBox } from "./KitBox";
import { KitCheckout } from "./KitCheckout";
import { WaitlistForm } from "./WaitlistForm";
import { Arrow } from "../jazz-midi-pack/Cta";
import s from "../jazz-midi-pack/jazz.module.css";
import b from "../jazz-midi-pack/btn.module.css";
import e from "../jazz-midi-pack/edit.module.css";
import k from "./kit.module.css";

export type KitProductView = {
  slug: string;
  name: string;
  tagline: string;
  price: Money;
  bump: Bump | null;
  launch: Launch | null;
};

export type KitCtx = {
  product: KitProductView;
  country: string; // reported by the checkout when the browser has no visitor_country cookie
  publishableKey: string | null;
  guaranteeDays: number;
  editing?: boolean;
};

type Patch = (props: Record<string, unknown>) => void;

const TOKEN = /\{(name|tagline|price|earlyprice|fullprice|cartopen|deadline|days)\}/g;

/** Text with its tokens filled in; prices and dates stay live. */
export function tokens(text: string, ctx: KitCtx): ReactNode {
  const parts = text.split(TOKEN);
  if (parts.length === 1) return text;
  return parts.map((p, i) => {
    if (i % 2 === 0) return p;
    const node: ReactNode =
      p === "name" ? ctx.product.name
      : p === "tagline" ? ctx.product.tagline
      : p === "days" ? String(ctx.guaranteeDays)
      : p === "price" ? <Price />
      : p === "earlyprice" ? <Price kind="early" />
      : p === "fullprice" ? <Price kind="full" />
      : p === "cartopen" ? <When at="cartOpen" />
      : <When at="deadline" />;
    return <Fragment key={i}>{node}</Fragment>;
  });
}

function T({ v, set, ctx, as: Tag = "span", className, placeholder }: {
  v: string;
  set?: (next: string) => void;
  ctx: KitCtx;
  as?: ElementType;
  className?: string;
  placeholder?: string;
}) {
  if (set) return <EditableText as={Tag} value={v} onChange={set} className={`${className ?? ""} ${e.text}`} placeholder={placeholder} />;
  return <Tag className={className}>{tokens(v, ctx)}</Tag>;
}

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

function Tick() {
  return (
    <svg className={s.tick} viewBox="0 0 20 20" width="18" height="18" aria-hidden>
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TickList({ items, k: key, patch, ctx, className }: { items: string[]; k: string; patch?: Patch; ctx: KitCtx; className: string }) {
  const ops = listOps(items, key, patch);
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

function Head({ eyebrow, title, patch, ctx }: { eyebrow: string; title: string; patch?: Patch; ctx: KitCtx }) {
  return (
    <div className={s.secHead}>
      <T v={eyebrow} set={patch && ((v) => patch({ eyebrow: v }))} ctx={ctx} as="p" className={s.eyebrow} />
      <T v={title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
    </div>
  );
}

/** The one call to action: scrolls to the checkout, shows the price in force. */
function Cta({ className, note }: { className?: string; note?: ReactNode }) {
  return (
    <div className={className}>
      <a href="#buy" className={b.btn} data-cta>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span>Get the pack</span>
          <Arrow className={b.arrow} />
        </span>
        <span className={b.inner}>
          <Price /> · instant download
        </span>
      </a>
      {note && <p className={b.note}>{note}</p>}
    </div>
  );
}

function Shield({ big }: { big?: boolean }) {
  return (
    <svg className={big ? s.shieldBig : s.shield} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="currentColor" opacity=".18" />
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo() {
  return (
    <span className={s.logo}>
      GRIND <span className={s.dia}>◆</span> STUDIO
    </span>
  );
}

// ─── the sections ─────────────────────────────────────────────

function Waitlist({ p, patch, ctx }: { p: KitSectionProps["k_waitlist"]; patch?: Patch; ctx: KitCtx }) {
  const set = (key: string) => patch && ((v: string) => patch({ [key]: v }));
  const ops = listOps(p.bullets, "bullets", patch);
  return (
    <section className={`${s.hero} ${k.waitlist}`}>
      <div className={s.heroBg} aria-hidden />
      <header className={`${s.wrap} ${s.topbar}`}>
        <Logo />
        <span className={s.tag}>
          <span className={s.dot} aria-hidden />
          <T v={p.eyebrow} set={set("eyebrow")} ctx={ctx} />
        </span>
      </header>
      <div className={`${s.wrap} ${s.heroGrid} ${k.waitlistBody}`}>
        <div className={s.heroCopy}>
          <h1 className={s.display}>
            <T v={p.headline} set={set("headline")} ctx={ctx} /> <T v={p.headlineEm} set={set("headlineEm")} ctx={ctx} as="em" />
          </h1>
          <T v={p.lead} set={set("lead")} ctx={ctx} as="p" className={s.lead} />
          {ctx.product.launch && <Countdown to="cartOpen" className={k.bigCountdown} />}
          <ul className={k.bullets}>
            {p.bullets.map((t, i) => (
              <li key={i}>
                <Tick />
                <T v={t} set={ops.set && ((v) => ops.set!(i, v))} ctx={ctx} />
                <Remove onClick={ops.remove && (() => ops.remove!(i))} />
              </li>
            ))}
          </ul>
          <Add onClick={ops.add && (() => ops.add!("New line"))} label="line" />
          {patch ? (
            <div className={e.locked}>
              <b>Waitlist form</b>
              <span>
                Button: <T v={p.button} set={set("button")} ctx={ctx} />
              </span>
              <span>
                After signing up: <T v={p.done} set={set("done")} ctx={ctx} />
              </span>
              <span>
                Small print: <T v={p.note} set={set("note")} ctx={ctx} />
              </span>
            </div>
          ) : (
            <WaitlistForm funnel={ctx.product.slug} button={p.button} done={p.done} note={p.note} />
          )}
        </div>
        <div className={s.heroVis}>
          <KitBox name={ctx.product.name} tagline={ctx.product.tagline} />
        </div>
      </div>
    </section>
  );
}

function Hero({ p, patch, ctx }: { p: KitSectionProps["k_hero"]; patch?: Patch; ctx: KitCtx }) {
  const set = (key: string) => patch && ((v: string) => patch({ [key]: v }));
  return (
    <section id="hero" className={s.hero}>
      <div className={s.heroBg} aria-hidden />
      <header className={`${s.wrap} ${s.topbar}`}>
        <Logo />
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
          <Cta className={s.heroCta} />
          <TickList items={p.ticks} k="ticks" patch={patch} ctx={ctx} className={s.proofRow} />
        </div>
        <div className={s.heroVis}>
          <KitBox name={ctx.product.name} tagline={ctx.product.tagline} />
        </div>
      </div>
    </section>
  );
}

const PARA_CLASS = { p: undefined, bold: undefined, pull: s.pull, hit: s.hit } as const;

function Letter({ p, patch, ctx }: { p: KitSectionProps["k_letter"]; patch?: Patch; ctx: KitCtx }) {
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

function Product({ p, patch, ctx }: { p: KitSectionProps["k_product"]; patch?: Patch; ctx: KitCtx }) {
  const set = (key: string) => patch && ((v: string) => patch({ [key]: v }));
  return (
    <section className={`${s.sec} ${s.band}`}>
      <div className={`${s.wrap} ${s.introGrid}`}>
        <KitBox name={ctx.product.name} tagline={ctx.product.tagline} size="md" />
        <div>
          <T v={p.eyebrow} set={set("eyebrow")} ctx={ctx} as="p" className={s.eyebrow} />
          <T v={p.title} set={set("title")} ctx={ctx} as="h2" className={s.h2} />
          <T v={p.lead} set={set("lead")} ctx={ctx} as="p" className={s.lead} />
          <TickList items={p.ticks} k="ticks" patch={patch} ctx={ctx} className={s.ticks} />
          <Cta className={s.ctaBlock} />
        </div>
      </div>
    </section>
  );
}

function Inside({ p, patch, ctx }: { p: KitSectionProps["k_inside"]; patch?: Patch; ctx: KitCtx }) {
  const ops = listOps(p.items, "items", patch);
  return (
    <section className={s.sec}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} patch={patch} ctx={ctx} />
        <div className={s.bento}>
          {p.items.map((it, i) => (
            <div key={i} className={`${s.cell} ${i === 0 ? s.cellBig : ""}`}>
              <span className={s.cellN}>{String(i + 1).padStart(2, "0")}</span>
              <T v={it.count} set={ops.set && ((v) => ops.set!(i, { ...it, count: v }))} ctx={ctx} className={s.cellCount} />
              <T v={it.name} set={ops.set && ((v) => ops.set!(i, { ...it, name: v }))} ctx={ctx} as="h3" />
              <T v={it.what} set={ops.set && ((v) => ops.set!(i, { ...it, what: v }))} ctx={ctx} as="p" />
              <Remove onClick={ops.remove && (() => ops.remove!(i))} />
            </div>
          ))}
        </div>
        <Add onClick={ops.add && (() => ops.add!({ count: "0", name: "Folder", what: "What it's for." }))} label="folder" />
      </div>
    </section>
  );
}

function Steps({ p, patch, ctx }: { p: KitSectionProps["k_steps"]; patch?: Patch; ctx: KitCtx }) {
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
      </div>
    </section>
  );
}

function Offer({ p, patch, ctx }: { p: KitSectionProps["k_offer"]; patch?: Patch; ctx: KitCtx }) {
  const { product } = ctx;
  return (
    <section id="buy" className={`${s.sec} ${s.order}`}>
      <div className={s.wrap}>
        <Head eyebrow={p.eyebrow} title={p.title} patch={patch} ctx={ctx} />
        <div className={s.orderGrid}>
          <div className={s.orderSummary}>
            <KitBox name={product.name} tagline={product.tagline} size="md" />
            <TickList items={p.stack} k="stack" patch={patch} ctx={ctx} className={s.stack} />
            <p className={s.guaranteeMini}>
              <Shield /> <T v={p.guarantee} set={patch && ((v) => patch({ guarantee: v }))} ctx={ctx} />
            </p>
          </div>
          <div className={s.orderForm}>
            {ctx.editing ? (
              <div className={e.locked}>
                <b>Checkout</b>
                <span>Locked in the editor so a payment can never break. Prices, dates and the add-on are in Launches.</span>
              </div>
            ) : (
              <KitCheckout
                slug={product.slug}
                name={product.name}
                tagline={product.tagline}
                bump={product.bump}
                country={ctx.country}
                publishableKey={ctx.publishableKey}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Guarantee({ p, patch, ctx }: { p: KitSectionProps["k_guarantee"]; patch?: Patch; ctx: KitCtx }) {
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

function Faq({ p, patch, ctx }: { p: KitSectionProps["k_faq"]; patch?: Patch; ctx: KitCtx }) {
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
                <summary>{tokens(it.q, ctx)}</summary>
                <p>
                  {tokens(it.a, ctx)}{" "}
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

function Final({ p, patch, ctx }: { p: KitSectionProps["k_final"]; patch?: Patch; ctx: KitCtx }) {
  return (
    <section className={`${s.sec} ${s.final}`}>
      <div className={`${s.wrap} ${s.col} ${s.finalIn}`}>
        <T v={p.title} set={patch && ((v) => patch({ title: v }))} ctx={ctx} as="h2" className={s.h2} />
        <Cta className={s.ctaBlock} note={patch ? undefined : tokens(p.note, ctx)} />
        {patch && <T v={p.note} set={(v) => patch({ note: v })} ctx={ctx} as="p" className={e.hint} />}
      </div>
    </section>
  );
}

const VIEWS: { [K in KitSectionType]: (a: { p: KitSectionProps[K]; patch?: Patch; ctx: KitCtx }) => ReactNode } = {
  k_waitlist: Waitlist,
  k_hero: Hero,
  k_letter: Letter,
  k_product: Product,
  k_inside: Inside,
  k_steps: Steps,
  k_offer: Offer,
  k_guarantee: Guarantee,
  k_faq: Faq,
  k_final: Final,
};

export function KitSectionView({ section, patch, ctx }: { section: KitSection; patch?: Patch; ctx: KitCtx }) {
  const View = VIEWS[section.type] as (a: { p: unknown; patch?: Patch; ctx: KitCtx }) => ReactNode;
  return <View p={section.props} patch={patch} ctx={ctx} />;
}
