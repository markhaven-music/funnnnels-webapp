"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation } from "@/lib/support";
import type { Overview, OverviewItem, Priority } from "@/lib/supportOverview";
import s from "./support.module.css";

// Dashboard → Support → AI Overview (lib/supportOverview.ts): what to answer
// first. Written again on opening the page when the inbox changed since.

type State = { configured: boolean; overview: Overview | null; generatedAt?: string; model?: string; stale: boolean };

const LABEL: Record<Priority, string> = { urgent: "urgent", high: "high", normal: "normal", low: "low", ignore: "ignore" };
const CHIP: Record<Priority, string> = { urgent: s.p_urgent, high: s.p_high, normal: s.p_normal, low: s.p_low, ignore: s.p_low };

function ago(iso: string): string {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Item({ item, name, onOpen }: { item: OverviewItem; name: string; onOpen: (c: string) => void }) {
  return (
    <button type="button" className={s.ovItem} onClick={() => onOpen(item.customer)}>
      <span className={`${s.prio} ${CHIP[item.priority]}`}>{LABEL[item.priority]}</span>
      <span className={s.ovText}>
        <span className={s.ovTitle}>
          {item.title} <span className={s.ovWho}>· {name}</span>
        </span>
        <span className={s.ovWhy}>{item.why}</span>
        <span className={s.ovAction}>→ {item.action}</span>
      </span>
    </button>
  );
}

export function SupportOverview({ list, onOpen }: { list: Conversation[]; onOpen: (customer: string) => void }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showIgnored, setShowIgnored] = useState(false);
  const auto = useRef(false);

  const generate = useCallback(async (force: boolean) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/support/overview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ force }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setState((st) => ({ configured: true, ...st, ...j }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/support/overview", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<State>) : null))
      .then((j) => {
        if (!j) return;
        setState(j);
        // Opening the page writes a new one if the inbox changed since.
        if (j.configured && j.stale && !auto.current) {
          auto.current = true;
          generate(false);
        }
      })
      .catch(() => {});
  }, [generate]);

  if (!state) return null;
  if (!state.configured) {
    return (
      <div className={s.overview}>
        <div className={s.ovHead}>
          <span className={s.ovLabel}>AI OVERVIEW</span>
        </div>
        <p className={s.ovSummary}>Set ANTHROPIC_API_KEY in Vercel to get a summary of the inbox, ordered by what to answer first.</p>
      </div>
    );
  }

  const byCustomer = new Map(list.map((c) => [c.customer, c]));
  // Conversations marked done since drop out.
  const items = (state.overview?.items ?? []).filter((i) => !byCustomer.get(i.customer)?.done);
  const main = items.filter((i) => i.priority !== "ignore");
  const ignored = items.filter((i) => i.priority === "ignore");
  const name = (c: string) => byCustomer.get(c)?.name || c;

  return (
    <div className={s.overview}>
      <div className={s.ovHead}>
        <span className={s.ovLabel}>AI OVERVIEW</span>
        <span className={s.ovMeta}>
          {busy ? "Reading the inbox…" : state.generatedAt ? `${ago(state.generatedAt)}${state.stale ? " · new email since" : ""}` : ""}
        </span>
        <button type="button" className="btn" onClick={() => generate(true)} disabled={busy}>
          {busy ? "Working…" : "Refresh"}
        </button>
      </div>
      {error ? <p className={s.ovError}>Couldn&apos;t write the overview: {error}</p> : null}
      {state.overview ? (
        <>
          <p className={s.ovSummary}>{state.overview.summary}</p>
          {main.length > 0 && (
            <div className={s.ovList}>
              {main.map((i) => (
                <Item key={i.customer} item={i} name={name(i.customer)} onOpen={onOpen} />
              ))}
            </div>
          )}
          {ignored.length > 0 && (
            <div>
              <button type="button" className={s.linkButton} onClick={() => setShowIgnored((v) => !v)}>
                {showIgnored ? "hide" : "show"} {ignored.length} to ignore (spam, notifications, auto-replies)
              </button>
              {showIgnored && (
                <div className={s.ovList} style={{ marginTop: 8 }}>
                  {ignored.map((i) => (
                    <Item key={i.customer} item={i} name={name(i.customer)} onOpen={onOpen} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : busy ? null : (
        <p className={s.ovSummary}>No overview yet.</p>
      )}
    </div>
  );
}
