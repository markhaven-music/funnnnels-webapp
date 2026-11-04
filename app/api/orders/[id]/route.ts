import { NextResponse } from "next/server";
import { getOrderDetail } from "@/lib/orderDetail";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Dashboard → Orders → one order: everything known about it (lib/orderDetail.ts).
export async function GET(_: Request, ctx: Ctx) {
  const detail = await getOrderDetail((await ctx.params).id);
  return detail ? NextResponse.json(detail) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
