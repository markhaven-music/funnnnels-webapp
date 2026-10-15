"use client";

import { isCodeFunnel, liveUrl } from "@/lib/liveUrl";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FunnelCanvas } from "@/components/FunnelCanvas";
import { I } from "@/components/icons";
import { addableSections } from "@/lib/addable";
import type { StoredFunnel } from "@/lib/blocks";

type Device = "desktop" | "tablet" | "mobile";

export function EditorShell({ initialFunnel }: { initialFunnel: StoredFunnel }) {
  const router = useRouter();
  const [funnel, setFunnel] = useState<StoredFunnel>(initialFunnel);
  const [device, setDevice] = useState<Device>("desktop");
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [adding, setAdding] = useState(false);

  // Publish copies the draft into what visitors see; editing afterwards
  // never touches the live page until "Publish changes".
  const handlePublish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/funnels/${funnel.id}/publish`, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { funnel: StoredFunnel };
      setFunnel(data.funnel);
      setJustPublished(true);
      setTimeout(() => setJustPublished(false), 3500);
    } finally {
      setPublishing(false);
    }
  }, [funnel.id, publishing]);

  const handleUnpublish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/funnels/${funnel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { funnel: StoredFunnel };
      setFunnel(data.funnel);
    } finally {
      setPublishing(false);
    }
  }, [funnel.id, publishing]);

  const livePath = liveUrl(funnel.id, funnel.type);
  const publicUrl =
    typeof window === "undefined" || livePath.startsWith("http")
      ? livePath
      : `${window.location.origin}${livePath}`;

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
  }, [deleting, funnel.id, router]);

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

  // Close delete confirm on outside click / Esc
  useEffect(() => {
    if (!confirmingDelete) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest(".delete-wrap")) setConfirmingDelete(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmingDelete(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [confirmingDelete]);

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

  // Add a section at the bottom of the page; drag it where it belongs.
  const handleAddSection = useCallback(
    async (type: string) => {
      if (adding) return;
      setAdding(true);
      try {
        const res = await fetch(`/api/funnels/${initialFunnel.id}/blocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { block: { id: string }; funnel: StoredFunnel };
        setFunnel(data.funnel);
        requestAnimationFrame(() =>
          document
            .querySelector(`[data-block-id="${data.block.id}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
      } finally {
        setAdding(false);
      }
    },
    [adding, initialFunnel.id],
  );

  const handleDeleteBlock = useCallback(
    async (blockId: string) => {
      const res = await fetch(`/api/funnels/${initialFunnel.id}/blocks/${blockId}`, { method: "DELETE" });
      if (!res.ok) return;
      const data = (await res.json()) as { funnel: StoredFunnel };
      setFunnel(data.funnel);
    },
    [initialFunnel.id],
  );

  const canvasMax =
    device === "mobile" ? 420 : device === "tablet" ? 760 : "none";
  const blocks = funnel.pages[0]?.blocks ?? [];
  const dirty =
    JSON.stringify(blocks) !== JSON.stringify(funnel.publishedPages?.[0]?.blocks ?? null);

  return (
    <div className="editor-shell">
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
              <span className="live-bar__url">{livePath.replace(/^https?:\/\//, "")}</span>
              <button
                type="button"
                className="live-bar__btn"
                onClick={copyUrl}
                title="Copy public URL"
              >
                <I.copy size={11} /> {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={livePath}
                target="_blank"
                rel="noreferrer"
                className="live-bar__btn live-bar__btn--primary"
                title="Open the live page in a new tab"
              >
                <I.rocket size={11} /> Go to live site
              </a>
            </div>
          )}
          <div className="delete-wrap">
            <button
              className="btn ghost"
              type="button"
              title="Delete this funnel"
              onClick={() => setConfirmingDelete((v) => !v)}
              disabled={deleting}
            >
              <I.trash size={14} /> {deleting ? "Deleting…" : "Delete"}
            </button>
            {confirmingDelete && !deleting && (
              <div className="delete-confirm">
                <div className="delete-confirm__title">Delete this funnel?</div>
                <div className="delete-confirm__msg">
                  This permanently removes <b>{funnel.name}</b> and its history.
                  This cannot be undone.
                </div>
                <div className="delete-confirm__actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn delete-confirm__danger"
                    onClick={() => {
                      setConfirmingDelete(false);
                      handleDelete();
                    }}
                  >
                    <I.trash size={13} /> Delete forever
                  </button>
                </div>
              </div>
            )}
          </div>
          {funnel.status === "live" && !isCodeFunnel(funnel.id, funnel.type) && (
            <button className="btn ghost" type="button" onClick={handleUnpublish} disabled={publishing}>
              Unpublish
            </button>
          )}
          <button
            className="btn primary"
            type="button"
            title={dirty ? "Put your edits live" : "Everything is live"}
            onClick={handlePublish}
            disabled={publishing || blocks.length === 0 || (funnel.status === "live" && !dirty)}
          >
            <I.rocket size={14} />{" "}
            {publishing
              ? "Publishing…"
              : funnel.status !== "live"
                ? "Publish"
                : dirty
                  ? "Publish changes"
                  : "Published"}
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
              onPatch={handlePatchBlock}
              onReorder={handleReorder}
              onDelete={handleDeleteBlock}
            />
            <div className="add-bar">
              <span className="add-bar__label">
                <I.plus size={12} /> {adding ? "Adding…" : "Add section"}
              </span>
              {addableSections(funnel.id, funnel.type).map((a) => (
                <button
                  key={a.type}
                  type="button"
                  className="add-bar__btn"
                  onClick={() => handleAddSection(a.type)}
                  disabled={adding}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="editor-stage-footer">
          <div className="hint">
            Click any text to edit it · drag a section by its grip to move it · × deletes it
          </div>
        </div>
      </div>
    </div>
  );
}
