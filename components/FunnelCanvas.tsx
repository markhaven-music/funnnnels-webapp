"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { BlockView } from "@/components/blocks/BlockView";
import { I } from "@/components/icons";
import { InlineBlockEditor } from "@/components/InlineBlockEditor";
import { SelectionTooltip } from "@/components/SelectionTooltip";
import type { Block } from "@/lib/blocks";

type Props = {
  blocks: Block[];
  flashIds?: string[];
  onAskRiley?: (
    blockId: string,
    blockType: string,
    intent: string | null,
    instruction: string,
    selectedText?: string | null,
  ) => void;
  onPatch?: (blockId: string, propsPatch: Record<string, unknown>) => void;
  onReorder?: (orderedIds: string[]) => void;
};

export function FunnelCanvas({
  blocks,
  flashIds = [],
  onAskRiley,
  onPatch,
  onReorder,
}: Props) {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSelection, setEditSelection] = useState<string | null>(null);

  useEffect(() => {
    if (flashIds.length === 0) return;
    for (const id of flashIds) {
      const el = refs.current.get(id);
      if (el) {
        el.classList.remove("flash");
        void el.offsetWidth;
        el.classList.add("flash");
      }
    }
  }, [flashIds]);

  // Close inline editor on outside click or Esc
  useEffect(() => {
    if (!editId) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        !target.closest(".inline-editor") &&
        !target.closest(".fb-block__edit") &&
        !target.closest(".sel-tooltip")
      ) {
        setEditId(null);
        setEditSelection(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditId(null);
        setEditSelection(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [editId]);

  if (blocks.length === 0) {
    return (
      <div className="fb-empty">
        <h3>Empty page</h3>
        <p>
          Tell Riley what you want — &ldquo;build a SaaS landing page for an AI
          note-taking app&rdquo; works.
        </p>
      </div>
    );
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    if (!onReorder) return;
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {
      /* ignore */
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, id: string) => {
    if (!onReorder || !dragId || dragId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverId(id);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, id: string) => {
    if (!onReorder || !dragId) return;
    e.preventDefault();
    if (dragId === id) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ids = blocks.map((b) => b.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = ids.filter((x) => x !== dragId);
    next.splice(toIdx, 0, dragId);
    setDragId(null);
    setOverId(null);
    onReorder(next);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <>
      {onAskRiley && (
        <SelectionTooltip
          onPick={(blockId, text) => {
            setEditId(blockId);
            setEditSelection(text);
          }}
        />
      )}
      {blocks.map((b) => {
        const isCustom = b.type === "custom_html";
        const intent = isCustom
          ? ((b.props as { intent?: string }).intent ?? "section")
          : null;
        const dragging = dragId === b.id;
        const overTop = overId === b.id && dragId !== b.id;
        const isEditing = editId === b.id;
        return (
          <div
            key={b.id}
            className={[
              "fb-block",
              isCustom ? "fb-block--custom" : "",
              isEditing ? "is-editing" : "",
              dragging ? "is-dragging" : "",
              overTop ? "is-drop-target" : "",
              isEditing && editSelection ? "is-editing-selection" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-block-id={b.id}
            draggable={!!onReorder && !isEditing}
            onDragStart={(e) => handleDragStart(e, b.id)}
            onDragOver={(e) => handleDragOver(e, b.id)}
            onDrop={(e) => handleDrop(e, b.id)}
            onDragEnd={handleDragEnd}
            ref={(el) => {
              if (el) refs.current.set(b.id, el);
              else refs.current.delete(b.id);
            }}
          >
            <div className="fb-block__chrome">
              {onReorder && (
                <span
                  className="fb-block__grip"
                  title="Drag to reorder"
                  aria-hidden
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <circle cx="6" cy="3" r="1" />
                    <circle cx="10" cy="3" r="1" />
                    <circle cx="6" cy="8" r="1" />
                    <circle cx="10" cy="8" r="1" />
                    <circle cx="6" cy="13" r="1" />
                    <circle cx="10" cy="13" r="1" />
                  </svg>
                </span>
              )}
              <span>{isCustom ? `custom · ${intent}` : b.type}</span>
              {onAskRiley && (
                <button
                  type="button"
                  className="fb-block__edit"
                  onClick={() => setEditId(isEditing ? null : b.id)}
                  title="Click and edit with Riley"
                >
                  <I.sparkles size={10} />
                  Click and edit
                </button>
              )}
            </div>

            {isEditing && onAskRiley && (
              <InlineBlockEditor
                blockType={b.type}
                intent={intent}
                selectedText={editSelection}
                onSubmit={(instruction) => {
                  const sel = editSelection;
                  setEditId(null);
                  setEditSelection(null);
                  onAskRiley(b.id, b.type, intent, instruction, sel);
                }}
                onCancel={() => {
                  setEditId(null);
                  setEditSelection(null);
                }}
              />
            )}

            <BlockView
              block={b}
              patch={
                onPatch && !isCustom
                  ? (propsPatch) => onPatch(b.id, propsPatch)
                  : undefined
              }
            />
          </div>
        );
      })}
    </>
  );
}
