"use client";

import { useEffect, useMemo, useState } from "react";
import { FunnelCard } from "@/components/FunnelCard";
import { I } from "@/components/icons";
import type { Analytics } from "@/lib/analytics";
import type { StoredFunnel } from "@/lib/blocks";
import { AvailabilityCard, BonusCard, PopupOfferCard, TapsCard, TestCard } from "./AnalyticsPanel";
import s from "./analytics.module.css";

// Dashboard → A/B Tests: the running tests (lib/analytics.ts TESTS), the other
// experiments (pop-ups, bonuses, taps) and the ended tests. They come from
// /api/analytics like dashboard → Analytics; each is counted since it started,
// whatever the range, so the cheapest range is asked for.

type Props = { funnels: StoredFunnel[] };

export function ABTestsPanel({ funnels }: Props) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/analytics?range=today", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`The tests didn't load (${r.status}).`);
        return (await r.json()) as Analytics;
      })
      .then((d) => live && setData(d))
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, []);

  // Funnels whose own status is "test" (the editor's split), apart from the coded tests.
  const statusTests = useMemo(() => funnels.filter((f) => f.status === "test"), [funnels]);

  // Running tests, the latest started first; the ended ones go to the archive.
  const tests = data?.tests ?? [];
  const running = tests.filter((t) => !t.ended).sort((a, b) => (b.since ?? "").localeCompare(a.since ?? ""));
  const ended = tests.filter((t) => t.ended);
  const others = !!data && (!!data.availability || !!data.popupOffer || !!data.taps || data.bonuses.length > 0);

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">A/B Tests</h1>
          <p className="page-sub">
            {data ? `${running.length} test${running.length === 1 ? "" : "s"} running, each counted since it started.` : "Loading the tests…"}
          </p>
        </div>
      </div>

      {error && <div className={`${s.notice} ${s.bad}`}>{error}</div>}
      {data?.errors.map((e) => (
        <div key={e} className={`${s.notice} ${s.bad}`}>
          Couldn&apos;t read {e}
        </div>
      ))}

      {running.map((t) => (
        <TestCard key={`${t.funnel}|${t.name}`} t={t} />
      ))}

      {others && (
        <div className="section-head" style={{ marginTop: 28 }}>
          <div className="section-title">Other experiments</div>
        </div>
      )}
      {data?.taps && <TapsCard t={data.taps} />}
      {data?.popupOffer && <PopupOfferCard p={data.popupOffer} />}
      {data?.availability && <AvailabilityCard a={data.availability} />}
      {data?.bonuses?.map((b) => <BonusCard key={b.funnel} b={b} />)}

      {ended.length > 0 && (
        <details className={s.archive}>
          <summary>
            Ended tests <span className="count">{ended.length}</span>
          </summary>
          {ended.map((t) => (
            <TestCard key={`${t.funnel}|${t.name}`} t={t} />
          ))}
        </details>
      )}

      {statusTests.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 28 }}>
            <div className="section-title">
              Funnels in test mode <span className="count">{statusTests.length}</span>
            </div>
          </div>
          <div className="funnels">
            {statusTests.map((f) => (
              <FunnelCard key={f.id} f={f} />
            ))}
          </div>
        </>
      )}

      {data && running.length === 0 && ended.length === 0 && !others && statusTests.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--fg-3)", paddingTop: "10vh" }}>
          <I.abtest size={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-2)" }}>No tests yet</div>
        </div>
      )}
    </main>
  );
}
