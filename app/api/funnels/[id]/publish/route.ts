import { NextResponse } from "next/server";
import { publishFunnel } from "@/lib/store";
import { revalidateFunnelPages } from "@/lib/pages";

export const runtime = "nodejs";

// POST: copy the draft to what visitors see.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const funnel = await publishFunnel(id);
  if (!funnel) return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  revalidateFunnelPages(id);
  return NextResponse.json({ funnel });
}
