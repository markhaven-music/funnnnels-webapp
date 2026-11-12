"use client";

import { useCallback, useEffect, useState } from "react";
import { isRange, RANGE_LABEL, RANGES, rangeDays, type Range } from "@/lib/range";
import s from "./rangePicker.module.css";

// The one time-range picker of the dashboard (lib/range.ts): Today,
// Yesterday, the last 7/28/90 days, this and last month, this and last year,
// all time. The days it covers are written beside it.

const RANGE_KEY = "fv:range";

/**
 * The range picked, remembered in this browser: one pick carries from the
 * home to Analytics, a funnel's map and Email → Insights. key: another
 * memory, for a screen that offers other ranges (Live). allowed: the ranges
 * that screen offers.
 */
export function useRange(fallback: Range = "28d", key = RANGE_KEY, allowed: Range[] = RANGES): [Range, (r: Range) => void] {
  const [range, setRange] = useState<Range>(fallback);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (isRange(saved) && allowed.includes(saved)) setRange(saved);
    } catch {
      // private window: the default
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const pick = useCallback(
    (r: Range) => {
      setRange(r);
      try {
        localStorage.setItem(key, r);
      } catch {
        // not remembered, still switched
      }
    },
    [key],
  );
  return [range, pick];
}

const fmt = (day: string, year: boolean) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });

/** "1 Nov – 7 Nov", "6 Nov", or "" for all time. */
export function rangeSpanLabel(r: Range, offsetMin?: number): string {
  const { first, last } = rangeDays(r, Date.now(), offsetMin);
  if (!first) return "";
  const year = first.slice(0, 4) !== new Date().toISOString().slice(0, 4);
  return first === last ? fmt(first, year) : `${fmt(first, year)} – ${fmt(last, year)}`;
}

type Props = {
  value: Range;
  onChange: (r: Range) => void;
  /** The ranges offered (all of them by default). */
  ranges?: Range[];
  /** Minutes to add to UTC for the days written beside it (Live: the viewer's own). */
  offsetMin?: number;
  /** Hide the days beside it. */
  bare?: boolean;
};

export function RangePicker({ value, onChange, ranges = RANGES, offsetMin, bare = false }: Props) {
  const span = bare ? "" : rangeSpanLabel(value, offsetMin);
  return (
    <span className={s.pick}>
      <select aria-label="Time range" value={value} onChange={(e) => onChange(e.target.value as Range)}>
        {ranges.map((r) => (
          <option key={r} value={r}>
            {RANGE_LABEL[r]}
          </option>
        ))}
      </select>
      {span && <span className={s.span}>{span}</span>}
    </span>
  );
}
