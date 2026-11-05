import type { Currency } from "@/lib/geo";
import { applyHtmlTexts } from "@/lib/htmlTexts";
import { astroHtml } from "../astroLanding";
import { TEMPLATE } from "./astro/landing";
import { funnel } from "./funnel";

// The sales page: the Astro page as it was live on m.thegrind.studio
// (./astro/landing.ts), served as ../astroLanding.ts says, with its words
// changed in the dashboard (funnel map → Edit, lib/htmlTexts.ts). marks: each
// text marked for the editor's frame, never on a live page.
export const landingHtml = (currency: Currency, price: number, edits: Record<string, string> = {}, marks = false) =>
  astroHtml(applyHtmlTexts(TEMPLATE, edits, marks), { funnel: funnel.slug, orderPage: funnel.checkout.orderPage, currency, price });

/** The page as the code has it, for the dashboard's editor. */
export const landingTemplate = TEMPLATE;
