import { NextResponse } from "next/server";
import { getVisitorStats, STAT_DAYS } from "@/lib/visitorStats";

export const runtime = "nodejs";

// Dashboard → Live → "Who they are" (lib/visitorStats.ts). ?days= 1, 7 or 30;
// ?tz= the viewer's getTimezoneOffset(). Behind ADMIN_PASSWORD (proxy.ts).
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const days = Number(q.get("days"));
  const tz = Number(q.get("tz"));
  try {
    const stats = await getVisitorStats(
      (STAT_DAYS as readonly number[]).includes(days) ? days : 7,
      Number.isFinite(tz) && Math.abs(tz) <= 840 ? tz : 0,
    );
    return NextResponse.json(stats, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("visitor stats", err);
    return NextResponse.json({ error: "Visitor stats didn't load." }, { status: 500 });
  }
}
