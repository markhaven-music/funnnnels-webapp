import { type MetaSpend, spendByPack } from "@/lib/metaSpend";
import { rangeSpan, type Range } from "@/lib/range";
import { supabase } from "@/lib/supabase";

// Dashboard → Free packs: what the free lead magnets bring in. Each opt-in
// (db/optins.sql) is a lead; per pack and per ad: how many leads, how many
// started a checkout and bought (any product) within 1, 7 and 30 days of
// opting in, and what they've spent since. People who had bought before
// opting in are counted apart ("already buyers"): the rates are about new
// buyers. A window only counts leads old enough to have lived it ("7 days"
// over leads at least 7 days old), so a fresh test shows "—", not 0%.
//
// What the ads cost comes from Meta (lib/metaSpend.ts) when META_ADS_TOKEN is set.

const DAY = 86_400_000;
export const WINDOWS = [1, 7, 30] as const;

export type Rate = { hit: number; of: number };
export type FreePackRow = {
  key: string;
  label: string;
  leads: number;
  alreadyBuyers: number;
  checkout: Rate; // started a checkout since opting in
  bought: Record<(typeof WINDOWS)[number], Rate>;
  boughtSoFar: number;
  revenue: { eur: number; usd: number }; // cents, every order since opting in
};
/** One person who opted in, and where they are now (the panel's list). */
export type FreePackPerson = {
  email: string;
  pack: string;
  ad: string | null; // utm_content / the Meta ad's name; null = no ad
  at: string; // opted in
  alreadyBuyer: boolean; // had bought before opting in
  checkoutAt: string | null; // first checkout started since
  boughtAt: string | null; // first order since
  revenue: { eur: number; usd: number };
  // The Drum Kit follow-up (db/free-packs-kit.sql): emails sent of all, and whether it's still going.
  kit: { sent: number; of: number; state: "waiting" | "sending" | "done" | "stopped"; nextAt: string | null } | null;
};
// spend: what the Meta ads cost per pack in the same period (lib/metaSpend.ts), when Meta is connected.
export type FreePackStats = { since: string; packs: FreePackRow[]; ads: FreePackRow[]; leads: number; people: FreePackPerson[]; spend: MetaSpend };

const KIT_SEQUENCE = "Free packs · Drum Kit follow-up";

type Optin = { email: string; optin: string; utm_content: string | null; utm_campaign: string | null; ad_id: string | null; created_at: string };
type Run = { email: string; next_position: number; next_at: string | null; status: string | null };
type Lead = Optin & { at: number; before: boolean; checkoutAt: number | null; buyAt: number | null; eur: number; usd: number };

const PACK_NAMES: Record<string, string> = {
  "free-rolls": "Rolls",
  "free-bounce": "Bounce",
  "free-hooks": "Mystery Hooks",
  "free-store": "Free Store",
};

async function inChunks<T>(emails: string[], run: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < emails.length; i += 300) {
    const { data, error } = await run(emails.slice(i, i + 300));
    if (error) throw error;
    out.push(...(data ?? []));
  }
  return out;
}

/** range: one of the dashboard's ranges, or the last so many days. */
export async function freePackStats(range: Range | number = "90d"): Promise<FreePackStats> {
  const db = supabase();
  const span = typeof range === "number" ? { from: Date.now() - range * DAY, until: Date.now() + DAY } : rangeSpan(range);
  const since = new Date(span.from).toISOString();
  const until = new Date(span.until).toISOString();
  const { data, error } = await db
    .from("optins")
    .select("email, optin, utm_content, utm_campaign, ad_id, created_at")
    .gte("created_at", since)
    .lt("created_at", until)
    .order("created_at", { ascending: true })
    .limit(20_000);
  if (error) throw error;

  // One lead per email and pack: their first opt-in in the period.
  const seen = new Set<string>();
  const optins = ((data ?? []) as Optin[]).filter((o) => {
    const k = `${o.optin}|${o.email}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const emails = [...new Set(optins.map((o) => o.email))];

  const [orders, starts, legacy, names, kit] = await Promise.all([
    inChunks<{ email: string; amount_cents: number; currency: string; created_at: string }>(emails, (c) =>
      db.from("orders").select("email, amount_cents, currency, created_at").eq("status", "succeeded").in("email", c),
    ),
    inChunks<{ email: string; started_at: string }>(emails, (c) => db.from("checkout_starts").select("email, started_at").in("email", c)),
    inChunks<{ email: string; bought_at: string | null }>(emails, (c) => db.from("legacy_purchases").select("email, bought_at").in("email", c)),
    (async () => {
      const ids = [...new Set(optins.map((o) => o.ad_id).filter(Boolean))] as string[];
      if (!ids.length) return [] as { ad_id: string; ad_name: string | null; campaign_name: string | null }[];
      const { data: n } = await db.from("meta_ad_names").select("ad_id, ad_name, campaign_name").in("ad_id", ids);
      return (n ?? []) as { ad_id: string; ad_name: string | null; campaign_name: string | null }[];
    })(),
    (async () => {
      const { data: seq } = await db.from("sequences").select("id, sequence_steps(id)").eq("name", KIT_SEQUENCE).maybeSingle();
      if (!seq) return { of: 0, runs: [] as Run[] };
      const runs = await inChunks<Run>(emails, (c) => db.from("sequence_runs").select("email, next_position, next_at, status").eq("sequence_id", seq.id).in("email", c));
      return { of: (seq.sequence_steps as unknown[]).length, runs };
    })(),
  ]);
  const kitBy = new Map(kit.runs.map((r) => [r.email.toLowerCase(), r]));

  const by = <T extends { email: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) {
      const k = r.email.toLowerCase();
      m.set(k, [...(m.get(k) ?? []), r]);
    }
    return m;
  };
  const ordersBy = by(orders);
  const startsBy = by(starts);
  const legacyBy = by(legacy);

  const leads: Lead[] = optins.map((o) => {
    const at = Date.parse(o.created_at);
    const mine = ordersBy.get(o.email) ?? [];
    const before =
      mine.some((x) => Date.parse(x.created_at) < at) ||
      (legacyBy.get(o.email) ?? []).some((x) => !x.bought_at || Date.parse(x.bought_at) < at);
    const after = mine.filter((x) => Date.parse(x.created_at) >= at);
    const first = (ts: number[]) => (ts.length ? Math.min(...ts) : null);
    return {
      ...o,
      at,
      before,
      checkoutAt: first((startsBy.get(o.email) ?? []).map((s) => Date.parse(s.started_at)).filter((t) => t >= at)),
      buyAt: first(after.map((x) => Date.parse(x.created_at))),
      eur: after.filter((x) => x.currency === "eur").reduce((n, x) => n + x.amount_cents, 0),
      usd: after.filter((x) => x.currency === "usd").reduce((n, x) => n + x.amount_cents, 0),
    };
  });

  const now = Date.now();
  const row = (key: string, label: string, ls: Lead[]): FreePackRow => {
    const fresh = ls.filter((l) => !l.before);
    const within = (w: number): Rate => {
      const old = fresh.filter((l) => now - l.at >= w * DAY);
      return { of: old.length, hit: old.filter((l) => l.buyAt !== null && l.buyAt - l.at <= w * DAY).length };
    };
    return {
      key,
      label,
      leads: ls.length,
      alreadyBuyers: ls.length - fresh.length,
      checkout: { of: fresh.length, hit: fresh.filter((l) => l.checkoutAt !== null).length },
      bought: { 1: within(1), 7: within(7), 30: within(30) },
      boughtSoFar: fresh.filter((l) => l.buyAt !== null).length,
      revenue: { eur: fresh.reduce((n, l) => n + l.eur, 0), usd: fresh.reduce((n, l) => n + l.usd, 0) },
    };
  };
  const group = (keyOf: (l: Lead) => string, labelOf: (l: Lead) => string) => {
    const m = new Map<string, Lead[]>();
    for (const l of leads) m.set(keyOf(l), [...(m.get(keyOf(l)) ?? []), l]);
    return [...m.entries()].map(([k, ls]) => row(k, labelOf(ls[0]), ls)).sort((a, b) => b.leads - a.leads);
  };

  const nameOf = new Map(names.map((n) => [n.ad_id, n]));
  const pack = (l: Lead) => PACK_NAMES[l.optin] ?? l.optin;
  const ad = (l: Lead) => {
    const n = l.ad_id ? nameOf.get(l.ad_id) : null;
    const name = n?.ad_name ?? l.utm_content;
    return name ? `${pack(l)} · ${name}` : `${pack(l)} · no ad (organic, email, direct)`;
  };

  const iso = (t: number | null) => (t === null ? null : new Date(t).toISOString());
  const people: FreePackPerson[] = [...leads]
    .sort((a, b) => b.at - a.at)
    .slice(0, 500)
    .map((l) => {
      const n = l.ad_id ? nameOf.get(l.ad_id) : null;
      const r = kitBy.get(l.email);
      const state = !r ? null : r.status === "done" ? "done" : r.status === "exited" ? "stopped" : r.next_position > 0 ? "sending" : "waiting";
      return {
        email: l.email,
        pack: pack(l),
        ad: n?.ad_name ?? l.utm_content ?? null,
        at: l.created_at,
        alreadyBuyer: l.before,
        checkoutAt: iso(l.checkoutAt),
        boughtAt: iso(l.buyAt),
        revenue: { eur: l.eur, usd: l.usd },
        kit: r && state ? { sent: r.next_position, of: kit.of, state, nextAt: state === "waiting" || state === "sending" ? r.next_at : null } : null,
      };
    });

  return {
    since,
    leads: leads.length,
    packs: group((l) => l.optin, pack),
    ads: group((l) => `${l.optin}|${l.ad_id ?? l.utm_content ?? ""}`, ad),
    people,
    spend: await spendByPack(
      Object.values(PACK_NAMES),
      // All time: from the first sign-up, not 1970.
      span.from ? since.slice(0, 10) : (optins[0]?.created_at ?? new Date().toISOString()).slice(0, 10),
      new Date(Math.min(Date.now(), span.until - DAY)).toISOString().slice(0, 10),
    ),
  };
}
