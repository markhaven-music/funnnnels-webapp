import type { BlockType } from "@/lib/blocks";
import { SECTION_LABELS, type SectionType } from "@/app/(funnels)/jazz-midi-pack/content";
import { KIT_SECTION_LABELS } from "@/app/(funnels)/_kit/content";
import { PRODUCT_TYPE, isCodeFunnel } from "@/lib/liveUrl";

// What the editor's "Add section" bar offers. Builder funnels get the generic
// blocks; a code funnel (the Jazz page) gets its own sections, and a
// launch-kit product (type "Product") the template's — the same ones the
// live page renders.
const BLOCK_LABELS: Record<Exclude<BlockType, "custom_html">, string> = {
  hero: "Hero",
  text: "Text",
  cta: "Call to action",
  image: "Image",
  social_proof: "Social proof",
  form: "Form",
  pricing: "Pricing",
  faq: "FAQ",
};

export type Addable = { type: string; label: string };

export function addableSections(funnelId: string, type?: string): Addable[] {
  const labels: Record<string, string> =
    type === PRODUCT_TYPE ? KIT_SECTION_LABELS : isCodeFunnel(funnelId) ? SECTION_LABELS : BLOCK_LABELS;
  return Object.entries(labels).map(([type, label]) => ({ type, label }));
}

export function isAddable(funnelId: string, funnelType: string | undefined, type: unknown): type is BlockType | SectionType {
  return typeof type === "string" && addableSections(funnelId, funnelType).some((a) => a.type === type);
}
