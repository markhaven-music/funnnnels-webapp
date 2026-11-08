import type { Metrics } from "@/lib/analytics";
import type { StoredFunnel } from "@/lib/blocks";

// The funnels built in code (app/(funnels)/<slug>) on the dashboard's funnel
// list. They have no row in the `funnels` table (only Jazz does, because its
// sections can be edited), so they're added here, live; every card opens the
// funnel's map (app/funnels/[id]). Their visits, CVR and revenue
// come from dashboard → Analytics (see withStats).

// tag: the word on the card's picture ("Sales" when not given).
type CodeCard = { id: string; name: string; image: string; steps: number; tag?: string; category?: StoredFunnel["category"] };

const CARDS: CodeCard[] = [
  {
    id: "midi-drum-kit",
    name: "MIDI Drum Kit",
    image: "/funnels/midi-drum-kit/preview.webp",
    steps: 3,
  },
  {
    id: "top-hits-midi-bundle",
    name: "TOP HITS MIDI Bundle",
    image: "/funnels/top-hits-midi-bundle/preview.webp",
    steps: 3,
  },
  {
    id: "famous-beats-bundle",
    name: "Famous Beats Bundle",
    image: "/funnels/famous-beats-bundle/preview.webp",
    steps: 3,
  },
  {
    id: "drunk-swing-grooves",
    name: "Drunk Swing Grooves",
    image: "/funnels/drunk-swing-grooves/preview.webp",
    steps: 4,
  },
  // The free lead magnets (app/free), listed apart under Lead magnets, one card per
  // pack. Each opens its map (lib/funnelMap.ts freePacksMap): the sign-up page, then
  // the MIDI Drum Kit's pages. Analytics doesn't count them, so the cards show no
  // visits; the map has their numbers. Their ids are the opt-ins' (app/free/packs.ts).
  ...[
    { id: "free-rolls", name: "Free Rolls Pack", shot: "optin-rolls" },
    { id: "free-bounce", name: "Free Bounce Pack", shot: "optin-bounce" },
    { id: "free-hooks", name: "Free Mystery Hooks Pack", shot: "optin-hooks" },
  ].map((p): CodeCard => ({ id: p.id, name: p.name, image: `/funnels/free/${p.shot}.webp`, steps: 4, tag: "Lead magnet", category: "lead-magnet" })),
];

// The cards show a screenshot of the first page: public/funnels/<slug>/preview.webp,
// made by tools/funnel-previews.sh. Jazz has a row, so it gets its screenshot here.
const IMAGES: Record<string, string> = { "jazz-midi-pack": "/funnels/jazz-midi-pack/preview.webp" };

/** The code funnels missing from the table, first, then the table's funnels. */
export function withCodeFunnels(funnels: StoredFunnel[]): StoredFunnel[] {
  const have = new Set(funnels.map((f) => f.id));
  const code: StoredFunnel[] = CARDS.filter((c) => !have.has(c.id)).map((c) => ({
    id: c.id,
    name: c.name,
    status: "live",
    type: "Code",
    tag: c.tag ?? "Sales",
    ...(c.category ? { category: c.category } : {}),
    palette: ["oklch(0.82 0.16 75)", "oklch(0.55 0.18 280)"],
    views: "—",
    cvr: "—",
    revenue: "—",
    updated: "live",
    steps: c.steps,
    on: c.steps,
    pages: [],
    image: c.image,
  }));
  return [...code, ...funnels.map((f) => (IMAGES[f.id] ? { ...f, image: IMAGES[f.id] } : f))];
}

const eur = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const eur2 = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** The cards' visits, CVR and revenue from the Analytics numbers, keyed by funnel slug. */
export function withStats(funnels: StoredFunnel[], stats: Record<string, Metrics>, range: string): StoredFunnel[] {
  return funnels.map((f) => {
    const m = stats[f.id];
    if (!m) return f;
    const cvr = m.visitors > 0 ? `${((m.ratedOrders / m.visitors) * 100).toFixed(1)}%` : "—";
    return {
      ...f,
      views: m.visitors.toLocaleString("en-US"),
      cvr,
      revenue: eur(m.revenue),
      statsRange: range,
      stats: {
        revenue: eur(m.revenue),
        orders: m.orders.toLocaleString("en-US"),
        // Average order value: revenue (upsells included) per order.
        aov: m.orders > 0 ? eur2(m.revenue / m.orders) : "—",
        cvr,
        visitors: m.visitors.toLocaleString("en-US"),
      },
    };
  });
}
