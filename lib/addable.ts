import type { BlockType } from "@/lib/blocks";
import { SECTION_LABELS, type SectionType } from "@/app/(funnels)/jazz-midi-pack/content";
import { isCodeFunnel } from "@/lib/liveUrl";

// What the editor's "Add section" bar offers. Builder funnels get the generic
// blocks; a code funnel (the Jazz page, the only one so far) gets its own
// sections, the same ones the live page renders.
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

export function addableSections(funnelId: string): Addable[] {
  const labels: Record<string, string> = isCodeFunnel(funnelId) ? SECTION_LABELS : BLOCK_LABELS;
  return Object.entries(labels).map(([type, label]) => ({ type, label }));
}

export function isAddable(funnelId: string, type: unknown): type is BlockType | SectionType {
  return typeof type === "string" && addableSections(funnelId).some((a) => a.type === type);
}
