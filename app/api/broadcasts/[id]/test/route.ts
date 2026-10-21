import { NextResponse } from "next/server";
import { getBroadcast } from "@/lib/broadcasts";
import { isEmail } from "@/lib/contacts";
import { sendTest } from "@/lib/outbox";

export const runtime = "nodejs";

// "Send me a test": the broadcast as it is now, to one address.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { to } = await req.json().catch(() => ({}));
  if (typeof to !== "string" || !isEmail(to.trim())) return NextResponse.json({ error: "Type a valid email." }, { status: 400 });
  const b = await getBroadcast((await ctx.params).id);
  if (!b) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    await sendTest(to.trim(), b);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String((err as Error).message ?? err).slice(0, 300) }, { status: 502 });
  }
}
