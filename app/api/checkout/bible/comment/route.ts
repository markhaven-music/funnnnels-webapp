import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isEmail, upsertContact } from "@/lib/contacts";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Comments under the MIDI DRUMS BIBLE launch videos (Jeff Walker's prelaunch:
// people answer under the video, and the answers are the social proof).
// Published at once; links are refused, a row can be hidden by setting
// bible_comments.hidden. The email is optional and never shown: when given it joins the list (tag bible-comment).
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (b.company) return NextResponse.json({ ok: true }); // honeypot
  const video = Number(b.video);
  const name = String(b.name ?? "").trim().slice(0, 40);
  const email = String(b.email ?? "").trim().toLowerCase();
  const body = String(b.body ?? "").trim().replace(/\s+\n/g, "\n").slice(0, 800);
  if (![1, 2, 3, 4].includes(video)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Add your first name." }, { status: 400 });
  if (email && !isEmail(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  if (body.length < 3) return NextResponse.json({ error: "Write a few words." }, { status: 400 });
  if (/https?:\/\/|www\.|\.com\b/i.test(body)) return NextResponse.json({ error: "No links in comments." }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    if (ip) {
      const since = new Date(Date.now() - 10 * 60_000).toISOString();
      const { count } = await supabase().from("bible_comments").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since);
      if ((count ?? 0) >= 5) return NextResponse.json({ error: "Slow down a little. Try again in a few minutes." }, { status: 429 });
    }
    const { data, error } = await supabase().from("bible_comments").insert({ video, name, email: email || null, body, ip }).select("id, name, body, created_at").single();
    if (error) throw error;
    if (email) await upsertContact({ email, name, source: "bible-comment", tags: ["bible-comment"] }).catch(() => null);
    revalidatePath(`/free/bible/${video}`);
    return NextResponse.json({ ok: true, comment: data });
  } catch (err) {
    console.error("bible comment failed", err);
    return NextResponse.json({ error: "We couldn't post it just now. Try again in a minute." }, { status: 503 });
  }
}
