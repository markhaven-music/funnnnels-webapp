"use client";

import { useEffect, useState } from "react";
import { POP_ICON, POP_PRODUCT, SALES_POP_ON, type RecentBuyer } from "@/lib/salesPop";

// The recent-buyer pop-up (lib/salesPop.ts). Bottom left; on a phone a one-line pill, on a
// computer a card with a bigger box. Starts 8 s after the page opens, shows a buyer for 5 s
// every 20 s, 3 at most per page view. Nothing is fetched before then, so the page's speed
// score doesn't see it. Off while SALES_POP_ON is false, except with ?pop=1.

const WORDS: Record<string, { from: string; got: string; ago: (m: number) => string; by: string }> = {
  en: { from: "from", got: "got the", by: "verified by Grind Studio", ago: (m) => (m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`) },
  it: { from: "da", got: "ha preso", by: "verificato da Grind Studio", ago: (m) => (m < 60 ? `${m} min fa` : m < 1440 ? `${Math.round(m / 60)} h fa` : `${Math.round(m / 1440)} g fa`) },
  fr: { from: "de", got: "a pris", by: "vérifié par Grind Studio", ago: (m) => (m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`) },
  es: { from: "de", got: "compró", by: "verificado por Grind Studio", ago: (m) => (m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`) },
  de: { from: "aus", got: "hat", by: "verifiziert von Grind Studio", ago: (m) => (m < 60 ? `vor ${m} Min.` : m < 1440 ? `vor ${Math.round(m / 60)} Std.` : `vor ${Math.round(m / 1440)} T.`) },
};

const FIRST = 8000;
const EVERY = 20000;
const SHOW = 5000;
const MAX = 3;

export function SalesPop({ funnel, lang = "en", lift = 0 }: { funnel: string; lang?: string; lift?: number }) {
  const product = POP_PRODUCT[funnel] ?? "";
  const [buyer, setBuyer] = useState<RecentBuyer | null>(null);
  const [open, setOpen] = useState(false);
  const icon = POP_ICON[funnel];

  useEffect(() => {
    const on = SALES_POP_ON || new URLSearchParams(location.search).get("pop") === "1";
    if (!on || !icon) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let list: RecentBuyer[] = [];
    let shown = 0;
    const next = () => {
      if (shown >= Math.min(MAX, list.length)) return;
      setBuyer(list[shown++]);
      setOpen(true);
      timers.push(setTimeout(() => setOpen(false), SHOW));
      timers.push(setTimeout(next, EVERY));
    };
    timers.push(
      setTimeout(() => {
        fetch(`/api/checkout/recent?f=${encodeURIComponent(funnel)}`)
          .then((r) => r.json())
          .then((d: { buyers?: RecentBuyer[] }) => {
            list = d.buyers ?? [];
            next();
          })
          .catch(() => {});
      }, FIRST),
    );
    return () => timers.forEach(clearTimeout);
  }, [funnel, icon]);

  if (!buyer || !icon) return null;
  const w = WORDS[lang] ?? WORDS.en;
  const who = buyer.country ? `${buyer.name} ${w.from} ${buyer.country}` : buyer.name;
  const got = lang === "de" ? `${w.got} ${product} gekauft` : `${w.got} ${product}`;

  return (
    <div className={`gsp${open ? " gsp-open" : ""}`} style={{ ["--sp-lift" as string]: `${lift}px` }} role="status" aria-live="polite">
      <style>{CSS}</style>
      <img className="gsp-icon" src={icon} alt="" width={160} height={160} loading="lazy" decoding="async" />
      <div className="gsp-text">
        <div className="gsp-who">
          <span className="gsp-name">{who}</span>
          <i className="gsp-tick" aria-label={w.by} />
        </div>
        <div className="gsp-what">{got}</div>
        <div className="gsp-meta">
          <span>{w.ago(buyer.ago)}</span>
          <span className="gsp-by">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <circle cx="8" cy="8" r="8" fill="#1d9bf0" />
              <path d="M4.5 8.2l2.2 2.2 4.8-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {w.by}
          </span>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.gsp{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:60;display:flex;align-items:center;gap:12px;
  width:min(340px,calc(100vw - 32px));padding:10px 16px 10px 10px;background:#fff;color:#111;border-radius:999px;
  box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;
  opacity:0;transform:translateY(16px);pointer-events:none;transition:opacity .35s ease,transform .35s ease}
.gsp-open{opacity:1;transform:none}
.gsp-icon{width:56px;height:56px;flex:none;object-fit:contain;border-radius:12px;background:#f2f2f2}
.gsp-text{min-width:0}
.gsp-who{display:flex;align-items:center;gap:4px;font-weight:700;min-width:0}
.gsp-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gsp-tick{display:none}
.gsp-what{color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gsp-meta{display:flex;gap:8px;margin-top:2px;font-size:12px;color:#666;white-space:nowrap}
.gsp-by{display:inline-flex;align-items:center;gap:4px;color:#1d9bf0;font-weight:600}
@media (max-width:640px){
  .gsp{left:8px;right:8px;width:auto;bottom:calc(8px + var(--sp-lift) + env(safe-area-inset-bottom));padding:5px 14px 5px 5px;gap:10px;font-size:13px;line-height:1.25}
  .gsp-icon{width:38px;height:38px;border-radius:999px}
  .gsp-meta{display:none}
  .gsp-tick{display:block;flex:none;width:13px;height:13px;border-radius:50%;background:#1d9bf0 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 8.2l2.2 2.2 4.8-4.8' fill='none' stroke='%23fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/100% no-repeat}
}
@media (prefers-reduced-motion:reduce){.gsp{transition:opacity .2s}}
`;
