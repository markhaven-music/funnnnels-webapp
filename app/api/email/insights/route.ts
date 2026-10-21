import { NextResponse } from "next/server";
import { RANGES, type Range } from "@/lib/analytics";
import { getEmailInsights } from "@/lib/emailStats";

export const runtime = "nodejs";

// Dashboard → Email → Insights (and the revenue columns of Broadcasts and
// Automations), ?range=7d|28d|all. Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  const asked = new URL(req.url).searchParams.get("range") as Range;
  const range = RANGES.includes(asked) ? asked : "28d";
  return NextResponse.json(await getEmailInsights(range), { headers: { "cache-control": "no-store" } });
}
