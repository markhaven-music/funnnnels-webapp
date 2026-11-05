import { FunnelCard } from "@/components/FunnelCard";
import type { StoredFunnel } from "@/lib/blocks";

/** The free packs and other lead magnets (category "lead-magnet"), listed apart from the funnels that sell. */
export const isLeadMagnet = (f: StoredFunnel) => f.category === "lead-magnet";

/** Funnels → Lead magnets: their own heading and cards under the funnels' grid; nothing when there are none. */
export function LeadMagnets({ funnels }: { funnels: StoredFunnel[] }) {
  if (funnels.length === 0) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <div className="section-head">
        <div className="section-title">
          Lead magnets
          <span className="count">{funnels.length}</span>
        </div>
      </div>
      <div className="funnels">
        {funnels.map((f) => (
          <FunnelCard key={f.id} f={f} />
        ))}
      </div>
    </div>
  );
}
