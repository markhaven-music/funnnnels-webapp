import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";
import { isEra } from "@/lib/bfEra";
import { rangeParam } from "@/lib/range";

export const runtime = "nodejs";

// Dashboard → Analytics, ?range= one of lib/range.ts RANGES, ?era= regular | bf | all (lib/bfEra.ts;
// left out: all). Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(req: Request) {
  const era = new URL(req.url).searchParams.get("era");
  return NextResponse.json(await getAnalytics(rangeParam(req.url), { era: isEra(era) ? era : "all" }), { headers: { "cache-control": "no-store" } });
}
