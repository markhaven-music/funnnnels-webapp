import { NextResponse } from "next/server";
import { getOverview } from "@/lib/supportOverview";

export const runtime = "nodejs";

// Dashboard → Support → Overview (lib/supportOverview.ts): the open
// conversations in the order to answer them, worked out by rules.
export async function GET() {
  return NextResponse.json(await getOverview());
}
