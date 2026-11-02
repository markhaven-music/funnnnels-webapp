import { usdToEur } from "@/lib/analytics";
import { ASTRO_FUNNEL } from "@/lib/beacon";
import { codeFunnels, getFunnel } from "@/lib/funnels";
import { SHOP_SLUG } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

// Dashboard → Live: who is on a buyer page right now, where they are, which
// page, and what just happened.
//   visitors, page views  live_visitors / live_events (db/live.sql), from the
//                         pages' pings (lib/beacon.ts LIVE_JS → /api/checkout/here)
//   checkouts started     checkout_starts
//   orders and upsells    orders (lib/sales.ts)
//   email clicks          email_clicks
// Vercel puts the visitor's country, region, city and rough position on every
// request (x-vercel-ip-*); nothing else about them is kept.

// Local, preview and origin hosts, as in /api/checkout/view: not real visitors.
export const OFF_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/;

// ─── recording ─────────────────────────────────────────────────

export type Ping =
  | { kind: "beat" | "leave"; sid: string }
  | {
      kind: "view";
      sid: string;
      host: string;
      funnel: string;
      page: string;
      lang: string;
      path: string;
      country: string;
      region: string;
      city: string;
      lat: number | null;
      lon: number | null;
      device: string;
      source: string;
      campaign: string;
    };

export async function livePing(p: Ping) {
  const v = p.kind === "view" ? p : null;
  const { error } = await supabase().rpc("live_ping", {
    p_kind: p.kind,
    p_sid: p.sid,
    p_host: v?.host ?? "",
    p_funnel: v?.funnel ?? "",
    p_page: v?.page ?? "",
    p_lang: v?.lang ?? "en",
    p_path: v?.path ?? "",
    p_country: v?.country ?? "",
    p_region: v?.region ?? "",
    p_city: v?.city ?? "",
    p_lat: v?.lat ?? null,
    p_lon: v?.lon ?? null,
    p_device: v?.device ?? "",
    p_source: v?.source ?? "",
    p_campaign: v?.campaign ?? "",
  });
  if (error) throw error;
}

// Where a visitor came from, read from the first page of their tab. Meta's ads
// carry utm_source={{site_source_name}} (fb, ig, an, msg) and
// utm_content={{ad.name}}. An empty source means a page of the same site: the
// visit keeps the one it came in with (live_ping).
const SITES: [RegExp, string][] = [
  [/(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|mail\.yahoo\.com)$/, "Email"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "X"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "ChatGPT"],
  [/(^|\.)reddit\.com$/, "Reddit"],
];
// Pages a buyer passes through to pay: not where they came from.
const PAYING = /(^|\.)(stripe\.com|stripe\.network|paypal\.com)$/;

export function sourceOf(b: Record<string, unknown>): { source: string; campaign: string } {
  const str = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 120) : "");
  const s = str(b.s).toLowerCase();
  const campaign = str(b.a) || str(b.c);
  const ad = Boolean(campaign);
  if (s === "fb" || s === "facebook") return { source: ad ? "Facebook ad" : "Facebook", campaign };
  if (s === "ig" || s === "instagram") return { source: ad ? "Instagram ad" : "Instagram", campaign };
  if (s === "an" || s === "msg" || s === "meta") return { source: "Meta ad", campaign };
  if (/mail|newsletter/.test(s) || str(b.m).toLowerCase() === "email") return { source: "Email", campaign };
  if (s) return { source: str(b.s).slice(0, 40), campaign };
  const r = str(b.r).toLowerCase();
  if (r === "=" || PAYING.test(r)) return { source: "", campaign: "" };
  if (b.fb === 1) return { source: /instagram/.test(r) ? "Instagram" : "Facebook", campaign: "" };
  if (b.g === 1) return { source: "Google ad", campaign: "" };
  if (!r) return { source: "Direct", campaign: "" };
  const site = SITES.find(([re]) => re.test(r));
  return { source: site ? site[1] : r.replace(/^www\./, "").slice(0, 60), campaign: "" };
}

export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "mobile";
  return "desktop";
}

// ─── reading ───────────────────────────────────────────────────

/** A visitor counts as on a page while their tab pinged in the last 50 s (it pings every 20 s). */
const ACTIVE_MS = 50_000;
const RECENT_MS = 30 * 60_000;
const STREAM_MS = 24 * 3600_000;
const STREAM_MAX = 80;

export type LiveVisitor = {
  id: string;
  active: boolean;
  funnel: string;
  funnelName: string;
  page: string;
  lang: string;
  path: string;
  url: string; // the page they're on, "" if unknown
  country: string;
  region: string;
  city: string;
  lat: number | null;
  lon: number | null;
  device: string;
  source: string;
  campaign: string;
  views: number; // pages opened this visit
  since: string; // when this visit began
  lastSeen: string;
  leftAt: string | null;
  returning: boolean; // seen on an earlier visit
};

type Base = { id: string; at: string; funnel: string; funnelName: string; lang: string };
export type LiveEvent =
  | (Base & { kind: "view"; visitor: string; page: string; path: string; url: string; country: string; city: string; source: string; campaign: string })
  | (Base & { kind: "checkout"; who: string })
  | (Base & { kind: "order" | "upsell"; who: string; amount: number; currency: string; country: string; offer: string })
  | (Base & { kind: "click"; who: string; url: string });

export type Live = {
  at: string;
  visitors: LiveVisitor[]; // seen in the last 30 minutes, latest first
  events: LiveEvent[]; // the last day, latest first
  today: { checkouts: number; orders: number; revenue: number }; // revenue in euros, upsells included
  since: string | null; // the first page view ever recorded here
  errors: string[];
};

function funnelNames(): (slug: string) => string {
  const names = new Map<string, string>(codeFunnels().map((f) => [f.slug, f.product]));
  names.set(SHOP_SLUG, "Shop");
  names.set(ASTRO_FUNNEL, "Astro landings");
  return (slug) => names.get(slug) ?? slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

const testEmail = (e: string | null) => !!e && /@example\.com$/i.test(e);

// The page as the visitor's browser had it: its host and path (LIVE_JS h, u).
const pageUrl = (host: string, path: string) => (host && path ? `https://${host}${path}` : "");

/** @param day the viewer's midnight (ISO), for "today". */
export async function getLive(day: string | null): Promise<Live> {
  const db = supabase();
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const dayMs = day && Number.isFinite(Date.parse(day)) && now - Date.parse(day) <= 48 * 3600_000 ? Date.parse(day) : Date.parse(iso(now).slice(0, 10));
  const from = iso(Math.min(dayMs, now - STREAM_MS));
  const errors: string[] = [];
  const soft = async <T,>(what: string, q: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> => {
    const { data, error } = await q;
    if (error) {
      console.error(`live: ${what}`, error);
      errors.push(what);
    }
    return data ?? [];
  };

  type VisitorRow = {
    sid: string;
    first_seen: string;
    session_start: string;
    last_seen: string;
    left_at: string | null;
    host: string;
    funnel: string;
    page: string;
    lang: string;
    path: string;
    country: string;
    region: string;
    city: string;
    lat: number | null;
    lon: number | null;
    device: string;
    source: string;
    campaign: string;
    views: number;
  };
  type ViewRow = { id: number; at: string; sid: string; host: string; funnel: string; page: string; lang: string; path: string; country: string; city: string; source: string; campaign: string };
  type CheckoutRow = { funnel: string; email: string; name: string | null; lang: string | null; started_at: string };
  type OrderRow = { id: string; funnel: string; name: string | null; email: string | null; country: string | null; amount_cents: number; currency: string; offer: string | null; parent: string | null; lang: string | null; status: string; created_at: string };
  type ClickRow = { id: number; email: string; url: string; created_at: string };

  const [visitorRows, viewRows, checkoutRows, orderRows, clickRows, first, rate] = await Promise.all([
    soft<VisitorRow>("visitors", db.from("live_visitors").select("*").gte("last_seen", iso(now - RECENT_MS)).order("last_seen", { ascending: false }).limit(500)),
    // The checkout's step 1 comes from checkout_starts instead, with the name.
    soft<ViewRow>("page views", db.from("live_events").select("*").gte("at", iso(now - STREAM_MS)).neq("page", "checkout").order("at", { ascending: false }).limit(STREAM_MAX)),
    soft<CheckoutRow>("checkouts", db.from("checkout_starts").select("funnel, email, name, lang, started_at").gte("started_at", from).order("started_at", { ascending: false }).limit(500)),
    soft<OrderRow>("orders", db.from("orders").select("id, funnel, name, email, country, amount_cents, currency, offer, parent, lang, status, created_at").gte("created_at", from).order("created_at", { ascending: false }).limit(500)),
    soft<ClickRow>("email clicks", db.from("email_clicks").select("id, email, url, created_at").gte("created_at", iso(now - STREAM_MS)).order("created_at", { ascending: false }).limit(STREAM_MAX)),
    soft<{ at: string }>("first view", db.from("live_events").select("at").order("at", { ascending: true }).limit(1)),
    usdToEur(),
  ]);

  // Dev servers write here too: production never shows their visits.
  const shown = (host: string) => process.env.NODE_ENV !== "production" || !OFF_HOST.test(host);
  const name = funnelNames();
  const offerName = (funnel: string, offer: string) => getFunnel(funnel)?.offers?.find((o) => o.id === offer)?.name ?? offer;
  const inStream = (at: string) => Date.parse(at) >= now - STREAM_MS;
  const paid = orderRows.filter((o) => o.status === "succeeded" && !testEmail(o.email));
  const checkouts = checkoutRows.filter((c) => !testEmail(c.email));

  const visitors: LiveVisitor[] = visitorRows
    .filter((v) => shown(v.host))
    .map((v) => ({
      id: v.sid,
      active: !v.left_at && now - Date.parse(v.last_seen) < ACTIVE_MS,
      funnel: v.funnel,
      funnelName: name(v.funnel),
      page: v.page,
      lang: v.lang,
      path: v.path,
      url: pageUrl(v.host, v.path),
      country: v.country,
      region: v.region,
      city: v.city,
      lat: v.lat,
      lon: v.lon,
      device: v.device,
      source: v.source,
      campaign: v.campaign,
      views: v.views,
      since: v.session_start,
      lastSeen: v.last_seen,
      leftAt: v.left_at,
      returning: Date.parse(v.session_start) - Date.parse(v.first_seen) > 60_000,
    }));

  const events: LiveEvent[] = [
    ...viewRows
      .filter((v) => shown(v.host))
      .map((v): LiveEvent => ({
        kind: "view",
        id: `v${v.id}`,
        at: v.at,
        visitor: v.sid,
        funnel: v.funnel,
        funnelName: name(v.funnel),
        lang: v.lang,
        page: v.page,
        path: v.path,
        url: pageUrl(v.host, v.path),
        country: v.country,
        city: v.city,
        source: v.source,
        campaign: v.campaign,
      })),
    ...checkouts
      .filter((c) => inStream(c.started_at))
      .map((c): LiveEvent => ({
        kind: "checkout",
        id: `c${c.funnel}:${c.email}:${c.started_at}`,
        at: c.started_at,
        funnel: c.funnel,
        funnelName: name(c.funnel),
        lang: c.lang ?? "en",
        who: c.name || c.email,
      })),
    ...paid
      .filter((o) => inStream(o.created_at))
      .map((o): LiveEvent => ({
        kind: o.parent ? "upsell" : "order",
        id: `o${o.id}`,
        at: o.created_at,
        funnel: o.funnel,
        funnelName: name(o.funnel),
        lang: o.lang ?? "en",
        who: o.name || o.email || "Someone",
        amount: o.amount_cents / 100,
        currency: o.currency,
        country: o.country ?? "",
        offer: o.offer ? offerName(o.funnel, o.offer) : "",
      })),
    ...clickRows
      .filter((c) => !testEmail(c.email))
      .map((c): LiveEvent => ({ kind: "click", id: `e${c.id}`, at: c.created_at, funnel: "", funnelName: "", lang: "", who: c.email, url: c.url })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, STREAM_MAX);

  const today = paid.filter((o) => Date.parse(o.created_at) >= dayMs);
  return {
    at: iso(now),
    visitors,
    events,
    today: {
      checkouts: checkouts.filter((c) => Date.parse(c.started_at) >= dayMs).length,
      orders: today.filter((o) => !o.parent).length,
      revenue: today.reduce((sum, o) => sum + (o.amount_cents / 100) * (o.currency === "usd" ? rate : 1), 0),
    },
    since: first[0]?.at ?? null,
    errors,
  };
}
