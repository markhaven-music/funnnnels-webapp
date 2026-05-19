"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { I } from "@/components/icons";
import { FunnelCard } from "@/components/FunnelCard";
import { NewFunnelTile } from "@/components/NewFunnelTile";
import type { FunnelStatus, StoredFunnel } from "@/lib/blocks";

type TabKey = "all" | FunnelStatus;
const TABS: TabKey[] = ["all", "live", "test", "draft"];

type Props = { onAsk: (p: string) => void; funnels: StoredFunnel[] };

export function MainPanel({ onAsk, funnels }: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  const filtered = useMemo(() => {
    if (tab === "all") return funnels;
    return funnels.filter((f) => f.status === tab);
  }, [tab, funnels]);

  const counts = useMemo(() => {
    const c = { live: 0, draft: 0, test: 0 };
    for (const f of funnels) c[f.status] += 1;
    return c;
  }, [funnels]);

  const empty = funnels.length === 0;

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {empty ? "Welcome to funnnnels." : "Your funnels"}
          </h1>
          <p className="page-sub">
            {empty ? (
              <>Build your first funnel by describing it in plain English.</>
            ) : (
              <>
                <span className="mono">
                  {funnels.length} funnel{funnels.length === 1 ? "" : "s"}
                </span>
                {counts.live > 0 && (
                  <>
                    {" · "}
                    <span className="mono" style={{ color: "var(--mint)" }}>
                      {counts.live} live
                    </span>
                  </>
                )}
                {counts.draft > 0 && (
                  <>
                    {" · "}
                    <span className="mono">{counts.draft} draft</span>
                  </>
                )}
                {counts.test > 0 && (
                  <>
                    {" · "}
                    <span className="mono" style={{ color: "var(--amber)" }}>
                      {counts.test} in test
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <div className="cta-group">
          <Link href="/funnels/new" className="btn primary">
            <I.sparkles size={14} /> New with AI
          </Link>
        </div>
      </div>

      {!empty && (
        <div className="section-head">
          <div className="section-title">
            All funnels
            <span className="count">
              {filtered.length} of {funnels.length}
            </span>
          </div>
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={empty ? "funnels funnels--empty" : "funnels"}>
        <NewFunnelTile onPrompt={onAsk} prominent={empty} />
        {filtered.map((f) => (
          <FunnelCard key={f.id} f={f} />
        ))}
      </div>
    </main>
  );
}
