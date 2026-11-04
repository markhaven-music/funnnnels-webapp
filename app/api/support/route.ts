import { NextResponse } from "next/server";
import { listConversations, supportConfigured } from "@/lib/support";
import { getOverview } from "@/lib/supportOverview";

export const runtime = "nodejs";

// Dashboard → Support: the conversations (lib/support.ts); ?count=1 gives
// only how many open ones from people (not spam) have unread email, for the
// sidebar.
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("count") === "1") {
    try {
      const [conversations, overview] = await Promise.all([listConversations(), getOverview()]);
      const spam = new Set(overview.items.filter((i) => i.priority === "ignore").map((i) => i.customer));
      return NextResponse.json({ unread: conversations.filter((c) => c.unread > 0 && !c.done && !spam.has(c.customer)).length });
    } catch {
      return NextResponse.json({ unread: 0 });
    }
  }
  return NextResponse.json({ configured: supportConfigured(), conversations: await listConversations() });
}
