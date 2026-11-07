import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";
import { rangeParam } from "@/lib/range";

export const runtime = "nodejs";

// Dashboard → Analytics, ?range= one of lib/range.ts RANGES. Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  return NextResponse.json(await getAnalytics(rangeParam(req.url)), { headers: { "cache-control": "no-store" } });
}
