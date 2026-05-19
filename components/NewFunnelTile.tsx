"use client";

import Link from "next/link";
import { I } from "@/components/icons";
import { QUICK_PROMPTS } from "@/lib/data";

type Props = { prominent?: boolean };

export function NewFunnelTile({ prominent = false }: Props) {
  return (
    <div className={`funnel new ${prominent ? "funnel--prominent" : ""}`}>
      <div className="new-icon">
        <I.sparkles size={18} />
      </div>
      <h4>Create with AI</h4>
      <p>
        {prominent
          ? "You don't have any funnels yet. Describe what you want — Riley will draft pages, copy, and a hero in seconds."
          : "Describe what you want. Riley will draft pages, copy, and a hero in seconds."}
      </p>
      <div className="quick">
        {QUICK_PROMPTS.map((p, i) => (
          <Link
            key={i}
            href={`/funnels/new?seed=${encodeURIComponent(p)}`}
            className="qprompt"
          >
            <I.sparkles
              size={12}
              style={{ color: "var(--accent-2)", flexShrink: 0 }}
            />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p}
            </span>
            <I.arrow size={12} className="arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
}
