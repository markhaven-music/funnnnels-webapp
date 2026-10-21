import { NextResponse } from "next/server";
import { letter } from "@/lib/mail";

export const runtime = "nodejs";

// The editors' live preview: { subject, preheader, body, vars? } → the email's HTML,
// as a contact called Alex would get it.
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = letter({
    to: { email: "alex@example.com", name: "Alex Example" },
    subject: String(b.subject ?? ""),
    preheader: String(b.preheader ?? ""),
    body: String(b.body ?? ""),
    vars: b.vars && typeof b.vars === "object" ? b.vars : undefined,
  });
  return NextResponse.json({ subject: email.subject, html: email.html });
}
