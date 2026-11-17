import { NextResponse } from "next/server";
import { bumpFull } from "@/lib/bumpFull";
import { BUMP_LANGS, bumpTexts, ORDER_PAGE, saveBumpText } from "@/lib/bumpText";
import { CODE_FUNNELS, funnelItems } from "@/lib/catalog";
import { revalidateSalesPages } from "@/lib/pages";

export const runtime = "nodejs";

// Dashboard → Products → Order bump words: one set of words per product, said on every order
// form that sells it as a tick-box add-on (lib/bumpText.ts).
//   GET ?product=…                          its saved words per language, and where it is an add-on
//                                           (that checkout's price, the struck full price, the order page)
//   PUT { product, lang, headline, body }   save them (both empty: back to each funnel's own words)
// Behind ADMIN_PASSWORD (proxy.ts).

async function addOnUses(product: string) {
  const names = Object.fromEntries(CODE_FUNNELS.map((f) => [f.slug, f.name]));
  return (await funnelItems())
    .filter((i) => i.role === "bump" && i.product === product && ORDER_PAGE[i.funnel])
    .map((i) => ({
      funnel: i.funnel,
      funnelName: names[i.funnel] ?? i.funnel,
      key: i.key,
      price: i.price.eur,
      full: bumpFull(i.key, i.price.eur) ?? i.price.eur,
      // Only the MIDI Drum Kit has an Italian order page.
      pages: Object.fromEntries(BUMP_LANGS.filter((l) => l === "en" || i.funnel === "midi-drum-kit").map((l) => [l, ORDER_PAGE[i.funnel](l)])),
    }));
}

export async function GET(req: Request) {
  const product = new URL(req.url).searchParams.get("product") ?? "";
  try {
    const [texts, uses] = await Promise.all([bumpTexts(), addOnUses(product)]);
    return NextResponse.json({ texts: texts[product] ?? {}, uses });
  } catch (err) {
    console.error("bump text: load failed", err);
    return NextResponse.json({ error: "Couldn't load." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const product = String(body.product ?? "");
  const lang = String(body.lang ?? "");
  if (!product || !(BUMP_LANGS as readonly string[]).includes(lang)) return NextResponse.json({ error: "Unknown product or language." }, { status: 400 });
  try {
    await saveBumpText(product, lang, { headline: String(body.headline ?? "").slice(0, 300), body: String(body.body ?? "").slice(0, 6000) });
    const uses = await addOnUses(product);
    for (const funnel of new Set(uses.map((u) => u.funnel))) revalidateSalesPages(funnel);
    return NextResponse.json({ ok: true, forms: uses.length });
  } catch (err) {
    console.error("bump text: save failed", err);
    return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
}
