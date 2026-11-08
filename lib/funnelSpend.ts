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
 * days): by the ad's id, else by its name, which every click carries in
 * utm_content even when the ad's URL template has no ids (the Travis ads).
 */
async function funnelOfAds(ads: { adId: string; adName: string }[], slugs: string[]): Promise<Map<string, string>> {
  const since = new Date(Date.now() - 120 * 86_400_000).toISOString();
  const vote = async (column: "ad_id" | "utm_content", keys: string[]) => {
    const votes = new Map<string, Map<string, number>>();
    for (let i = 0; i < keys.length; i += 200) {
      const { data, error } = await supabase()
        .from("clicks")
        .select(`${column}, page_url`)
        .in(column, keys.slice(i, i + 200))
        .gte("created_at", since)
        .limit(20_000);
      if (error) throw error;
      for (const r of (data ?? []) as Record<string, string | null>[]) {
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
  const out = new Map<string, string>();
  for (const a of ads) {
    const f = byId.get(a.adId) ?? byName.get(a.adName);
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
