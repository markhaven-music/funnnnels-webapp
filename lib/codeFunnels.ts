import type { Metrics } from "@/lib/analytics";
import type { StoredFunnel } from "@/lib/blocks";

// The funnels built in code (app/(funnels)/<slug>) on the dashboard's funnel
// list. They have no row in the `funnels` table (only Jazz does, because its
// sections can be edited), so they're added here, live; every card opens the
// funnel's map (app/funnels/[id]). Their visits, CVR and revenue
// come from dashboard → Analytics (see withStats).

type CodeCard = { id: string; name: string; image: string; steps: number };

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
    tag: "Sales",
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

/** The cards' visits, CVR and revenue from the Analytics numbers, keyed by funnel slug. */
export function withStats(funnels: StoredFunnel[], stats: Record<string, Metrics>, range: string): StoredFunnel[] {
  return funnels.map((f) => {
    const m = stats[f.id];
    if (!m) return f;
    return {
      ...f,
      views: m.visitors.toLocaleString("en-US"),
      cvr: m.visitors > 0 ? `${((m.ratedOrders / m.visitors) * 100).toFixed(1)}%` : "—",
      revenue: eur(m.revenue),
      statsRange: range,
    };
  });
}
