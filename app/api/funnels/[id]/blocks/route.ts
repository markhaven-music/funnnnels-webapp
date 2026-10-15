import { NextResponse } from "next/server";
import { SECTION_LABELS, defaultSection, type SectionType } from "@/app/(funnels)/jazz-midi-pack/content";
import { isAddable } from "@/lib/addable";
import type { Block } from "@/lib/blocks";
import { addBlock, getFunnel } from "@/lib/store";

export const runtime = "nodejs";

// "Add section" in the editor: appends a section of that type with its default
// content, which you then edit in place and drag where it belongs.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (!isAddable(id, body.type)) {
    return NextResponse.json({ error: "Unknown section type" }, { status: 400 });
  }
  // Builder blocks get their defaults inside addBlock; code-funnel sections bring their own.
  const props = body.type in SECTION_LABELS ? defaultSection(body.type as SectionType).props : {};
  const block = await addBlock(id, body.type as Block["type"], props as Record<string, unknown>);
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ block, funnel: await getFunnel(id) });
}
