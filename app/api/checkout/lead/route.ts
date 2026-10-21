import { NextResponse } from "next/server";
import { botReason } from "@/lib/bots";
import { isEmail, upsertContact } from "@/lib/contacts";
import { resolveFunnel } from "@/lib/funnels";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Step 1 of the checkout: name + email. Saved as "checkout-started" so the
// abandoned-checkout automation can nudge people who never pay. A failed save
// must never block a sale, so the visitor moves on to step 2 either way.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = await resolveFunnel(body.funnel);
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

  // A bot filling the form (Meta's ad review) is no lead: no contact, no reminder.
  if (botReason(req)) return NextResponse.json({ ok: true });

  const lang = typeof body.lang === "string" && f.langs?.includes(body.lang) ? body.lang : "en";

  try {
    await upsertContact({
      email,
      name: name || undefined,
      source: f.slug,
      tags: [...f.checkout.leadTags],
      lang,
    });
  } catch (err) {
    console.error("checkout lead: contact save failed", err);
  }
  // The abandoned-checkout reminder's clock (lib/outbox.ts): restarted by every
  // new attempt; a reminder already sent stays sent.
  try {
    const { error } = await supabase()
      .from("checkout_starts")
      .upsert({ funnel: f.slug, email: email.toLowerCase(), name: name || null, lang, started_at: new Date().toISOString() }, { onConflict: "funnel,email" });
    if (error) throw error;
  } catch (err) {
    console.error("checkout lead: checkout start save failed", err);
  }
  return NextResponse.json({ ok: true });
}
