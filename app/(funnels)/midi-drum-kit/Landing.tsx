import { Fragment } from "react";
import type { Currency } from "@/lib/geo";
import { Rich } from "../top-hits-midi-bundle/Rich";
import { Wistia } from "../top-hits-midi-bundle/Wistia";
import { copyFor } from "./copy";
import { funnel } from "./funnel";
import { fontVars } from "./fonts";
import { paths, type Lang } from "./i18n";
import { Tracking } from "./Tracking";
import s from "./landing.module.css";

// The MIDI Drum Kit sales page, the ClickFunnels one section by section
// (thegrind.studio/midi-drum-kit-47ad56), in any language of ./i18n.ts.
// Words in ./copy, images in /public/funnels/midi-drum-kit.

const IMG = "/funnels/midi-drum-kit";
const img = (name: string) => `${IMG}/${name}.webp`;

export function Landing({ lang, currency }: { lang: Lang; currency: Currency }) {
  const t = copyFor(lang);
  const order = paths(lang).order;
  const R = ({ text }: { text: string }) => <Rich text={text} currency={currency} hl={s.hl} />;
  // A title with "|" line breaks.
  const Lines = ({ text }: { text: string }) =>
    text.split("|").map((line, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        <R text={line} />
      </Fragment>
    ));
  const Cta = ({ sub, wide }: { sub?: string; wide?: boolean }) => (
    <div className={s.ctaBlock}>
      <a href={order} data-cta className={`${s.cta} ${wide ? s.wide : ""}`}>
        <span className={s.ctaMain}>
          {!sub && <Cart />}
          {t.cta}
        </span>
        {sub && <span className={s.ctaSub}>{sub}</span>}
      </a>
      <p className={s.guaranteeLine}>{t.ctaGuarantee}</p>
    </div>
  );

  return (
    <main className={`${s.page} ${fontVars}`} lang={lang}>
      <Tracking value={funnel.price[currency]} currency={currency} />
      <div className={s.topbar}>
        <R text={t.topbar} />
      </div>

      {/* hero */}
      <section className={s.hero}>
        <div className={s.wrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.logo} src={img("logo")} alt="GRIND STUDIO" width={900} height={103} />
          <p className={s.for}>{t.hero.for}</p>
          <h1 className={s.h1}>
            <Lines text={t.hero.title} />
          </h1>
          <p className={s.sub}>{t.hero.sub}</p>
          <Wistia id={funnel.wistiaId} className={s.video} />
          <ul className={s.bullets}>
            {t.hero.bullets.map((b) => (
              <li key={b}>
                <Check />
                {b}
              </li>
            ))}
          </ul>
          <ul className={s.bullets}>
            {t.hero.bullets2.map((b) => (
              <li key={b}>
                <Check />
                {b}
              </li>
            ))}
          </ul>
          <div className={s.ctaBlock}>
            <a href={order} data-cta className={s.cta}>
              <span className={s.ctaMain}>{t.cta}</span>
              <span className={s.ctaSub}>{t.hero.ctaSub}</span>
            </a>
            <p className={s.expires}>{t.hero.expires}</p>
          </div>
        </div>
      </section>

      {/* producer logos */}
      <section className={s.logos}>
        <div className={s.wrap}>
          <p className={s.logosTitle}>
            <R text={t.logos.title} />
          </p>
          <div className={s.logoList}>
            {t.logos.items.map((l) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={l.alt} src={l.src} alt={l.alt} width={l.w} height={l.h} loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      {/* the secret */}
      <section className={s.story}>
        <div className={s.narrow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.storyImg} src={img("secret")} alt="" width={900} height={672} loading="lazy" />
          <h2 className={s.h2}>
            <Lines text={t.secret.title} />
          </h2>
          <hr className={s.rule} />
          <p className={s.p}>{t.secret.intro}</p>
          <ul className={s.marks}>
            {t.secret.wrong.map((w) => (
              <li key={w}>
                <Cross />
                {w}
              </li>
            ))}
          </ul>
          {t.secret.body.map((p) => (
            <p key={p} className={s.p}>
              <R text={p} />
            </p>
          ))}
        </div>

        <div className={s.narrow} style={{ marginTop: 60 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.storyImg} src={img("scientist")} alt="" width={900} height={900} loading="lazy" />
          <h2 className={s.h2}>
            <R text={t.bounce.title} />
          </h2>
          <hr className={s.rule} />
          {t.bounce.intro.map((p) => (
            <p key={p} className={s.p}>
              {p}
            </p>
          ))}
          <ul className={s.marks}>
            {t.bounce.wrong.map((w) => (
              <li key={w}>
                <Cross />
                {w}
              </li>
            ))}
          </ul>
          <p className={s.p}>{t.bounce.instead}</p>
          <ul className={s.marks}>
            {t.bounce.right.map((w) => (
              <li key={w}>
                <Check />
                {w}
              </li>
            ))}
          </ul>
          {t.bounce.body.map((p) => (
            <p key={p} className={s.p}>
              {p}
            </p>
          ))}
        </div>

        {/* introducing the kit */}
        <div className={`${s.card} ${s.kitCard}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.kitBox} src={img("kit-box")} alt="MIDI Drum Kit" width={786} height={1080} loading="lazy" />
          <p className={s.introducing}>{t.kit.introducing}</p>
          <h2 className={`${s.kitName} ${s.hl}`}>{t.kit.name}</h2>
          <p className={s.kitLine}>
            <R text={t.kit.line} />
          </p>
          <p className={s.powered}>
            <R text={t.kit.powered} />
          </p>
          <ul className={s.benefits}>
            {t.kit.benefits.map((b) => (
              <li key={b}>
                <Check />
                <span>
                  <R text={b} />
                </span>
              </li>
            ))}
          </ul>
          <div className={s.ctaBlock}>
            <a href={order} data-cta className={s.cta} style={{ width: "min(100%, 312px)", padding: "18px 14px" }}>
              <span className={s.ctaMain} style={{ fontSize: 16 }}>
                {t.cta}
              </span>
              <span className={s.ctaSub} style={{ fontSize: 13 }}>
                {t.kit.ctaSub}
              </span>
            </a>
            <p className={s.guaranteeLine}>{t.ctaGuarantee}</p>
          </div>
        </div>
      </section>

      {/* producer quotes + science */}
      <section className={s.quotes}>
        <h2 className={`${s.h2} ${s.center}`} style={{ fontSize: "clamp(24px, 3vw, 27px)", maxWidth: 420, margin: "0 auto 26px", padding: "0 16px" }}>
          <R text={t.quotes.title} />
        </h2>
        <hr className={`${s.rule} ${s.mid}`} style={{ width: 132, marginBottom: 56 }} />
        <div className={s.quoteGrid}>
          {t.quotes.items.map((q) => (
            <figure key={q.name} className={s.quote} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.avatar} src={img(q.img)} alt={q.name} width={340} height={340} loading="lazy" />
              <h3 className={s.qName}>{q.name}</h3>
              <p className={s.qRole}>{q.role}</p>
              <blockquote className={s.qText} style={{ margin: 0 }}>
                <R text={q.quote} />
              </blockquote>
            </figure>
          ))}
        </div>
        <h2 className={s.youToo}>
          <R text={t.quotes.youToo} />
        </h2>
        <div className={s.science} style={{ marginLeft: "auto", marginRight: "auto" }}>
          <div className={s.scienceIn}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("studies")} alt="" width={900} height={644} loading="lazy" style={{ margin: "0 auto 40px", maxWidth: 560 }} />
            <h2 className={s.h2}>
              <R text={t.science.title} />
            </h2>
            <hr className={s.orangeRule} />
            <p className={s.found}>{t.science.found}</p>
            <ul className={s.sciList}>
              {t.science.items.map((it) => (
                <li key={it}>
                  <Check />
                  <span>
                    <R text={it} />
                  </span>
                </li>
              ))}
            </ul>
            <p className={s.end}>{t.science.end}</p>
          </div>
        </div>
      </section>

      {/* what's inside */}
      <section className={s.inside}>
        <h2 className={s.insideTitle}>
          <R text={t.inside.title} />
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.boxesAll} src={img("boxes-all")} alt="" width={900} height={301} loading="lazy" />
        <hr className={s.greenBar} />
        {t.inside.folders.map((f) => (
          <Fragment key={f.box}>
            <article className={`${s.folder} ${f.center ? s.centered : ""}`}>
              <div className={s.folderIn}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={s.folderBox} src={img(f.box)} alt={f.title} width={700} height={700} loading="lazy" />
                <h3 className={s.fTitle}>{f.title}</h3>
                <p className={s.fDesc}>{f.desc}</p>
                <hr className={s.orangeRule} />
                {f.demos.map((d) => (
                  <div key={d.label} className={s.demo}>
                    <p className={s.demoLabel}>{d.label.replace("|", "\n")}</p>
                    {"rolls" in d ? (
                      <div className={s.rolls}>
                        {d.rolls.map((r) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={r} src={img(r)} alt="" width={900} height={60} loading="lazy" />
                        ))}
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={s.gif} src={img(d.gif)} alt="" width={600} height={160} loading="lazy" />
                    )}
                  </div>
                ))}
              </div>
            </article>
            {f.ctaAfter && <Cta wide />}
            {f.ctaAfter && <div style={{ height: 50 }} />}
          </Fragment>
        ))}

        {/* bonuses */}
        <h2 className={s.bonusesTitle}>
          <R text={t.bonuses.title} />
        </h2>
        {t.bonuses.items.map((b) => (
          <article key={b.box} className={s.folder}>
            <div className={s.folderIn}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.bonusBox} src={img(b.box)} alt={b.name} width={900} height={700} loading="lazy" />
              <h3 className={s.fTitle}>
                <span className={s.bonusLabel}>{b.label}</span> {b.name}
              </h3>
              <p className={s.fDesc}>{b.desc}</p>
              <hr className={s.orangeRule} />
              <p className={s.demoLabel}>{b.demo}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.tree} src={img(b.tree)} alt="" width={704} height={1328} loading="lazy" />
            </div>
          </article>
        ))}
        <Cta wide />
      </section>

      {/* value stack */}
      <section className={s.valueSection}>
        <div className={s.valueCard}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.valueArt} src={img("value-art")} alt="MIDI Drum Kit Bundle + 3 bonuses" width={1000} height={650} loading="lazy" />
          <div className={s.bracket} />
          <p className={s.bracketText}>
            <R text={t.value.total} />
          </p>
          <p className={s.week}>{t.value.week}</p>
          <p className={s.prices}>
            <span className={s.was}>
              <R text={t.value.was} />
            </span>
            <span className={s.now}>
              <R text={t.value.now} />
            </span>
          </p>
          <span className={s.save}>
            <R text={t.value.save} />
          </span>
          <h2 className={s.valueTitle}>{t.value.title}</h2>
          <ul className={s.valueList}>
            {t.value.items.map((it) => (
              <li key={it}>
                <Check />
                <span>
                  <R text={it} />
                </span>
              </li>
            ))}
          </ul>
          <p className={s.totalLine}>
            <R text={t.value.totalLine} />
          </p>
          <p className={s.deal}>{t.value.deal}</p>
          <p className={s.single}>{t.value.single}</p>
          <p className={s.only}>
            {t.value.only}{" "}
            <s>
              <R text={t.value.oldPrice} />
            </s>{" "}
            <R text={t.value.price} />
          </p>
          <a href={order} data-cta className={s.yellow}>
            <Cart />
            {t.cta}
          </a>
          <p className={s.valueGuarantee}>{t.value.guarantee}</p>
        </div>
      </section>

      {/* 3 steps */}
      <section className={s.steps}>
        <h2 className={`${s.h2} ${s.center}`} style={{ maxWidth: 340, margin: "0 auto 22px" }}>
          <R text={t.steps.title} />
        </h2>
        <hr className={`${s.rule} ${s.mid}`} style={{ width: 94, marginBottom: 46 }} />
        <div className={s.stepGrid}>
          {t.steps.items.map((st) => (
            <div key={st.n} className={s.step}>
              <div className={s.stepText}>
                <h3 className={s.stepTitle}>
                  <span className={s.stepN}>{st.n}</span> {st.title}
                </h3>
                {st.text.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.stepGif} src={img(st.gif)} alt="" width={600} height={300} loading="lazy" />
            </div>
          ))}
        </div>
        <Cta wide />
      </section>

      <div className={s.daws}>
        <p className={s.dawsTitle}>{t.daws}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.dawsImg} src={img("daws")} alt="FL Studio, Ableton Live, Logic Pro, Pro Tools, Cubase, Studio One, Reaper…" width={1000} height={63} loading="lazy" />
      </div>

      {/* patterns & fragments */}
      <section className={s.pf}>
        <h2 className={`${s.h2} ${s.center}`} style={{ maxWidth: 420, margin: "0 auto 40px", padding: "0 16px" }}>
          <Lines text={t.pf.title} />
        </h2>
        {(["patterns", "fragments"] as const).map((k) => {
          const b = t.pf[k];
          return (
            <article key={k} className={s.folder}>
              <div className={s.folderIn}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={s.pfIcon} src={img(k === "patterns" ? "icon-patterns" : "icon-fragments")} alt="" width={400} height={400} loading="lazy" />
                <h3 className={s.fTitle}>{b.title}</h3>
                <p className={s.fDesc}>{b.desc}</p>
                <ul className={s.pfChecks}>
                  {b.checks.map((c) => (
                    <li key={c}>
                      <Check />
                      {c}
                    </li>
                  ))}
                </ul>
                <hr className={s.orangeRule} />
                <p className={s.demoLabel} style={{ textAlign: "center" }}>
                  {b.demo}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={s.gif} src={img(k === "patterns" ? "g-kick-patterns" : "g-rolls")} alt="" width={600} height={160} loading="lazy" />
              </div>
            </article>
          );
        })}
        <Cta wide />
      </section>

      {/* folder structure */}
      <section className={s.pf}>
        <h2 className={`${s.h2} ${s.center}`} style={{ margin: "0 auto 26px" }}>
          <R text={t.folders.title} />
        </h2>
        <div className={s.structure} style={{ marginLeft: "auto", marginRight: "auto" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.structureImg} src={img("folders")} alt="" width={900} height={924} loading="lazy" />
          <p className={s.caption}>{t.folders.caption}</p>
          <ul className={s.structureList}>
            {t.folders.items.map((it) => (
              <li key={it}>
                <Check />
                <span>
                  <R text={it} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Cta wide />
      </section>

      {/* reviews */}
      <section className={s.reviews}>
        <h2 className={`${s.h2} ${s.center}`}>
          <R text={t.reviews.title} />
        </h2>
        <p className={s.reviewsSub}>{t.reviews.sub}</p>
        <div className={s.reviewGrid}>
          {t.reviews.items.map((r) => (
            <figure key={r.name} className={s.review} style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.stars} src={img("stars")} alt="5/5" width={300} height={99} loading="lazy" />
              <blockquote className={s.rQuote} style={{ marginInline: 0 }}>
                {r.quote}
              </blockquote>
              <figcaption>
                <p className={s.rName}>{r.name}</p>
                <p className={s.rRole}>{r.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <Cta wide />
      </section>

      {/* faq */}
      <section className={s.faq}>
        <h2 className={`${s.h2} ${s.center}`} style={{ marginBottom: 30 }}>
          <R text={t.faq.title} />
        </h2>
        <div className={s.faqList}>
          {t.faq.items.map((f) => (
            <details key={f.q} className={s.faqItem}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className={s.wrap}>
          <Cta wide />
        </div>
        <div style={{ height: 40 }} />
      </section>

      {/* guarantee */}
      <section className={s.guarantee}>
        <h2 className={`${s.h2} ${s.center}`} style={{ maxWidth: 400, margin: "0 auto 40px", padding: "0 16px" }}>
          <Lines text={t.guarantee.title} />
        </h2>
        <div className={s.gCard}>
          <h3 className={s.gTitle}>{t.guarantee.card}</h3>
          <p className={s.gText}>{t.guarantee.text}</p>
          <p className={s.promise}>{t.guarantee.promise}</p>
          <div className={s.badge}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("badge-dont-overthink")} alt={t.guarantee.badgeAlt} width={500} height={500} loading="lazy" />
          </div>
        </div>
      </section>

      {/* one shot */}
      <section className={s.oneShot}>
        <div className={s.wrap}>
          <h2 className={s.h2}>
            <Lines text={t.oneShot.title} />
          </h2>
          <p className={s.decision}>
            <R text={t.oneShot.decision} />
          </p>
          <p className={s.warning}>
            <R text={t.oneShot.warning} />
          </p>
          <div className={s.ctaBlock} style={{ marginTop: 20 }}>
            <a href={order} data-cta className={s.cta}>
              <span className={s.ctaMain} style={{ fontSize: 18 }}>
                <Cart />
                {t.oneShot.cta}
              </span>
            </a>
          </div>
          <p className={s.small}>{t.oneShot.small}</p>
        </div>
      </section>

      <footer>
        <div className={`${s.disclaimer}`}>
          <div className={s.narrow}>
            {t.disclaimer.map((d) => (
              <p key={d}>
                <R text={d} />
              </p>
            ))}
          </div>
        </div>
        <div className={s.footer}>
          © 2026, {funnel.brand} - <a href={funnel.legal.terms}>{t.footer.terms}</a> - <a href={funnel.legal.privacy}>{t.footer.privacy}</a> -{" "}
          <a href={funnel.legal.refund}>{t.footer.refund}</a> - <b>{t.footer.contact}</b> <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </div>
      </footer>
    </main>
  );
}

export function Check() {
  return (
    <svg className={s.check} viewBox="0 0 512 512" aria-hidden>
      <path
        fill="currentColor"
        d="M173.9 439.4l-166.4-166.4c-10-10-10-26.2 0-36.2l36.2-36.2c10-10 26.2-10 36.2 0L192 312.7 432.1 72.6c10-10 26.2-10 36.2 0l36.2 36.2c10 10 10 26.2 0 36.2L210.1 439.4c-10 10-26.2 10-36.2 0z"
      />
    </svg>
  );
}

function Cross() {
  return (
    <svg className={s.cross} viewBox="0 0 352 512" aria-hidden>
      <path
        fill="currentColor"
        d="M242.7 256l100.1-100.1c12.3-12.3 12.3-32.2 0-44.5l-22.2-22.2c-12.3-12.3-32.2-12.3-44.5 0L176 189.3 75.9 89.2c-12.3-12.3-32.2-12.3-44.5 0L9.2 111.5c-12.3 12.3-12.3 32.2 0 44.5L109.3 256 9.2 356.1c-12.3 12.3-12.3 32.2 0 44.5l22.2 22.2c12.3 12.3 32.2 12.3 44.5 0L176 322.7l100.1 100.1c12.3 12.3 32.2 12.3 44.5 0l22.2-22.2c12.3-12.3 12.3-32.2 0-44.5L242.7 256z"
      />
    </svg>
  );
}

function Cart() {
  return (
    <svg className={s.cart} viewBox="0 0 576 512" aria-hidden>
      <path
        fill="currentColor"
        d="M528.1 301.3l47.3-208C578.8 78.3 567.4 64 552 64H159.2l-9.2-44.8C147.8 8 137.9 0 126.5 0H24C10.7 0 0 10.7 0 24v16c0 13.3 10.7 24 24 24h69.9l70.2 343.4C147.3 417.1 136 435.2 136 456c0 30.9 25.1 56 56 56s56-25.1 56-56c0-15.7-6.4-29.8-16.8-40h209.6C430.4 426.2 424 440.3 424 456c0 30.9 25.1 56 56 56s56-25.1 56-56c0-22.2-12.9-41.3-31.6-50.4l5.5-24.3c3.4-15-8-29.3-23.4-29.3H218.1l-6.5-32h293.1c11.2 0 20.9-7.8 23.4-18.7z"
      />
    </svg>
  );
}
