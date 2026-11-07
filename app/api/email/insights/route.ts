import { NextResponse } from "next/server";
import { getEmailInsights } from "@/lib/emailStats";
import { rangeParam } from "@/lib/range";

export const runtime = "nodejs";

// Dashboard → Email → Insights (and the revenue columns of Broadcasts and
// Automations), ?range= one of lib/range.ts RANGES. Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  return NextResponse.json(await getEmailInsights(rangeParam(req.url)), { headers: { "cache-control": "no-store" } });
}
