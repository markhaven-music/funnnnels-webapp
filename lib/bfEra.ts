import { BF, BF_ENDS, BF_FROM, BF_SITEWIDE_OFF, sitewideUntil } from "@/lib/blackFriday";
import { dayIn } from "@/lib/tz";

// The dashboard in two parts ("metti tutti i dati da quando abbiamo iniziato la Black Friday offer a
// parte, perché altrimenti inquinano i dati che abbiamo col prezzo a 27", 2026-11-24): everything
// from BF_FROM to BF_ENDS (orders, upsells, visitors, ad spend) is the Black Friday dashboard's, and
// Dashboard (the home, the funnel cards) leaves it out. Split by time, whatever the funnel: from that
// minute every front-end was €9.99, and Meta's spend can't be split by funnel per hour anyway.
//
//   "regular"  everything outside the Black Friday window (Dashboard, the funnel cards)
//   "bf"       only the Black Friday window (dashboard → Black Friday)
//   "all"      no split (Analytics, A/B tests, the funnel maps, Email: as before)
//
// The days the window starts and ends on are split too: orders and spend by the minute (spend
// by the hour, shared out by the minutes of it on each side), visitors by when each browser first
// opened the page that day (lib/analytics.ts bfViewWeights). Safe to import in the browser.

export type Era = "regular" | "bf" | "all";
export const isEra = (x: unknown): x is Era => x === "regular" || x === "bf" || x === "all";

export const BF_FROM_MS = Date.parse(BF_FROM);
export const BF_UNTIL_MS = Date.parse(BF_ENDS);
/** The Warsaw days the window starts and ends on ("2026-11-24", "2026-11-28"). */
export const BF_FIRST_DAY = dayIn(BF_FROM_MS);
export const BF_LAST_DAY = dayIn(BF_UNTIL_MS - 1);

export const inBf = (ms: number) => ms >= BF_FROM_MS && ms < BF_UNTIL_MS;

/**
 * Whether an order, upsell or visit belongs to Black Friday. Mostly by the clock (inBf), but the MIDI Drum Kit and the
 * Jazz MIDI Pack left the store-wide sale early (lib/blackFriday.ts BF_SITEWIDE_OFF, 24 Nov 00:01 Italy): their own
 * pages count as Black Friday only until then, and the separate Black Friday copies at 9.99 (variant "bf") always do.
 */
export function bfFor(funnel: string, ms: number, variant = ""): boolean {
  if (variant === BF.variant) return true;
  return inBf(ms) && (!BF_SITEWIDE_OFF[funnel] || ms < sitewideUntil(funnel));
}

/** How much of [from, until) (ms) falls in the Black Friday window, 0 to 1. */
export function bfShare(from: number, until: number): number {
  if (until <= from) return inBf(from) ? 1 : 0;
  const overlap = Math.min(until, BF_UNTIL_MS) - Math.max(from, BF_FROM_MS);
  return Math.max(0, Math.min(1, overlap / (until - from)));
}

/** The share of [from, until) that belongs to the era (1 for "all"). */
export const eraShare = (era: Era, from: number, until: number) => (era === "all" ? 1 : era === "bf" ? bfShare(from, until) : 1 - bfShare(from, until));

/** "Tue 24 Nov 14:31" in Italy's time (the owner's), for the labels. */
export function italyTime(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", { timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).replace(",", "");
}
