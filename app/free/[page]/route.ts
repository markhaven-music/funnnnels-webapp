import { isPage, PAGES } from "../packs";
import { freeHtml } from "../render";

// A free lead magnet's page (../packs.ts), prebuilt and served from the CDN.
// proxy.ts rewrites ClickFunnels' paths (/download-rolls-midi-drums…) here.

export const dynamic = "force-static";

export function generateStaticParams() {
  return PAGES.map((page) => ({ page }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isPage(page)) return new Response("Not found", { status: 404 });
  return new Response(freeHtml(page), { headers: { "content-type": "text/html; charset=utf-8" } });
}
