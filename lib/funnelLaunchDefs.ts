// The code funnels' launches dashboard → Launches shows (stats: lib/funnelLaunches.ts).
// Plain data: the client panel imports it too.

export type FunnelLaunchDef = {
  id: string;
  name: string;
  funnel: string; // the funnel the emails link to and the visitors land on
  /** Every funnel that sells the product: the copies count them all (as the close job does). */
  copyFunnels: string[];
  copyItem: string; // an order item that is a copy too (an add-on elsewhere)
  start: string; // ISO: the launch email
  ends: string; // ISO: the launch price ends (or at `cap` copies)
  cap: number | null;
  priceNote: string;
};

// TOP HITS: €27 / $27 until Sunday 22 Nov midnight Pacific or 100 copies, then 97
// (app/(funnels)/top-hits-chords/funnel.ts `launch`, db/top-hits-launch-close.sql).
export const FUNNEL_LAUNCHES: FunnelLaunchDef[] = [
  {
    id: "top-hits",
    name: "TOP HITS MIDI Bundle",
    funnel: "top-hits-chords",
    copyFunnels: ["top-hits-chords", "top-hits-midi-bundle"],
    copyItem: "top-hits",
    start: "2026-11-16T08:00:00Z",
    ends: "2026-11-23T08:00:00Z",
    cap: 100,
    priceNote: "€27 / $27 until Sun 22 Nov midnight PT or 100 copies, then 97",
  },
];
