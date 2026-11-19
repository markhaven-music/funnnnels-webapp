// The pack's price, 27 → 37 (2026-11-15, "ok allora alziamo prezzo Jazz (metti in analytics il cambio
// e teniamolo d'occhio)"): the average order was about €35 with 2 buyers in 3 paying the bare 27, and
// the target is €45. With it the Jazz Record Samples became the seventh bonus. Not a split: everyone
// gets 37, read as a before/after by days in Analytics (lib/analytics.ts, TESTS).
//
// What decides it is money per visitor, not orders alone: 37 wins while it loses fewer than 27 % of
// the orders 27 got from the same visits (27 / 37 = 0.73).
export const PRICE_37 = {
  /** Before: the page's last five whole UTC days at 27 with nothing else changing (the 5-minute bonus ended 11-10). */
  beforeFrom: "2026-11-11T00:00:00Z",
  /** The minute 37 reached visitors (dashboard → Products set to 37 at 22:28 UTC; the pages' deploy followed at 22:30). */
  live: "2026-11-15T22:28:00Z",
  /** After: its first whole UTC day, orders and visits alike. */
  afterFrom: "2026-11-16T00:00:00Z",
  /** Back to 27 ("Riportiamo a 27"): dashboard → Products' row at 27 again. 37 lasted about 17 hours, so the
   * 37 column is 11-16 alone (its evening at 27 included: page_views has days, not hours). */
  back27: "2026-11-16T16:49:00Z",
};
