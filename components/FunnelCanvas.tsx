"use client";

import { useState, type DragEvent } from "react";
import { BlockView } from "@/components/blocks/BlockView";
import type { Block } from "@/lib/blocks";

// The page in the editor: every block is a box you edit in place, drag by its
// grip to reorder, or delete from its label bar.
type Props = {
  blocks: Block[];
  onPatch?: (blockId: string, propsPatch: Record<string, unknown>) => void;
  onReorder?: (orderedIds: string[]) => void;
  onDelete?: (blockId: string) => void;
};

export function FunnelCanvas({ blocks, onPatch, onReorder, onDelete }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (blocks.length === 0) {
    return (
      <div className="fb-empty">
        <h3>Empty page</h3>
        <p>Add a section from the bar below to start building.</p>
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
      {blocks.map((b) => {
        const isCustom = b.type === "custom_html";
        const intent = isCustom
          ? ((b.props as { intent?: string }).intent ?? "section")
          : null;
        const dragging = dragId === b.id;
        const overTop = overId === b.id && dragId !== b.id;
        return (
          <div
            key={b.id}
            className={[
              "fb-block",
              isCustom ? "fb-block--custom" : "",
              dragging ? "is-dragging" : "",
              overTop ? "is-drop-target" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-block-id={b.id}
            draggable={!!onReorder}
            onDragStart={(e) => handleDragStart(e, b.id)}
            onDragOver={(e) => handleDragOver(e, b.id)}
            onDrop={(e) => handleDrop(e, b.id)}
            onDragEnd={handleDragEnd}
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
              {onDelete &&
                (confirmId === b.id ? (
                  <span className="fb-block__confirm">
                    <button type="button" className="fb-block__del is-danger" onClick={() => { setConfirmId(null); onDelete(b.id); }}>
                      Delete
                    </button>
                    <button type="button" className="fb-block__del" onClick={() => setConfirmId(null)}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="fb-block__del"
                    title="Delete this section"
                    aria-label="Delete this section"
                    onClick={() => setConfirmId(b.id)}
                  >
                    ×
                  </button>
                ))}
            </div>

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
