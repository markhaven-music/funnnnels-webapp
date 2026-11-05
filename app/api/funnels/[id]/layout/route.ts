import { NextResponse } from "next/server";
import { isVariant } from "@/app/(funnels)/midi-drum-kit/abtest";
import { CF_PAGES, isCfPage } from "@/app/(funnels)/midi-drum-kit/cfPages";
import { funnel } from "@/app/(funnels)/midi-drum-kit/funnel";
import { isLang, LANGS, type Lang } from "@/app/(funnels)/midi-drum-kit/i18n";
import { LANG_IMAGES } from "@/app/(funnels)/midi-drum-kit/landing";
import { sectionOrder, splitSections } from "@/lib/cfSections";
import { pagesPublicPrefix, saveLayout, type Layout, type LayoutImage } from "@/lib/pageLayout";
import { revalidateDrumKitTexts } from "@/lib/pageTexts";

export const runtime = "nodejs";

// Funnel map → Edit on a MIDI Drum Kit page (app/funnels/[id]/texts): saves
// how the page is laid out in one language (sections hidden or moved, pictures
// replaced, the button colour), or with langs: "all" in every language
// (Apply to all languages), then rebuilds the cached pages so it's live in
// seconds. Only the page's own sections, only pictures from our storage
// (../images); behind ADMIN_PASSWORD (proxy.ts).
const IMAGE_KEY = /^\/funnels\/[\w-]+\/[\w.-]+\.(?:webp|png|jpe?g|gif|svg)$/;

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (id !== funnel.slug) return NextResponse.json({ error: "This funnel's pages aren't edited here." }, { status: 404 });
  let body: { page?: unknown; lang?: unknown; layout?: unknown; langs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { page, lang, layout } = body;
  if (!isCfPage(page) || !isLang(lang) || !layout || typeof layout !== "object") {
    return NextResponse.json({ error: "Unknown page or language" }, { status: 400 });
  }
  if (body.langs !== undefined && body.langs !== "all") return NextResponse.json({ error: "langs can only be \"all\"" }, { status: 400 });
  const targets: Lang[] = body.langs === "all" ? [...LANGS] : [lang];
  const l = layout as Record<string, unknown>;
  const split = splitSections(CF_PAGES[page]);
  const ids = new Set(split.sections.map((s) => s.id));
  const sections = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && ids.has(x)))] : []);

  const clean: Layout = {};
  // The order only when it isn't the code's.
  const order = sectionOrder(split, sections(l.order));
  if (order.some((x, i) => x !== split.sections[i].id)) clean.order = order;
  const hidden = sections(l.hidden);
  if (hidden.length) clean.hidden = hidden;
  if (l.button !== undefined && l.button !== null && l.button !== "") {
    if (page !== "landing" || !isVariant(l.button)) return NextResponse.json({ error: "Unknown button colour" }, { status: 400 });
    clean.button = l.button;
  }
  const prefix = pagesPublicPrefix();
  const images: Record<string, LayoutImage> = {};
  for (const [key, v] of Object.entries((l.images && typeof l.images === "object" ? l.images : {}) as Record<string, unknown>)) {
    const i = (v ?? {}) as Partial<LayoutImage>;
    const ok =
      IMAGE_KEY.test(key) &&
      typeof i.src === "string" &&
      i.src.startsWith(prefix) &&
      /^[\w/.-]+$/.test(i.src.slice(prefix.length)) &&
      Number.isInteger(i.w) &&
      Number.isInteger(i.h) &&
      i.w! >= 1 &&
      i.h! >= 1 &&
      i.w! <= 8000 &&
      i.h! <= 8000;
    if (!ok) return NextResponse.json({ error: `Can't save the picture ${key}` }, { status: 400 });
    images[key] = { src: i.src!, w: i.w!, h: i.h! };
  }
  if (Object.keys(images).length) clean.images = images;

  try {
    for (const to of targets) await saveLayout(id, page, to, to === lang ? clean : forLanguage(clean, page, lang, to));
  } catch (err) {
    console.error("layout: save failed", err);
    return NextResponse.json({ error: "Couldn't save the layout." }, { status: 500 });
  }
  for (const to of targets) revalidateDrumKitTexts(to);
  return NextResponse.json({ ok: true, layout: clean, langs: targets });
}

const src = (name: string) => `/funnels/midi-drum-kit/${name}.webp`;

/**
 * The layout as another language saves it: the same sections and button, the
 * pictures keyed by what that language's page shows. A picture with words
 * baked in has a file per language (landing.ts LANG_IMAGES): a replacement
 * of the English value stack becomes a replacement of the French one.
 */
function forLanguage(layout: Layout, page: string, from: Lang, to: Lang): Layout {
  if (page !== "landing" || !layout.images) return layout;
  const images: Record<string, LayoutImage> = {};
  for (const [key, image] of Object.entries(layout.images)) {
    let name = key;
    for (const [code, shown] of Object.entries(LANG_IMAGES[from] ?? {})) if (key === src(shown)) name = src(code);
    for (const [code, shown] of Object.entries(LANG_IMAGES[to] ?? {})) if (name === src(code)) name = src(shown);
    images[name] = image;
  }
  return { ...layout, images };
}
