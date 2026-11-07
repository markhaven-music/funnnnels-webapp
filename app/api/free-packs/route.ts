import { NextResponse } from "next/server";
import { freePackStats } from "@/lib/freePacks";
import { rangeParam } from "@/lib/range";

export const runtime = "nodejs";

// Dashboard → Free packs (lib/freePacks.ts), ?range= one of lib/range.ts RANGES. Behind the dashboard password (proxy.ts).
export async function GET(req: Request) {
  return NextResponse.json(await freePackStats(rangeParam(req.url, "28d")));
}
