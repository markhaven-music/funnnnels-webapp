"use client";

import { useState } from "react";
import { I } from "@/components/icons";

type Domain = {
  id: string;
  host: string;
  status: "active" | "pending" | "error";
  primary: boolean;
};

export function DomainsPanel() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [adding, setAdding] = useState(false);
  const [host, setHost] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) return;
    const d: Domain = {
      id: Math.random().toString(36).slice(2),
      host: host.trim().replace(/^https?:\/\//, ""),
      status: "pending",
      primary: domains.length === 0,
    };
    setDomains((prev) => [...prev, d]);
    setHost("");
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== id));
  };

  const statusColor = (s: Domain["status"]) =>
    s === "active" ? "var(--mint)" : s === "pending" ? "var(--amber)" : "var(--rose)";

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Domains</h1>
          <p className="page-sub">
            {domains.length === 0
              ? "Add a custom domain to publish your funnels on your own URL."
              : `${domains.length} domain${domains.length === 1 ? "" : "s"} configured`}
          </p>
        </div>
        <div className="cta-group">
          <button
            type="button"
            className="btn primary"
            onClick={() => setAdding((v) => !v)}
          >
            <I.globe size={14} /> Add domain
          </button>
        </div>
      </div>

      <div className="demo-banner">
        <I.bolt size={13} /> Demo only — domains aren&rsquo;t persisted yet.
        DNS verification and routing come with the Vercel domains integration.
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            background: "var(--bg-1)",
            border: "1px solid var(--line-soft)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
          }}
        >
          <input
            type="text"
            placeholder="yourdomain.com"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            style={{
              flex: 1,
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "6px 10px",
              color: "var(--fg-0)",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
            }}
          />
          <button type="submit" className="btn primary">Add</button>
          <button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
        </form>
      )}

      {domains.length === 0 ? (
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
          <I.globe size={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-2)" }}>No domains yet</div>
          <div style={{ fontSize: 13 }}>Add a custom domain to use your own branding on published funnels.</div>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line-soft)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                padding: "8px 16px",
                borderBottom: "1px solid var(--line-soft)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--fg-3)",
                letterSpacing: "0.04em",
                gap: 16,
              }}
            >
              <span>DOMAIN</span>
              <span>STATUS</span>
              <span>PRIMARY</span>
              <span />
            </div>
            {domains.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--line-soft)",
                  fontSize: 13,
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{d.host}</span>
                <span style={{ color: statusColor(d.status), fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  ● {d.status}
                </span>
                <span style={{ color: d.primary ? "var(--mint)" : "var(--fg-3)", fontSize: 12 }}>
                  {d.primary ? "primary" : "—"}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  title="Remove"
                  onClick={() => handleRemove(d.id)}
                  style={{ color: "var(--fg-3)" }}
                >
                  <I.trash size={13} />
                </button>
              </div>
            ))}
          </div>

          {domains.some((d) => d.status === "pending") && (
            <div
              style={{
                background: "oklch(0.82 0.16 75 / 0.08)",
                border: "1px solid oklch(0.82 0.16 75 / 0.25)",
                borderRadius: "var(--radius)",
                padding: "12px 16px",
                fontSize: 13,
                color: "oklch(0.82 0.16 75)",
              }}
            >
              Point a <strong>CNAME</strong> record from your domain to{" "}
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "oklch(0 0 0 / 0.2)",
                  padding: "1px 5px",
                  borderRadius: 4,
                }}
              >
                cname.funnnnels.com
              </code>{" "}
              and DNS will propagate within a few minutes.
            </div>
          )}
        </>
      )}
    </main>
  );
}
