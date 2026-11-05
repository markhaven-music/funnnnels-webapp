import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { funnel } from "@/app/(funnels)/midi-drum-kit/funnel";
import { PAGES_BUCKET, pagesPublicPrefix } from "@/lib/pageLayout";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Funnel map → Edit → a click on a picture: the file chosen, made webp at three
// times the width the picture takes on the page (docs/page-speed.md rule 12;
// never larger than it came, animation kept), stored in the bucket `pages` under its
// own hash, so a changed picture is a new file and the old one stays cached
// (rule 10). Answers where it's served from and its size; the editor saves
// that in the page's layout (../layout). Behind ADMIN_PASSWORD (proxy.ts).
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (id !== funnel.slug) return NextResponse.json({ error: "This funnel's pictures aren't edited here." }, { status: 404 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a picture." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a picture." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "That file isn't a picture." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The picture is over 20 MB." }, { status: 400 });
  // The width the picture takes on the page (desktop): the file is made three
  // times that (phones show it bigger, on sharper screens), never under 480 or over 2400.
  const shown = Math.round(Number(form.get("width")) || 0);
  const target = shown > 0 ? Math.min(2400, Math.max(480, shown * 3)) : 1600;

  let out: Buffer;
  let w: number;
  let h: number;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    out = await sharp(input, { animated: true }).rotate().resize({ width: target, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const meta = await sharp(out, { animated: true }).metadata();
    w = meta.width ?? target;
    h = meta.pageHeight ?? meta.height ?? 0; // an animation's height is one frame's
    if (!w || !h) throw new Error("no size");
  } catch (err) {
    console.error("images: can't read", err);
    return NextResponse.json({ error: "Couldn't read that picture." }, { status: 400 });
  }

  const name = `${id}/${createHash("sha1").update(out).digest("hex").slice(0, 16)}.webp`;
  const store = supabase().storage;
  const put = () => store.from(PAGES_BUCKET).upload(name, out, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
  let { error } = await put();
  if (error && /not found/i.test(error.message)) {
    // First picture ever: the bucket (public: the pages link straight to it).
    await store.createBucket(PAGES_BUCKET, { public: true });
    ({ error } = await put());
  }
  if (error) {
    console.error("images: upload failed", error);
    return NextResponse.json({ error: "Couldn't store the picture." }, { status: 500 });
  }
  return NextResponse.json({ src: `${pagesPublicPrefix()}${name}`, w, h, bytes: out.length });
}
