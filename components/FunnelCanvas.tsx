"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { BlockView } from "@/components/blocks/BlockView";
import { I } from "@/components/icons";
import { InlineBlockEditor } from "@/components/InlineBlockEditor";
import { SelectionTooltip } from "@/components/SelectionTooltip";
import type { Block } from "@/lib/blocks";

export type ElementSelection = {
  outerHtml: string;
  tag: string;
  text: string;
};

type Props = {
  blocks: Block[];
  flashIds?: string[];
  editMode?: boolean;
  onExitEditMode?: () => void;
  onAskRiley?: (
    blockId: string,
    blockType: string,
    intent: string | null,
    instruction: string,
    selectedText?: string | null,
    element?: ElementSelection | null,
  ) => void;
  onPatch?: (blockId: string, propsPatch: Record<string, unknown>) => void;
  onReorder?: (orderedIds: string[]) => void;
};

export function FunnelCanvas({
  blocks,
  flashIds = [],
  editMode = false,
  onExitEditMode,
  onAskRiley,
  onPatch,
  onReorder,
}: Props) {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSelection, setEditSelection] = useState<string | null>(null);
  const [editElement, setEditElement] = useState<ElementSelection | null>(null);

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

  // Element-level picker for custom_html blocks during edit mode.
  useEffect(() => {
    if (!editMode) return;
    let hovered: HTMLElement | null = null;
    const clear = () => {
      if (hovered) {
        hovered.style.outline = "";
        hovered.style.outlineOffset = "";
        hovered = null;
      }
    };
    const isCandidate = (el: HTMLElement): boolean => {
      if (!el) return false;
      // Must be inside a custom block's rendered HTML
      const custom = el.closest(".fb-custom");
      if (!custom) return false;
      // Skip chrome/editor overlays and the wrapper itself
      if (el.closest(".fb-block__chrome") || el.closest(".inline-editor")) return false;
      if (el === custom) return false;
      // Skip the block wrapper itself
      if (el.classList.contains("fb-block")) return false;
      return true;
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!isCandidate(target)) {
        clear();
        return;
      }
      if (hovered === target) return;
      clear();
      hovered = target;
      target.style.outline = "2px solid var(--accent)";
      target.style.outlineOffset = "2px";
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!isCandidate(target)) return;
      const blockEl = target.closest(".fb-block") as HTMLElement | null;
      const blockId = blockEl?.getAttribute("data-block-id");
      if (!blockId) return;
      // Don't intercept ongoing text selection
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
      e.preventDefault();
      e.stopPropagation();
      const text = (target.textContent ?? "").trim().slice(0, 160);
      let outer = target.outerHTML;
      if (outer.length > 1200) outer = outer.slice(0, 1200) + "…";
      setEditElement({
        outerHtml: outer,
        tag: target.tagName.toLowerCase(),
        text,
      });
      setEditId(blockId);
      clear();
    };
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("click", onClick, true);
      clear();
    };
  }, [editMode]);

  // Close inline editor on outside click; Esc closes editor first, then exits edit mode.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!editId) return;
      const target = e.target as Element;
      if (
        !target.closest(".inline-editor") &&
        !target.closest(".fb-block") &&
        !target.closest(".sel-tooltip")
      ) {
        setEditId(null);
        setEditSelection(null);
        setEditElement(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editId) {
        setEditId(null);
        setEditSelection(null);
        setEditElement(null);
      } else if (editMode && onExitEditMode) {
        onExitEditMode();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [editId, editMode, onExitEditMode]);

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
              editMode ? "is-pickable" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            data-block-id={b.id}
            draggable={!!onReorder && !isEditing && !editMode}
            onDragStart={(e) => handleDragStart(e, b.id)}
            onDragOver={(e) => handleDragOver(e, b.id)}
            onDrop={(e) => handleDrop(e, b.id)}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
              if (!editMode || !onAskRiley) return;
              // Don't trigger if user clicked into the inline editor or chrome
              const target = e.target as Element;
              if (target.closest(".inline-editor") || target.closest(".fb-block__chrome")) return;
              // Don't trigger if there's an active text selection
              const sel = window.getSelection();
              if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) return;
              e.preventDefault();
              setEditId(b.id);
            }}
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
            </div>

            {isEditing && onAskRiley && (
              <InlineBlockEditor
                blockType={b.type}
                intent={intent}
                selectedText={editSelection}
                selectedHtml={editElement?.outerHtml ?? null}
                selectedTag={editElement?.tag ?? null}
                onSubmit={(instruction) => {
                  const sel = editSelection;
                  const elt = editElement;
                  setEditId(null);
                  setEditSelection(null);
                  setEditElement(null);
                  onAskRiley(b.id, b.type, intent, instruction, sel, elt);
                }}
                onCancel={() => {
                  setEditId(null);
                  setEditSelection(null);
                  setEditElement(null);
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
