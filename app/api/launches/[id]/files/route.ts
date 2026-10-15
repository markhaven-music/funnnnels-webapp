import { NextResponse } from "next/server";
import { attachFile, getLaunch, uploadTarget } from "@/lib/products";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Paid zips. Two steps, because a Vercel function can't receive a body over
// 4.5 MB: POST {key, filename} returns a one-time signed URL the browser PUTs
// the zip to (straight into the private bucket), then PUT {key, path} points
// the product's file at it. key = "pack" or the add-on's id.

async function keys(id: string) {
  const l = await getLaunch(id);
  if (!l) return null;
  return { slug: l.product.slug, keys: ["pack", ...(l.product.bump ? [l.product.bump.id] : [])] };
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const p = await keys(id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  if (!p.keys.includes(body.key)) return NextResponse.json({ error: "Unknown file" }, { status: 400 });
  if (typeof body.filename !== "string" || !/\.zip$/i.test(body.filename)) {
    return NextResponse.json({ error: "Upload a .zip file." }, { status: 400 });
  }
  try {
    return NextResponse.json(await uploadTarget(p.slug, body.filename));
  } catch (err) {
    console.error("upload url failed", err);
    return NextResponse.json({ error: "Couldn't start the upload." }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const p = await keys(id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  if (!p.keys.includes(body.key) || typeof body.path !== "string") {
    return NextResponse.json({ error: "Unknown file" }, { status: 400 });
  }
  try {
    return NextResponse.json({ files: await attachFile(p.slug, body.key, body.path) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
