import { NextResponse } from "next/server";
import { getLtv } from "@/lib/ltv";

export const runtime = "nodejs";

// Dashboard → LTV (lib/ltv.ts). Holds buyers' names and emails: behind
// ADMIN_PASSWORD like every non-public route (proxy.ts); never add it to PUBLIC.
export async function GET() {
  return NextResponse.json(await getLtv(), { headers: { "cache-control": "private, no-store" } });
}
