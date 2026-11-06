import { NextResponse } from "next/server";
import { readResumeToken } from "@/lib/mail";

export const runtime = "nodejs";

// The saved cart of an abandoned-checkout email (lib/mail.ts resumeToken):
// the order page posts the link's ?c= token and gets back the name and email
// it holds, to open on step 2 with them filled. Public, at
// m.thegrind.studio/api/checkout/resume (the brand domain forwards
// /api/checkout/* here). Only whoever got the email has the token.

const noStore = { "cache-control": "no-store" };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const cart = readResumeToken(body?.t, String(body?.funnel ?? ""));
  if (!cart) return NextResponse.json({ error: "This link has expired." }, { status: 400, headers: noStore });
  return NextResponse.json(cart, { headers: noStore });
}
