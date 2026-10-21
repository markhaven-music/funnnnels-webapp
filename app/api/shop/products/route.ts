import { NextResponse } from "next/server";
import { checkShopProduct, createShopProduct, parseShopProduct, reorderShop, revalidateShop } from "@/lib/shop";

export const runtime = "nodejs";

// Dashboard → Shop: a new product (always a draft until its zip is in), and the shop's order.

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const product = parseShopProduct({ ...body, status: "draft" });
  const errors = checkShopProduct(product, null);
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  try {
    const created = await createShopProduct(product);
    // A 404 may be cached for this URL from before the product existed.
    revalidateShop(created.slug);
    return NextResponse.json({ product: created });
  } catch (err) {
    console.error("shop: create failed", err);
    return NextResponse.json({ error: (err as Error).message || "Couldn't create the product." }, { status: 500 });
  }
}

/** { order: [slugs] }: the products in the order the shop shows them. */
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const order = Array.isArray(body.order) ? body.order.filter((s: unknown): s is string => typeof s === "string") : [];
  if (!order.length) return NextResponse.json({ error: "Nothing to order." }, { status: 400 });
  try {
    await reorderShop(order);
    revalidateShop();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("shop: reorder failed", err);
    return NextResponse.json({ error: "Couldn't save the order." }, { status: 500 });
  }
}
