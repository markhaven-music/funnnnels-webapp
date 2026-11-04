import { NextResponse } from "next/server";
import { listConversations, supportConfigured, unreadConversations } from "@/lib/support";

export const runtime = "nodejs";

// Dashboard → Support: the conversations (lib/support.ts); ?count=1 gives
// only how many have unread email, for the sidebar.
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("count") === "1") {
    return NextResponse.json({ unread: await unreadConversations().catch(() => 0) });
  }
  return NextResponse.json({ configured: supportConfigured(), conversations: await listConversations() });
}
