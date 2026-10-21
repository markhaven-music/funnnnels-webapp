"use client";

import Link from "next/link";
import { I } from "@/components/icons";

type Props = { prominent?: boolean };

export function NewFunnelTile({ prominent = false }: Props) {
  return (
    <Link href="/funnels/new" className={`funnel new ${prominent ? "funnel--prominent" : ""}`}>
      <img className="new-art" src="/funnels/dashboard/new-funnel.webp" width={88} height={88} alt="" />
      <h4>
        <I.plus size={14} /> New funnel
      </h4>
      <p>
        {prominent
          ? "You don't have any funnels yet. Start from a starter page and edit it section by section."
          : "Start from a starter page and edit it section by section."}
      </p>
    </Link>
  );
}
