// The time ranges the dashboard offers everywhere (home, Analytics, a
// funnel's map, Email → Insights, Free packs, Live): Today, Yesterday, the
// last 7/28/90 days, this and last month, this and last year, all time.
// Days are Warsaw days (lib/tz.ts), like page_views and the sales
// (lib/analytics.ts), unless a caller passes an offset (Live counts in the
// viewer's own time).
// Safe to import in the browser.

export type Range = "today" | "yesterday" | "7d" | "28d" | "90d" | "this-month" | "last-month" | "this-year" | "last-year" | "all";

export const RANGES: Range[] = ["today", "yesterday", "7d", "28d", "90d", "this-month", "last-month", "this-year", "last-year", "all"];

export const RANGE_LABEL: Record<Range, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "28d": "Last 28 days",
  "90d": "Last 90 days",
  "this-month": "This month",
  "last-month": "Last month",
  "this-year": "This year",
  "last-year": "Last year",
  all: "All time",
};

export const isRange = (x: unknown): x is Range => typeof x === "string" && (RANGES as string[]).includes(x);

/** The range in the query string, or the fallback. */
export const rangeParam = (url: string, fallback: Range = "28d"): Range => {
  const r = new URL(url).searchParams.get("range");
  return isRange(r) ? r : fallback;
};

import { addDays, dayIn, startOfDay } from "@/lib/tz";

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/**
 * The range's first and last day ("2026-11-01"), both included; first is
 * null for all time. offsetMin: minutes to add to UTC for the days; left out,
 * the days are Warsaw days (lib/tz.ts).
 */
export function rangeDays(r: Range, now = Date.now(), offsetMin?: number): { first: string | null; last: string } {
  const today = offsetMin === undefined ? dayIn(now) : iso(now + offsetMin * 60_000);
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  const back = (n: number) => addDays(today, -n);
  switch (r) {
    case "today":
      return { first: today, last: today };
    case "yesterday":
      return { first: back(1), last: back(1) };
    case "7d":
      return { first: back(6), last: today };
    case "28d":
      return { first: back(27), last: today };
    case "90d":
      return { first: back(89), last: today };
    case "this-month":
      return { first: `${today.slice(0, 7)}-01`, last: today };
    case "last-month": {
      const firstOfThis = Date.UTC(y, m - 1, 1);
      return { first: iso(Date.UTC(y, m - 2, 1)), last: iso(firstOfThis - DAY) };
    }
    case "this-year":
      return { first: `${y}-01-01`, last: today };
    case "last-year":
      return { first: `${y - 1}-01-01`, last: `${y - 1}-12-31` };
    case "all":
      return { first: null, last: today };
  }
}

/** The range as instants: [from, until) in ms (from 0 for all time), for rows with a timestamp. */
export function rangeSpan(r: Range, now = Date.now(), offsetMin?: number): { from: number; until: number } {
  const { first, last } = rangeDays(r, now, offsetMin);
  if (offsetMin === undefined) return { from: first ? startOfDay(first) : 0, until: startOfDay(addDays(last, 1)) };
  const shift = offsetMin * 60_000;
  return {
    from: first ? Date.parse(`${first}T00:00:00Z`) - shift : 0,
    until: Date.parse(`${last}T00:00:00Z`) + DAY - shift,
  };
}

/** How many days the range covers (null for all time). */
export function rangeLength(r: Range, now = Date.now()): number | null {
  const { first, last } = rangeDays(r, now);
  return first ? Math.round((Date.parse(last) - Date.parse(first)) / DAY) + 1 : null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The range inside a sentence: "today", "in the last 7 days", "in October", "in 2025", "so far". */
export function rangePhrase(r: Range, now = Date.now()): string {
  const { first } = rangeDays(r, now);
  switch (r) {
    case "today":
    case "yesterday":
      return r;
    case "7d":
    case "28d":
    case "90d":
      return `in the ${RANGE_LABEL[r].toLowerCase()}`;
    case "this-month":
    case "this-year":
      return r.replace("-", " ");
    case "last-month":
      return `in ${MONTHS[Number(first!.slice(5, 7)) - 1]}`;
    case "last-year":
      return `in ${first!.slice(0, 4)}`;
    case "all":
      return "so far";
  }
}

/** For "vs previous …": the period before is as many days, right before. */
export function previousName(r: Range, now = Date.now()): string {
  const n = rangeLength(r, now);
  return n === null ? "period" : n === 1 ? "day" : `${n} days`;
}
