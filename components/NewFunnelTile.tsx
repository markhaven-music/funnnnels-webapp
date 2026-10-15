"use client";

import Link from "next/link";
import { I } from "@/components/icons";

type Props = { prominent?: boolean };

export function NewFunnelTile({ prominent = false }: Props) {
  return (
    <Link href="/funnels/new" className={`funnel new ${prominent ? "funnel--prominent" : ""}`}>
      <div className="new-icon">
        <I.plus size={18} />
      </div>
      <h4>New funnel</h4>
      <p>
        {prominent
          ? "You don't have any funnels yet. Start from a starter page and edit it section by section."
          : "Start from a starter page and edit it section by section."}
      </p>
    </Link>
  );
}
