"use client";

import { useState } from "react";

type Integration = {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  initials: string;
};

const INTEGRATIONS: Integration[] = [
  { id: "mailchimp",    name: "Mailchimp",     description: "Sync leads to Mailchimp audiences automatically.",          category: "Email",     color: "oklch(0.82 0.16 75)",  initials: "MC" },
  { id: "convertkit",  name: "Kit",            description: "Add subscribers to Kit sequences on form submit.",          category: "Email",     color: "oklch(0.72 0.18 18)",  initials: "KT" },
  { id: "klaviyo",     name: "Klaviyo",        description: "Push contacts to Klaviyo lists and trigger flows.",         category: "Email",     color: "oklch(0.74 0.19 295)", initials: "KL" },
  { id: "stripe",      name: "Stripe",         description: "Accept payments and upsells directly in your funnels.",     category: "Payments",  color: "oklch(0.78 0.13 230)", initials: "ST" },
  { id: "zapier",      name: "Zapier",         description: "Connect to 5,000+ apps via Zapier webhooks.",              category: "Automation",color: "oklch(0.82 0.16 75)",  initials: "ZP" },
  { id: "make",        name: "Make",           description: "Build visual automation scenarios with your funnel data.",  category: "Automation",color: "oklch(0.74 0.19 295)", initials: "MK" },
  { id: "ga4",         name: "Google Analytics", description: "Track funnel pageviews and events in GA4.",             category: "Analytics", color: "oklch(0.72 0.18 18)",  initials: "GA" },
  { id: "meta",        name: "Meta Pixel",     description: "Fire Meta events for Facebook and Instagram ad tracking.",  category: "Analytics", color: "oklch(0.78 0.13 230)", initials: "FB" },
  { id: "slack",       name: "Slack",          description: "Get notified in Slack when a new lead comes in.",          category: "Notifications", color: "oklch(0.86 0.16 165)", initials: "SL" },
];

const CATEGORIES = ["All", "Email", "Payments", "Analytics", "Automation", "Notifications"];

export function IntegrationsPanel() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const filtered =
    activeCategory === "All"
      ? INTEGRATIONS
      : INTEGRATIONS.filter((i) => i.category === activeCategory);

  const toggle = (id: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Integrations</h1>
          <p className="page-sub">
            {connected.size === 0
              ? "Connect your email, payments, and analytics tools."
              : `${connected.size} integration${connected.size === 1 ? "" : "s"} connected`}
          </p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((int) => {
          const isConnected = connected.has(int.id);
          return (
            <div
              key={int.id}
              style={{
                background: "var(--bg-1)",
                border: `1px solid ${isConnected ? int.color.replace(")", " / 0.4)") : "var(--line-soft)"}`,
                borderRadius: "var(--radius)",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: int.color.replace(")", " / 0.15)"),
                    color: int.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.02em",
                    flexShrink: 0,
                  }}
                >
                  {int.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{int.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--fg-3)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {int.category}
                  </div>
                </div>
                {isConnected && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "var(--mint)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ● connected
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--fg-2)", margin: 0, lineHeight: 1.5 }}>
                {int.description}
              </p>
              <button
                type="button"
                className={`btn ${isConnected ? "ghost" : "primary"}`}
                style={{ alignSelf: "flex-start", height: 30, fontSize: 12, padding: "0 12px" }}
                onClick={() => toggle(int.id)}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
