import { NextResponse } from "next/server";
import { deleteFunnel, getFunnel } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const f = await getFunnel(id);
  if (!f) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }
  return NextResponse.json({ funnel: f });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const ok = await deleteFunnel(id);
  if (!ok) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
