// The dashboard's days are Marco's days: Europe/Warsaw, summer time included
// ("io voglio sapere nel mio fuso orario", 11-12). Before 11-12 they were UTC
// days, so a sale at 00:30 in Warsaw counted for the day before.
// Safe to import in the browser.

export const TIME_ZONE = "Europe/Warsaw";

const DAY = 86_400_000;

/** The day (YYYY-MM-DD) an instant falls on in the time zone. */
export const dayIn = (ms: number, tz = TIME_ZONE): string => new Date(ms).toLocaleDateString("en-CA", { timeZone: tz });

/** Minutes the time zone is ahead of UTC at an instant (Warsaw: 60 in winter, 120 in summer). */
export function offsetAt(ms: number, tz = TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60_000);
}

/** The instant a day (YYYY-MM-DD) starts in the time zone. */
export function startOfDay(day: string, tz = TIME_ZONE): number {
  const midnightUtc = Date.parse(`${day}T00:00:00Z`);
  const first = midnightUtc - offsetAt(midnightUtc, tz) * 60_000;
  return midnightUtc - offsetAt(first, tz) * 60_000;
}

/** A local wall-clock time (day YYYY-MM-DD, hour 0-23) in a time zone, as an instant. */
export function instantAt(day: string, hour: number, tz: string): number {
  const wall = Date.parse(`${day}T00:00:00Z`) + hour * 3_600_000;
  const first = wall - offsetAt(wall, tz) * 60_000;
  return wall - offsetAt(first, tz) * 60_000;
}

/** Calendar arithmetic on a day label: addDays("2026-11-12", -1) = "2026-11-11". */
export const addDays = (day: string, n: number): string => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
