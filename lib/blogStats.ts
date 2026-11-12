import { POSTS, SITE } from "@/app/blog/posts";
import { rangeDays, rangeSpan, type Range } from "@/lib/range";
import { supabase } from "@/lib/supabase";
import { addDays } from "@/lib/tz";

// Dashboard → Blog: each post's visitors, where they came from, how many went
// on to the pack, and what they bought.
//
// Visitors and clicks are ours (blog_stats, db/blog.sql): a post tells
// /api/checkout/blog once per browser per day that someone is reading it, and
// once more when they follow a link to the pack. Bots are turned away
// (lib/bots.ts).
//
// Sales come from neo, as everywhere else: a post's links to the pack carry
// utm_source=blog&utm_campaign=<post> (app/blog/posts.ts packUrl), neo notes
// them on the visitor's click, and an order by a visitor who came through a
// post is credited to the last post they came through before buying, however
// long before. Not only neo's "converting click": someone who reads a post
// today and buys from an email next week still found us through that post.

export const INDEX = "index"; // the blog's front page, /blog

/** Where a reader came from: the search engines by name, "direct", "site" (another page of ours), else the referring host. */
export function sourceOf(referrerHost: unknown): string {
  const h = (typeof referrerHost === "string" ? referrerHost : "").toLowerCase().replace(/^www\./, "").slice(0, 60);
  if (!h || !/^[a-z0-9.-]+$/.test(h)) return "direct";
  if (/(^|\.)thegrind\.studio$/.test(h)) return "site";
  for (const [name, re] of SEARCH) if (re.test(h)) return name;
  return h.slice(0, 40);
}
const SEARCH: [string, RegExp][] = [
  ["google", /(^|\.)google\.[a-z.]+$/],
  ["bing", /(^|\.)bing\.com$/],
  ["duckduckgo", /(^|\.)duckduckgo\.com$/],
  ["yahoo", /(^|\.)yahoo\.[a-z.]+$/],
  ["yandex", /(^|\.)yandex\.[a-z.]+$/],
  ["brave", /^search\.brave\.com$/],
  ["ecosia", /(^|\.)ecosia\.org$/],
  ["baidu", /(^|\.)baidu\.com$/],
  ["startpage", /(^|\.)startpage\.com$/],
  ["qwant", /(^|\.)qwant\.com$/],
];
const isSearch = (source: string) => SEARCH.some(([name]) => name === source);

export const isBlogSlug = (slug: unknown): slug is string => slug === INDEX || POSTS.some((p) => p.slug === slug);

/** Count a reader (kind "view") or a reader who followed a link to the pack ("click"). */
export async function countBlogHit(v: { slug: string; kind: "view" | "click"; source: string }) {
  const { error } = await supabase().rpc("count_blog_stat", { p_slug: v.slug, p_kind: v.kind, p_source: v.source });
  if (error) throw error;
}

export type Money = { eur: number; usd: number }; // cents
export type BlogPostStats = {
  slug: string;
  title: string;
  url: string;
  published: string | null;
  visitors: number;
  search: number;
  clicks: number;
  orders: number;
  revenue: Money;
  /** Per day of `days`, in order. */
  series: { visitors: number[]; search: number[]; clicks: number[] };
  sources: { source: string; visitors: number }[];
};
export type BlogSale = { at: string; slug: string; product: string; cents: number; currency: string; orderId: string; days: number };
export type BlogStats = {
  days: string[];
  posts: BlogPostStats[];
  sales: BlogSale[];
};

type Row = { day: string; slug: string; kind: "view" | "click"; source: string; views: number };

export async function blogStats(range: Range): Promise<BlogStats> {
  const db = supabase();
  const { first, last } = rangeDays(range);

  // ─── visitors and clicks ────────────────────────────────────────────
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from("blog_stats").select("day, slug, kind, source, views").lte("day", last).order("day").range(from, from + 999);
    if (first) q = q.gte("day", first);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) break;
  }
  // The days drawn: the range's, or from the first post's day for all time.
  const start = first ?? [rows[0]?.day, ...POSTS.map((p) => p.date)].filter(Boolean).sort()[0] ?? last;
  const days: string[] = [];
  for (let d = start; d <= last && days.length < 800; d = addDays(d, 1)) days.push(d);
  const at = new Map(days.map((d, i) => [d, i]));

  const blank = () => days.map(() => 0);
  const make = (slug: string, title: string, published: string | null): BlogPostStats => ({
    slug,
    title,
    url: slug === INDEX ? `${SITE}/blog` : `${SITE}/blog/${slug}`,
    published,
    visitors: 0,
    search: 0,
    clicks: 0,
    orders: 0,
    revenue: { eur: 0, usd: 0 },
    series: { visitors: blank(), search: blank(), clicks: blank() },
    sources: [],
  });
  const posts = new Map<string, BlogPostStats>(POSTS.map((p) => [p.slug, make(p.slug, p.title, p.date)]));
  posts.set(INDEX, make(INDEX, "Blog front page", null));
  const bySource = new Map<string, Map<string, number>>();

  for (const r of rows) {
    const p = posts.get(r.slug);
    const i = at.get(r.day);
    if (!p || i === undefined) continue;
    if (r.kind === "click") {
      p.clicks += r.views;
      p.series.clicks[i] += r.views;
      continue;
    }
    p.visitors += r.views;
    p.series.visitors[i] += r.views;
    if (isSearch(r.source)) {
      p.search += r.views;
      p.series.search[i] += r.views;
    }
    const m = bySource.get(r.slug) ?? new Map<string, number>();
    m.set(r.source, (m.get(r.source) ?? 0) + r.views);
    bySource.set(r.slug, m);
  }
  for (const [slug, m] of bySource) {
    posts.get(slug)!.sources = [...m].map(([source, visitors]) => ({ source, visitors })).sort((a, b) => b.visitors - a.visitors);
  }

  // ─── sales (neo) ────────────────────────────────────────────────────
  // Every click that came from a post, ever (a reader of last month may buy
  // today), then the orders of those visitors inside the range.
  const sales: BlogSale[] = [];
  const { from, until } = rangeSpan(range);
  const { data: clicks, error: clickErr } = await db
    .from("clicks")
    .select("visitor_id, utm_campaign, created_at")
    .eq("utm_source", "blog")
    .eq("is_bot", false)
    .not("visitor_id", "is", null)
    .order("created_at")
    .limit(5000);
  if (clickErr) throw clickErr;
  const trail = new Map<string, { slug: string; at: number }[]>();
  for (const c of clicks ?? []) {
    if (!isBlogSlug(c.utm_campaign)) continue;
    const list = trail.get(c.visitor_id) ?? [];
    list.push({ slug: c.utm_campaign, at: Date.parse(c.created_at) });
    trail.set(c.visitor_id, list);
  }
  const visitors = [...trail.keys()];
  for (let i = 0; i < visitors.length; i += 150) {
    const { data, error } = await db
      .from("conversions")
      .select("order_id, visitor_id, amount_cents, currency, product_name, occurred_at")
      .in("visitor_id", visitors.slice(i, i + 150))
      .gte("occurred_at", new Date(from).toISOString())
      .lt("occurred_at", new Date(until).toISOString());
    if (error) throw error;
    for (const c of data ?? []) {
      const when = Date.parse(c.occurred_at);
      // the last post they came through before this order
      const via = (trail.get(c.visitor_id) ?? []).filter((t) => t.at <= when + 60_000).at(-1);
      const p = via && posts.get(via.slug);
      if (!via || !p) continue;
      const currency = String(c.currency ?? "").toLowerCase();
      const cents = Number(c.amount_cents) || 0;
      p.orders += 1;
      if (currency === "eur") p.revenue.eur += cents;
      else p.revenue.usd += cents;
      sales.push({
        at: c.occurred_at,
        slug: via.slug,
        product: c.product_name ?? "",
        cents,
        currency,
        orderId: c.order_id,
        days: Math.max(0, Math.floor((when - via.at) / 86_400_000)),
      });
    }
  }
  sales.sort((a, b) => b.at.localeCompare(a.at));

  // Posts as written, the front page last and only when someone came through it.
  const list = [...posts.values()].filter((p) => p.slug !== INDEX || p.visitors || p.clicks || p.orders);
  return { days, posts: list, sales };
}
