import { after, NextResponse } from "next/server";
import { confirmEmail } from "@/app/free/bible/confirmEmail";
import { sendEmail } from "@/lib/ses";
import { isEmail, upsertContact } from "@/lib/contacts";
import { supabase } from "@/lib/supabase";
import { CONSENT_TEXT, LAUNCH } from "@/app/free/bible/launch";

export const runtime = "nodejs";

// The MIDI DRUMS BIBLE early-access list (/free/bible/notify): email, optional
// phone with SMS consent. Saves the contact (tag bible-waitlist) and a row in
// launch_signups (the phone, the consent text they agreed to, when, from where).
// Reached on m.thegrind.studio through the Astro site's /api/checkout/* rewrite.
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (b.company) return NextResponse.json({ ok: true }); // honeypot
  const email = String(b.email ?? "").trim().toLowerCase();
  const name = String(b.name ?? "").trim().slice(0, 80) || null;
  if (!isEmail(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  const raw = String(b.phone ?? "").replace(/[^\d+]/g, "");
  const phone = raw ? (raw.startsWith("+") ? raw : `+${raw}`) : null;
  if (!phone) return NextResponse.json({ error: "Add your phone so we can text you when it opens." }, { status: 400 });
  if (!/^\+\d{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "Check your phone number and the country code next to it." }, { status: 400 });
  }
  const sms = Boolean(phone && b.sms === true);
  if (phone && !sms) return NextResponse.json({ error: "Tick the box to get the text reminders." }, { status: 400 });
  try {
    const contact = await upsertContact({ email, name: name ?? undefined, source: "bible-waitlist", tags: ["bible-waitlist"] });
    const utm = b.src && typeof b.src === "object" ? b.src : null;
    const { error } = await supabase()
      .from("launch_signups")
      .upsert(
        {
          launch: LAUNCH.key, email, name, phone, sms_consent: sms, consent_text: sms ? CONSENT_TEXT : null,
          page: typeof b.page === "string" ? b.page.slice(0, 300) : null, utm,
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        },
        { onConflict: "launch,email" },
      );
    if (error) throw error;
    // The "You're in" email (Cymatics-style confirmation), not to people who unsubscribed.
    if (contact?.status !== "unsubscribed") {
      const to = { email, name: contact?.name ?? name };
      after(() => sendEmail(confirmEmail(to)).catch((err) => console.error(`bible: confirmation to ${email} failed`, err)));
    }
  } catch (err) {
    console.error("bible: signup failed", err);
    return NextResponse.json({ error: "We couldn't save you just now. Try again in a minute." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
