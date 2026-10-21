import { NextResponse } from "next/server";
import { listShopProducts, revalidateShop, shopSettings, shopStats, updateShopSettings } from "@/lib/shop";

export const runtime = "nodejs";

// Dashboard → Shop. Behind ADMIN_PASSWORD like every non-public route (proxy.ts).

export async function GET() {
  try {
    const [products, settings, stats] = await Promise.all([listShopProducts(), shopSettings(), shopStats()]);
    return NextResponse.json({ products, settings, stats });
  } catch (err) {
    console.error("shop: load failed", err);
    return NextResponse.json({ error: "Couldn't load the shop." }, { status: 500 });
  }
}

/** The shop page's heading and intro. */
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const settings = await updateShopSettings({ title: String(body.title ?? ""), intro: String(body.intro ?? "") });
    revalidateShop();
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("shop: settings failed", err);
    return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
}
