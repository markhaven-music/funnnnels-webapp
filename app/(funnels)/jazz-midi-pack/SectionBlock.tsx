import { Instrument_Serif } from "next/font/google";
import { funnel } from "./funnel";
import type { Section } from "./content";
import { SectionView, type Ctx } from "./sections";
import s from "./jazz.module.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

// One Jazz section inside the dashboard editor's canvas: the page's own
// styles and fonts around it, euro prices, checkout locked.
const EDIT_CTX: Ctx = {
  price: `€${funnel.price.eur}`,
  amount: funnel.price.eur,
  currency: "eur",
  country: "IT",
  publishableKey: null,
  editing: true,
};

export function SectionBlock({ section, patch }: { section: Section; patch?: (p: Record<string, unknown>) => void }) {
  return (
    <div className={`${s.page} ${serif.variable}`} style={{ minHeight: 0 }}>
      <SectionView section={section} patch={patch} ctx={EDIT_CTX} />
    </div>
  );
}
