import { NextResponse } from "next/server";
import { cfOrders } from "@/lib/cfOrders";

export const runtime = "nodejs";

// Dashboard → ClickFunnels (lib/cfOrders.ts): every order ClickFunnels took,
// with the buyer's name and email. Behind the dashboard password (proxy.ts);
// never add this path to its PUBLIC list.
export async function GET() {
  return NextResponse.json({ orders: await cfOrders() }, { headers: { "Cache-Control": "private, no-store" } });
}
