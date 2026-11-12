// What the Meta ads cost, for dashboard → Free packs (lib/freePacks.ts) and
// the home's net revenue vs ad spend chart (components/HomeCharts.tsx).
// Read from the Marketing API with a read-only token (ads_read) of a system
// user in FFUNK Media LLC's Business Manager:
//
//   META_ADS_TOKEN       the token (Vercel, Production)
//   META_AD_ACCOUNT_ID   the ad account, default 462189981361126 ("GRIND STUDIO", EUR)
//
// Spend is per ad set and counted for a pack when the ad set's or campaign's
// name has the pack's name as one of its " | " parts ("Rolls | US+CA | …",
// "Leads | Rolls | USA, Canada"). A range that reaches today (in the account's
// time zone, Los Angeles) is asked fresh every time: a cached answer was served
// stale and showed €25 for a day Meta already had at €35. Past days are cached
// 10 minutes. Amounts in the account's currency (EUR), never converted.

import { addDays, dayIn, instantAt } from "@/lib/tz";

const GRAPH = "https://graph.facebook.com/v23.0";
const DEFAULT_ACCOUNT = "462189981361126";

export type PackSpend = { spend: number; impressions: number; clicks: number };
export type MetaSpend =
  | { connected: false; reason: string }
  | { connected: true; currency: string; byPack: Record<string, PackSpend> };

type Row = {
  adset_name?: string;
  campaign_name?: string;
  date_start?: string;
  account_currency?: string;
  spend?: string;
  impressions?: string;
  inline_link_clicks?: string;
};

/** Today in the ad account's time zone (GRIND STUDIO bills by Los Angeles days), YYYY-MM-DD. */
const ACCOUNT_TZ = "America/Los_Angeles";
const HOURLY = "hourly_stats_aggregated_by_advertiser_time_zone";
function accountToday(): string {
  return dayIn(Date.now(), ACCOUNT_TZ);
}

/** The account's insight rows, page after page; the reason when Meta says no. */
async function insightRows(params: URLSearchParams, until: string): Promise<Row[] | { reason: string }> {
  const live = until >= accountToday();
  const account = process.env.META_AD_ACCOUNT_ID || DEFAULT_ACCOUNT;
  let url: string | null = `${GRAPH}/act_${account}/insights?${params}`;
  const rows: Row[] = [];
  try {
    for (let page = 0; url && page < 10; page++) {
      const res: Response = await fetch(url, live ? { cache: "no-store" } : { next: { revalidate: 600 } });
      const body = (await res.json()) as { data?: Row[]; paging?: { next?: string }; error?: { message?: string } };
      if (!res.ok || body.error) return { reason: `Meta said: ${body.error?.message ?? `HTTP ${res.status}`}` };
      rows.push(...(body.data ?? []));
      url = body.paging?.next ?? null;
    }
  } catch (err) {
    return { reason: `Couldn't reach Meta (${String(err)}).` };
  }
  return rows;
}

/**
 * The first day the ads count on the home: before it they sent buyers to
 * ClickFunnels, whose sales aren't in funnnnels, so their cost has no revenue
 * against it here ("we migrated from clickfunnels so only count the days
 * from Nov 2").
 */
export const SPEND_SINCE = "2026-11-02";

export type DaySpend = { day: string; spend: number; impressions: number; clicks: number };
export type MetaDaily = { connected: false; reason: string } | { connected: true; currency: string; days: DaySpend[] };

/**
 * The whole account's spend day by day between two Warsaw days (YYYY-MM-DD,
 * inclusive), oldest first, in the account's currency. Meta bills by Los
 * Angeles days, 9 hours behind Warsaw, so the spend is asked hour by hour and
 * each hour put on the Warsaw day it fell in (lib/tz.ts).
 */
export async function spendByDay(since: string, until: string): Promise<MetaDaily> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) return { connected: false, reason: "Meta isn't connected (no META_ADS_TOKEN)." };
  if (since < SPEND_SINCE) since = SPEND_SINCE;
  if (since > until) return { connected: true, currency: "EUR", days: [] };
  // A Warsaw day starts the afternoon before in Los Angeles: ask one Los Angeles day more at the front.
  const laToday = accountToday();
  const laUntil = until < laToday ? until : laToday;
  const rows = (await insightRows(
    new URLSearchParams({
      level: "account",
      fields: "spend,impressions,inline_link_clicks,account_currency",
      time_increment: "1",
      breakdowns: HOURLY,
      time_range: JSON.stringify({ since: addDays(since, -1), until: laUntil }),
      limit: "500",
      access_token: token,
    }),
    laUntil,
  )) as (Row & { [HOURLY]?: string })[] | { reason: string };
  if (!Array.isArray(rows)) return { connected: false, reason: rows.reason };
  const by = new Map<string, DaySpend>();
  for (const r of rows) {
    const hour = Number((r[HOURLY] ?? "").slice(0, 2));
    if (!r.date_start || !Number.isFinite(hour)) continue;
    const day = dayIn(instantAt(r.date_start, hour, ACCOUNT_TZ));
    if (day < since || day > until) continue;
    const d = by.get(day) ?? { day, spend: 0, impressions: 0, clicks: 0 };
    d.spend += Number(r.spend ?? 0);
    d.impressions += Number(r.impressions ?? 0);
    d.clicks += Number(r.inline_link_clicks ?? 0);
    by.set(day, d);
  }
  const days = [...by.values()].map((d) => ({ ...d, spend: Math.round(d.spend * 100) / 100 })).sort((a, b) => (a.day < b.day ? -1 : 1));
  return { connected: true, currency: rows[0]?.account_currency ?? "EUR", days };
}

export function metaConfigured(): boolean {
  return Boolean(process.env.META_ADS_TOKEN);
}

/** Spend per pack label (`labels`, e.g. ["Rolls", "Bounce", "Mystery Hooks"]) between two days (YYYY-MM-DD, inclusive). */
export async function spendByPack(labels: string[], since: string, until: string): Promise<MetaSpend> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) return { connected: false, reason: "Meta isn't connected (no META_ADS_TOKEN)." };
  const rows = await insightRows(
    new URLSearchParams({
      level: "adset",
      fields: "adset_name,campaign_name,spend,impressions,inline_link_clicks",
      time_range: JSON.stringify({ since, until }),
      limit: "500",
      access_token: token,
    }),
    until,
  );
  if (!Array.isArray(rows)) return { connected: false, reason: rows.reason };

  const byPack: Record<string, PackSpend> = {};
  for (const r of rows) {
    const parts = `${r.adset_name ?? ""} | ${r.campaign_name ?? ""}`.split("|").map((s) => s.trim().toLowerCase());
    const label = labels.find((l) => parts.includes(l.toLowerCase()));
    if (!label) continue;
    const p = (byPack[label] ??= { spend: 0, impressions: 0, clicks: 0 });
    p.spend += Number(r.spend ?? 0);
    p.impressions += Number(r.impressions ?? 0);
    p.clicks += Number(r.inline_link_clicks ?? 0);
  }
  return { connected: true, currency: "EUR", byPack };
}

export type AdSpend = { adId: string; adName: string; campaignName: string; spend: number };

/** Spend per ad between two days (YYYY-MM-DD, inclusive), for the funnel cards (lib/funnelSpend.ts). */
export async function spendByAd(since: string, until: string): Promise<{ connected: false; reason: string } | { connected: true; currency: string; ads: AdSpend[] }> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) return { connected: false, reason: "Meta isn't connected (no META_ADS_TOKEN)." };
  if (since < SPEND_SINCE) since = SPEND_SINCE;
  if (since > until) return { connected: true, currency: "EUR", ads: [] };
  const rows = (await insightRows(
    new URLSearchParams({
      level: "ad",
      fields: "ad_id,ad_name,campaign_name,spend,account_currency",
      time_range: JSON.stringify({ since, until }),
      limit: "500",
      access_token: token,
    }),
    until,
  )) as (Row & { ad_id?: string; ad_name?: string })[] | { reason: string };
  if (!Array.isArray(rows)) return { connected: false, reason: rows.reason };
  return {
    connected: true,
    currency: rows[0]?.account_currency ?? "EUR",
    ads: rows.filter((r) => r.ad_id && Number(r.spend ?? 0) > 0).map((r) => ({ adId: r.ad_id!, adName: r.ad_name ?? "", campaignName: r.campaign_name ?? "", spend: Number(r.spend ?? 0) })),
  };
}
