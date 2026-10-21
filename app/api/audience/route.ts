import { NextResponse } from "next/server";
import { audienceSize, contactTags } from "@/lib/contacts";

export const runtime = "nodejs";

// The editors' audience pickers: every tag with its count, and ?tag=&exclude=
// → how many subscribed contacts a send would reach.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tag = url.searchParams.get("tag") || null;
  const exclude = url.searchParams.get("exclude") || null;
  const [tags, size] = await Promise.all([contactTags(), audienceSize(tag, exclude)]);
  return NextResponse.json({ tags, size });
}
