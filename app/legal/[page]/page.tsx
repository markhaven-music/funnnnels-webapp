import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Poppins } from "next/font/google";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { COMPANY_ADDRESS, LEGAL_PAGES, legalPage } from "@/lib/legal";
import l from "../legal.module.css";

// Terms, Privacy and Refund policy (lib/legal.ts), at the paths they had on
// ClickFunnels: proxy.ts rewrites /terms-and-conditions, /privacy-policy and
// /refund-policy here, and the brand domain forwards them (rewrites in
// grind-studio-landing-pages/vercel.json). Static, from the CDN.

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ page: p.slug }));
}

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-poppins" });

type Params = { page: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = legalPage((await params).page);
  return page ? { title: `${page.title} · Grind Studio` } : {};
}

export default async function Legal({ params }: { params: Promise<Params> }) {
  const page = legalPage((await params).page);
  if (!page) notFound();

  return (
    <main className={`${l.page} ${poppins.variable}`}>
      <header className={l.top}>
        <a href="/" className={l.logo}>
          <img src="/funnels/shop/logo.webp" alt={BRAND.name} width={360} height={42} />
        </a>
      </header>

      <article className={l.doc}>
        <h1 className={l.h1}>{page.title}</h1>
        <p className={l.updated}>Last Updated: {page.updated}</p>
        {page.blocks.map((b, i) =>
          "h" in b ? (
            <h2 key={i} className={l.h2}>
              {b.h}
            </h2>
          ) : "p" in b ? (
            <p key={i}>{b.p}</p>
          ) : "ul" in b ? (
            <ul key={i}>
              {b.ul.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <ol key={i}>
              {b.ol.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          ),
        )}
        {page.address && (
          <address className={l.address}>
            {COMPANY_ADDRESS.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
        )}
      </article>

      <footer className={l.footer}>
        <p>
          © {new Date().getFullYear()} {BRAND.name} ·{" "}
          {LEGAL_PAGES.map((p) => (
            <span key={p.slug}>
              <a href={`/${p.slug}`} aria-current={p.slug === page.slug ? "page" : undefined}>
                {p.title}
              </a>{" "}
              ·{" "}
            </span>
          ))}
          <a href={`mailto:${BRAND.support}`}>{BRAND.support}</a>
        </p>
      </footer>
    </main>
  );
}
