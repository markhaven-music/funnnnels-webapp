"use client";

import { useEffect, useRef, type ElementType, type KeyboardEvent } from "react";

type Props = {
  as?: ElementType;
  value: string;
  onChange?: (next: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
};

export function EditableText({
  as: Tag = "span",
  value,
  onChange,
  className,
  placeholder,
  multiline = false,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  // Keep the DOM in sync when the value changes externally (e.g. Riley edits).
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return; // don't clobber while typing
    if (ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const editable = !!onChange;

  const handleBlur = () => {
    if (!ref.current || !onChange) return;
    const next = (ref.current.textContent ?? "").trim();
    if (next !== value) onChange(next);
  };

  const handleKey = (e: KeyboardEvent<HTMLElement>) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      if (ref.current) ref.current.textContent = value;
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      className={`${className ?? ""}${editable ? " editable" : ""}`.trim()}
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={editable}
      data-placeholder={placeholder}
      onBlur={handleBlur}
      onKeyDown={handleKey}
    >
      {value}
    </Tag>
  );
}
