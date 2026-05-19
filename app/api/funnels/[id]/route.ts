import { NextResponse } from "next/server";
import { deleteFunnel, getFunnel, updateFunnel } from "@/lib/store";
import type { FunnelStatus } from "@/lib/blocks";

export const runtime = "nodejs";

const STATUSES: ReadonlySet<FunnelStatus> = new Set<FunnelStatus>([
  "draft",
  "live",
  "test",
]);

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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: { name?: string; status?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const patch: { name?: string; status?: FunnelStatus } = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.status === "string") {
    if (!STATUSES.has(body.status as FunnelStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status as FunnelStatus;
  }
  const f = await updateFunnel(id, patch);
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
