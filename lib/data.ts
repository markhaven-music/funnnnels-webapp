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
      { id: "launches", label: "Launches", icon: "rocket" },
      { id: "pages", label: "Landing Pages", icon: "page" },
      { id: "ab", label: "A/B Tests", icon: "abtest" },
    ],
  },
  {
    section: "Sales",
    items: [
      { id: "orders", label: "Orders", icon: "receipt" },
      { id: "analytics", label: "Analytics", icon: "analytics" },
    ],
  },
  {
    section: "Email",
    items: [
      { id: "contacts", label: "Contacts", icon: "contacts" },
      { id: "broadcasts", label: "Broadcasts", icon: "mail" },
      { id: "automations", label: "Automations", icon: "bolt" },
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

