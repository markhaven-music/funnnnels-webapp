import { Anton, Bebas_Neue, Inter, Open_Sans } from "next/font/google";

// The ClickFunnels page's fonts, self-hosted by next/font.
export const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });
export const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
export const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"], variable: "--font-inter" });
export const openSans = Open_Sans({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-opensans" });

export const fontVars = [bebas.variable, anton.variable, inter.variable, openSans.variable].join(" ");
