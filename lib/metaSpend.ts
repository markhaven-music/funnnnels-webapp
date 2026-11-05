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
function accountToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
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

/** The whole account's spend day by day between two days (YYYY-MM-DD, inclusive), oldest first, in the account's currency. */
export async function spendByDay(since: string, until: string): Promise<MetaDaily> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) return { connected: false, reason: "Meta isn't connected (no META_ADS_TOKEN)." };
  if (since < SPEND_SINCE) since = SPEND_SINCE;
  if (since > until) return { connected: true, currency: "EUR", days: [] };
  const rows = await insightRows(
    new URLSearchParams({
      level: "account",
      fields: "spend,impressions,inline_link_clicks,account_currency",
      time_increment: "1",
      time_range: JSON.stringify({ since, until }),
      limit: "500",
      access_token: token,
    }),
    until,
  );
  if (!Array.isArray(rows)) return { connected: false, reason: rows.reason };
  const days = rows
    .filter((r) => r.date_start)
    .map((r) => ({ day: r.date_start!, spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0), clicks: Number(r.inline_link_clicks ?? 0) }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));
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
