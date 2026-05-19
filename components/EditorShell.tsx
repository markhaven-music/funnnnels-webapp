"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AIPanel } from "@/components/AIPanel";
import { FunnelCanvas } from "@/components/FunnelCanvas";
import { I } from "@/components/icons";
import type { StoredFunnel } from "@/lib/blocks";

const STORAGE_KEY = "funnnnels.aiPanelWidth";
const OPEN_STORAGE_KEY = "funnnnels.aiPanelOpen";
const MIN_W = 340;
const MAX_W = 640;
const DEFAULT_W = 420;

type Device = "desktop" | "tablet" | "mobile";

export function EditorShell({
  initialFunnel,
  initialSeed = null,
}: {
  initialFunnel: StoredFunnel;
  initialSeed?: string | null;
}) {
  const router = useRouter();
  const [funnel, setFunnel] = useState<StoredFunnel>(initialFunnel);
  const [device, setDevice] = useState<Device>("desktop");
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(initialSeed);
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_W);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [justPublished, setJustPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const dragging = useRef(false);
  const gripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (!Number.isNaN(n)) setPanelWidth(Math.max(MIN_W, Math.min(MAX_W, n)));
      }
      const openStored = localStorage.getItem(OPEN_STORAGE_KEY);
      if (openStored === "0") setAiOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_STORAGE_KEY, aiOpen ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [aiOpen]);

  // Strip the ?seed= query once we've consumed it so refreshes don't re-fire.
  useEffect(() => {
    if (initialSeed) {
      router.replace(`/funnels/${initialFunnel.id}/edit`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--ai-w", `${panelWidth}px`);
  }, [panelWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.max(MIN_W, Math.min(MAX_W, window.innerWidth - e.clientX));
      setPanelWidth(w);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      gripRef.current?.classList.remove("dragging");
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(STORAGE_KEY, String(panelWidth));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [panelWidth]);

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.classList.add("dragging");
    document.body.style.userSelect = "none";
  };

  const handlePublishToggle = useCallback(async () => {
    if (publishing) return;
    const nextStatus = funnel.status === "live" ? "draft" : "live";
    setPublishing(true);
    try {
      const res = await fetch(`/api/funnels/${funnel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { funnel: StoredFunnel };
      setFunnel(data.funnel);
      if (nextStatus === "live") {
        setJustPublished(true);
        setTimeout(() => setJustPublished(false), 3500);
      }
    } finally {
      setPublishing(false);
    }
  }, [funnel.id, funnel.status, publishing]);

  const publicUrl =
    typeof window === "undefined"
      ? `/p/${funnel.id}`
      : `${window.location.origin}/p/${funnel.id}`;

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [publicUrl]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    const ok = window.confirm(
      `Delete "${funnel.name}"? This cannot be undone.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/funnels/${funnel.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setDeleting(false);
        return;
      }
      router.push("/");
    } catch {
      setDeleting(false);
    }
  }, [deleting, funnel.id, funnel.name, router]);

  const handlePatchBlock = useCallback(
    async (blockId: string, propsPatch: Record<string, unknown>) => {
      // Optimistic update
      setFunnel((prev) => {
        const next = structuredClone(prev) as StoredFunnel;
        const page = next.pages[0];
        if (!page) return prev;
        const block = page.blocks.find((b) => b.id === blockId);
        if (!block) return prev;
        block.props = { ...block.props, ...propsPatch } as typeof block.props;
        return next;
      });
      try {
        const res = await fetch(
          `/api/funnels/${initialFunnel.id}/blocks/${blockId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ props: propsPatch }),
          },
        );
        if (!res.ok) {
          // Rollback by refetching authoritative state
          const fresh = await fetch(`/api/funnels/${initialFunnel.id}`, {
            cache: "no-store",
          });
          if (fresh.ok) {
            const data = (await fresh.json()) as { funnel: StoredFunnel };
            setFunnel(data.funnel);
          }
        }
      } catch {
        /* ignore */
      }
    },
    [initialFunnel.id],
  );

  const handleReorder = useCallback(
    async (orderedIds: string[]) => {
      setFunnel((prev) => {
        const next = structuredClone(prev) as StoredFunnel;
        const page = next.pages[0];
        if (!page) return prev;
        const byId = new Map(page.blocks.map((b) => [b.id, b]));
        page.blocks = orderedIds
          .map((id) => byId.get(id))
          .filter((b): b is NonNullable<typeof b> => !!b);
        return next;
      });
      try {
        const res = await fetch(
          `/api/funnels/${initialFunnel.id}/blocks/reorder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedIds }),
          },
        );
        if (!res.ok) {
          const fresh = await fetch(`/api/funnels/${initialFunnel.id}`, {
            cache: "no-store",
          });
          if (fresh.ok) {
            const data = (await fresh.json()) as { funnel: StoredFunnel };
            setFunnel(data.funnel);
          }
        }
      } catch {
        /* ignore */
      }
    },
    [initialFunnel.id],
  );

  const handleUndo = useCallback(async () => {
    if (undoing) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/funnels/${initialFunnel.id}/undo`, {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { funnel: StoredFunnel };
        setFunnel(data.funnel);
      } else if (res.status === 409) {
        setCanUndo(false);
      }
    } finally {
      setUndoing(false);
    }
  }, [initialFunnel.id, undoing]);

  // Any mutation flips canUndo on; the API tells us when there's nothing left.
  useEffect(() => {
    setCanUndo(true);
  }, [funnel]);

  // Cmd/Ctrl+Z keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta || e.shiftKey) return;
      if (e.key !== "z" && e.key !== "Z") return;
      // Don't hijack if user is editing inline text
      const target = e.target as Element | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable)
      )
        return;
      e.preventDefault();
      handleUndo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo]);

  const refetchFunnel = useCallback(async () => {
    try {
      const before = new Set(
        (funnel.pages[0]?.blocks ?? []).map((b) => b.id),
      );
      const res = await fetch(`/api/funnels/${funnel.id}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { funnel: StoredFunnel };
      setFunnel(data.funnel);
      const after = data.funnel.pages[0]?.blocks ?? [];
      const flash = after.filter((b) => !before.has(b.id)).map((b) => b.id);
      setFlashIds(flash);
    } catch {
      /* ignore */
    }
  }, [funnel]);

  const canvasMax =
    device === "mobile" ? 420 : device === "tablet" ? 760 : "none";
  const blocks = funnel.pages[0]?.blocks ?? [];

  return (
    <div className={`editor-shell${aiOpen ? "" : " editor-shell--no-ai"}`}>
      <header className="editor-top">
        <Link
          href="/"
          className="btn ghost"
          style={{ padding: "0 10px 0 8px", height: 32 }}
        >
          <I.arrowLeft size={14} /> Back
        </Link>
        <span style={{ width: 1, height: 24, background: "var(--line)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div
            style={{ fontSize: 13, fontWeight: 500, letterSpacing: "-0.005em" }}
          >
            {funnel.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--fg-2)",
            }}
          >
            <span
              className={`status ${funnel.status}`}
              style={{ marginRight: 8 }}
            >
              {funnel.status === "live" && <span className="dotpulse" />}
              {funnel.status}
            </span>
            autosaved
          </div>
        </div>

        <button
          className="btn ghost"
          type="button"
          title="Undo last change (⌘Z)"
          onClick={handleUndo}
          disabled={!canUndo || undoing}
          style={{ padding: "0 10px", height: 32 }}
        >
          <I.refresh size={13} /> {undoing ? "Undoing…" : "Undo"}
        </button>

        <div className="device-tabs" style={{ marginLeft: 18 }}>
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`tab ${device === d ? "active" : ""}`}
              onClick={() => setDevice(d)}
              title={d}
              style={{ padding: "5px 9px" }}
            >
              {d === "desktop" && <I.device_desktop size={13} />}
              {d === "tablet" && <I.device_tablet size={13} />}
              {d === "mobile" && <I.device_mobile size={13} />}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {funnel.status === "live" && (
            <div
              className={`live-bar${justPublished ? " is-fresh" : ""}`}
              title="This funnel is live"
            >
              <span className="live-bar__dot" />
              <span className="live-bar__label">Live at</span>
              <span className="live-bar__url">{`/p/${funnel.id}`}</span>
              <button
                type="button"
                className="live-bar__btn"
                onClick={copyUrl}
                title="Copy public URL"
              >
                <I.copy size={11} /> {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={`/p/${funnel.id}`}
                target="_blank"
                rel="noreferrer"
                className="live-bar__btn live-bar__btn--primary"
                title="Open the live page in a new tab"
              >
                <I.rocket size={11} /> Go to live site
              </a>
            </div>
          )}
          <button
            className={`btn ghost${aiOpen ? " is-on" : ""}`}
            type="button"
            title={aiOpen ? "Hide Riley" : "Show Riley"}
            onClick={() => setAiOpen((v) => !v)}
          >
            <I.sparkles size={13} /> {aiOpen ? "Hide Riley" : "Show Riley"}
          </button>
          <button
            className="btn ghost"
            type="button"
            title="Delete this funnel"
            onClick={handleDelete}
            disabled={deleting}
          >
            <I.trash size={14} /> {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            className="btn primary"
            type="button"
            title={
              funnel.status === "live"
                ? "Move back to draft"
                : "Publish this funnel"
            }
            onClick={handlePublishToggle}
            disabled={publishing || blocks.length === 0}
          >
            <I.rocket size={14} />{" "}
            {publishing
              ? funnel.status === "live"
                ? "Unpublishing…"
                : "Publishing…"
              : funnel.status === "live"
                ? "Unpublish"
                : "Publish"}
          </button>
        </div>
      </header>

      <div className={`editor-stage is-${device}`}>
        <div
          className="editor-canvas"
          style={{ maxWidth: canvasMax, transition: "max-width 0.25s" }}
        >
          <div className="stage-grid" />
          <div style={{ position: "relative", zIndex: 1, padding: "32px 0" }}>
            <FunnelCanvas
              blocks={blocks}
              flashIds={flashIds}
              onPatch={handlePatchBlock}
              onReorder={handleReorder}
              onAskRiley={(blockId, blockType, intent, instruction) => {
                const target =
                  blockType === "custom_html"
                    ? `custom_html block ${blockId} (intent="${intent ?? "section"}")`
                    : `${blockType} block ${blockId}`;
                setPendingPrompt(
                  `[Click-and-edit on ${target}] ${instruction}\n\nEdit only that block. Use get_block first to read its current state, then update_block to apply the change. Preserve the existing design and structure unless the instruction explicitly asks to change them.`,
                );
              }}
            />
          </div>
        </div>

        <div className="editor-stage-footer">
          <div className="hint">
            <I.sparkles size={11} style={{ color: "var(--accent-2)" }} />
            Riley edits this page in real time — try the chat on the right.
          </div>
        </div>
      </div>

      {aiOpen && (
        <>
          <AIPanel
            funnelId={funnel.id}
            funnelName={funnel.name}
            pendingPrompt={pendingPrompt}
            onPromptConsumed={() => setPendingPrompt(null)}
            onMutate={refetchFunnel}
          />

          <div
            ref={gripRef}
            className="ai-grip"
            style={{ right: panelWidth - 3 + "px" }}
            onMouseDown={startDrag}
          />
        </>
      )}
    </div>
  );
}
