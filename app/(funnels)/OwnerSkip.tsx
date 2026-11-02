"use client";

import { useEffect, useState } from "react";
import { isPreview } from "@/lib/beacon";

// Step 1 of the order forms, on the owner's devices (fv:me) and previews only
// ("se sono io ad andare sull order page... andare step 2 senza mettere nomi
// email"): a link straight to step 2 with no name or email. The caller opens
// step 2 without saving a lead; the checkout view and the Pixel already skip
// these browsers (lib/beacon.ts), so nothing reaches Analytics, Live or Meta.
// Shown after mount, as the page is cached for everyone.

export function OwnerSkip({ onSkip }: { onSkip: () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isPreview()), []);
  if (!on) return null;
  return (
    <button
      type="button"
      onClick={onSkip}
      style={{
        display: "block",
        margin: "12px auto 0",
        padding: "6px 10px",
        border: 0,
        background: "rgba(17,17,17,.82)",
        color: "#fff",
        font: "600 12px/1.2 system-ui,sans-serif",
        borderRadius: 3,
        cursor: "pointer",
      }}
    >
      Your device · skip to step 2 (not saved)
    </button>
  );
}
