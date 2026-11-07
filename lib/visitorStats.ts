import { ASTRO_FUNNEL } from "@/lib/beacon";
import { codeFunnels } from "@/lib/funnels";
import { OFF_HOST } from "@/lib/live";
import { rangeLength, rangeSpan, type Range } from "@/lib/range";
import { SHOP_SLUG } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

// Dashboard → Live → "Who they are": the visitors of the last day, week or
// month, from the live tracking's own tables (db/live.sql), kept 30 days.
//   live_visitors  one row per browser: where it is, which device, where it
//                  came from, pages opened and time spent on its latest visit
//   live_events    each page opened: when, and how far down a funnel it got
// Bots and the owner's own browsers are never in them (lib/bots.ts, ?me=1).

// The ranges offered: the tables keep 30 days.
export const STAT_RANGES: Range[] = ["today", "yesterday", "7d", "28d", "this-month"];

export type Count = { key: string; n: number };
export type DeviceRow = { device: string; visitors: number; order: number; checkout: number; bought: number };

export type VisitorStats = {
  range: Range;
  days: number;
  since: string | null; // the first visit recorded at all
  visitors: number;
  returning: number;
  pages: number; // page views in the range
  medianSeconds: number | null; // time on site, visits that stayed past the first page's ping
  devices: DeviceRow[];
  countries: Count[];
  cities: Count[]; // "City|CC"
  sources: Count[];
  ads: Count[]; // utm_content / campaign
  langs: Count[];
  funnels: Count[];
  depth: Count[]; // pages per visit: "1", "2", "3", "4+"
  stay: Count[]; // time on site buckets
  hours: number[]; // unique visitors per hour of day, the viewer's time
  perDay: { day: string; n: number }[]; // unique visitors per day, the viewer's days
};

const STEP_ORDER = ["landing", "order", "checkout", "upsell-1", "upsell-2", "thank-you"];

function top(map: Map<string, number>, max = 12): Count[] {
  return [...map.entries()]
    .map(([key, n]) => ({ key, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, max);
}
const add = (map: Map<string, number>, key: string, n = 1) => map.set(key, (map.get(key) ?? 0) + n);

/**
 * @param range one of STAT_RANGES, in the viewer's own days
 * @param offset the viewer's Date.getTimezoneOffset(), for hours and days
 */
export async function getVisitorStats(range: Range, offset: number): Promise<VisitorStats> {
  const db = supabase();
  const span = rangeSpan(range, Date.now(), -offset);
  const days = rangeLength(range) ?? 30;
  const from = new Date(span.from).toISOString();
  const until = new Date(span.until).toISOString();
  type V = { sid: string; first_seen: string; session_start: string; last_seen: string; host: string; funnel: string; lang: string; country: string; city: string; device: string; source: string; campaign: string; views: number };
  type E = { sid: string; at: string; host: string; funnel: string; page: string };

  // Pages of 1000 (PostgREST's cap) until the range is read.
  async function all<T>(table: string, cols: string, col: string): Promise<T[]> {
    const out: T[] = [];
    for (let at = 0; at < 50_000; at += 1000) {
      const { data, error } = await db.from(table).select(cols).gte(col, from).lt(col, until).order(col, { ascending: true }).range(at, at + 999);
      if (error) throw error;
      out.push(...((data ?? []) as T[]));
      if (!data || data.length < 1000) break;
    }
    return out;
  }

  const [vRows, eRows, first] = await Promise.all([
    all<V>("live_visitors", "sid, first_seen, session_start, last_seen, host, funnel, lang, country, city, device, source, campaign, views", "last_seen"),
    all<E>("live_events", "sid, at, host, funnel, page", "at"),
    db.from("live_events").select("at").order("at", { ascending: true }).limit(1),
  ]);

  // Dev servers write here too: production never counts their visits.
  const shown = (host: string) => process.env.NODE_ENV !== "production" || !OFF_HOST.test(host);
  const visitors = vRows.filter((v) => shown(v.host));
  const events = eRows.filter((e) => shown(e.host));

  const names = new Map<string, string>(codeFunnels().map((f) => [f.slug, f.product]));
  names.set(SHOP_SLUG, "Shop");
  names.set(ASTRO_FUNNEL, "Astro landings");
  const funnelName = (slug: string) => names.get(slug) ?? slug;

  // How far each browser got, from every page it opened in the range.
  const deepest = new Map<string, number>();
  const funnelsOf = new Map<string, Set<string>>();
  const hourSids = Array.from({ length: 24 }, () => new Set<string>());
  const daySids = new Map<string, Set<string>>();
  for (const e of events) {
    const step = e.funnel === ASTRO_FUNNEL ? 0 : STEP_ORDER.indexOf(e.page);
    deepest.set(e.sid, Math.max(deepest.get(e.sid) ?? 0, step));
    if (!funnelsOf.has(e.sid)) funnelsOf.set(e.sid, new Set());
    funnelsOf.get(e.sid)!.add(e.funnel);
    const local = new Date(Date.parse(e.at) - offset * 60_000);
    hourSids[local.getUTCHours()].add(e.sid);
    const day = local.toISOString().slice(0, 10);
    if (!daySids.has(day)) daySids.set(day, new Set());
    daySids.get(day)!.add(e.sid);
  }

  const devices = new Map<string, DeviceRow>();
  const countries = new Map<string, number>();
  const cities = new Map<string, number>();
  const sources = new Map<string, number>();
  const ads = new Map<string, number>();
  const langs = new Map<string, number>();
  const funnels = new Map<string, number>();
  const depth = new Map<string, number>();
  const stay = new Map<string, number>();
  const stays: number[] = [];
  let returning = 0;

  for (const v of visitors) {
    const d = v.device || "unknown";
    const row = devices.get(d) ?? { device: d, visitors: 0, order: 0, checkout: 0, bought: 0 };
    const deep = deepest.get(v.sid) ?? 0;
    row.visitors++;
    if (deep >= 1) row.order++;
    if (deep >= 2) row.checkout++;
    if (deep >= 3) row.bought++;
    devices.set(d, row);

    add(countries, v.country || "");
    if (v.city) add(cities, `${v.city}|${v.country}`);
    add(sources, v.source || "Direct");
    if (v.campaign) add(ads, v.campaign);
    add(langs, v.lang || "en");
    for (const f of funnelsOf.get(v.sid) ?? [v.funnel]) add(funnels, funnelName(f));
    add(depth, v.views >= 4 ? "4+" : String(Math.max(1, v.views)));
    if (Date.parse(v.session_start) - Date.parse(v.first_seen) > 60_000) returning++;

    // A tab pings every 20 s while in front: under that, they saw one screen and went.
    const sec = Math.max(0, (Date.parse(v.last_seen) - Date.parse(v.session_start)) / 1000);
    add(stay, sec < 10 ? "under 10 s" : sec < 30 ? "10–30 s" : sec < 60 ? "30 s – 1 min" : sec < 180 ? "1–3 min" : sec < 600 ? "3–10 min" : "10 min +");
    if (sec >= 10) stays.push(sec);
  }
  stays.sort((a, b) => a - b);

  const STAY_ORDER = ["under 10 s", "10–30 s", "30 s – 1 min", "1–3 min", "3–10 min", "10 min +"];
  return {
    range,
    days,
    since: first.data?.[0]?.at ?? null,
    visitors: visitors.length,
    returning,
    pages: events.length,
    medianSeconds: stays.length ? Math.round(stays[Math.floor(stays.length / 2)]) : null,
    devices: [...devices.values()].sort((a, b) => b.visitors - a.visitors),
    countries: top(countries),
    cities: top(cities),
    sources: top(sources),
    ads: top(ads, 10),
    langs: top(langs),
    funnels: top(funnels),
    depth: ["1", "2", "3", "4+"].map((key) => ({ key, n: depth.get(key) ?? 0 })),
    stay: STAY_ORDER.map((key) => ({ key, n: stay.get(key) ?? 0 })),
    hours: hourSids.map((s) => s.size),
    perDay: [...daySids.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, s]) => ({ day, n: s.size })),
  };
}
