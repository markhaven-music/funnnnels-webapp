import { NextResponse } from "next/server";
import { editableFunnel } from "@/lib/editablePages";
import { saveTexts } from "@/lib/pageTexts";

export const runtime = "nodejs";

// Funnel map → Edit on a page built in code (app/funnels/[id]/texts, the pages
// in lib/editablePages.ts): saves the words changed in one page and language,
// then rebuilds the page's cached copies so they're live in seconds. Only keys
// the page has; behind ADMIN_PASSWORD (proxy.ts).
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const f = editableFunnel(id);
  if (!f) return NextResponse.json({ error: "This funnel's texts aren't edited here." }, { status: 404 });
  let body: { page?: unknown; lang?: unknown; set?: unknown; reset?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { lang } = body;
  const page = f.pages.find((p) => p.id === body.page);
  if (!page || typeof lang !== "string" || !f.langs.some((l) => l.lang === lang)) {
    return NextResponse.json({ error: "Unknown page or language" }, { status: 400 });
  }
  const known = page.code(lang);
  const set: Record<string, string> = {};
  for (const [key, value] of Object.entries((body.set ?? {}) as Record<string, unknown>)) {
    if (!(key in known) || typeof value !== "string" || value.length > 20000) {
      return NextResponse.json({ error: `Can't save the text ${key}` }, { status: 400 });
    }
    set[key] = value;
  }
  const reset = Array.isArray(body.reset) ? body.reset.filter((k): k is string => typeof k === "string" && k in known) : [];
  try {
    await saveTexts(id, page.id, lang, set, reset);
  } catch (err) {
    console.error("texts: save failed", err);
    return NextResponse.json({ error: "Couldn't save the texts." }, { status: 500 });
  }
  page.revalidate(lang);
  return NextResponse.json({ ok: true });
}
