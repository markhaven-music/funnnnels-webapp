import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";

// The landing's fonts (grind-studio-landing-pages, theme "aurora"), self-hosted
// by next/font: Inter Tight for everything, JetBrains Mono for the countdown.
export const tight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-tight" });
export const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["700"], variable: "--font-jet" });

export const fontVars = [tight.variable, jet.variable].join(" ");

// The MIDI Drum Kit order form's face (Inter, as ../top-hits-midi-bundle/fonts.ts
// has it), for the checkout card this page borrows (order.module.css .dkForm).
// Not preloaded: the card sits under the product picture, and the picture paints first.
export const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-inter", preload: false });
