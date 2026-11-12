import { NextResponse } from "next/server";
import { blogStats } from "@/lib/blogStats";
import { rangeParam } from "@/lib/range";

export const runtime = "nodejs";

// Dashboard → Blog (lib/blogStats.ts), ?range= one of lib/range.ts RANGES. Behind the dashboard password (proxy.ts).
export async function GET(req: Request) {
  return NextResponse.json(await blogStats(rangeParam(req.url, "28d")));
}
