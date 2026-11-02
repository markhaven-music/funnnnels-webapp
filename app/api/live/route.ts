import { NextResponse } from "next/server";
import { getLive } from "@/lib/live";

export const runtime = "nodejs";

// Dashboard → Live, asked every 5 s while the panel is open. ?day= is the
// viewer's midnight, for "today". Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  const day = new URL(req.url).searchParams.get("day");
  return NextResponse.json(await getLive(day), { headers: { "cache-control": "no-store" } });
}
