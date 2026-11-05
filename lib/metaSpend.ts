// What the Meta ads cost, for dashboard → Free packs (lib/freePacks.ts).
// Read from the Marketing API with a read-only token (ads_read) of a system
// user in FFUNK Media LLC's Business Manager:
//
//   META_ADS_TOKEN       the token (Vercel, Production)
//   META_AD_ACCOUNT_ID   the ad account, default 462189981361126 ("GRIND STUDIO", EUR)
//
// Spend is per ad set and counted for a pack when the ad set's or campaign's
// name has the pack's name as one of its " | " parts ("Rolls | US+CA | …",
// "Leads | Rolls | USA, Canada"). Cached 10 minutes. Amounts in the account's
// currency (EUR), never converted.

const GRAPH = "https://graph.facebook.com/v23.0";
const DEFAULT_ACCOUNT = "462189981361126";

export type PackSpend = { spend: number; impressions: number; clicks: number };
export type MetaSpend =
  | { connected: false; reason: string }
  | { connected: true; currency: string; byPack: Record<string, PackSpend> };

type Row = { adset_name?: string; campaign_name?: string; spend?: string; impressions?: string; inline_link_clicks?: string };

export function metaConfigured(): boolean {
  return Boolean(process.env.META_ADS_TOKEN);
}

/** Spend per pack label (`labels`, e.g. ["Rolls", "Bounce", "Mystery Hooks"]) between two days (YYYY-MM-DD, inclusive). */
export async function spendByPack(labels: string[], since: string, until: string): Promise<MetaSpend> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) return { connected: false, reason: "Meta isn't connected (no META_ADS_TOKEN)." };
  const account = process.env.META_AD_ACCOUNT_ID || DEFAULT_ACCOUNT;

  const params = new URLSearchParams({
    level: "adset",
    fields: "adset_name,campaign_name,spend,impressions,inline_link_clicks",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
    access_token: token,
  });
  let url: string | null = `${GRAPH}/act_${account}/insights?${params}`;
  const rows: Row[] = [];
  try {
    for (let page = 0; url && page < 10; page++) {
      const res: Response = await fetch(url, { next: { revalidate: 600 } });
      const body = (await res.json()) as { data?: Row[]; paging?: { next?: string }; error?: { message?: string } };
      if (!res.ok || body.error) return { connected: false, reason: `Meta said: ${body.error?.message ?? `HTTP ${res.status}`}` };
      rows.push(...(body.data ?? []));
      url = body.paging?.next ?? null;
    }
  } catch (err) {
    return { connected: false, reason: `Couldn't reach Meta (${String(err)}).` };
  }

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
