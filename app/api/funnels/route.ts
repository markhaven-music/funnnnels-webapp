import { NextResponse } from "next/server";
import { createFunnel } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  const f = await createFunnel(body.name ?? "Untitled funnel");
  return NextResponse.json({ funnel: f }, { status: 201 });
}
