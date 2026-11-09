import { I } from "@/components/icons";

type Props = {
  trail?: { label: string }[];
  onMenu?: () => void;
  menuOpen?: boolean;
};

export function TopBar({ trail, onMenu, menuOpen = false }: Props) {
  const items = trail ?? [{ label: "Dashboard" }];
  return (
    <header className="topbar">
      {onMenu && (
        <button
          type="button"
          className="icon-btn menu-btn"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={onMenu}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      )}
      <div className="crumbs">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <span
              key={i}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {last ? <b>{it.label}</b> : <span>{it.label}</span>}
              {!last && <span className="sep">/</span>}
            </span>
          );
        })}
      </div>
      <div className="search">
        <I.search size={14} style={{ color: "var(--fg-2)" }} />
        <input placeholder="Search funnels, pages…" />
        <kbd>⌘K</kbd>
      </div>
      <div className="topbar-actions">
        <button
          className="icon-btn"
          title="Notifications"
          type="button"
        >
          <I.bell size={15} />
        </button>
        <div className="avatar" title="You">
          <I.person size={15} />
        </div>
      </div>
    </header>
  );
}
