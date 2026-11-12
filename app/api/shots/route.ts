import { PAGES_BUCKET } from "@/lib/pageLayout";
import { shotPath } from "@/lib/shots";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// PUT /api/shots?slug=midi-drum-kit&name=preview with a webp body: a funnel
// page's new screenshot (lib/shots.ts), from the GitHub Action that takes them
// after each production deploy. Public in proxy.ts, guarded by its own
// SHOTS_TOKEN (Authorization: Bearer …) so the Action never holds the admin
// password or the database key.
export async function PUT(req: Request) {
  const token = process.env.SHOTS_TOKEN;
  if (!token || req.headers.get("authorization") !== `Bearer ${token}`) return new Response("Unauthorized", { status: 401 });
  const q = new URL(req.url).searchParams;
  const path = shotPath(q.get("slug") ?? "", q.get("name") ?? "");
  if (!path) return new Response("slug and name: lowercase letters, digits and dashes", { status: 400 });
  const body = Buffer.from(await req.arrayBuffer());
  // A webp starts with RIFF....WEBP; a screenshot is ~20 KB.
  if (body.length < 12 || body.length > 1_000_000 || body.toString("ascii", 0, 4) !== "RIFF" || body.toString("ascii", 8, 12) !== "WEBP") {
    return new Response("a webp under 1 MB", { status: 400 });
  }
  const { error } = await supabase().storage.from(PAGES_BUCKET).upload(path, body, { contentType: "image/webp", cacheControl: "300", upsert: true });
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true, path });
}
