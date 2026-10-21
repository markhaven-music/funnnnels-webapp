import { Instrument_Serif } from "next/font/google";

// The launch kit's display face (app/(funnels)/[slug]), self-hosted by
// next/font with a size-matched fallback, so headlines don't jump (docs/page-speed.md rule 13).
export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});
