import { Inter, Open_Sans, Poppins, Roboto_Mono } from "next/font/google";

// The ClickFunnels page's fonts, self-hosted by next/font.
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-poppins" });
export const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-inter" });
export const openSans = Open_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-opensans" });
export const mono = Roboto_Mono({ subsets: ["latin"], weight: "400", variable: "--font-mono" });

export const fontVars = [poppins.variable, inter.variable, openSans.variable, mono.variable].join(" ");
