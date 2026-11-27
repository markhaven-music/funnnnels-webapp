import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { poppins } from "@/app/shop/fonts";
import { VIDEOS } from "./videos";
import s from "./bible.module.css";

// m.thegrind.studio/free/bible/<n>: the free launch videos of MIDI DRUMS BIBLE
// (the Astro site already forwards /free/* here). A video shows once it has a
// Wistia id; before that the page says when it comes out.
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
  return (
    <main className={`${s.page} ${poppins.variable}`}>
      <img className={s.logo} src="/funnels/shop/logo.webp" alt="Grind Studio" width={300} height={35} fetchPriority="high" />
      <p className={s.step}>Free video {v.n} of 4</p>
      <h1 className={s.h1}>{v.title}</h1>
      {v.wistiaId ? (
        <div className={s.video}>
          <iframe
            src={`https://fast.wistia.net/embed/iframe/${v.wistiaId}?playerColor=fc4200&videoFoam=false`}
            title={v.title}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <p className={s.soon}>This video comes out on {v.out}. Watch your inbox.</p>
      )}
      {v.lines.map((l) => (
        <p key={l} className={s.p}>{l}</p>
      ))}
      {v.homework && (
        <>
          <h2 className={s.h2}>Your homework</h2>
          <ol className={s.list}>
            {v.homework.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        </>
      )}
      <nav className={s.nav}>
        {VIDEOS.map((x) => (
          <a key={x.n} href={`/free/bible/${x.n}`} className={x.n === v.n ? s.on : x.wistiaId ? "" : s.off}>
            <b>{x.n}</b>
            <span>{x.wistiaId ? x.title : x.out}</span>
          </a>
        ))}
      </nav>
      <p className={s.foot}>On December 21 we show you what we built from all of this.</p>
    </main>
  );
}
