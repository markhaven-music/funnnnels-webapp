import type { Currency } from "@/lib/geo";
import { astroHtml } from "../astroLanding";
import { TEMPLATE } from "./astro/landing";
import { funnel } from "./funnel";

// The sales page: the Astro page as it was live on m.thegrind.studio
// (./astro/landing.ts), served as ../astroLanding.ts says.
export const landingHtml = (currency: Currency, price: number) =>
  astroHtml(TEMPLATE, { funnel: funnel.slug, orderPage: funnel.checkout.orderPage, currency, price });
