import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Clarity } from "@/app/(funnels)/Clarity";
import { ShopFrame } from "@/app/shop/ShopFrame";
import { BlogBeacon } from "../BlogBeacon";
import { Blocks } from "../Blocks";
import { BLOG, POSTS, post as find, SITE } from "../posts";
import b from "../blog.module.css";

// A blog post (posts.ts), at m.thegrind.studio/blog/<slug>: the brand domain
// forwards /blog here (rewrites in grind-studio-landing-pages/vercel.json).
// Static, from the CDN, in the store's frame. For search: one h1, a canonical
// address on the brand domain, and the post, its questions and its place on
// the site as structured data.

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

type Params = { slug: string };

const IMAGE = { url: `${SITE}/funnels/jazz-midi-pack/vsl-en-1600.webp`, width: 1600, height: 900 };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = find((await params).slug);
  if (!p) return {};
  const url = `${SITE}/blog/${p.slug}`;
  return {
    title: p.seoTitle,
    description: p.description,
    alternates: { canonical: url },
    openGraph: { title: p.title, description: p.description, type: "article", url, siteName: BRAND.name, publishedTime: p.date, images: [IMAGE] },
  };
}

const longDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default async function BlogPost({ params }: { params: Promise<Params> }) {
  const p = find((await params).slug);
  if (!p) notFound();
  const url = `${SITE}/blog/${p.slug}`;
  const others = POSTS.filter((o) => o.slug !== p.slug).slice(0, 3);

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      dateModified: p.date,
      image: IMAGE.url,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: BRAND.name, url: SITE },
      publisher: { "@type": "Organization", name: BRAND.name, url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/funnels/shop/logo.webp` } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND.name, item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <ShopFrame className={b.blog}>
      <Clarity />
      <BlogBeacon slug={p.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      <article className={b.post}>
        <nav className={b.crumbs} aria-label="Breadcrumb">
          <a href="/blog">Blog</a>
        </nav>
        <h1 className={b.h1}>{p.title}</h1>
        <p className={b.meta}>
          <time dateTime={p.date}>{longDate(p.date)}</time> · {p.minutes} min read · by {BRAND.name}
        </p>

        <Blocks post={p} />

        <section className={b.faq}>
          <h2 id="faq" className={b.h2}>
            Questions producers ask
          </h2>
          {p.faq.map((f) => (
            <div key={f.q} className={b.qa}>
              <h3 className={b.h3}>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

      </article>

      <section className={b.more}>
        <h2 className={b.moreTitle}>Keep reading</h2>
        <ul className={b.cards}>
          {others.map((o) => (
            <li key={o.slug}>
              <a href={`/blog/${o.slug}`} className={b.card}>
                <span className={b.cardTitle}>{o.title}</span>
                <span className={b.cardText}>{o.teaser}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className={b.all}>
          <a href="/blog">All posts on {BLOG.title} →</a>
        </p>
      </section>
    </ShopFrame>
  );
}
