import { NextResponse } from "next/server";
import { undoFunnel } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const f = await undoFunnel(id);
  if (!f) {
    return NextResponse.json(
      { error: "Nothing to undo" },
      { status: 409 },
    );
  }
  return NextResponse.json({ funnel: f });
}
