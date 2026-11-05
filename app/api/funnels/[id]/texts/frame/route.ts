import { funnel } from "@/app/(funnels)/midi-drum-kit/funnel";
import { isLang } from "@/app/(funnels)/midi-drum-kit/i18n";
import { landingHtml } from "@/app/(funnels)/midi-drum-kit/landing";
import { upsellHtml } from "@/app/(funnels)/midi-drum-kit/upsell";
import { funnel as famousBeats } from "@/app/(funnels)/famous-beats-bundle/funnel";
import { landingHtml as famousLandingHtml } from "@/app/(funnels)/famous-beats-bundle/landing";
import { isPage } from "@/app/free/packs";
import { freeHtml } from "@/app/free/render";
import { pageLayouts } from "@/lib/pageLayout";
import { pageEdits } from "@/lib/pageTexts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The MIDI Drum Kit's ClickFunnels pages (sales page, both upsells) as the
// dashboard's editor shows them (components/PageFrame.tsx): the page as it is
// live in euros, with its saved texts and layout, each editable text between
// <!--fx:tNNN--> and <!--/fx--> so a click finds it, every section tagged
// data-fs (the hidden ones kept, data-fs-hidden) and every picture data-fi.
// Without the page's scripts: no tracking, no visit counted, no buttons that
// go anywhere.
// The sales page shows the code's price, so the words saved say the same
// price the code does (the live page restates it).
// The same for the other copied pages (lib/editablePages.ts): the Famous Beats
// Bundle's sales page and the free packs' sign-up pages, each block of words
// marked <!--fx:h…--> (lib/htmlTexts.ts). Behind ADMIN_PASSWORD (proxy.ts).
const SCRIPT = /<script\b[^>]*>[\s\S]*?<\/script>/gi;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const page = q.get("page") ?? "";
  const lang = q.get("lang") ?? "";
  let html: string | null = null;
  if (id === famousBeats.slug && page === "landing") {
    html = famousLandingHtml("eur", famousBeats.price.eur, (await pageEdits(id, "en")).landing ?? {}, true);
  } else if (id === "free" && isPage(page)) {
    html = freeHtml(page, (await pageEdits("free", "en"))[page] ?? {}, true);
  } else if (id !== funnel.slug || !isLang(lang)) {
    return new Response("Not found", { status: 404 });
  } else if (page === "landing") {
    const [edits, layouts] = await Promise.all([pageEdits(funnel.slug, lang), pageLayouts(funnel.slug, lang)]);
    html = landingHtml(lang, "eur", funnel.price.eur, edits, true, layouts.landing ?? {});
  }
  else if (page === "famous-beats" || page === "top-hits") html = await upsellHtml(page, lang, "eur", funnel.slug, true);
  if (!html) return new Response("Not found", { status: 404 });

  return new Response(html.replace(SCRIPT, "").replace(/<head>/i, '<head>\n<meta name="robots" content="noindex">'), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
