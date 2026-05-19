"use client";

import { useEffect, useRef } from "react";
import { BlockView } from "@/components/blocks/BlockView";
import type { Block } from "@/lib/blocks";

type Props = {
  blocks: Block[];
  flashIds?: string[];
};

export function FunnelCanvas({ blocks, flashIds = [] }: Props) {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (flashIds.length === 0) return;
    for (const id of flashIds) {
      const el = refs.current.get(id);
      if (el) {
        el.classList.remove("flash");
        // force reflow so the animation restarts even if class was just added
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
      {blocks.map((b) => (
        <div
          key={b.id}
          className="fb-block"
          data-block-id={b.id}
          ref={(el) => {
            if (el) refs.current.set(b.id, el);
            else refs.current.delete(b.id);
          }}
        >
          <div className="fb-block__chrome">{b.type}</div>
          <BlockView block={b} />
        </div>
      ))}
    </>
  );
}
