"use client";

import { useEffect } from "react";
import { track, type BeaconOptions } from "@/lib/beacon";
import { AVAILABILITY_JS } from "@/lib/availability";
import { salesPopJs } from "@/lib/salesPop";

/** Counts this page's visitor for dashboard → Analytics (see lib/beacon.ts).
 *  On a landing it also puts the "Checking availability…" popup in front of
 *  the order page's links (lib/availability.ts). Landings also carry the
 *  recent-buyer pop-up (lib/salesPop.ts). */
export function Beacon({ funnel, page, lang, abCookie }: BeaconOptions) {
  useEffect(() => {
    if (page === "landing") new Function(AVAILABILITY_JS)();
  }, [page]);
  useEffect(() => {
    if (page === "landing") new Function(salesPopJs(funnel, lang))();
  }, [page, funnel, lang]);
  useEffect(() => {
    track({ funnel, page, lang, abCookie });
  }, [funnel, page, lang, abCookie]);
  return null;
}
