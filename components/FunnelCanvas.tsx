"use client";

import { useEffect, useRef } from "react";
import { BlockView } from "@/components/blocks/BlockView";
import { I } from "@/components/icons";
import type { Block } from "@/lib/blocks";

type Props = {
  blocks: Block[];
  flashIds?: string[];
  onAnnotate?: (blockId: string, type: string) => void;
  onConvert?: (blockId: string, intent: string) => void;
  activeAnnotationId?: string | null;
};

export function FunnelCanvas({
  blocks,
  flashIds = [],
  onAnnotate,
  onConvert,
  activeAnnotationId = null,
}: Props) {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());

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

  return (
    <>
      {blocks.map((b) => {
        const isCustom = b.type === "custom_html";
        const intent = isCustom
          ? ((b.props as { intent?: string }).intent ?? "section")
          : null;
        return (
          <div
            key={b.id}
            className={`fb-block${isCustom ? " fb-block--custom" : ""}${
              activeAnnotationId === b.id ? " is-annotating" : ""
            }`}
            data-block-id={b.id}
            ref={(el) => {
              if (el) refs.current.set(b.id, el);
              else refs.current.delete(b.id);
            }}
          >
            <div className="fb-block__chrome">
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
            <BlockView block={b} />
          </div>
        );
      })}
    </>
  );
}
