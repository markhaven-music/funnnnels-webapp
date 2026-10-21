import { funnel as drumKit } from "@/app/(funnels)/midi-drum-kit/funnel";
import { funnel as jazz } from "@/app/(funnels)/jazz-midi-pack/funnel";
import { funnel as topHits } from "@/app/(funnels)/top-hits-midi-bundle/funnel";
import type { Money } from "@/lib/launch";
import { SHOP_SLUG } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

// Dashboard → Products, as in ClickFunnels: one product per zip a buyer
// downloads, wherever it's sold. HUSTLE is one product, used as an add-on in
// two funnels; TOP HITS is one, the main product of its funnel and an upsell
// in the Drum Kit's. Each use says the funnel, the role (main, add-on, upsell,
// or free: a bonus, or a file another add-on brings), the name and price it's
// sold at there, and how many paid orders it was in (lib/sales.ts).
//
// The funnels' products come from their funnel.ts (read-only here: their
// prices live there) and the launch kit's from `products`; the shop's own are
// made and edited in the dashboard (lib/shop.ts). Jazz's old €9 Chord Pack
// add-on isn't offered any more, so it only shows as the bonus it became.

export type Role = "Main" | "Add-on" | "Upsell" | "Bonus" | "Included";

export type ProductUse = {
  funnel: string; // slug
  funnelName: string;
  role: Role;
  soldAs: string; // the name the funnel gives it
  price: Money | null; // null: free with something else
  sold: number | null; // paid orders it was in; null when free
  with?: string; // what it comes with (a bonus, an included file)
  manage: string; // where it's managed in the dashboard
};

export type CatalogProduct = {
  id: string; // the zip's file name
  name: string;
  cover: string | null;
  uses: ProductUse[];
  sold: number; // paid orders, all uses together
};

// The covers the funnels already show, by zip.
const COVERS: Record<string, string> = {
  "MIDI Drum Kit - Bundle.zip": "/funnels/midi-drum-kit/kit-box.webp",
  "EXPLORER Expansions (House, Lofi, Afrobeat).zip": "/funnels/midi-drum-kit/bump-expansions.webp",
  "HUSTLE MIDI Bundle.zip": "/funnels/midi-drum-kit/bump-hustle.webp",
  "The Chord Progressions Bible.zip": "/funnels/midi-drum-kit/bump-chords.webp",
  "Drum Loops for Songwriting.zip": "/funnels/jazz-midi-pack/bonus-5-360.webp",
  "Emotional Keys MIDI Bundle.zip": "/funnels/top-hits-midi-bundle/bump-emotional-keys.webp",
  "Famous Beats Bundle (320 MIDI Beats).zip": "/funnels/midi-drum-kit/bonus-famous.webp",
  "TOP HITS MIDI Bundle.zip": "/funnels/top-hits-midi-bundle/product.webp",
  "Jazz MIDI Pack.zip": "/funnels/jazz-midi-pack/box-520.webp",
  "Jazz MIDI Chord Pack.zip": "/funnels/jazz-midi-pack/bonus-1-360.webp",
  "Anime & Video Game MIDI Chord Pack.zip": "/funnels/jazz-midi-pack/bonus-3-360.webp",
};

type Item = { id: string; name: string; price: Money };

/** A funnel as this file reads it: what it sells, and the zip behind each file key. */
type Source = {
  slug: string;
  name: string;
  price: Money;
  files: Readonly<Record<string, string>>;
  bumps: readonly Item[];
  offers: readonly Item[];
  includes?: Readonly<Record<string, readonly string[]>>; // files an add-on brings besides its own
  bonuses?: readonly { id: string; name: string }[]; // free with the main product
  manage: string;
};

const CODE: Source[] = [
  { slug: jazz.slug, name: jazz.product, price: jazz.price, files: { ...jazz.files, ...jazz.remoteFiles }, bumps: [], offers: [], bonuses: jazz.bonuses, manage: `/funnels/${jazz.slug}` },
  { slug: topHits.slug, name: topHits.product, price: topHits.price, files: topHits.files, bumps: topHits.bumps, offers: topHits.offers, manage: `/funnels/${topHits.slug}` },
  { slug: drumKit.slug, name: drumKit.product, price: drumKit.price, files: drumKit.files, bumps: drumKit.bumps, offers: drumKit.offers, includes: drumKit.includes, manage: `/funnels/${drumKit.slug}` },
];

type KitRow = {
  slug: string;
  name: string;
  price_eur_cents: number;
  price_usd_cents: number;
  bump: { id: string; name: string; eur_cents: number; usd_cents: number } | null;
  files: Record<string, string>;
};

/** Launch-kit products (dashboard → Launches): the pack and its add-on, once their zips are uploaded. */
async function kitSources(): Promise<Source[]> {
  const { data, error } = await supabase().from("products").select("slug, name, price_eur_cents, price_usd_cents, bump, files").order("created_at");
  if (error) throw error;
  const money = (eur: number, usd: number) => ({ eur: eur / 100, usd: usd / 100 });
  return ((data ?? []) as KitRow[]).map((r) => ({
    slug: r.slug,
    name: r.name,
    price: money(r.price_eur_cents, r.price_usd_cents),
    files: r.files ?? {},
    bumps: r.bump ? [{ id: r.bump.id, name: r.bump.name, price: money(r.bump.eur_cents, r.bump.usd_cents) }] : [],
    offers: [],
    manage: "/?nav=launches",
  }));
}

/** Paid orders per "<funnel>/<file key>": the pack, each add-on ticked, each upsell taken. */
async function soldCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase()
    .from("orders")
    .select("funnel, items, offer")
    .eq("status", "succeeded")
    .neq("funnel", SHOP_SLUG)
    .limit(20000);
  if (error) throw error;
  const sold = new Map<string, number>();
  const add = (k: string) => sold.set(k, (sold.get(k) ?? 0) + 1);
  for (const o of (data ?? []) as { funnel: string; items: string[] | null; offer: string | null }[]) {
    if (o.offer) add(`${o.funnel}/${o.offer}`);
    else for (const item of o.items ?? ["pack"]) add(`${o.funnel}/${item}`);
  }
  return sold;
}

const zipOf = (path: string) => path.split("/").pop() ?? path;
const ROLE_ORDER: Role[] = ["Main", "Add-on", "Upsell", "Bonus", "Included"];

/** Every zip the funnels and launches sell, each with where and how. Main products first. */
export async function funnelCatalog(): Promise<CatalogProduct[]> {
  const [sold, kits] = await Promise.all([soldCounts(), kitSources()]);
  const byZip = new Map<string, CatalogProduct>();
  const named = new Map<string, number>();
  const use = (src: Source, key: string, u: Pick<ProductUse, "role" | "soldAs" | "price" | "with">, paid: boolean) => {
    const path = src.files[key];
    if (!path) return; // no zip behind it (yet)
    const id = zipOf(path);
    const p = byZip.get(id) ?? { id, name: id.replace(/\.zip$/i, ""), cover: COVERS[id] ?? null, uses: [], sold: 0 };
    const n = paid ? (sold.get(`${src.slug}/${key}`) ?? 0) : null;
    p.uses.push({ ...u, funnel: src.slug, funnelName: src.name, manage: src.manage, sold: n });
    // Named as buyers see it: by the funnel it's the main product of, else by
    // its first add-on or upsell, unless that one is several zips sold
    // together; else by its file.
    const rank = u.role === "Main" ? 2 : paid && !src.includes?.[key]?.length ? 1 : 0;
    if (rank > (named.get(id) ?? 0)) {
      p.name = u.soldAs;
      named.set(id, rank);
    }
    p.sold += n ?? 0;
    byZip.set(id, p);
  };
  for (const src of [...CODE, ...kits]) {
    use(src, "pack", { role: "Main", soldAs: src.name, price: src.price }, true);
    for (const b of src.bumps) {
      use(src, b.id, { role: "Add-on", soldAs: b.name, price: b.price }, true);
      for (const key of src.includes?.[b.id] ?? []) use(src, key, { role: "Included", soldAs: b.name, price: null, with: b.name }, false);
    }
    for (const o of src.offers) use(src, o.id, { role: "Upsell", soldAs: o.name, price: o.price }, true);
    for (const x of src.bonuses ?? []) use(src, x.id, { role: "Bonus", soldAs: x.name, price: null, with: src.name }, false);
  }
  const rank = (p: CatalogProduct) => Math.min(...p.uses.map((u) => ROLE_ORDER.indexOf(u.role)));
  return [...byZip.values()].sort((a, b) => rank(a) - rank(b));
}
