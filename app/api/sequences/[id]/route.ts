import { NextResponse } from "next/server";
import { deleteSequence, parseSequence, saveSequence } from "@/lib/sequences";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const input = parseSequence(await req.json().catch(() => ({})));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  return NextResponse.json({ id: await saveSequence((await ctx.params).id, input) });
}

export async function DELETE(_: Request, ctx: Ctx) {
  await deleteSequence((await ctx.params).id);
  return NextResponse.json({ ok: true });
}
