import { NextResponse } from "next/server";
import { listOrders } from "@/lib/sales";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ orders: await listOrders() });
}
