import { NextResponse } from "next/server";
import { getLtv } from "@/lib/ltv";

export const runtime = "nodejs";

// Dashboard → LTV (lib/ltv.ts). ?since=YYYY-MM-DD counts only buyers whose
// first purchase is on or after that day. Holds buyers' names and emails:
// behind ADMIN_PASSWORD like every non-public route (proxy.ts); never add it to PUBLIC.
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("since");
  const since = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw)) ? raw : null;
  return NextResponse.json(await getLtv(since), { headers: { "cache-control": "private, no-store" } });
}
