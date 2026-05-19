"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { I } from "@/components/icons";

type Props = {
  blockType: string;
  intent?: string | null;
  selectedText?: string | null;
  selectedHtml?: string | null;
  selectedTag?: string | null;
  anchor?: { x: number; y: number } | null;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
};

const EDITOR_W = 420;
const EDITOR_H_GUESS = 220;

const QUICK_ACTIONS: Record<string, string[]> = {
  hero: ["Punchier headline", "More urgent CTA", "Shorter subhead"],
  custom_html: ["Bolder typography", "Tighter spacing", "Different palette"],
  pricing: ["Add a third tier", "Reframe value", "Lower mid-tier price"],
  faq: ["Add refund question", "Rewrite for clarity", "Shorter answers"],
  cta: ["More urgent", "Reframe benefit", "Test variation"],
  text: ["Shorter", "More punchy", "Add an example"],
  social_proof: ["More specific quote", "Add metric", "New attribution"],
  form: ["Fewer fields", "Reframe label", "Stronger submit"],
  image: ["Reword alt", "New caption"],
};

export function InlineBlockEditor({
  blockType,
  intent,
  selectedText,
  selectedHtml,
  selectedTag,
  anchor,
  onSubmit,
  onCancel,
}: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = (override?: string) => {
    const value = (override ?? text).trim();
    if (!value) return;
    onSubmit(value);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const suggestions = selectedHtml
    ? ["Make bolder", "More compact", "New color", "Subtler", "Bigger"]
    : selectedText
      ? ["Shorter", "Punchier", "More specific", "More casual"]
      : (QUICK_ACTIONS[blockType] ?? QUICK_ACTIONS.custom_html);

  let style: React.CSSProperties | undefined;
  if (anchor) {
    const pad = 12;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const left = Math.max(
      pad,
      Math.min(vw - EDITOR_W - pad, anchor.x - EDITOR_W / 2),
    );
    const top =
      anchor.y + EDITOR_H_GUESS + pad < vh
        ? anchor.y + 12
        : Math.max(pad, anchor.y - EDITOR_H_GUESS - 12);
    style = { position: "fixed", top, left, width: EDITOR_W };
  }

  return (
    <div
      className={`inline-editor${anchor ? " inline-editor--anchored" : ""}`}
      style={style}
      onDragStart={(e) => e.stopPropagation()}
      draggable={false}
    >
      <div className="inline-editor__head">
        <span className="inline-editor__chip">
          <I.sparkles size={10} />
          Ask Riley
        </span>
        <span className="inline-editor__target">
          {selectedHtml
            ? `<${selectedTag ?? "element"}>`
            : selectedText
              ? "Selected text"
              : blockType === "custom_html"
                ? `custom · ${intent ?? "section"}`
                : blockType}
        </span>
        <button
          type="button"
          className="inline-editor__close"
          onClick={onCancel}
          aria-label="Close"
        >
          <I.close size={11} />
        </button>
      </div>

      {selectedHtml && !selectedText && (
        <div className="inline-editor__fragment">
          <code>
            {selectedHtml.length > 180
              ? selectedHtml.slice(0, 177) + "…"
              : selectedHtml}
          </code>
        </div>
      )}
      {selectedText && (
        <div className="inline-editor__quote">
          “{selectedText.length > 140
            ? selectedText.slice(0, 137) + "…"
            : selectedText}”
        </div>
      )}

      <textarea
        ref={ref}
        className="inline-editor__input"
        placeholder={
          selectedText
            ? "Tell Riley how to change this text…"
            : "Tell Riley what to change…"
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        rows={2}
      />

      <div className="inline-editor__suggestions">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="inline-editor__suggestion"
            onClick={() => submit(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="inline-editor__foot">
        <span className="inline-editor__hint">Enter to send · Esc to close</span>
        <button
          type="button"
          className="inline-editor__send"
          onClick={() => submit()}
          disabled={!text.trim()}
        >
          <I.send size={12} />
        </button>
      </div>
    </div>
  );
}
