import { after, NextResponse } from "next/server";
import { isEmail, upsertContact } from "@/lib/contacts";
import { sendEmail, SUPPORT } from "@/lib/ses";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// The 1:1 coaching application (app/coaching). Saves the row
// (db/coaching.sql), tags the contact coaching-applicant, and emails the
// application to support@ so it shows in dashboard → Support.

const FIELDS = ["name", "instagram", "daw", "years", "where_stuck", "goal", "ready", "links"] as const;
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const clip = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (body.company) return NextResponse.json({ ok: true }); // honeypot

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!isEmail(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });

  const row: Record<string, string | null> = { email, page: clip(body.page, 300) };
  for (const k of FIELDS) row[k] = clip(body[k], k === "where_stuck" || k === "goal" || k === "links" ? 2000 : 200);
  const src = body.src && typeof body.src === "object" ? (body.src as Record<string, unknown>) : {};
  for (const k of UTM) row[k] = clip(src[k], 200);
  if (!row.where_stuck || !row.goal || !row.ready) {
    return NextResponse.json({ error: "Answer the three questions so I know where you are." }, { status: 400 });
  }

  const { error } = await supabase().from("coaching_applications").insert(row);
  if (error) {
    console.error("coaching: application not saved", error);
    return NextResponse.json({ error: "Couldn't send it just now. Try again in a minute." }, { status: 503 });
  }

  after(async () => {
    try {
      await upsertContact({ email, name: row.name ?? undefined, source: "coaching", tags: ["coaching-applicant"] });
    } catch (err) {
      console.error("coaching: contact not tagged", err);
    }
    const lines = [["Email", email], ...FIELDS.map((k) => [k, row[k] ?? ""]), ...UTM.map((k) => [k, row[k] ?? ""])];
    await sendEmail({
      to: SUPPORT,
      subject: `Coaching application: ${row.name ?? email}`,
      text: lines.map(([k, v]) => `${k}: ${v}`).join("\n\n"),
      html: lines.map(([k, v]) => `<p><b>${esc(k)}</b><br>${esc(v).replace(/\n/g, "<br>")}</p>`).join(""),
    }).catch((err) => console.error("coaching: notification failed", err));
  });

  return NextResponse.json({ ok: true });
}
