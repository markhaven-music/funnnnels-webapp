import { NextResponse } from "next/server";
import { isEmail, upsertContact } from "@/lib/contacts";
import { getFunnel } from "@/lib/funnels";

export const runtime = "nodejs";

// Step 1 of the checkout: name + email. Saved as "checkout-started" so the
// abandoned-checkout automation can nudge people who never pay. A failed save
// must never block a sale, so the visitor moves on to step 2 either way.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = getFunnel(body.funnel);
  if (!f) return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });

  const email = String(body.email ?? "").trim();
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  const name = [body.firstName, body.lastName]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 80);

  try {
    await upsertContact({
      email,
      name: name || undefined,
      source: f.slug,
      tags: [...f.checkout.leadTags],
    });
  } catch (err) {
    console.error("checkout lead: contact save failed", err);
  }
  return NextResponse.json({ ok: true });
}
