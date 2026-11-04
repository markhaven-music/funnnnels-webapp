"use client";

import { useEffect, useState } from "react";
import type { Conversation } from "@/lib/support";
import type { Overview, OverviewItem, Priority } from "@/lib/supportOverview";
import s from "./support.module.css";

// Dashboard → Support → Overview (lib/supportOverview.ts): what to answer
// first, by rules. Worked out again whenever the conversations change.

const CHIP: Record<Priority, string> = { urgent: s.p_urgent, high: s.p_high, normal: s.p_normal, low: s.p_low, ignore: s.p_low };

function Item({ item, name, onOpen }: { item: OverviewItem; name: string; onOpen: (c: string) => void }) {
  return (
    <button type="button" className={s.ovItem} onClick={() => onOpen(item.customer)}>
      <span className={`${s.prio} ${CHIP[item.priority]}`}>{item.priority}</span>
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
  const [overview, setOverview] = useState<Overview | null>(null);
  const [showIgnored, setShowIgnored] = useState(false);
  // New email, read or done: the list's shape changes, the overview follows.
  const key = list.map((c) => `${c.customer}:${c.messages}:${c.lastAt}:${c.done ? 1 : 0}`).join("|");

  useEffect(() => {
    fetch("/api/support/overview", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Overview>) : null))
      .then((o) => o && setOverview(o))
      .catch(() => {});
  }, [key]);

  if (!overview) return null;
  const byCustomer = new Map(list.map((c) => [c.customer, c]));
  const items = overview.items.filter((i) => !byCustomer.get(i.customer)?.done);
  const main = items.filter((i) => i.priority !== "ignore");
  const ignored = items.filter((i) => i.priority === "ignore");
  const name = (c: string) => byCustomer.get(c)?.name || c;

  return (
    <div className={s.overview}>
      <div className={s.ovHead}>
        <span className={s.ovLabel}>OVERVIEW</span>
      </div>
      <p className={s.ovSummary}>{overview.summary}</p>
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
            {showIgnored ? "hide" : "show"} {ignored.length} to ignore (spam, phishing, bounces, auto-replies)
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
    </div>
  );
}
