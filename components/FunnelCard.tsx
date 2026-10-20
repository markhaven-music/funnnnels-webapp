import Link from "next/link";
import { FunnelThumb } from "@/components/FunnelThumb";
import type { StoredFunnel } from "@/lib/blocks";

export function FunnelCard({ f }: { f: StoredFunnel }) {
  const stages = Array.from({ length: f.steps }, (_, i) => i < f.on);
  const body = (
    <>
      <div className="thumb">
        {f.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="funnel-thumb-img" src={f.image} alt="" loading="lazy" />
        ) : (
          <FunnelThumb palette={f.palette} />
        )}
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
          <span>{f.statsRange ?? `upd ${f.updated}`}</span>
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
    </>
  );
  // The funnel's map: its pages, their live links and numbers (app/funnels/[id]).
  return (
    <Link href={`/funnels/${f.id}`} className="funnel">
      {body}
    </Link>
  );
}
