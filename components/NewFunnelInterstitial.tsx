"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { I } from "@/components/icons";

// A new funnel: name it, get a starter page, edit it section by section.
export function NewFunnelInterstitial() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n.slice(0, 80) }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      router.push(`/funnels/${data.funnel.id}/edit`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="new-funnel">
      <div className="new-funnel__back">
        <Link href="/" className="btn ghost" style={{ padding: "0 10px 0 8px", height: 32 }}>
          <I.arrowLeft size={14} /> Back
        </Link>
      </div>

      <form className="new-funnel__inner" onSubmit={submit}>
        <img className="new-funnel__art" src="/funnels/dashboard/funnel.webp" width={96} height={96} alt="" />
        <h1 className="new-funnel__title">Name your funnel</h1>
        <p className="new-funnel__sub">
          You get a starter page. Click any text to change it, add or delete sections, drag them
          into order, then publish.
        </p>

        <div className="new-funnel__composer">
          <input
            autoFocus
            placeholder="e.g. Drum Kit launch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className="new-funnel__name"
          />
          <div className="new-funnel__actions">
            <span className="new-funnel__hint">{busy ? "Creating your funnel…" : "Enter to create"}</span>
            <button type="submit" className="btn primary" disabled={!name.trim() || busy}>
              <I.plus size={13} /> {busy ? "Creating…" : "Create funnel"}
            </button>
          </div>
        </div>

        {err && <div className="new-funnel__err">⚠ {err}</div>}
      </form>
    </div>
  );
}
