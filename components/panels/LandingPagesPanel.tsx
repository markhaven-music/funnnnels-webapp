"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FunnelCard } from "@/components/FunnelCard";
import { NewFunnelTile } from "@/components/NewFunnelTile";
import { I } from "@/components/icons";
import type { StoredFunnel } from "@/lib/blocks";

type Props = { funnels: StoredFunnel[]; onAsk: (p: string) => void };

export function LandingPagesPanel({ funnels, onAsk }: Props) {
  const pages = useMemo(
    () => funnels.filter((f) => f.type === "Landing"),
    [funnels],
  );

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Landing Pages</h1>
          <p className="page-sub">
            {pages.length === 0
              ? "Standalone pages — not part of a multi-step funnel."
              : `${pages.length} landing page${pages.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="cta-group">
          <Link href="/funnels/new" className="btn primary">
            <I.sparkles size={14} /> New with AI
          </Link>
        </div>
      </div>

      <div className={pages.length === 0 ? "funnels funnels--empty" : "funnels"}>
        <NewFunnelTile onPrompt={onAsk} prominent={pages.length === 0} />
        {pages.map((f) => (
          <FunnelCard key={f.id} f={f} />
        ))}
      </div>
    </main>
  );
}
