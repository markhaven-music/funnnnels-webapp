import type { Currency } from "@/lib/geo";
import { resolveFunnel } from "@/lib/funnels";
import { liveProducts, type ShopImage, type ShopItem } from "@/lib/shop";

// What the homepage and the shop show side by side, like a sample-pack store:
// the packs sold through their funnels (a click goes to the sales page, where
// the add-ons and upsells are) and the shop's Live products (a click goes to
// the product page, bought through the cart). Each sits in a category row.

export type Category = "drums" | "chords" | "more";

// nav: in the bar's menu (a row the shop always has; "Bundles & More" shows once it has a Live product).
export const CATEGORIES: { id: Category; title: string; nav?: string }[] = [
  { id: "drums", title: "Drum MIDI", nav: "Drums" },
  { id: "chords", title: "Chord MIDI", nav: "Chords" },
  { id: "more", title: "Bundles & More" },
];

export type StorePic = { src: string; srcSet?: string; width: number; height: number; fade?: boolean }; // fade: a crop on its own black, its edges blended into the tile

export type StoreItem = {
  slug: string; // the catalog's (one product per zip)
  name: string;
  line: string;
  category: Category;
  price: number; // in the page's currency
  href: string;
  pic: StorePic | null;
  funnel: boolean; // sold through its funnel (no cart)
};

// The catalog's products by kind. One made later in dashboard → Products
// goes under "Bundles & More" until it's added here.
const CATEGORY: Record<string, Category> = {
  "midi-drum-kit": "drums",
  "midi-drum-kit-pro-max": "drums",
  "essential-drum-patterns": "drums",
  "famous-beats": "drums",
  expansions: "drums",
  "drum-loops": "drums",
  "top-hits": "chords",
  "jazz-midi-pack": "chords",
  "jazz-chord-pack": "chords",
  "anime-pack": "chords",
  "emotional-keys": "chords",
  "chord-bible": "chords",
  hitmaker: "chords",
};

// The funnels' packs, in the order the store shows them. Name and price come
// from the funnel as it sells today (funnel_items), so they match its pages.
const FUNNEL_PACKS: { slug: string; funnel: string; href: string; line: string; pic: StorePic }[] = [
  {
    slug: "midi-drum-kit",
    funnel: "midi-drum-kit",
    href: "/en/midi-drum-kit",
    line: "1050 drag-and-drop drum patterns, built around bounce.",
    pic: { src: "/funnels/midi-drum-kit/kit-box.webp", width: 786, height: 1080 },
  },
  {
    slug: "top-hits",
    funnel: "top-hits-midi-bundle",
    href: "/top-hits-midi-bundle",
    line: "The chord progressions of 1,000 top hits.",
    pic: { src: "/funnels/home/top-hits-box.webp", width: 440, height: 440, fade: true },
  },
  {
    slug: "jazz-midi-pack",
    funnel: "jazz-midi-pack",
    href: "/jazz-midi-pack",
    line: "Jazz progressions, voiced like a pianist plays them.",
    pic: { src: "/funnels/jazz-midi-pack/box-520.webp", width: 520, height: 741 },
  },
];

// Never in the home or the shop (Famous Beats is sold only as an upsell after an order).
const HIDDEN = new Set(["famous-beats"]);

const FUNNEL_SLUGS = new Set([...FUNNEL_PACKS.map((p) => p.slug), ...HIDDEN]);

export const shopPic = (image: ShopImage | null): StorePic | null =>
  image ? { src: image.sm, srcSet: image.sm === image.lg ? undefined : `${image.sm} 600w, ${image.lg} 1200w`, width: 600, height: 600 } : null;

export function fromShopItem(p: ShopItem, currency: Currency): StoreItem {
  return {
    slug: p.slug,
    name: p.name,
    line: p.tagline,
    category: CATEGORY[p.slug] ?? "more",
    price: p.price[currency],
    href: `/shop/${p.slug}`,
    pic: shopPic(p.image),
    funnel: false,
  };
}

export async function funnelPacks(currency: Currency): Promise<StoreItem[]> {
  return Promise.all(
    FUNNEL_PACKS.map(async (p) => {
      const f = await resolveFunnel(p.funnel);
      if (!f) throw new Error(`store: funnel ${p.funnel} not found`);
      return {
        slug: p.slug,
        name: f.product,
        line: p.line,
        category: CATEGORY[p.slug] ?? "more",
        price: f.price[currency],
        href: p.href,
        pic: p.pic,
        funnel: true,
      };
    }),
  );
}

/** The shop's Live products, less any that are sold through a funnel (shown as the funnel's). */
export async function shopItems(currency: Currency): Promise<StoreItem[]> {
  return (await liveProducts()).filter((p) => !FUNNEL_SLUGS.has(p.slug)).map((p) => fromShopItem(p, currency));
}

/** Everything for sale: the funnels' packs first in each category, then the shop's. */
export async function storeItems(currency: Currency): Promise<StoreItem[]> {
  const [packs, shop] = await Promise.all([funnelPacks(currency), shopItems(currency)]);
  return [...packs, ...shop];
}
