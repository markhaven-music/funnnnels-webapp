"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { I } from "@/components/icons";
import { FunnelCard } from "@/components/FunnelCard";
import { isLeadMagnet, LeadMagnets } from "@/components/LeadMagnets";
import { NewFunnelTile } from "@/components/NewFunnelTile";
import type { FunnelStatus, StoredFunnel } from "@/lib/blocks";
import type { FunnelSpend } from "@/lib/funnelSpend";

type TabKey = "all" | FunnelStatus;
const TABS: TabKey[] = ["all", "live", "test", "draft"];

type Props = { funnels: StoredFunnel[]; spend?: FunnelSpend | null };

const eur2 = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// The whole Meta bill over the cards' ad days, and the part no card carries:
// free packs (their own card under Lead magnets) and ads nobody visited from.
function SpendLine({ spend }: { spend: FunnelSpend }) {
  if (!spend.connected) return <p className="funnels-spend-note">Ad spend isn&apos;t loading: {spend.reason}</p>;
  const onFunnels = Object.values(spend.byFunnel).reduce((s, f) => s + f.spend, 0);
  const total = onFunnels + spend.leadMagnets + spend.unplaced;
  if (total === 0) return null;
  const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <p className="funnels-spend-note">
      Meta ads since {day(spend.since)}: <b>{eur2(total)}</b> · {eur2(onFunnels)} on these funnels
      {spend.leadMagnets > 0 && <> · {eur2(spend.leadMagnets)} on the free packs</>}
      {spend.unplaced > 0 && <> · {eur2(spend.unplaced)} on ads with no recorded visit, so no funnel</>}
    </p>
  );
}

export function MainPanel({ funnels: all, spend }: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  // The lead magnets (free packs) have their own section under the funnels that sell.
  const funnels = useMemo(() => all.filter((f) => !isLeadMagnet(f)), [all]);
  const magnets = useMemo(() => all.filter(isLeadMagnet), [all]);
  const filtered = useMemo(() => {
    if (tab === "all") return funnels;
    return funnels.filter((f) => f.status === tab);
  }, [tab, funnels]);
  const shownMagnets = tab === "all" ? magnets : magnets.filter((f) => f.status === tab);

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

      {spend && !empty && <SpendLine spend={spend} />}
      <div className={empty ? "funnels funnels--empty" : "funnels"}>
        <NewFunnelTile prominent={empty} />
        {filtered.map((f) => (
          <FunnelCard key={f.id} f={f} />
        ))}
      </div>
      <LeadMagnets funnels={shownMagnets} />
    </main>
  );
}
