import { I } from "@/components/icons";

type Props = {
  trail?: { label: string }[];
};

export function TopBar({ trail }: Props) {
  const items = trail ?? [{ label: "Dashboard" }];
  return (
    <header className="topbar">
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
