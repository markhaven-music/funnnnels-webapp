import { NextResponse } from "next/server";
import { listSequences, parseSequence, saveSequence } from "@/lib/sequences";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ sequences: await listSequences() });
}

export async function POST(req: Request) {
  const input = parseSequence(await req.json().catch(() => ({})));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  const id = await saveSequence(null, input);
  return NextResponse.json({ id }, { status: 201 });
}
