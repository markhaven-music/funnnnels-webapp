import { NextResponse } from "next/server";
import { publishFunnel } from "@/lib/store";

export const runtime = "nodejs";

// POST: copy the draft to what visitors see.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const funnel = await publishFunnel(id);
  if (!funnel) return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  return NextResponse.json({ funnel });
}
