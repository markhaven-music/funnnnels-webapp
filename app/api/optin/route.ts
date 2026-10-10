import { NextResponse } from "next/server";
import { upsertContact } from "@/lib/contacts";
import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";

export const runtime = "nodejs";

// Public endpoint behind every funnel's opt-in form. The funnel slug picks
// the source + tags server-side, so a visitor can't tag themselves "buyer".
const FUNNELS = { [jazz.slug]: jazz.optin } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const optin = FUNNELS[String(body.funnel) as keyof typeof FUNNELS];
  if (!optin) return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });

  // Honeypot: a field humans never see. Bots fill it; pretend success.
  if (body.company) return NextResponse.json({ ok: true, download: optin.download });

  const email = String(body.email ?? "").trim();
  const name = String(body.name ?? "").trim().slice(0, 80) || undefined;
  if (email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  try {
    await upsertContact({ email, name, source: optin.source, tags: [...optin.tags] });
  } catch (err) {
    console.error("optin: contact save failed", err);
    return NextResponse.json(
      { error: "We couldn't save your email just now. Please try again in a minute." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, download: optin.download });
}
