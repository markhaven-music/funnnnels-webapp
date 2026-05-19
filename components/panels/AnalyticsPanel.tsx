"use client";

import { I } from "@/components/icons";
import type { StoredFunnel } from "@/lib/blocks";

type Props = { funnels: StoredFunnel[] };

export function AnalyticsPanel({ funnels }: Props) {
  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">
            Visitor and conversion data per funnel.
          </p>
        </div>
        <div className="cta-group">
          <button type="button" className="btn ghost" disabled>
            <I.integrations size={14} /> Connect tracking
          </button>
        </div>
      </div>

      {/* tracking notice */}
      <div
        style={{
          background: "oklch(0.82 0.16 75 / 0.08)",
          border: "1px solid oklch(0.82 0.16 75 / 0.25)",
          borderRadius: "var(--radius)",
          padding: "12px 16px",
          fontSize: 13,
          color: "oklch(0.82 0.16 75)",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <I.analytics size={14} />
        Analytics tracking isn't connected yet. Publish a funnel and add a
        tracking integration to start collecting data.
      </div>

      {funnels.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "var(--fg-3)",
            paddingTop: "10vh",
          }}
        >
          <I.analytics size={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-2)" }}>
            No funnels to analyse
          </div>
          <div style={{ fontSize: 13 }}>Create your first funnel to see data here.</div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-soft)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              padding: "8px 16px",
              borderBottom: "1px solid var(--line-soft)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-3)",
              letterSpacing: "0.04em",
            }}
          >
            <span>FUNNEL</span>
            <span style={{ textAlign: "right" }}>VISITORS</span>
            <span style={{ textAlign: "right" }}>LEADS</span>
            <span style={{ textAlign: "right" }}>REVENUE</span>
            <span style={{ textAlign: "right" }}>CVR</span>
          </div>
          {funnels.map((f) => (
            <div
              key={f.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: "11px 16px",
                borderBottom: "1px solid var(--line-soft)",
                fontSize: 13,
                alignItems: "center",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`status ${f.status}`} style={{ marginRight: 0 }}>
                  {f.status === "live" && <span className="dotpulse" />}
                  {f.status}
                </span>
                <span style={{ color: "var(--fg-0)", fontWeight: 500 }}>{f.name}</span>
              </span>
              <span
                style={{
                  textAlign: "right",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                —
              </span>
              <span
                style={{
                  textAlign: "right",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                —
              </span>
              <span
                style={{
                  textAlign: "right",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                —
              </span>
              <span
                style={{
                  textAlign: "right",
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                —
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
