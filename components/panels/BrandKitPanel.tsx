"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspaceSettings } from "@/lib/workspace";

const FONTS = ["Inter", "Geist", "DM Sans", "Plus Jakarta Sans", "Sora", "Outfit"];

export function BrandKitPanel() {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/workspace");
    const data = await res.json();
    setSettings(data.settings);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    await fetch("/api/workspace", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) {
    return (
      <main className="main">
        <div className="page-head">
          <div>
            <h1 className="page-title">Brand Kit</h1>
          </div>
        </div>
        <div style={{ color: "var(--fg-3)", fontSize: 13 }}>Loading…</div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Brand Kit</h1>
          <p className="page-sub">
            Colors and fonts used across your funnels.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>

        <section
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-soft)",
            borderRadius: "var(--radius)",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", marginBottom: 2 }}>
            Colours
          </div>

          <FieldRow label="Primary colour">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="color"
                value={settings.brandPrimary}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, brandPrimary: e.target.value })
                }
                style={{ width: 36, height: 36, border: "none", background: "none", cursor: "pointer", borderRadius: 8 }}
              />
              <input
                type="text"
                value={settings.brandPrimary}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, brandPrimary: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          </FieldRow>

          <FieldRow label="Accent colour">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="color"
                value={settings.brandAccent}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, brandAccent: e.target.value })
                }
                style={{ width: 36, height: 36, border: "none", background: "none", cursor: "pointer", borderRadius: 8 }}
              />
              <input
                type="text"
                value={settings.brandAccent}
                onChange={(e) =>
                  setSettings((s) => s && { ...s, brandAccent: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          </FieldRow>
        </section>

        <section
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-soft)",
            borderRadius: "var(--radius)",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", marginBottom: 2 }}>
            Typography
          </div>

          <FieldRow label="Brand font">
            <select
              value={settings.brandFont}
              onChange={(e) =>
                setSettings((s) => s && { ...s, brandFont: e.target.value })
              }
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </FieldRow>
        </section>

        <section
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-soft)",
            borderRadius: "var(--radius)",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", marginBottom: 2 }}>
            Logo
          </div>
          <FieldRow label="Logo URL">
            <input
              type="url"
              placeholder="https://…"
              value={settings.logoUrl}
              onChange={(e) =>
                setSettings((s) => s && { ...s, logoUrl: e.target.value })
              }
              style={inputStyle}
            />
          </FieldRow>
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Logo preview"
              style={{ maxHeight: 48, maxWidth: 160, objectFit: "contain", borderRadius: 6 }}
            />
          )}
        </section>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save brand kit"}
          </button>
        </div>
      </form>
    </main>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: "var(--fg-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.03em" }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "7px 10px",
  color: "var(--fg-0)",
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  width: "100%",
};
