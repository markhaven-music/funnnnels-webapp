import { NextResponse } from "next/server";
import { getAnalytics, RANGES, type Range } from "@/lib/analytics";

export const runtime = "nodejs";

// Dashboard → Analytics, ?range=7d|28d|all. Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  const asked = new URL(req.url).searchParams.get("range") as Range;
  const range = RANGES.includes(asked) ? asked : "28d";
  return NextResponse.json(await getAnalytics(range), { headers: { "cache-control": "no-store" } });
}
