import { NextResponse } from "next/server";
import { isLang } from "@/app/(funnels)/midi-drum-kit/i18n";
import { codeTexts, isTextPage } from "@/app/(funnels)/midi-drum-kit/texts";
import { revalidateDrumKitTexts, saveTexts } from "@/lib/pageTexts";

export const runtime = "nodejs";

// Funnel map → Edit on a MIDI Drum Kit page (app/funnels/[id]/texts): saves the
// words changed in one page and language, then rebuilds the cached pages so
// they're live in seconds. Only keys the page has; behind ADMIN_PASSWORD (proxy.ts).
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (id !== "midi-drum-kit") return NextResponse.json({ error: "This funnel's texts aren't edited here." }, { status: 404 });
  let body: { page?: unknown; lang?: unknown; set?: unknown; reset?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { page, lang } = body;
  if (!isTextPage(page) || typeof lang !== "string" || !isLang(lang)) {
    return NextResponse.json({ error: "Unknown page or language" }, { status: 400 });
  }
  const known = codeTexts(page, lang);
  const set: Record<string, string> = {};
  for (const [key, value] of Object.entries((body.set ?? {}) as Record<string, unknown>)) {
    if (!(key in known) || typeof value !== "string" || value.length > 20000) {
      return NextResponse.json({ error: `Can't save the text ${key}` }, { status: 400 });
    }
    set[key] = value;
  }
  const reset = Array.isArray(body.reset) ? body.reset.filter((k): k is string => typeof k === "string" && k in known) : [];
  try {
    await saveTexts(id, page, lang, set, reset);
  } catch (err) {
    console.error("texts: save failed", err);
    return NextResponse.json({ error: "Couldn't save the texts." }, { status: 500 });
  }
  revalidateDrumKitTexts(lang);
  return NextResponse.json({ ok: true });
}
