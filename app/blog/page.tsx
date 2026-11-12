import type { Metadata } from "next";
import { BRAND } from "@/app/(funnels)/_kit/brand";
import { Clarity } from "@/app/(funnels)/Clarity";
import { ShopFrame } from "@/app/shop/ShopFrame";
import { BlogBeacon } from "./BlogBeacon";
import { PackPanel } from "./Blocks";
import { BLOG, POSTS, SITE } from "./posts";
import b from "./blog.module.css";

// The blog's index, m.thegrind.studio/blog: every post (posts.ts), newest
// first, in the store's frame. Static.

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Blog · ${BRAND.name}`,
  description: BLOG.description,
  alternates: { canonical: `${SITE}/blog` },
  openGraph: { title: BLOG.title, description: BLOG.description, type: "website", url: `${SITE}/blog`, siteName: BRAND.name },
};

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, c) => c.date.localeCompare(a.date));
  return (
    <ShopFrame className={b.blog}>
      <Clarity />
      <BlogBeacon slug="index" />
      <div className={b.index}>
        <h1 className={b.h1}>Chords, Voicings And Beat-Making Notes</h1>
        <p className={b.lead}>{BLOG.description}</p>
        <ul className={b.posts}>
          {posts.map((p) => (
            <li key={p.slug}>
              <a href={`/blog/${p.slug}`} className={b.item}>
                <span className={b.itemTitle}>{p.title}</span>
                <span className={b.itemText}>{p.teaser}</span>
                <span className={b.itemMeta}>{p.minutes} min read</span>
              </a>
            </li>
          ))}
        </ul>
        <PackPanel
          slug="index"
          spot="end"
          text="The progressions in these posts as drag-and-drop MIDI: 10,496 files, voiced the way a pianist plays them, in 12 voicings, 8 rhythms and all 12 keys."
        />
      </div>
    </ShopFrame>
  );
}
