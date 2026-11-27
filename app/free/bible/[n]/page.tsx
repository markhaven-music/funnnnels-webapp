import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { poppins } from "@/app/shop/fonts";
import { VIDEOS } from "./videos";
import s from "./bible.module.css";

// m.thegrind.studio/free/bible/<n>: the free launch videos of MIDI DRUMS BIBLE
// (the Astro site already forwards /free/* here). The four videos run along the
// top as a timeline (user, 11-27: "put time line on top", "make the page LOOK GOOD").
// A video shows once it has a Wistia id; before that the page says when it comes out.
export const revalidate = 3600;

export function generateStaticParams() {
  return VIDEOS.map((v) => ({ n: String(v.n) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const v = VIDEOS.find((x) => String(x.n) === n);
  return { title: v ? `Video ${v.n}: ${v.title} · Grind Studio` : "Grind Studio", robots: { index: false } };
}

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const v = VIDEOS.find((x) => String(x.n) === n);
  if (!v) notFound();
  const next = VIDEOS.find((x) => x.n === v.n + 1);
  return (
    <main className={`${s.page} ${poppins.variable}`}>
      <div className={s.glow} aria-hidden />
      <img className={s.logo} src="/funnels/shop/logo.webp" alt="Grind Studio" width={300} height={35} fetchPriority="high" />

      <ol className={s.timeline}>
        {VIDEOS.map((x) => {
          const state = x.n === v.n ? s.now : x.wistiaId ? s.open : s.locked;
          const inner = (
            <>
              <span className={s.dot}>{x.wistiaId || x.n === v.n ? x.n : "🔒"}</span>
              <span className={s.when}>{x.out}</span>
              <span className={s.name}>{x.n === 4 ? "The reveal" : `Video ${x.n}`}</span>
            </>
          );
          return (
            <li key={x.n} className={state}>
              {x.wistiaId && x.n !== v.n ? <a href={`/free/bible/${x.n}`}>{inner}</a> : <div>{inner}</div>}
            </li>
          );
        })}
      </ol>

      <h1 className={s.h1}>{v.title}</h1>

      {v.wistiaId ? (
        <div className={s.frame}>
          <div className={s.video}>
            <iframe
              src={`https://fast.wistia.net/embed/iframe/${v.wistiaId}?playerColor=fc4200&videoFoam=false`}
              title={v.title}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        <div className={s.soon}>
          <b>{v.out}</b>
          <span>This video comes out on {v.out}. Watch your inbox.</span>
        </div>
      )}

      {v.lines.length > 0 && (
        <div className={s.lines}>
          {v.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      )}

      {v.homework && (
        <section className={s.homework}>
          <h2 className={s.h2}>Your homework</h2>
          <ol>
            {v.homework.map((h, i) => (
              <li key={h}>
                <span>{i + 1}</span>
                {h}
              </li>
            ))}
          </ol>
        </section>
      )}

      {next && (
        <section className={s.next}>
          <span className={s.nextWhen}>Next · {next.out}</span>
          <b>{next.n === 4 ? "The reveal" : `Video ${next.n}: ${next.title}`}</b>
          <span className={s.nextHint}>We email you the moment it is out.</span>
        </section>
      )}

      <p className={s.foot}>
        On <b>December 21</b> we show you what we built from all of this.
      </p>
    </main>
  );
}
