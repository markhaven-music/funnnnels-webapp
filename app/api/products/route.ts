import { NextResponse } from "next/server";
import { funnelCatalog } from "@/lib/catalog";

export const runtime = "nodejs";

// Dashboard → Products: the funnels' and launches' products (read-only; the
// shop's own come from /api/shop). Behind ADMIN_PASSWORD (proxy.ts).
export async function GET() {
  try {
    return NextResponse.json({ funnels: await funnelCatalog() });
  } catch (err) {
    console.error("products: load failed", err);
    return NextResponse.json({ error: "Couldn't load the funnels' products." }, { status: 500 });
  }
}
