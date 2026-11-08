import { getAnalytics } from "@/lib/analytics";
import { SPEND_SINCE, spendByAd } from "@/lib/metaSpend";
import { rangeDays, type Range } from "@/lib/range";
import { supabase } from "@/lib/supabase";

// What the Meta ads cost per funnel, for the funnel cards (Funnels): ad spend,
// cost per visitor (spend ÷ landing visitors), ROAS (revenue ÷ spend) and net
// profit (revenue less Stripe's/PayPal's fees, less the spend).
//
// An ad belongs to the funnel its visitors landed on: the clicks neo records
// (public.clicks, same database) carry the ad's id and the page it opened.
// m.thegrind.studio/<lang>/<slug>/… and the old ClickFunnels paths on
// www.thegrind.studio (midi-drum-kit-47ad56, order-top-hits-midi-bundle…, now
// redirected to the funnels) both name the funnel's slug. An ad whose clicks
// went to the free packs is a lead magnet's (dashboard → Free packs) and an ad
// with no recorded click can't be placed: both are summed apart, never spread.
//
// Every number covers the same days: the range, from SPEND_SINCE at the
// earliest (before it the ads sold on ClickFunnels, outside funnnnels).

export type FunnelAds = { spend: number; visitors: number; revenue: number; net: number; orders: number };
export type FunnelSpend =
  | { connected: false; reason: string }
  | {
      connected: true;
      currency: string;
      since: string;
      until: string;
      byFunnel: Record<string, FunnelAds>;
      /** Spend on ads whose visitors went to a free pack (lead magnets). */
      leadMagnets: number;
      /** Spend on ads with no recorded visit, so no funnel. */
      unplaced: number;
    };

const LANGS = new Set(["en", "fr", "es", "de", "it", "pt"]);
const FREE = /^(free|download-.*-midi-drums|bounce|rolls|hooks)$/;

/** The funnel a landing URL belongs to: "free" for a free pack, null when none. */
export function funnelOfUrl(url: string | null, slugs: string[]): string | null {
  if (!url) return null;
  let path: string[];
  try {
    path = new URL(url).pathname.toLowerCase().split("/").filter(Boolean);
  } catch {
    return null;
  }
  if (LANGS.has(path[0])) path = path.slice(1);
  const seg = path[0];
  if (!seg) return null;
  if (FREE.test(seg)) return "free";
  // Exact slug first, then an old ClickFunnels path that contains one
  // ("midi-drum-kit-47ad56", "order-top-hits-midi-bundle"); longest wins.
  if (slugs.includes(seg)) return seg;
  return [...slugs].sort((a, b) => b.length - a.length).find((s) => seg.includes(s)) ?? null;
}

/**
 * Each ad's funnel, by where most of its recorded clicks landed (last 120
 * days): by the ad's id; else by its name in utm_content; else by its
 * campaign's name in utm_campaign (the Travis ads carry neither the id nor
 * their own name: utm_content=clipfirst_en for TRAVIS_clipfirst_EN_FUN_usd).
 */
async function funnelOfAds(ads: { adId: string; adName: string; campaignName: string }[], slugs: string[]): Promise<Map<string, string>> {
  const since = new Date(Date.now() - 120 * 86_400_000).toISOString();
  const vote = async (column: "ad_id" | "utm_content" | "utm_campaign", keys: string[]) => {
    const votes = new Map<string, Map<string, number>>();
    // Page by page: the API hands back 1,000 rows at most per request, and
    // reading only the first page left most ads looking unvisited.
    const rows: Record<string, string | null>[] = [];
    for (let i = 0; i < keys.length; i += 100) {
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase()
          .from("clicks")
          .select(`id, ${column}, page_url`)
          .in(column, keys.slice(i, i + 100))
          .gte("created_at", since)
          .order("id")
          .range(from, from + 999);
        if (error) throw error;
        rows.push(...((data ?? []) as Record<string, string | null>[]));
        if (!data || data.length < 1000) break;
      }
    }
    {
      for (const r of rows) {
        const key = r[column];
        const f = funnelOfUrl(r.page_url, slugs);
        if (!key || !f) continue;
        const v = votes.get(key) ?? new Map<string, number>();
        v.set(f, (v.get(f) ?? 0) + 1);
        votes.set(key, v);
      }
    }
    return new Map([...votes].map(([k, v]) => [k, [...v.entries()].sort((x, y) => y[1] - x[1])[0][0]]));
  };
  const byId = await vote("ad_id", ads.map((a) => a.adId));
  const rest = ads.filter((a) => !byId.has(a.adId) && a.adName);
  const byName = rest.length ? await vote("utm_content", Array.from(new Set(rest.map((a) => a.adName)))) : new Map<string, string>();
  const left = rest.filter((a) => !byName.has(a.adName) && a.campaignName);
  const byCampaign = left.length ? await vote("utm_campaign", Array.from(new Set(left.map((a) => a.campaignName)))) : new Map<string, string>();
  const out = new Map<string, string>();
  for (const a of ads) {
    const f = byId.get(a.adId) ?? byName.get(a.adName) ?? byCampaign.get(a.campaignName);
    if (f) out.set(a.adId, f);
  }
  return out;
}

export async function getFunnelSpend(range: Range): Promise<FunnelSpend> {
  const { first, last } = rangeDays(range);
  const since = !first || first < SPEND_SINCE ? SPEND_SINCE : first;
  if (since > last) return { connected: true, currency: "EUR", since, until: last, byFunnel: {}, leadMagnets: 0, unplaced: 0 };
  const [meta, a] = await Promise.all([spendByAd(since, last), getAnalytics(range, { since })]);
  if (!meta.connected) return meta;
  const slugs = a.funnels.map((f) => f.slug);
  const place = await funnelOfAds(meta.ads, slugs);

  const byFunnel: Record<string, FunnelAds> = {};
  for (const f of a.funnels) {
    byFunnel[f.slug] = { spend: 0, visitors: f.total.visitors, revenue: f.total.revenue, net: f.total.net, orders: f.total.orders };
  }
  let leadMagnets = 0;
  let unplaced = 0;
  for (const ad of meta.ads) {
    const f = place.get(ad.adId);
    if (f === "free") leadMagnets += ad.spend;
    else if (f && byFunnel[f]) byFunnel[f].spend += ad.spend;
    else unplaced += ad.spend;
  }
  return { connected: true, currency: meta.currency, since, until: last, byFunnel, leadMagnets, unplaced };
}
