"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { I } from "@/components/icons";

type Props = {
  blockType: string;
  intent?: string | null;
  selectedText?: string | null;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
};

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

  const suggestions = selectedText
    ? ["Shorter", "Punchier", "More specific", "More casual"]
    : (QUICK_ACTIONS[blockType] ?? QUICK_ACTIONS.custom_html);

  return (
    <div
      className="inline-editor"
      onDragStart={(e) => e.stopPropagation()}
      draggable={false}
    >
      <div className="inline-editor__head">
        <span className="inline-editor__chip">
          <I.sparkles size={10} />
          Ask Riley
        </span>
        <span className="inline-editor__target">
          {selectedText
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
