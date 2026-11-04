import { NextResponse } from "next/server";
import { freePackStats } from "@/lib/freePacks";

export const runtime = "nodejs";

// Dashboard → Free packs (lib/freePacks.ts). Behind the dashboard password (proxy.ts).
export async function GET(req: Request) {
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 90));
  return NextResponse.json(await freePackStats(days));
}
