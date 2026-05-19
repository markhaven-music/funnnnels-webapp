import Link from "next/link";
import { FunnelThumb } from "@/components/FunnelThumb";
import type { StoredFunnel } from "@/lib/blocks";

export function FunnelCard({ f }: { f: StoredFunnel }) {
  const stages = Array.from({ length: f.steps }, (_, i) => i < f.on);
  return (
    <Link href={`/funnels/${f.id}/edit`} className="funnel">
      <div className="thumb">
        <FunnelThumb palette={f.palette} />
        <div className="funnel-thumb-tag">{f.type}</div>
        <div className="funnel-thumb-watermark">{f.tag}</div>
      </div>
      <div className="body">
        <div className="row1">
          <div className="name">{f.name}</div>
          <span className={`status ${f.status}`}>
            {f.status === "live" && <span className="dotpulse" />}
            {f.status}
          </span>
        </div>
        <div className="funnel-meta">
          <span>
            <b>{f.views}</b> visits
          </span>
          <span className="pip" />
          <span>
            <b>{f.cvr}</b> cvr
          </span>
          <span className="pip" />
          <span>upd {f.updated}</span>
        </div>
      </div>
      <div className="funnel-foot">
        <div className="stage-bar">
          {stages.map((on, i) => (
            <span key={i} className={on ? "on" : ""} />
          ))}
        </div>
        <div className="conv">
          {f.revenue !== "—" ? (
            <b>{f.revenue}</b>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>— rev</span>
          )}
        </div>
      </div>
    </Link>
  );
}
