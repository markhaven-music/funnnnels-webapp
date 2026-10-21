import { NextResponse } from "next/server";
import { attachImage, attachZip, getShopProduct, imageUploadTargets, revalidateShop, zipUploadTarget } from "@/lib/shop";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

// A product's zip and picture, in two steps because a Vercel function can't
// receive a body over 4.5 MB: POST returns one-time signed URLs the browser
// PUTs the files to (straight into storage), then PUT points the product at them.
//   POST { kind: "zip", filename }  → { path, signedUrl }
//   POST { kind: "image", ext }     → { sm, lg }: the 600 and 1200 px webp (or jpg)
//   PUT  { kind: "zip", path } | { kind: "image", sm, lg } → { product }

export async function POST(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!(await getShopProduct(slug))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.kind === "zip") {
      if (typeof body.filename !== "string" || !/\.zip$/i.test(body.filename)) {
        return NextResponse.json({ error: "Upload a .zip file." }, { status: 400 });
      }
      return NextResponse.json(await zipUploadTarget(slug, body.filename));
    }
    if (body.kind === "image" && (body.ext === "webp" || body.ext === "jpg")) {
      return NextResponse.json(await imageUploadTargets(slug, body.ext));
    }
    return NextResponse.json({ error: "Unknown file" }, { status: 400 });
  } catch (err) {
    console.error("shop: upload url failed", err);
    return NextResponse.json({ error: "Couldn't start the upload." }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const product =
      body.kind === "zip" && typeof body.path === "string"
        ? await attachZip(slug, body.path)
        : body.kind === "image" && typeof body.sm === "string" && typeof body.lg === "string"
          ? await attachImage(slug, { sm: body.sm, lg: body.lg })
          : null;
    if (!product) return NextResponse.json({ error: "Unknown file" }, { status: 400 });
    revalidateShop(slug);
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
