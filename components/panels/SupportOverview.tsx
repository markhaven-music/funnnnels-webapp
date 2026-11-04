"use client";

import { useState } from "react";
import type { Conversation } from "@/lib/support";
import { I } from "@/components/icons";
import type { Overview, OverviewItem, Priority } from "@/lib/supportOverview";
import s from "./support.module.css";

// Dashboard → Support → Overview (lib/supportOverview.ts): what to answer
// first, by rules. Worked out again whenever the conversations change.

const CHIP: Record<Priority, string> = { urgent: s.p_urgent, high: s.p_high, normal: s.p_normal, low: s.p_low, ignore: s.p_low };

function Item({ item, name, onOpen, onDone }: { item: OverviewItem; name: string; onOpen: (c: string) => void; onDone: (cs: string[]) => void }) {
  return (
    <div className={s.ovRow}>
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
    <button type="button" className={s.discard} title="Mark done" aria-label={`Mark ${name} done`} onClick={() => onDone([item.customer])}>
      <I.check size={14} />
    </button>
    </div>
  );
}

export function SupportOverview({ overview, list, onOpen, onDone }: { overview: Overview | null; list: Conversation[]; onOpen: (customer: string) => void; onDone: (customers: string[]) => void }) {
  const [showIgnored, setShowIgnored] = useState(false);
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
            <Item key={i.customer} item={i} name={name(i.customer)} onOpen={onOpen} onDone={onDone} />
          ))}
        </div>
      )}
      {ignored.length > 0 && (
        <div>
          <div className={s.ignoreBar}>
            <span>
              {ignored.length} to ignore (spam, phishing, bounces, auto-replies)
            </span>
            <button type="button" className={s.linkButton} style={{ marginTop: 0 }} onClick={() => setShowIgnored((v) => !v)}>
              {showIgnored ? "hide" : "show"}
            </button>
            <button type="button" className="btn" onClick={() => onDone(ignored.map((i) => i.customer))}>
              <I.check size={13} /> Mark all {ignored.length} done
            </button>
          </div>
          {showIgnored && (
            <div className={s.ovList} style={{ marginTop: 8 }}>
              {ignored.map((i) => (
                <Item key={i.customer} item={i} name={name(i.customer)} onOpen={onOpen} onDone={onDone} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
