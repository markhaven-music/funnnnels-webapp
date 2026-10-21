import { codeFunnels, offeredBumps, type Product } from "@/lib/funnels";
import type { Money } from "@/lib/launch";
import { getKitProduct } from "@/lib/products";
import { SHOP_SLUG } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

// Dashboard → Products: everything sold, wherever it's sold. The shop's
// products are made and edited there (lib/shop.ts); this file lists the
// others, read-only: the funnels' products (prices, add-ons and upsells in
// their funnel.ts) and the launch kit's (edited in Launches). With how many
// times each sold, from the recorded orders (lib/sales.ts).

export type CatalogExtra = { id: string; name: string; price: Money; sold: number };

export type CatalogEntry = {
  slug: string;
  name: string;
  kind: "funnel" | "launch";
  price: Money;
  cover: string | null;
  addOns: CatalogExtra[]; // tick-boxes at the checkout
  upsells: CatalogExtra[]; // one-click offers after it
  sold: number; // orders of the product itself
  manage: string; // where it's managed in the dashboard: its funnel's map, or Launches
};

// The box art the funnels already show.
const COVERS: Record<string, string> = {
  "jazz-midi-pack": "/funnels/jazz-midi-pack/box-520.webp",
  "midi-drum-kit": "/funnels/midi-drum-kit/kit-box.webp",
  "top-hits-midi-bundle": "/funnels/top-hits-midi-bundle/product.webp",
};

// Add-ons a checkout no longer offers, kept in funnel.ts only so old orders verify.
const RETIRED = new Set(["jazz-midi-pack/chord-pack"]);

type OrderRow = { funnel: string; items: string[] | null; offer: string | null };

/** Orders per funnel, and per add-on and upsell id within it. */
async function soldCounts(): Promise<{ main: Map<string, number>; extra: Map<string, number> }> {
  const { data, error } = await supabase()
    .from("orders")
    .select("funnel, items, offer")
    .eq("status", "succeeded")
    .neq("funnel", SHOP_SLUG)
    .limit(20000);
  if (error) throw error;
  const main = new Map<string, number>();
  const extra = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const o of (data ?? []) as OrderRow[]) {
    if (o.offer) {
      bump(extra, `${o.funnel}/${o.offer}`);
      continue;
    }
    bump(main, o.funnel);
    for (const item of o.items ?? []) if (item !== "pack") bump(extra, `${o.funnel}/${item}`);
  }
  return { main, extra };
}

function entry(p: Product, kind: CatalogEntry["kind"], sold: Awaited<ReturnType<typeof soldCounts>>): CatalogEntry {
  const extra = (x: { id: string; name: string; price: Money }) => ({ id: x.id, name: x.name, price: x.price, sold: sold.extra.get(`${p.slug}/${x.id}`) ?? 0 });
  return {
    slug: p.slug,
    name: p.product,
    kind,
    price: p.price,
    cover: COVERS[p.slug] ?? null,
    addOns: offeredBumps(p).filter((b) => !RETIRED.has(`${p.slug}/${b.id}`)).map(extra),
    upsells: (p.offers ?? []).map(extra),
    sold: sold.main.get(p.slug) ?? 0,
    manage: kind === "funnel" ? `/funnels/${p.slug}` : "/?nav=launches",
  };
}

/** The funnels' and launches' products, in the order the dashboard lists funnels. */
export async function funnelCatalog(): Promise<CatalogEntry[]> {
  const [sold, kits] = await Promise.all([
    soldCounts(),
    supabase().from("products").select("slug").order("created_at"),
  ]);
  if (kits.error) throw kits.error;
  const launches = await Promise.all((kits.data ?? []).map((k) => getKitProduct(k.slug)));
  return [
    ...codeFunnels().map((p) => entry(p, "funnel", sold)),
    ...launches.filter((p): p is Product => Boolean(p)).map((p) => entry(p, "launch", sold)),
  ];
}
