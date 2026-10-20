"use client";

import { useEffect } from "react";
import { track, type BeaconOptions } from "@/lib/beacon";

/** Counts this page's visitor for dashboard → Analytics (see lib/beacon.ts). */
export function Beacon({ funnel, page, lang, abCookie }: BeaconOptions) {
  useEffect(() => {
    track({ funnel, page, lang, abCookie });
  }, [funnel, page, lang, abCookie]);
  return null;
}
