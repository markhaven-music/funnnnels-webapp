import { deliver } from "@/lib/catalog";
import { isPack, PACKS } from "../../packs";

export const runtime = "nodejs";

// A free pack's zip (../../packs.ts): a fresh 10-minute link to it in R2 on
// every click, so the links in the emails and on the pages never go stale.
// Free for anyone with the link, as on ClickFunnels.

export async function GET(_req: Request, { params }: { params: Promise<{ pack: string }> }) {
  const { pack } = await params;
  if (!isPack(pack)) return new Response("Not found", { status: 404 });
  const res = await deliver({ store: "r2", path: PACKS[pack].key });
  return res ?? new Response("This download isn't available right now. Please write to support@thegrind.studio.", { status: 503 });
}
