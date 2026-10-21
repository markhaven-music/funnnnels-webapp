import { NextResponse } from "next/server";
import { deleteBroadcast, getBroadcast, updateBroadcast, type BroadcastPatch } from "@/lib/broadcasts";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const b = await getBroadcast((await ctx.params).id);
  return b ? NextResponse.json({ broadcast: b }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}

// Edit, schedule ({ status: "scheduled", sendAt }), back to draft, or cancel.
export async function PATCH(req: Request, ctx: Ctx) {
  const body = await req.json().catch(() => ({}));
  const patch: BroadcastPatch = {};
  for (const k of ["subject", "preheader", "body"] as const) if (typeof body[k] === "string") patch[k] = body[k];
  for (const k of ["audienceTag", "excludeTag"] as const) if (typeof body[k] === "string" || body[k] === null) patch[k] = body[k];
  if (body.sendAt === null) patch.sendAt = null;
  if (typeof body.sendAt === "string") {
    const t = Date.parse(body.sendAt);
    if (Number.isNaN(t)) return NextResponse.json({ error: "Bad send time." }, { status: 400 });
    patch.sendAt = new Date(t).toISOString();
  }
  if (["draft", "scheduled", "cancelled"].includes(body.status)) patch.status = body.status;
  const r = await updateBroadcast((await ctx.params).id, patch);
  return "error" in r ? NextResponse.json(r, { status: 409 }) : NextResponse.json({ broadcast: r });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const r = await deleteBroadcast((await ctx.params).id);
  return r.error ? NextResponse.json(r, { status: 409 }) : NextResponse.json({ ok: true });
}
