import { NextResponse } from "next/server";
import { syncSupport } from "@/lib/support";

export const runtime = "nodejs";
export const maxDuration = 60;

// Dashboard → Support → Check now: the same copy the email job runs every minute.
export async function POST() {
  try {
    return NextResponse.json(await syncSupport());
  } catch (err) {
    console.error("support sync failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
