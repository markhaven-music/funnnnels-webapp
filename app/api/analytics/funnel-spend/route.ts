import { NextResponse } from "next/server";
import { getFunnelSpend } from "@/lib/funnelSpend";
import { rangeParam } from "@/lib/range";

export const runtime = "nodejs";

// Dashboard → Funnels, each card's ad spend, cost per visitor, ROAS and net
// profit (lib/funnelSpend.ts), ?range= one of lib/range.ts RANGES. Behind
// ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  return NextResponse.json(await getFunnelSpend(rangeParam(req.url)), { headers: { "cache-control": "no-store" } });
}
