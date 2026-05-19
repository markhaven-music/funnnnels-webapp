"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FunnelCard } from "@/components/FunnelCard";
import { NewFunnelTile } from "@/components/NewFunnelTile";
import { I } from "@/components/icons";
import type { FunnelStatus, StoredFunnel } from "@/lib/blocks";

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 200;
  const h = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathD =
    "M " +
    coords
      .map((c, i) => {
        if (i === 0) return c;
        const [px, py] = coords[i - 1].split(",").map(Number);
        const [cx, cy] = c.split(",").map(Number);
        const mx = (px + cx) / 2;
        return `C ${mx},${py} ${mx},${cy} ${cx},${cy}`;
      })
      .join(" ");

  const fillD =
    pathD + ` L ${w},${h} L 0,${h} Z`;

  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color.replace(/[^a-z]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#g-${color.replace(/[^a-z]/g, "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Metric cards ─────────────────────────────────────────────────────────────

type Metric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta: string;
  up: boolean;
  color: string;
  spark: number[];
};

function buildMetrics(funnels: StoredFunnel[], contactsCount: number): Metric[] {
  const abTests = funnels.filter((f) => f.status === "test").length;
  const liveFunnels = funnels.filter((f) => f.status === "live").length;
  return [
    { id: "visitors",    label: "Visitors · 7D",  value: "0",              delta: "—",  up: true,  color: "oklch(0.74 0.19 295)",  spark: Array(14).fill(0) },
    { id: "sessions",    label: "Sessions · 7D",  value: "0",              delta: "—",  up: true,  color: "oklch(0.82 0.18 295)",  spark: Array(14).fill(0) },
    { id: "conversions", label: "Conversions",    value: "0",    unit: "leads", delta: "—", up: true, color: "oklch(0.86 0.16 165)", spark: Array(14).fill(0) },
    { id: "revenue",     label: "Revenue",        value: "$0",             delta: "—",  up: true,  color: "oklch(0.86 0.16 165)",  spark: Array(14).fill(0) },
    { id: "cvr",         label: "Avg. CVR",       value: "0",    unit: "%", delta: "—", up: true,  color: "oklch(0.72 0.18 18)",   spark: Array(14).fill(0) },
    { id: "bounce",      label: "Bounce Rate",    value: "0",    unit: "%", delta: "—", up: true,  color: "oklch(0.86 0.16 165)",  spark: Array(14).fill(0) },
    { id: "contacts",    label: "New Contacts",   value: String(contactsCount), delta: "—", up: true, color: "oklch(0.78 0.13 230)", spark: Array(14).fill(0) },
    { id: "abtests",     label: "A/B Tests Live", value: String(abTests),  delta: liveFunnels > 0 ? `${liveFunnels} live` : "—", up: true, color: "oklch(0.82 0.16 75)", spark: Array(14).fill(0) },
  ];
}

function StatCard({ m }: { m: Metric }) {
  return (
    <div className="stat">
      <div className="stat-label">
        <span className="lk" style={{ background: m.color }} />
        {m.label}
      </div>
      <div className="v">
        {m.value}
        {m.unit && <small>{m.unit}</small>}
      </div>
      <span className={`delta ${m.up ? "up" : "down"}`}>
        {m.up ? "▲" : "▼"} {m.delta}
      </span>
      <Sparkline points={m.spark} color={m.color} />
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Main component ───────────────────────────────────────────────────────────

type TabKey = "all" | FunnelStatus;
const TABS: TabKey[] = ["all", "live", "test", "draft"];

type Props = { onAsk: (p: string) => void; funnels: StoredFunnel[] };

export function DashboardHome({ onAsk, funnels }: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/contacts", { cache: "no-store" });
        if (!r.ok) {
          console.error("Contacts fetch failed:", r.status);
          return;
        }
        const d = await r.json();
        if (!cancelled) setContactsCount((d.contacts ?? []).length);
      } catch (err) {
        console.error("Contacts fetch error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(
    () => buildMetrics(funnels, contactsCount),
    [funnels, contactsCount],
  );

  const filtered = useMemo(() => {
    if (tab === "all") return funnels;
    return funnels.filter((f) => f.status === tab);
  }, [tab, funnels]);

  const counts = useMemo(() => {
    const c = { live: 0, draft: 0, test: 0 };
    for (const f of funnels) c[f.status] += 1;
    return c;
  }, [funnels]);

  return (
    <main className="main">
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">{greeting()}.</h1>
          <p className="page-sub">
            {funnels.length > 0 ? (
              <>
                <span className="mono">{funnels.length} funnel{funnels.length === 1 ? "" : "s"}</span>
                {counts.live > 0 && (
                  <> · <span className="mono" style={{ color: "var(--mint)" }}>{counts.live} live</span></>
                )}
                {counts.draft > 0 && (
                  <> · <span className="mono">{counts.draft} draft</span></>
                )}
              </>
            ) : (
              "Build your first funnel by describing it in plain English."
            )}
          </p>
        </div>
        <div className="cta-group">
          <Link href="/funnels/new" className="btn primary">
            <I.sparkles size={14} /> New with AI
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {metrics.map((m) => (
          <StatCard key={m.id} m={m} />
        ))}
      </div>

      {/* Funnels section */}
      <div className="section-head">
        <div className="section-title">
          Your funnels
          <span className="count">{filtered.length} of {funnels.length}</span>
        </div>
        {funnels.length > 0 && (
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
        )}
      </div>

      <div className={funnels.length === 0 ? "funnels funnels--empty" : "funnels"}>
        <NewFunnelTile prominent={funnels.length === 0} />
        {filtered.map((f) => (
          <FunnelCard key={f.id} f={f} />
        ))}
      </div>
    </main>
  );
}
