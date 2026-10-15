"use client";

import { useState } from "react";
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
import type { StoredFunnel } from "@/lib/blocks";

const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV.flatMap((s) => s.items.map((it) => [it.id, it.label])),
);

type Props = { funnels: StoredFunnel[] };

export function Dashboard({ funnels }: Props) {
  const [activeNav, setActiveNav] = useState<string>("home");
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
      {activeNav === "analytics"    && <AnalyticsPanel funnels={funnels} onNav={setActiveNav} />}
      {activeNav === "brand"        && <BrandKitPanel />}
      {activeNav === "integrations" && <IntegrationsPanel />}
      {activeNav === "domains"      && <DomainsPanel />}
      {activeNav === "settings"     && <SettingsPanel />}
    </div>
  );
}
