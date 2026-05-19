export const BLOCK_TYPES = [
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

export type BlockPropsByType = {
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
};

export const BLOCK_SCHEMA_DOC = `Block types and their props:

- hero: { eyebrow?, headline, subhead?, primary_cta?, secondary_cta?, align?: "center"|"left" }
- text: { heading?, body } — long-form paragraph text
- cta: { headline?, subhead?, button_label, variant?: "primary"|"secondary" } — standalone call-to-action band
- image: { caption?, alt?, palette?: [hex/oklch, hex/oklch] } — placeholder image
- social_proof: { heading?, logos?: string[], quote?, attribution? }
- form: { heading?, subhead?, fields: [{ label, name, type: "text"|"email"|"tel"|"select"|"textarea", required?, placeholder? }], submit_label }
- pricing: { heading?, subhead?, tiers: [{ name, price, period?, features: string[], cta_label?, featured? }] }
- faq: { heading?, items: [{ q, a }] }`;

export function defaultProps<T extends BlockType>(
  type: T,
): BlockPropsByType[T] {
  switch (type) {
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
        body: "Paragraph body. Click into the chat to have Riley rewrite this.",
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
          { q: "Do you offer refunds?", a: "30-day money-back guarantee." },
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
