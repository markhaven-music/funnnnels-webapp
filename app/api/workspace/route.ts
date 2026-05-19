import { NextResponse } from "next/server";
import { getWorkspace, updateWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ settings: await getWorkspace() });
}

export async function PUT(req: Request) {
  const body = await req.json();
  return NextResponse.json({ settings: await updateWorkspace(body) });
}
