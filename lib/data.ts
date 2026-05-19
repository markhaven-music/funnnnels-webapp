import type { IconName } from "@/components/icons";

export type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  badgeKey?: "funnels";
};

export type NavSection = {
  section: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    section: "Workspace",
    items: [
      { id: "home", label: "Dashboard", icon: "layers" },
      { id: "funnels", label: "Funnels", icon: "funnel", badgeKey: "funnels" },
      { id: "pages", label: "Landing Pages", icon: "page" },
      { id: "ab", label: "A/B Tests", icon: "abtest" },
    ],
  },
  {
    section: "Audience",
    items: [
      { id: "contacts", label: "Contacts", icon: "contacts" },
      { id: "analytics", label: "Analytics", icon: "analytics" },
    ],
  },
  {
    section: "Setup",
    items: [
      { id: "brand", label: "Brand Kit", icon: "brand" },
      { id: "integrations", label: "Integrations", icon: "integrations" },
      { id: "domains", label: "Domains", icon: "globe" },
      { id: "settings", label: "Settings", icon: "settings" },
    ],
  },
];

export const QUICK_PROMPTS = [
  "Build a SaaS landing page for an AI note-taking app",
  "Build a webinar registration funnel for a free workshop",
  "Build a lead-magnet opt-in for a free PDF guide",
];

export const SUGGESTED = [
  "Build a SaaS landing page",
  "Build a webinar registration",
  "Build a lead-magnet opt-in",
  "Explain how funnels work",
];
