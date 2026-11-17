"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import b from "./btn.module.css";
import p from "./popupOffer.module.css";
import { Arrow } from "./Cta";
import { POPUP_OFFER, POPUP_WORDS } from "./offerPopup";

// The popup offer on the landing (./offerPopup.ts says why and how). One listener
// catches every link to the order page, as the availability popup did: a click
// another script already handled, a new-tab click (⌘/ctrl/shift/middle) or a link
// to another site goes through untouched. The order page starts loading behind
// the popup at the tap (prerendered where the browser can), so either answer
// opens it at once.

export function PopupOffer({ price }: { price: string }) {
  const [href, setHref] = useState<string | null>(null);
  const yes = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      let u: URL;
      try {
        u = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (u.origin !== location.origin || !/\/order(\/|$)/.test(u.pathname)) return;
      e.preventDefault();
      preload(u.href);
      setHref(u.href);
    }
    // Back from the order page (bfcache): the landing as it was, no popup.
    function onShow(e: PageTransitionEvent) {
      if (e.persisted) setHref(null);
    }
    window.addEventListener("click", onClick);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  useEffect(() => {
    if (!href) return;
    yes.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHref(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [href]);

  if (!href) return null;

  function answer(add: boolean) {
    try {
      localStorage.setItem(POPUP_OFFER.key, JSON.stringify({ add, at: Date.now() }));
    } catch {}
    location.href = href!;
  }

  const fill = (t: string) => t.replace("{price}", price);
  // On <body>: inside the page, its sections' own layers drew over it.
  return createPortal(
    <div className={p.back} onClick={(e) => e.target === e.currentTarget && setHref(null)}>
      <div className={p.box} role="dialog" aria-modal="true" aria-labelledby="popup-offer-title">
        <button type="button" className={p.close} aria-label="Close" onClick={() => setHref(null)}>
          ×
        </button>
        <img className={p.pic} src={POPUP_OFFER.image} alt="" width={160} height={160} decoding="async" />
        <h2 id="popup-offer-title" className={p.title}>
          {fill(POPUP_WORDS.title)}
        </h2>
        <p className={p.text}>{POPUP_WORDS.text}</p>
        <ul className={p.list}>
          {POPUP_WORDS.list.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <button ref={yes} type="button" className={`${b.btn} ${b.full} ${p.yes}`} onClick={() => answer(true)}>
          <span className={b.shine} aria-hidden />
          <span className={b.label}>
            <span>{fill(POPUP_WORDS.yes)}</span>
            <Arrow className={b.arrow} />
          </span>
        </button>
        <button type="button" className={p.no} onClick={() => answer(false)}>
          {POPUP_WORDS.no}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** The order page, loading behind the popup: prerendered whole where speculation rules work, fetched into the cache elsewhere. */
function preload(url: string) {
  try {
    if (HTMLScriptElement.supports?.("speculationrules")) {
      const s = document.createElement("script");
      s.type = "speculationrules";
      s.textContent = JSON.stringify({ prerender: [{ source: "list", urls: [url], eagerness: "immediate" }] });
      document.head.appendChild(s);
    } else {
      fetch(url, { credentials: "same-origin" }).catch(() => {});
    }
  } catch {}
}
