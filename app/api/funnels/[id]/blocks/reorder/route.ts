import { NextResponse } from "next/server";
import { reorderBlocks } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: { orderedIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (
    !Array.isArray(body.orderedIds) ||
    !body.orderedIds.every((x) => typeof x === "string")
  ) {
    return NextResponse.json(
      { error: "orderedIds must be a string array" },
      { status: 400 },
    );
  }
  const ok = await reorderBlocks(id, body.orderedIds as string[]);
  if (!ok) return NextResponse.json({ error: "Reorder failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
