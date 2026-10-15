"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Instrument_Serif } from "next/font/google";
import type { KitSection } from "./content";
import { KitSectionView, type KitCtx, type KitProductView } from "./sections";
import { LaunchClock } from "./LaunchClock";
import { BRAND } from "./brand";
import s from "../jazz-midi-pack/jazz.module.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

// The dashboard editor's view of a launch-kit product: each section is the
// real page section (euro prices, checkout locked), with click-to-edit text.
// The edit page provides the product; sections read it from here.

const ProductCtx = createContext<KitProductView | null>(null);

export function KitEditProvider({ product, children }: { product: KitProductView; children: ReactNode }) {
  return <ProductCtx.Provider value={product}>{children}</ProductCtx.Provider>;
}

export function KitSectionBlock({ section, patch }: { section: KitSection; patch?: (p: Record<string, unknown>) => void }) {
  const product = useContext(ProductCtx);
  const [now] = useState(() => Date.now());
  if (!product) return <div className="fb-unknown">Open this page from Launches to edit it.</div>;
  const ctx: KitCtx = { product, country: "IT", publishableKey: null, guaranteeDays: BRAND.guaranteeDays, editing: true };
  return (
    <div className={`${s.page} ${serif.variable}`} style={{ minHeight: 0 }}>
      <LaunchClock launch={product.launch} price={product.price} currency="eur" renderedAt={now} editing>
        <KitSectionView section={section} patch={patch} ctx={ctx} />
      </LaunchClock>
    </div>
  );
}
