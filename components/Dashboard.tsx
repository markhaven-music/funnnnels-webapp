"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AIPanel } from "@/components/AIPanel";
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
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { NAV } from "@/lib/data";
import type { StoredFunnel } from "@/lib/blocks";

const STORAGE_KEY = "funnnnels.aiPanelWidth";
const MIN_W = 340;
const MAX_W = 640;
const DEFAULT_W = 420;

const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV.flatMap((s) => s.items.map((it) => [it.id, it.label])),
);

type Props = { funnels: StoredFunnel[] };

export function Dashboard({ funnels }: Props) {
  const [activeNav, setActiveNav] = useState<string>("home");
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_W);
  const dragging = useRef(false);
  const gripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (!Number.isNaN(n)) setPanelWidth(Math.max(MIN_W, Math.min(MAX_W, n)));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--ai-w", `${panelWidth}px`);
  }, [panelWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.max(MIN_W, Math.min(MAX_W, window.innerWidth - e.clientX));
      setPanelWidth(w);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      gripRef.current?.classList.remove("dragging");
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(STORAGE_KEY, String(panelWidth));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [panelWidth]);

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.classList.add("dragging");
    document.body.style.userSelect = "none";
  };

  const handleAsk = useCallback((prompt: string) => {
    setPendingPrompt(prompt);
  }, []);

  const topBarLabel = NAV_LABELS[activeNav] ?? "Dashboard";

  return (
    <div className="app">
      <Brand />
      <Sidebar funnelCount={funnels.length} active={activeNav} onNav={setActiveNav} />
      <TopBar trail={[{ label: topBarLabel }]} />
      {activeNav === "home"         && <DashboardHome onAsk={handleAsk} funnels={funnels} />}
      {activeNav === "funnels"      && <MainPanel onAsk={handleAsk} funnels={funnels} />}
      {activeNav === "pages"        && <LandingPagesPanel onAsk={handleAsk} funnels={funnels} />}
      {activeNav === "ab"           && <ABTestsPanel onAsk={handleAsk} funnels={funnels} />}
      {activeNav === "contacts"     && <ContactsPanel />}
      {activeNav === "analytics"    && <AnalyticsPanel funnels={funnels} />}
      {activeNav === "brand"        && <BrandKitPanel />}
      {activeNav === "integrations" && <IntegrationsPanel />}
      {activeNav === "domains"      && <DomainsPanel />}
      {activeNav === "settings"     && <SettingsPanel />}
      <AIPanel
        pendingPrompt={pendingPrompt}
        onPromptConsumed={() => setPendingPrompt(null)}
      />
      <div
        ref={gripRef}
        className="ai-grip"
        style={{ right: panelWidth - 3 + "px" }}
        onMouseDown={startDrag}
      />
    </div>
  );
}
