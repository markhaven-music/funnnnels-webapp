"use client";

import { useEffect } from "react";
import { isPreview } from "@/lib/beacon";

// Counts a post's readers for dashboard → Blog (lib/blogStats.ts): once per
// browser per day that someone opened it, with the site they came from, and
// once more when they follow a link to the pack ([data-cta]). Nothing about
// the person is sent. Previews and the owner's devices aren't counted
// (lib/beacon.ts), like on the funnels.
const URL = "/api/checkout/blog";

function send(slug: string, kind: "view" | "click") {
  try {
    const key = `fv:blog:${slug}:${kind}`;
    const today = new Date().toDateString();
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {
      // no storage (private mode): count every time instead
    }
    let r = "";
    try {
      r = document.referrer ? new window.URL(document.referrer).hostname : "";
    } catch {
      // an odd referrer: counted as direct
    }
    const body = JSON.stringify({ s: slug, k: kind, r, h: location.hostname, ...(navigator.webdriver ? { w: 1 } : {}) });
    if (!navigator.sendBeacon?.(URL, body)) fetch(URL, { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // never break a page over a count
  }
}

export function BlogBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    if (isPreview()) return;
    send(slug, "view");
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-cta]")) send(slug, "click");
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [slug]);
  return null;
}
