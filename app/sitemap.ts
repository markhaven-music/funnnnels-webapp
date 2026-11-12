import type { MetadataRoute } from "next";
import { POSTS, SITE } from "./blog/posts";

// m.thegrind.studio/sitemap.xml (the brand domain forwards it here: rewrites in
// grind-studio-landing-pages/vercel.json): the pages meant to be found by
// search. The store, the Jazz MIDI Pack's page and the blog. The ad landings,
// order pages and downloads stay out.
export default function sitemap(): MetadataRoute.Sitemap {
  const newest = POSTS.map((p) => p.date).sort().at(-1)!;
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/shop`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/jazz-midi-pack`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/blog`, lastModified: newest, changeFrequency: "weekly", priority: 0.7 },
    ...POSTS.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
