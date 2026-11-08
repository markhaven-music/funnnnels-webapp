"use client";

import { useEffect } from "react";
import { track, type BeaconOptions } from "@/lib/beacon";
import { AVAILABILITY_JS } from "@/lib/availability";

/** Counts this page's visitor for dashboard → Analytics (see lib/beacon.ts).
 *  On a landing it also puts the "Checking availability…" popup in front of
 *  the order page's links (lib/availability.ts). */
export function Beacon({ funnel, page, lang, abCookie }: BeaconOptions) {
  useEffect(() => {
    if (page === "landing") new Function(AVAILABILITY_JS)();
  }, [page]);
  useEffect(() => {
    track({ funnel, page, lang, abCookie });
  }, [funnel, page, lang, abCookie]);
  return null;
}
