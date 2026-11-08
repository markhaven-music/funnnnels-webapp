import { Inter_Tight, Poppins } from "next/font/google";

// The funnels' face, as on the homepage: the shop, its cart and the home are
// one store. Self-hosted by next/font with a size-matched fallback, so
// headlines don't jump (docs/page-speed.md rule 13).
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-poppins",
});

// The brand kit's glass buttons (components/ui/GlassButton.tsx) are set in it.
export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-inter-tight",
});
