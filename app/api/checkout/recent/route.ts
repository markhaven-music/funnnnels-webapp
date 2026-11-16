import { NextResponse } from "next/server";
import { resolveFunnel } from "@/lib/funnels";
import { supabase } from "@/lib/supabase";
import type { RecentBuyer } from "@/lib/salesPop";

export const runtime = "nodejs";

// The recent-buyer pop-up's list (lib/salesPop.ts): the last paid orders of this funnel's own
// product in 14 days, upsells left out. Only a first name, a country and how long ago leave
// the server: no email, no surname, no amount. Real orders only, nothing made up.
//   GET ?f=<funnel slug> → { buyers: [{ name, country, ago }] }
// Cached 5 minutes at the edge so a busy landing doesn't query the DB on every visit.

const COUNTRY = new Intl.DisplayNames(["en"], { type: "region" });
const DAYS = 14;

function firstName(full: string | null): string | null {
  const w = (full ?? "").trim().split(/\s+/)[0] ?? "";
  if (!/^[\p{L}'-]{2,20}$/u.test(w) || /^test/i.test(w)) return null;
  return w[0].toUpperCase() + w.slice(1).toLowerCase();
}

export async function GET(req: Request) {
  const f = await resolveFunnel(new URL(req.url).searchParams.get("f")).catch(() => undefined);
  if (!f) return NextResponse.json({ buyers: [] });
  try {
    const since = new Date(Date.now() - DAYS * 864e5).toISOString();
    const { data, error } = await supabase()
      .from("orders")
      .select("name, country, created_at")
      .eq("funnel", f.slug)
      .eq("status", "succeeded")
      .is("parent", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    const now = Date.now();
    const buyers: RecentBuyer[] = [];
    for (const o of data ?? []) {
      const name = firstName(o.name);
      if (!name) continue;
      let country = "";
      try {
        country = o.country ? (COUNTRY.of(o.country) ?? "") : "";
      } catch {}
      buyers.push({ name, country, ago: Math.max(1, Math.round((now - Date.parse(o.created_at)) / 60000)) });
      if (buyers.length === 6) break;
    }
    return NextResponse.json(
      { buyers },
      { headers: { "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (err) {
    console.error("recent buyers failed", err);
    return NextResponse.json({ buyers: [] });
  }
}
