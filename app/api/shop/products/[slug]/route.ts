import { NextResponse } from "next/server";
import { checkShopProduct, deleteShopProduct, getShopProduct, parseShopProduct, revalidateShop, updateShopProduct } from "@/lib/shop";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const current = await getShopProduct(slug);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const product = parseShopProduct({ ...(await req.json().catch(() => ({}))), slug });
  const errors = checkShopProduct(product, { file: current.filePath });
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  try {
    const updated = await updateShopProduct(slug, product);
    revalidateShop(slug);
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("shop: update failed", err);
    return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  try {
    const refused = await deleteShopProduct(slug);
    if (refused) return NextResponse.json(refused, { status: 409 });
    revalidateShop(slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("shop: delete failed", err);
    return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  }
}
