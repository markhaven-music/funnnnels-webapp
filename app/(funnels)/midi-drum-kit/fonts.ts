import { Poppins } from "next/font/google";

// The sales page's button face (Poppins 700), for the order page's buttons (./order.module.css .cta).
// Not preloaded: the build shares its stylesheet with the TOP HITS order page, which
// would preload it for nothing; a browser fetches it only where a button uses it.
export const poppins = Poppins({ subsets: ["latin"], weight: "700", variable: "--font-poppins", preload: false });
