import { supabase } from "@/lib/supabase";
import { BF, BF_FUNNELS, sitewideUntil } from "@/lib/blackFriday";
import { BF_FROM_MS } from "@/lib/bfEra";

// Dashboard → Black Friday counts what the Black Friday ads brought, nothing else ("dobbiamo tracciare black friday a
// parte bene… solo quelle che venivano da ads precedenti vanno escluse dalla dashboard black friday", 2026-11-25).
// A Black Friday ad is one in a campaign named Black Friday, or whose clicks (neo's public.clicks) landed on a
// Black Friday page (/<slug>/black-friday). For the first hours of the sale (BF_FROM until each funnel's
// BF_SITEWIDE_OFF) the funnels' own pages were at €9.99 too and carried no Black Friday variant, so there the
// buyer's ad decides: neo's conversions name the click each order came from. Server only (reads the database).

const BF_CAMPAIGN = /black.?friday/i;
export const isBfCampaign = (name: string | null | undefined) => !!name && BF_CAMPAIGN.test(name);
const bfPage = (url: string | null | undefined) => !!url && new RegExp(`/${BF.path}(/|$|\\?)`).test(url);
/** A click that came from a Black Friday ad. */
const bfClick = (c: { utm_campaign: string | null; page_url: string | null }) => isBfCampaign(c.utm_campaign) || bfPage(c.page_url);

/** The latest minute any funnel's own pages were still in the store-wide sale. */
const SITEWIDE_LAST = Math.max(...Object.keys(BF_FUNNELS).map(sitewideUntil));
const iso = (ms: number) => new Date(ms).toISOString();

type Click = { id: number; ad_id: string | null; utm_campaign: string | null; page_url: string | null };

async function clicksSince(fromMs: number, untilMs: number | null): Promise<Click[]> {
  const out: Click[] = [];
  for (let at = 0; ; at += 1000) {
    let q = supabase().from("clicks").select("id, ad_id, utm_campaign, page_url").gte("created_at", iso(fromMs));
    if (untilMs !== null) q = q.lt("created_at", iso(untilMs));
    const { data, error } = await q.order("id").range(at, at + 999);
    if (error) throw error;
    out.push(...((data ?? []) as Click[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** The ids of the Black Friday ads among these (by campaign name, or by where their clicks landed since the sale began). */
export async function bfAdIds(ads: { adId: string; campaignName: string }[]): Promise<Set<string>> {
  const out = new Set(ads.filter((a) => isBfCampaign(a.campaignName)).map((a) => a.adId));
  const ids = new Set(ads.map((a) => a.adId));
  for (const c of await clicksSince(BF_FROM_MS, null)) if (c.ad_id && ids.has(c.ad_id) && bfPage(c.page_url)) out.add(c.ad_id);
  return out;
}

/** The funnel (one of the sale's) a landing URL belongs to, or null. */
function saleFunnel(url: string | null): string | null {
  if (!url) return null;
  try {
    const seg = new URL(url).pathname.toLowerCase().split("/").filter(Boolean);
    const slugs = Object.keys(BF_FUNNELS).sort((a, b) => b.length - a.length);
    for (const s of seg.slice(0, 2)) {
      const f = slugs.find((x) => s === x || s.includes(x));
      if (f) return f;
    }
  } catch {
    // not a URL
  }
  return null;
}

/**
 * For the store-wide hours: per funnel, the share of the clicks that landed on its pages while they were at €9.99
 * that came from Black Friday ads (the rest came from the ads that were already running). 0 when none.
 */
export async function bfClickShare(): Promise<Map<string, number>> {
  const tally = new Map<string, { bf: number; all: number }>();
  for (const c of await clicksSince(BF_FROM_MS, SITEWIDE_LAST)) {
    const f = saleFunnel(c.page_url);
    if (!f) continue;
    const t = tally.get(f) ?? { bf: 0, all: 0 };
    t.all += 1;
    if (bfClick(c)) t.bf += 1;
    tally.set(f, t);
  }
  return new Map([...tally].map(([f, t]) => [f, t.all ? t.bf / t.all : 0]));
}

/** The orders (Stripe payment intent or PayPal order id) placed in the store-wide hours that came from a Black Friday ad. */
export async function bfOrderIds(): Promise<Set<string>> {
  const db = supabase();
  const { data, error } = await db
    .from("conversions")
    .select("order_id, converting_click_id")
    .gte("occurred_at", iso(BF_FROM_MS))
    .lt("occurred_at", iso(SITEWIDE_LAST))
    .not("converting_click_id", "is", null)
    .limit(5000);
  if (error) throw error;
  const rows = (data ?? []) as { order_id: string; converting_click_id: number }[];
  if (!rows.length) return new Set();
  const out = new Set<string>();
  const ids = [...new Set(rows.map((r) => r.converting_click_id))];
  const bf = new Set<number>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data: cl, error: e2 } = await db.from("clicks").select("id, utm_campaign, page_url").in("id", ids.slice(i, i + 200));
    if (e2) throw e2;
    for (const c of (cl ?? []) as Click[]) if (bfClick(c)) bf.add(c.id);
  }
  for (const r of rows) if (bf.has(r.converting_click_id)) out.add(r.order_id);
  return out;
}
