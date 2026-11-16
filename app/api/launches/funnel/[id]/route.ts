import { NextResponse } from "next/server";
import { getFunnelLaunch } from "@/lib/funnelLaunches";

export const runtime = "nodejs";

// Dashboard → Launches → a code funnel's launch stats (lib/funnelLaunches.ts).
// Behind ADMIN_PASSWORD like every non-public route (proxy.ts).
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const stats = await getFunnelLaunch(id);
    if (!stats) return NextResponse.json({ error: "No such launch." }, { status: 404 });
    return NextResponse.json(stats);
  } catch (err) {
    console.error("funnel launch stats failed", err);
    return NextResponse.json({ error: (err as Error).message || "Couldn't read the launch." }, { status: 500 });
  }
}
