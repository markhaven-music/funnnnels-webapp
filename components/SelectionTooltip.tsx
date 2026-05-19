"use client";

import { useEffect, useState } from "react";
import { I } from "@/components/icons";

type Selection = {
  blockId: string;
  text: string;
  top: number;
  left: number;
};

type Props = {
  onPick: (blockId: string, text: string) => void;
};

export function SelectionTooltip({ onPick }: Props) {
  const [sel, setSel] = useState<Selection | null>(null);

  useEffect(() => {
    const update = () => {
      const s = window.getSelection();
      if (!s || s.isCollapsed || s.rangeCount === 0) {
        setSel(null);
        return;
      }
      const text = s.toString().trim();
      if (text.length < 2) {
        setSel(null);
        return;
      }
      const anchor = s.anchorNode;
      if (!anchor) return;
      const el =
        anchor.nodeType === Node.ELEMENT_NODE
          ? (anchor as Element)
          : (anchor.parentElement as Element | null);
      if (!el) return;
      // Block detection: must be inside an .fb-block, but ignore inline editor and chrome.
      if (el.closest(".inline-editor") || el.closest(".fb-block__chrome")) {
        return;
      }
      const block = el.closest(".fb-block") as HTMLElement | null;
      if (!block) {
        setSel(null);
        return;
      }
      const blockId = block.getAttribute("data-block-id");
      if (!blockId) {
        setSel(null);
        return;
      }
      const rect = s.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      setSel({
        blockId,
        text,
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    };

    document.addEventListener("selectionchange", update);
    return () => {
      document.removeEventListener("selectionchange", update);
    };
  }, []);

  if (!sel) return null;

  return (
    <button
      type="button"
      className="sel-tooltip"
      style={{ top: sel.top, left: sel.left }}
      onMouseDown={(e) => {
        // Avoid clobbering selection before the click fires
        e.preventDefault();
      }}
      onClick={() => {
        onPick(sel.blockId, sel.text);
        setSel(null);
        window.getSelection()?.removeAllRanges();
      }}
    >
      <I.sparkles size={11} />
      Ask Riley to edit this
    </button>
  );
}
