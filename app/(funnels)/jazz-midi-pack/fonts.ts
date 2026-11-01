import { Poppins } from "next/font/google";

// The funnel's one headline face (landing, order and thank-you pages, the
// editor): Poppins, as on the Grind Studio Drum Kit page. 800 for the hero and
// the big numbers, 700 for section titles. Body text stays Geist (root layout).
// next/font adds a size-matched "Poppins Fallback" (docs/page-speed.md rule 13).
export const display = Poppins({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-display" });
