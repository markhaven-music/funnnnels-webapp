import { NextResponse } from "next/server";
import { offerProduct, ownedProducts } from "@/lib/catalog";
import { offerOf, resolveFunnel } from "@/lib/funnels";
import { getOrder } from "@/lib/orders";

export const runtime = "nodejs";

// Does the buyer of this order already have what this upsell sells?
//   { funnel, offer, order: <the order the upsell follows> } → { owned: boolean }
// Asked by every upsell page as it opens (midi-drum-kit/upsell.ts script,
// drunk-swing-grooves/UpsellButtons.tsx): owned → the page skips itself
// (2026-11-08, "se lo ha preso non deve vederlo come upsell. Questo in generale in
// tutto funnnnels"). Owned = any paid order of that email, this one included (an
// add-on ticked at checkout), or a ClickFunnels purchase (lib/catalog.ts ownedProducts).
// Only a yes/no goes back: nothing about the buyer.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const f = await resolveFunnel(body.funnel);
  const offer = f ? offerOf(f, body.offer) : undefined;
  if (!f || !offer) return NextResponse.json({ owned: false });
  try {
    const parent = await getOrder(body.order, f.slug);
    const email = parent?.status === "succeeded" ? parent.email : null;
    if (!email) return NextResponse.json({ owned: false });
    const [product, owned] = await Promise.all([offerProduct(f.slug, offer.id), ownedProducts(email, { parent: parent!.id, offer: offer.id })]);
    return NextResponse.json({ owned: Boolean(product && owned.has(product)) });
  } catch (err) {
    console.error("owned check failed", err);
    return NextResponse.json({ owned: false });
  }
}
