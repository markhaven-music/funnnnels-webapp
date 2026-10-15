import { NextResponse } from "next/server";
import { updateLaunchEmail } from "@/lib/products";

export const runtime = "nodejs";

// Edit one launch email (subject, body, audience, send time, draft ↔ scheduled).
// Sent emails can't change. Nothing here sends: see the Launches panel note.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; emailId: string }> }) {
  const { id, emailId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const patch: Parameters<typeof updateLaunchEmail>[2] = {};
  if (typeof body.subject === "string") patch.subject = body.subject.slice(0, 200);
  if (typeof body.body === "string") patch.body = body.body.slice(0, 20000);
  if (typeof body.audienceTag === "string" && body.audienceTag.trim()) patch.audienceTag = body.audienceTag.trim();
  if (typeof body.sendAt === "string") {
    const t = Date.parse(body.sendAt);
    if (Number.isNaN(t)) return NextResponse.json({ error: "Bad send time." }, { status: 400 });
    patch.sendAt = new Date(t).toISOString();
  }
  if (body.status === "draft" || body.status === "scheduled" || body.status === "skipped") patch.status = body.status;

  const email = await updateLaunchEmail(id, emailId, patch);
  if (!email) return NextResponse.json({ error: "Not found, or already sent." }, { status: 404 });
  return NextResponse.json({ email });
}
