"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { BlockView } from "@/components/blocks/BlockView";
import { I } from "@/components/icons";
import type { Block } from "@/lib/blocks";

type Props = {
  blocks: Block[];
  flashIds?: string[];
  onAnnotate?: (blockId: string, type: string) => void;
  onConvert?: (blockId: string, intent: string) => void;
  onPatch?: (blockId: string, propsPatch: Record<string, unknown>) => void;
  onReorder?: (orderedIds: string[]) => void;
  activeAnnotationId?: string | null;
};

export function FunnelCanvas({
  blocks,
  flashIds = [],
  onAnnotate,
  onConvert,
  onPatch,
  onReorder,
  activeAnnotationId = null,
}: Props) {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

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
              activeAnnotationId === b.id ? "is-annotating" : "",
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
              {onAnnotate && (
                <button
                  type="button"
                  className="fb-block__note"
                  onClick={() => onAnnotate(b.id, b.type)}
                  title="Tell Riley to edit this block"
                >
                  <I.sparkles size={10} />
                  Note Riley
                </button>
              )}
              {isCustom && onConvert && (
                <button
                  type="button"
                  className="fb-block__note"
                  onClick={() => onConvert(b.id, intent ?? "section")}
                  title="Convert this custom block into editable structured blocks"
                >
                  <I.layers size={10} />
                  Make editable
                </button>
              )}
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
