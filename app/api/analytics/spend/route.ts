import { NextResponse } from "next/server";
import { spendByDay } from "@/lib/metaSpend";

export const runtime = "nodejs";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Dashboard → home, the net revenue vs ad spend chart: what the Meta ads cost
// day by day, ?since=YYYY-MM-DD&until=YYYY-MM-DD (inclusive). Behind
// ADMIN_PASSWORD like every non-public route (proxy.ts); Meta's answer is
// cached 10 minutes (lib/metaSpend.ts).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const since = q.get("since") ?? "";
  const until = q.get("until") ?? "";
  if (!DAY.test(since) || !DAY.test(until) || since > until) {
    return NextResponse.json({ error: "since and until must be days (YYYY-MM-DD), since first" }, { status: 400 });
  }
  return NextResponse.json(await spendByDay(since, until), { headers: { "cache-control": "no-store" } });
}
