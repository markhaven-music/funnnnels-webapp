import { NextResponse } from "next/server";
import { isRange } from "@/lib/range";
import { getVisitorStats, STAT_RANGES } from "@/lib/visitorStats";

export const runtime = "nodejs";

// Dashboard → Live → "Who they are" (lib/visitorStats.ts). ?range= one of
// STAT_RANGES; ?tz= the viewer's getTimezoneOffset(). Behind ADMIN_PASSWORD (proxy.ts).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const asked = q.get("range");
  const tz = Number(q.get("tz"));
  try {
    const stats = await getVisitorStats(
      isRange(asked) && STAT_RANGES.includes(asked) ? asked : "7d",
      Number.isFinite(tz) && Math.abs(tz) <= 840 ? tz : 0,
    );
    return NextResponse.json(stats, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("visitor stats", err);
    return NextResponse.json({ error: "Visitor stats didn't load." }, { status: 500 });
  }
}
