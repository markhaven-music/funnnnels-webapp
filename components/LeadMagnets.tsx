import { FunnelCard } from "@/components/FunnelCard";
import type { StoredFunnel } from "@/lib/blocks";

/** The free packs and other lead magnets (category "lead-magnet"), listed apart from the funnels that sell. */
export const isLeadMagnet = (f: StoredFunnel) => f.category === "lead-magnet";
/** The Black Friday copies (category "black-friday", lib/blackFriday.ts), listed apart too. */
export const isBlackFriday = (f: StoredFunnel) => f.category === "black-friday";
/** Listed in a section of its own, not among the funnels that sell. */
export const isApart = (f: StoredFunnel) => isLeadMagnet(f) || isBlackFriday(f);

/** A section of cards under the funnels' grid, with its own heading; nothing when there are none. */
export function FunnelSection({ title, funnels }: { title: string; funnels: StoredFunnel[] }) {
  if (funnels.length === 0) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <div className="section-head">
        <div className="section-title">
          {title}
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

/** Funnels → Lead magnets. */
export function LeadMagnets({ funnels }: { funnels: StoredFunnel[] }) {
  return <FunnelSection title="Lead magnets" funnels={funnels} />;
}
