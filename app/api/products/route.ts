import { NextResponse } from "next/server";
import { ADD_ON_FUNNELS, productUses } from "@/lib/catalog";
import { listShopProducts, shopStats } from "@/lib/shop";

export const runtime = "nodejs";

// Dashboard → Products: every product (one per zip) with every place it's
// sold (lib/catalog.ts). Behind ADMIN_PASSWORD (proxy.ts).
export async function GET() {
  try {
    const [products, stats] = await Promise.all([listShopProducts(), shopStats()]);
    const uses = await productUses(products.map((p) => ({ slug: p.slug, status: p.status, price: p.price })));
    return NextResponse.json({
      products: products.map((p) => {
        const u = uses[p.slug] ?? [];
        return { ...p, uses: u, sold: u.reduce((n, x) => n + (x.sold ?? 0), 0) };
      }),
      funnels: ADD_ON_FUNNELS,
      shop: stats,
    });
  } catch (err) {
    console.error("products: load failed", err);
    return NextResponse.json({ error: "Couldn't load the products." }, { status: 500 });
  }
}
