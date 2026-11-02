import { Poppins } from "next/font/google";

// The sales page's button face (Poppins 700), for the order page's buttons (./order.module.css .cta).
export const poppins = Poppins({ subsets: ["latin"], weight: "700", variable: "--font-poppins" });
