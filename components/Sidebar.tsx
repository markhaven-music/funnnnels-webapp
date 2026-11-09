"use client";

import { I } from "@/components/icons";
import { NAV } from "@/lib/data";

type Props = {
  funnelCount: number;
  supportUnread?: number;
  active: string;
  open?: boolean;
  onNav: (id: string) => void;
};

export function Sidebar({ funnelCount, supportUnread = 0, active, open = false, onNav }: Props) {
  return (
    <aside className={`nav ${open ? "open" : ""}`} id="main-nav">
      {NAV.map((s) => (
        <div className="nav-section" key={s.section}>
          <div className="nav-label">{s.section}</div>
          {s.items.map((it) => {
            const Ico = I[it.icon];
            const isActive = active === it.id;
            const badge =
              it.badgeKey === "funnels" && funnelCount > 0
                ? String(funnelCount)
                : it.badgeKey === "support" && supportUnread > 0
                  ? String(supportUnread)
                  : null;
            return (
              <button
                key={it.id}
                type="button"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => onNav(it.id)}
              >
                <Ico size={16} />
                <span>{it.label}</span>
                {badge && <span className={`badge ${it.badgeKey === "support" ? "unread" : ""}`}>{badge}</span>}
              </button>
            );
          })}
        </div>
      ))}
      <button
        type="button"
        className="workspace"
        onClick={() => onNav("settings")}
        title="Workspace settings"
      >
        <div className="ws-icon">
          <I.layers size={15} />
        </div>
        <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
          <div className="ws-name">My workspace</div>
          <div className="ws-plan">SOLO · 1 SEAT</div>
        </div>
        <I.settings size={14} style={{ color: "var(--fg-2)" }} />
      </button>
    </aside>
  );
}
