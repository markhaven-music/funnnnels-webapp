import { NextResponse } from "next/server";
import { updateBlock } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; blockId: string }> },
) {
  const { id, blockId } = await ctx.params;
  let body: { props?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.props || typeof body.props !== "object") {
    return NextResponse.json({ error: "Missing props" }, { status: 400 });
  }
  const block = await updateBlock(id, blockId, body.props);
  if (!block) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ block });
}
