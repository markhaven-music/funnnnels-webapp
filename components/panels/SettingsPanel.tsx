"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspaceSettings } from "@/lib/workspace";
import { DEFAULT_FUNNEL_PRINCIPLES } from "@/lib/principles";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Europe/Warsaw",
  "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney",
];

const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "PLN", label: "Polish Złoty (PLN)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
];

export function SettingsPanel() {
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
          <div><h1 className="page-title">Settings</h1></div>
        </div>
        <div style={{ color: "var(--fg-3)", fontSize: 13 }}>Loading…</div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Workspace preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
        <Section title="Workspace">
          <Field label="WORKSPACE NAME">
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings((s) => s && { ...s, name: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </Section>

        <Section title="Riley memory — funnel principles">
          <div style={{ color: "var(--fg-2)", fontSize: 12.5, lineHeight: 1.5 }}>
            Riley always reads these before building or editing a page. Leave blank to use the built-in defaults shown when you click <b>Reset to defaults</b>. Add or rewrite freely — brand voice rules, must-haves, things to avoid.
          </div>
          <Field label="PRINCIPLES">
            <textarea
              value={
                settings.funnelPrinciples && settings.funnelPrinciples.length > 0
                  ? settings.funnelPrinciples
                  : DEFAULT_FUNNEL_PRINCIPLES
              }
              onChange={(e) =>
                setSettings((s) => s && { ...s, funnelPrinciples: e.target.value })
              }
              rows={16}
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                lineHeight: 1.55,
                resize: "vertical",
                minHeight: 280,
              }}
            />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                setSettings((s) => s && { ...s, funnelPrinciples: "" })
              }
              title="Clear your custom text and fall back to the built-in defaults"
            >
              Reset to defaults
            </button>
            <span style={{ alignSelf: "center", color: "var(--fg-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
              {settings.funnelPrinciples && settings.funnelPrinciples.trim().length > 0
                ? "custom"
                : "using defaults"}
            </span>
          </div>
        </Section>

        <Section title="Localisation">
          <Field label="TIMEZONE">
            <select
              value={settings.timezone}
              onChange={(e) => setSettings((s) => s && { ...s, timezone: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>

          <Field label="CURRENCY">
            <select
              value={settings.currency}
              onChange={(e) => setSettings((s) => s && { ...s, currency: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </Field>
        </Section>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
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
        {title}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
        {label}
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
