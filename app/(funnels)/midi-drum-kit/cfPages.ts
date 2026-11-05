import { TEMPLATE as LANDING } from "./cf/template";
import { TEMPLATE as FAMOUS } from "./cf/upsell-famous";
import { TEMPLATE as TOP_HITS } from "./cf/upsell-tophits";

// The MIDI Drum Kit's pages that are ClickFunnels' markup (tools/cf_clone.mjs),
// by the page name the dashboard's editor uses (./texts.ts TEXT_PAGES): their
// sections can be hidden and moved and their pictures replaced
// (lib/cfSections.ts, lib/pageLayout.ts). The order and thank-you pages are
// React and aren't here.
export const CF_PAGES = { landing: LANDING, "famous-beats": FAMOUS, "top-hits": TOP_HITS } as const;
export type CfPage = keyof typeof CF_PAGES;
export const isCfPage = (v: unknown): v is CfPage => typeof v === "string" && v in CF_PAGES;
