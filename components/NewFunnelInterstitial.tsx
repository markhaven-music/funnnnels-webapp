"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type KeyboardEvent } from "react";
import { I } from "@/components/icons";

const SUGGESTIONS = [
  "SaaS landing page for an AI note-taking app",
  "Webinar registration funnel for a B2B audience",
  "Lead-magnet opt-in for a free PDF guide",
  "Product page for a $49 MIDI drum kit",
  "Booking page for a 1:1 coaching call",
  "Pre-launch waitlist for a mobile app",
];

export function NewFunnelInterstitial() {
  const router = useRouter();
  const params = useSearchParams();
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const initial = params.get("seed");
    if (initial) setSeed(initial);
  }, [params]);

  async function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const name = t.length > 60 ? t.slice(0, 60).trimEnd() + "…" : t;
      const res = await fetch("/api/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      router.push(
        `/funnels/${data.funnel.id}/edit?seed=${encodeURIComponent(t)}`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      submit(seed);
    }
  };

  return (
    <div className="new-funnel">
      <div className="new-funnel__back">
        <Link href="/" className="btn ghost" style={{ padding: "0 10px 0 8px", height: 32 }}>
          <I.arrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="new-funnel__inner">
        <div className="new-funnel__eyebrow">
          <span className="orb" /> New with AI
        </div>
        <h1 className="new-funnel__title">What do you want to build?</h1>
        <p className="new-funnel__sub">
          Describe the funnel in a sentence. Riley will draft the page —
          hero, sections, copy, CTAs — and you edit from there.
        </p>

        <div className="new-funnel__composer">
          <textarea
            autoFocus
            placeholder="e.g. A landing page for a $29/month dog-training app, friendly and confident tone, with a free 7-day trial CTA"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={onKey}
            rows={4}
            disabled={busy}
          />
          <div className="new-funnel__actions">
            <span className="new-funnel__hint">
              {busy ? "Spinning up your funnel…" : "Enter to build · Shift+Enter for newline"}
            </span>
            <button
              type="button"
              className="btn primary"
              onClick={() => submit(seed)}
              disabled={!seed.trim() || busy}
            >
              <I.sparkles size={13} /> {busy ? "Building…" : "Build it"}
            </button>
          </div>
        </div>

        {err && <div className="new-funnel__err">⚠ {err}</div>}

        <div className="new-funnel__suggestions">
          <div className="new-funnel__suggestions-label">Or start from a template</div>
          <div className="new-funnel__suggestions-grid">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="new-funnel__suggestion"
                onClick={() => submit(s)}
                disabled={busy}
              >
                <span className="pl">›</span>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
