import { isPage, PAGES } from "../packs";
import { freeHtml } from "../render";
import { pageEdits } from "@/lib/pageTexts";

// A free lead magnet's page (../packs.ts), prebuilt and served from the CDN.
// proxy.ts rewrites ClickFunnels' paths (/download-rolls-midi-drums…) here.
// Its words as edited in the dashboard (funnel map → Edit, saved under funnel
// "free", page = the page's name); saving revalidates it, hourly at the latest.

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return PAGES.map((page) => ({ page }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isPage(page)) return new Response("Not found", { status: 404 });
  const edits = (await pageEdits("free", "en", true))[page] ?? {};
  return new Response(freeHtml(page, edits), { headers: { "content-type": "text/html; charset=utf-8" } });
}
