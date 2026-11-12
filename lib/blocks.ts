export const BLOCK_TYPES = [
  "custom_html",
  "hero",
  "text",
  "cta",
  "image",
  "social_proof",
  "form",
  "pricing",
  "faq",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type HeroProps = {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  primary_cta?: string;
  secondary_cta?: string;
  align?: "center" | "left";
};

export type TextProps = {
  heading?: string;
  body: string;
};

export type CtaProps = {
  headline?: string;
  subhead?: string;
  button_label: string;
  variant?: "primary" | "secondary";
};

export type ImageProps = {
  caption?: string;
  alt?: string;
  palette?: [string, string];
};

export type SocialProofProps = {
  heading?: string;
  logos?: string[];
  quote?: string;
  attribution?: string;
};

export type FormField = {
  label: string;
  name: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
};

export type FormProps = {
  heading?: string;
  subhead?: string;
  fields: FormField[];
  submit_label: string;
};

export type PricingTier = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta_label?: string;
  featured?: boolean;
};

export type PricingProps = {
  heading?: string;
  subhead?: string;
  tiers: PricingTier[];
};

export type FaqItem = { q: string; a: string };

export type FaqProps = {
  heading?: string;
  items: FaqItem[];
};

export type CustomHtmlProps = {
  intent: string;
  html: string;
  theme?: string;
};

export type BlockPropsByType = {
  custom_html: CustomHtmlProps;
  hero: HeroProps;
  text: TextProps;
  cta: CtaProps;
  image: ImageProps;
  social_proof: SocialProofProps;
  form: FormProps;
  pricing: PricingProps;
  faq: FaqProps;
};

export type Block<T extends BlockType = BlockType> = {
  id: string;
  type: T;
  props: BlockPropsByType[T];
};

export type Page = {
  id: string;
  name: string;
  slug: string;
  blocks: Block[];
};

export type FunnelStatus = "live" | "draft" | "test";

export type StoredFunnel = {
  id: string;
  name: string;
  status: FunnelStatus;
  type: string;
  tag: string;
  palette: [string, string];
  views: string;
  cvr: string;
  revenue: string;
  updated: string;
  steps: number;
  on: number;
  pages: Page[];
  /** Snapshot taken by "Publish": what visitors see. Edits stay draft until the next publish. */
  publishedPages?: Page[] | null;
  /** A screenshot of the first page for the card, instead of the generated thumbnail. */
  image?: string;
  /** What the numbers on the card cover, e.g. "28d". */
  statsRange?: string;
  /** The card's big numbers for that range, from dashboard → Analytics (lib/codeFunnels.ts withStats). */
  stats?: { revenue: string; orders: string; aov: string; cvr: string; visitors: string };
  /**
   * What its Meta ads cost and earned, all over the same days (from 2 Nov at
   * the earliest, lib/funnelSpend.ts). profitTone: the net profit's sign.
   */
  ads?: { spend: string; cpc: string; roas: string; profit: string; profitTone: "up" | "down" | "flat"; visitors: string; since: string };
  /** What the cards are ordered by on the home: the net profit (net revenue less ad spend, ads' days), else the net revenue. */
  profitValue?: number;
  /** "lead-magnet": listed apart, under Lead magnets (the free packs), not among the funnels that sell. */
  category?: "lead-magnet";
};

export function defaultProps<T extends BlockType>(
  type: T,
): BlockPropsByType[T] {
  switch (type) {
    case "custom_html":
      return {
        intent: "section",
        html: "<section><p>Custom section</p></section>",
        theme: "",
      } as BlockPropsByType[T];
    case "hero":
      return {
        eyebrow: "New",
        headline: "Headline goes here.",
        subhead: "Supporting one-liner that explains the value.",
        primary_cta: "Get started",
        secondary_cta: "Learn more",
        align: "center",
      } as BlockPropsByType[T];
    case "text":
      return {
        heading: "Section heading",
        body: "Paragraph body. Click this text to rewrite it.",
      } as BlockPropsByType[T];
    case "cta":
      return {
        headline: "Ready to start?",
        button_label: "Get started",
        variant: "primary",
      } as BlockPropsByType[T];
    case "image":
      return {
        caption: "Image placeholder",
        alt: "Placeholder",
        palette: ["oklch(0.74 0.19 295)", "oklch(0.55 0.18 280)"],
      } as BlockPropsByType[T];
    case "social_proof":
      return {
        heading: "Trusted by teams everywhere",
        logos: ["Acme", "Globex", "Initech", "Umbrella"],
      } as BlockPropsByType[T];
    case "form":
      return {
        heading: "Get the trial",
        fields: [
          { label: "Email", name: "email", type: "email", required: true },
        ],
        submit_label: "Start trial",
      } as BlockPropsByType[T];
    case "pricing":
      return {
        heading: "Simple pricing",
        tiers: [
          {
            name: "Starter",
            price: "$0",
            period: "/mo",
            features: ["1 funnel", "Community support"],
            cta_label: "Start free",
          },
          {
            name: "Pro",
            price: "$49",
            period: "/mo",
            features: ["Unlimited funnels", "A/B testing", "AI assistant"],
            cta_label: "Go Pro",
            featured: true,
          },
        ],
      } as BlockPropsByType[T];
    case "faq":
      return {
        heading: "Frequently asked",
        items: [
          { q: "Can I cancel anytime?", a: "Yes — no contract." },
          { q: "Do you offer refunds?", a: "14-day quality guarantee: if a file is broken or not as described, we fix it, and if we can't, you get a refund." },
        ],
      } as BlockPropsByType[T];
  }
  throw new Error(`Unknown block type: ${type}`);
}

let _idCounter = 0;
export function blockId() {
  _idCounter += 1;
  return `b_${Date.now().toString(36)}_${_idCounter.toString(36)}`;
}

export function funnelId() {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function pageId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
