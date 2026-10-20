"use client";

import { useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/Brand";
import { DashboardHome } from "@/components/DashboardHome";
import { MainPanel } from "@/components/MainPanel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ABTestsPanel } from "@/components/panels/ABTestsPanel";
import { AnalyticsPanel } from "@/components/panels/AnalyticsPanel";
import { BrandKitPanel } from "@/components/panels/BrandKitPanel";
import { ContactsPanel } from "@/components/panels/ContactsPanel";
import { DomainsPanel } from "@/components/panels/DomainsPanel";
import { IntegrationsPanel } from "@/components/panels/IntegrationsPanel";
import { LandingPagesPanel } from "@/components/panels/LandingPagesPanel";
import { LaunchesPanel } from "@/components/panels/LaunchesPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { NAV } from "@/lib/data";
import type { Analytics, Metrics } from "@/lib/analytics";
import type { StoredFunnel } from "@/lib/blocks";
import { withStats } from "@/lib/codeFunnels";

const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV.flatMap((s) => s.items.map((it) => [it.id, it.label])),
);

type Props = { funnels: StoredFunnel[] };

// The cards' visits, CVR and revenue: the last 28 days from dashboard → Analytics.
const CARD_RANGE = "28d";

export function Dashboard({ funnels: rows }: Props) {
  const [activeNav, setActiveNav] = useState<string>("home");
  const [stats, setStats] = useState<Record<string, Metrics>>({});
  // ?nav=analytics (from a funnel map) opens that panel.
  useEffect(() => {
    const nav = new URLSearchParams(window.location.search).get("nav");
    if (nav && nav in NAV_LABELS) setActiveNav(nav);
  }, []);
  useEffect(() => {
    fetch(`/api/analytics?range=${CARD_RANGE}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Analytics>) : null))
      .then((a) => a && setStats(Object.fromEntries(a.funnels.map((f) => [f.slug, f.total]))))
      .catch(() => {});
  }, []);
  const funnels = useMemo(() => withStats(rows, stats, CARD_RANGE), [rows, stats]);
  const topBarLabel = NAV_LABELS[activeNav] ?? "Dashboard";

  return (
    <div className="app">
      <Brand />
      <Sidebar funnelCount={funnels.length} active={activeNav} onNav={setActiveNav} />
      <TopBar trail={[{ label: topBarLabel }]} />
      {activeNav === "home"         && <DashboardHome funnels={funnels} />}
      {activeNav === "funnels"      && <MainPanel funnels={funnels} />}
      {activeNav === "launches"     && <LaunchesPanel />}
      {activeNav === "pages"        && <LandingPagesPanel funnels={funnels} />}
      {activeNav === "ab"           && <ABTestsPanel funnels={funnels} />}
      {activeNav === "contacts"     && <ContactsPanel />}
      {activeNav === "analytics"    && <AnalyticsPanel />}
      {activeNav === "brand"        && <BrandKitPanel />}
      {activeNav === "integrations" && <IntegrationsPanel />}
      {activeNav === "domains"      && <DomainsPanel />}
      {activeNav === "settings"     && <SettingsPanel />}
    </div>
  );
}
