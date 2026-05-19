"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FunnelCard } from "@/components/FunnelCard";
import { I } from "@/components/icons";
import type { StoredFunnel } from "@/lib/blocks";

type Props = { funnels: StoredFunnel[]; onAsk: (p: string) => void };

export function ABTestsPanel({ funnels, onAsk }: Props) {
  const tests = useMemo(
    () => funnels.filter((f) => f.status === "test"),
    [funnels],
  );

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">A/B Tests</h1>
          <p className="page-sub">
            {tests.length === 0
              ? "Funnels in test mode. Set any funnel's status to 'test' to run a split."
              : `${tests.length} experiment${tests.length === 1 ? "" : "s"} running`}
          </p>
        </div>
        <div className="cta-group">
          <button
            type="button"
            className="btn ghost"
            onClick={() =>
              onAsk("Set up an A/B test for my best-performing funnel")
            }
          >
            <I.sparkles size={14} /> Ask Riley
          </button>
          <Link href="/funnels/new" className="btn primary">
            <I.sparkles size={14} /> New test
          </Link>
        </div>
      </div>

      {tests.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "var(--fg-3)",
            paddingTop: "10vh",
          }}
        >
          <I.abtest size={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-2)" }}>
            No experiments yet
          </div>
          <div style={{ fontSize: 13, maxWidth: 300, textAlign: "center" }}>
            Open any funnel, change its status to <strong>test</strong>, and it
            will appear here.
          </div>
        </div>
      ) : (
        <div className="funnels">
          {tests.map((f) => (
            <FunnelCard key={f.id} f={f} />
          ))}
        </div>
      )}
    </main>
  );
}
