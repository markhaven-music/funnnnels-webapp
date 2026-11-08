import Link from "next/link";
import { FunnelThumb } from "@/components/FunnelThumb";
import type { StoredFunnel } from "@/lib/blocks";

// "28d" → "last 28 days", for the line under the card's numbers.
function rangeLabel(r?: string) {
  const m = r?.match(/^(\d+)d$/);
  return m ? `last ${m[1]} days` : (r ?? "");
}

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
        {f.stats ? (
          <>
            <div className="funnel-stats">
              <div className="funnel-stat">
                <div className="funnel-stat-label">Revenue</div>
                <div className="funnel-stat-value money">{f.stats.revenue}</div>
              </div>
              <div className="funnel-stat">
                <div className="funnel-stat-label">Orders</div>
                <div className="funnel-stat-value">{f.stats.orders}</div>
              </div>
              <div className="funnel-stat">
                <div className="funnel-stat-label">Avg. order (AOV)</div>
                <div className="funnel-stat-value">{f.stats.aov}</div>
              </div>
              <div className="funnel-stat">
                <div className="funnel-stat-label">Conversion</div>
                <div className="funnel-stat-value">{f.stats.cvr}</div>
              </div>
            </div>
            <div className="funnel-stats-note">
              {f.stats.visitors} visitors · {rangeLabel(f.statsRange)}
            </div>
            {f.ads && (
              <>
                <div className="funnel-stats funnel-stats--ads">
                  <div className="funnel-stat">
                    <div className="funnel-stat-label">Ad spend</div>
                    <div className="funnel-stat-value">{f.ads.spend}</div>
                  </div>
                  <div className="funnel-stat">
                    <div className="funnel-stat-label" title="Ad spend ÷ landing visitors">Cost / visitor</div>
                    <div className="funnel-stat-value">{f.ads.cpc}</div>
                  </div>
                  <div className="funnel-stat">
                    <div className="funnel-stat-label" title="Revenue ÷ ad spend">ROAS</div>
                    <div className="funnel-stat-value">{f.ads.roas}</div>
                  </div>
                  <div className="funnel-stat">
                    <div className="funnel-stat-label" title="Revenue less payment fees, less ad spend">Net profit</div>
                    <div className={`funnel-stat-value profit-${f.ads.profitTone}`}>{f.ads.profit}</div>
                  </div>
                </div>
                <div className="funnel-stats-note">
                  Meta ads since {f.ads.since} · {f.ads.visitors} visitors in those days
                </div>
              </>
            )}
          </>
        ) : (
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
        )}
      </div>
      <div className="funnel-foot">
        <div className="stage-bar">
          {stages.map((on, i) => (
            <span key={i} className={on ? "on" : ""} />
          ))}
        </div>
        <div className="conv">
          {f.stats ? null : f.revenue !== "—" ? (
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
