import type { Currency } from "@/lib/geo";
import { applyHtmlTexts } from "@/lib/htmlTexts";
import { astroHtml } from "../astroLanding";
import { TEMPLATE } from "./astro/landing";
import { funnel } from "./funnel";
import { FBB_LP } from "./landingTest";

// The sales page: the Astro page as it was live on m.thegrind.studio
// (./astro/landing.ts), served as ../astroLanding.ts says, with its words
// changed in the dashboard (funnel map → Edit, lib/htmlTexts.ts). marks: each
// text marked for the editor's frame, never on a live page.
// "€0.08 per groove" (twice) was worked out for €27: the price ÷ 320 grooves.
export const landingHtml = (currency: Currency, price: number, edits: Record<string, string> = {}, marks = false) =>
  astroHtml(carryIds(no808(applyHtmlTexts(TEMPLATE, edits, marks))).replaceAll("€0.08", `€${(price / 320).toFixed(2)}`), {
    funnel: funnel.slug,
    orderPage: funnel.checkout.orderPage,
    currency,
    price,
    abCookie: FBB_LP.cookie,
  });

// The Astro page's own script takes fbclid and utm_* from the address to its buttons. The ads also
// tag campaign_id, adset_id and ad_id (neo credits the sale to the ad by them): those go along too.
const CARRIED = "/^(fbclid|oppref|utm_[a-z_]+)$/";
function carryIds(html: string): string {
  if (!html.includes(CARRIED)) throw new Error("famous-beats-bundle/astro/landing.ts: the script that carries the ad tags has changed");
  return html.replace(CARRIED, "/^(fbclid|gclid|oppref|utm_[a-z_]+|campaign_id|adset_id|ad_id)$/");
}

/** The page as the code has it, for the dashboard's editor. */
export const landingTemplate = TEMPLATE;

// The Astro page said "kick, snare, hats and 808 on separate tracks"; counted from the zip, 808 is a
// track in 3 of the 320 files (BRIEF.md), so back on air as the test's "fbb-old" it says percussion,
// as the Jazz-style page does. Words only: the pictures are the page's own.
const no808 = (html: string) =>
  html
    .replaceAll("hats and 808", "hats and percussion")
    .replaceAll("kick and 808", "kick and percussion")
    .replace("your snare, your 808, same groove", "your snare, your hats, same groove")
    .replace("<p>KICK</p><p>808</p>", "<p>KICK</p><p>PERC</p>");
