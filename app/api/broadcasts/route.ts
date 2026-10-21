import { NextResponse } from "next/server";
import { createBroadcast, getBroadcast, listBroadcasts } from "@/lib/broadcasts";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ broadcasts: await listBroadcasts() });
}

// { copyOf?: id } → a new draft (empty, or a copy of that one).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const source = typeof body.copyOf === "string" ? await getBroadcast(body.copyOf) : null;
  return NextResponse.json({ broadcast: await createBroadcast(source) }, { status: 201 });
}
