import { NextResponse } from "next/server";
import { isEra } from "@/lib/bfEra";
import { getFunnelSpend } from "@/lib/funnelSpend";
import { rangeParam } from "@/lib/range";

export const runtime = "nodejs";

// Dashboard → Funnels, each card's ad spend, cost per visitor, ROAS and net
// profit (lib/funnelSpend.ts), ?range= one of lib/range.ts RANGES, ?era= regular | bf | all
// (lib/bfEra.ts; left out: all). Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  const era = new URL(req.url).searchParams.get("era");
  // &core=1: totals with Black Friday, averages without (lib/analytics.ts Analytics.core).
  const core = new URL(req.url).searchParams.get("core") === "1";
  return NextResponse.json(await getFunnelSpend(rangeParam(req.url), isEra(era) ? era : "all", core), { headers: { "cache-control": "no-store" } });
}
