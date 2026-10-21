"use client";

import { useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/Brand";
import { DashboardHome } from "@/components/DashboardHome";
import { MainPanel } from "@/components/MainPanel";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ABTestsPanel } from "@/components/panels/ABTestsPanel";
import { AnalyticsPanel } from "@/components/panels/AnalyticsPanel";
import { AutomationsPanel } from "@/components/panels/AutomationsPanel";
import { BroadcastsPanel } from "@/components/panels/BroadcastsPanel";
import { BrandKitPanel } from "@/components/panels/BrandKitPanel";
import { ContactsPanel } from "@/components/panels/ContactsPanel";
import { DomainsPanel } from "@/components/panels/DomainsPanel";
import { EmailInsightsPanel } from "@/components/panels/EmailInsightsPanel";
import { IntegrationsPanel } from "@/components/panels/IntegrationsPanel";
import { LandingPagesPanel } from "@/components/panels/LandingPagesPanel";
import { LaunchesPanel } from "@/components/panels/LaunchesPanel";
import { OrdersPanel } from "@/components/panels/OrdersPanel";
import { ProductsPanel } from "@/components/panels/ProductsPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { ShopPanel } from "@/components/panels/ShopPanel";
import { NAV } from "@/lib/data";
import type { Analytics, Metrics } from "@/lib/analytics";
import type { StoredFunnel } from "@/lib/blocks";
import { withStats } from "@/lib/codeFunnels";

const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV.flatMap((s) => s.items.map((it) => [it.id, it.label])),
);

type Props = { funnels: StoredFunnel[] };

// The cards' visits, CVR and revenue, and the home's charts until another
// range is picked: the last 28 days from dashboard → Analytics.
const CARD_RANGE = "28d";

export function Dashboard({ funnels: rows }: Props) {
  const [activeNav, setActiveNav] = useState<string>("home");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  // ?nav=analytics (from a funnel map) opens that panel.
  useEffect(() => {
    const nav = new URLSearchParams(window.location.search).get("nav");
    if (nav && nav in NAV_LABELS) setActiveNav(nav);
  }, []);
  useEffect(() => {
    fetch(`/api/analytics?range=${CARD_RANGE}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Analytics>) : null))
      .then((a) => a && setAnalytics(a))
      .catch(() => {});
  }, []);
  const funnels = useMemo(() => {
    const stats: Record<string, Metrics> = Object.fromEntries((analytics?.funnels ?? []).map((f) => [f.slug, f.total]));
    return withStats(rows, stats, CARD_RANGE);
  }, [rows, analytics]);
  const topBarLabel = NAV_LABELS[activeNav] ?? "Dashboard";
  const trail = activeNav === "email-insights" ? [{ label: "Email" }, { label: topBarLabel }] : [{ label: topBarLabel }];

  return (
    <div className="app">
      <Brand />
      <Sidebar funnelCount={funnels.length} active={activeNav} onNav={setActiveNav} />
      <TopBar trail={trail} />
      {activeNav === "home"         && <DashboardHome funnels={funnels} analytics={analytics} />}
      {activeNav === "funnels"      && <MainPanel funnels={funnels} />}
      {activeNav === "products"     && <ProductsPanel />}
      {activeNav === "launches"     && <LaunchesPanel />}
      {activeNav === "pages"        && <LandingPagesPanel funnels={funnels} />}
      {activeNav === "ab"           && <ABTestsPanel funnels={funnels} />}
      {activeNav === "shop"         && <ShopPanel />}
      {activeNav === "orders"       && <OrdersPanel />}
      {activeNav === "contacts"     && <ContactsPanel />}
      {activeNav === "email-insights" && <EmailInsightsPanel analytics={analytics} />}
      {activeNav === "broadcasts"   && <BroadcastsPanel />}
      {activeNav === "automations"  && <AutomationsPanel />}
      {activeNav === "analytics"    && <AnalyticsPanel />}
      {activeNav === "brand"        && <BrandKitPanel />}
      {activeNav === "integrations" && <IntegrationsPanel />}
      {activeNav === "domains"      && <DomainsPanel />}
      {activeNav === "settings"     && <SettingsPanel />}
    </div>
  );
}
