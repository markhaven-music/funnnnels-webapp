"use client";

import { useCallback, useEffect, useState } from "react";
import { I } from "@/components/icons";
import type { Broadcast } from "@/lib/broadcasts";
import e from "./email.module.css";
import { FormatHelp, Preview, TagSelect, fromLocal, toLocal, useAudience, useTestAddress, when } from "./emailShared";

// Dashboard → Broadcasts: the newsletter. Write it, send yourself a test,
// then send it now or at a time, to a tag or to everyone subscribed.
// lib/outbox.ts sends it (every minute, at SES's pace).

async function call<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(url, { method, cache: "no-store", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
  return d as T;
}

const COLS = { gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr) 100px 90px 150px" };

export function BroadcastsPanel() {
  const [list, setList] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList((await call<{ broadcasts: Broadcast[] }>("/api/broadcasts")).broadcasts);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  // While something is sending, keep the numbers fresh.
  useEffect(() => {
    if (!list.some((b) => b.status === "sending" || b.status === "scheduled")) return;
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [list, load]);

  async function create(copyOf?: string) {
    const { broadcast } = await call<{ broadcast: Broadcast }>("/api/broadcasts", "POST", copyOf ? { copyOf } : {});
    setList((l) => [broadcast, ...l]);
    setOpen(broadcast.id);
  }

  const current = list.find((b) => b.id === open);
  if (current) {
    return (
      <Editor
        key={current.id}
        b={current}
        onBack={() => {
          setOpen(null);
          load();
        }}
        onChange={(next) => setList((l) => l.map((x) => (x.id === next.id ? next : x)))}
        onDuplicate={() => create(current.id)}
        onDeleted={() => {
          setOpen(null);
          setList((l) => l.filter((x) => x.id !== current.id));
        }}
      />
    );
  }

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Broadcasts</h1>
          <p className="page-sub">One email to your list or to a tag, now or at a set time. Sent through Amazon SES.</p>
        </div>
        <div className="cta-group">
          <button type="button" className="btn primary" onClick={() => create()}>
            <I.plus size={14} /> New broadcast
          </button>
        </div>
      </div>

      {!loading && list.length === 0 ? (
        <div className={e.empty}>
          <img className={e.emptyArt} src="/funnels/dashboard/broadcasts.webp" width={112} height={112} alt="" />
          <div>No broadcasts yet. Write your first newsletter.</div>
        </div>
      ) : (
        <div className={e.table}>
          <div className={e.head} style={COLS}>
            <span>SUBJECT</span>
            <span>TO</span>
            <span>STATUS</span>
            <span>SENT</span>
            <span>WHEN</span>
          </div>
          {list.map((b) => (
            <button key={b.id} type="button" className={e.rowButton} style={COLS} onClick={() => setOpen(b.id)}>
              <span className={`${e.cell} ${e.strong}`}>{b.subject || <span className={e.dim}>Untitled</span>}</span>
              <span className={`${e.cell} ${e.dim}`}>
                {b.audienceTag ?? "Everyone"}
                {b.excludeTag ? ` · not ${b.excludeTag}` : ""}
              </span>
              <span className={`${e.chip} ${e[`chip_${b.status}`] ?? ""}`}>{b.status}</span>
              <span className={e.mono}>
                {b.sentCount.toLocaleString("en-US")}
                {b.failedCount ? ` · ${b.failedCount} failed` : ""}
              </span>
              <span className={e.mono}>{when(b.sentAt ?? b.sendAt ?? b.updatedAt)}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

function Editor({ b, onBack, onChange, onDuplicate, onDeleted }: { b: Broadcast; onBack: () => void; onChange: (b: Broadcast) => void; onDuplicate: () => void; onDeleted: () => void }) {
  const [f, setF] = useState({ subject: b.subject, preheader: b.preheader, body: b.body, audienceTag: b.audienceTag, excludeTag: b.excludeTag });
  const [sendAt, setSendAt] = useState(toLocal(b.sendAt));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [testTo, setTestTo] = useTestAddress();
  const { tags, size } = useAudience(f.audienceTag, f.excludeTag);
  const locked = b.status !== "draft" && b.status !== "scheduled";
  const set = (patch: Partial<typeof f>) => {
    setF((x) => ({ ...x, ...patch }));
    setDirty(true);
  };

  async function patch(body: Record<string, unknown>, ok?: string) {
    setBusy(true);
    setMsg({});
    try {
      const { broadcast } = await call<{ broadcast: Broadcast }>(`/api/broadcasts/${b.id}`, "PATCH", body);
      onChange(broadcast);
      setDirty(false);
      if (ok) setMsg({ ok });
      return true;
    } catch (err) {
      setMsg({ error: (err as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (dirty && !(await patch(f))) return;
    setBusy(true);
    setMsg({});
    try {
      await call(`/api/broadcasts/${b.id}/test`, "POST", { to: testTo });
      setMsg({ ok: `Test sent to ${testTo}.` });
    } catch (err) {
      setMsg({ error: `Test not sent: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  async function schedule(now: boolean) {
    const at = now ? new Date().toISOString() : fromLocal(sendAt);
    if (!at) return setMsg({ error: "Pick a date and time, or send now." });
    const who = f.audienceTag ? `the ${size ?? "?"} subscribed contacts tagged “${f.audienceTag}”` : `all ${size ?? "?"} subscribed contacts`;
    if (!window.confirm(now ? `Send “${f.subject}” to ${who} now?` : `Send “${f.subject}” to ${who} on ${when(at)}?`)) return;
    await patch({ ...f, sendAt: at, status: "scheduled" }, now ? "On its way: it starts within a minute." : `Scheduled for ${when(at)}.`);
  }

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <button type="button" className="btn ghost" onClick={onBack} style={{ marginBottom: 10 }}>
            ← Broadcasts
          </button>
          <h1 className="page-title">{f.subject || "Untitled broadcast"}</h1>
          <p className="page-sub">
            <span className={`${e.chip} ${e[`chip_${b.status}`] ?? ""}`}>{b.status}</span>{" "}
            {b.status === "scheduled" && `goes out ${when(b.sendAt)}`}
            {(b.status === "sending" || b.status === "sent") && `${b.sentCount.toLocaleString("en-US")} sent${b.failedCount ? `, ${b.failedCount} failed` : ""}`}
            {b.status === "sent" && ` · ${when(b.sentAt)}`}
          </p>
        </div>
        <div className="cta-group">
          <button type="button" className="btn ghost" onClick={onDuplicate}>
            <I.copy size={14} /> Duplicate
          </button>
          {b.status === "draft" && (
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                if (!window.confirm("Delete this draft?")) return;
                await call(`/api/broadcasts/${b.id}`, "DELETE");
                onDeleted();
              }}
            >
              <I.trash size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {b.error && <div className={e.notice}>{b.error}</div>}

      <div className={e.editor}>
        <div className={e.panel}>
          <div className={e.fields}>
            <label className={e.label}>
              Subject
              <input className={e.input} value={f.subject} disabled={locked} onChange={(ev) => set({ subject: ev.target.value })} placeholder="The one line they read before opening" />
            </label>
            <label className={e.label}>
              Preview text (shown after the subject in the inbox)
              <input className={e.input} value={f.preheader} disabled={locked} onChange={(ev) => set({ preheader: ev.target.value })} placeholder="Optional" />
            </label>
          </div>
          <div className={e.fields}>
            <label className={e.label}>
              Send to
              <TagSelect value={f.audienceTag} onChange={(v) => set({ audienceTag: v })} tags={tags} none="Everyone subscribed" disabled={locked} />
            </label>
            <label className={e.label}>
              Except contacts tagged
              <TagSelect value={f.excludeTag} onChange={(v) => set({ excludeTag: v })} tags={tags} none="Nobody left out" disabled={locked} />
            </label>
          </div>
          <p className={e.mono} style={{ margin: "0 0 12px" }}>
            Reaches {size === null ? "…" : size.toLocaleString("en-US")} subscribed contact{size === 1 ? "" : "s"} right now.
          </p>
          <label className={e.label}>
            Email
            <textarea className={e.textarea} value={f.body} disabled={locked} onChange={(ev) => set({ body: ev.target.value })} placeholder={"Hey {first_name},\n\n…\n\n[button: Get the pack](https://m.thegrind.studio/…)\n\nMark"} />
          </label>
          <FormatHelp />

          {!locked && (
            <>
              <div className={e.actions} style={{ marginTop: 16 }}>
                <button type="button" className="btn" disabled={busy || !dirty} onClick={() => patch(f, "Saved.")}>
                  {dirty ? "Save" : "Saved"}
                </button>
                <input className={e.input} style={{ width: 220 }} type="email" placeholder="you@email.com" value={testTo} onChange={(ev) => setTestTo(ev.target.value)} />
                <button type="button" className="btn" disabled={busy || !testTo} onClick={test}>
                  <I.send size={13} /> Send me a test
                </button>
              </div>
              <div className={e.actions} style={{ marginTop: 12 }}>
                <input className={e.input} type="datetime-local" value={sendAt} onChange={(ev) => setSendAt(ev.target.value)} />
                <button type="button" className="btn" disabled={busy} onClick={() => schedule(false)}>
                  Schedule
                </button>
                <button type="button" className="btn primary" disabled={busy} onClick={() => schedule(true)}>
                  <I.send size={13} /> Send now
                </button>
                {b.status === "scheduled" && (
                  <button type="button" className="btn ghost" disabled={busy} onClick={() => patch({ status: "draft" }, "Back to draft: it won't go out.")}>
                    Unschedule
                  </button>
                )}
              </div>
            </>
          )}
          {b.status === "sending" && (
            <div className={e.actions} style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => window.confirm("Stop sending to the people who haven't had it yet?") && patch({ status: "cancelled" }, "Stopped.")}
              >
                Stop sending
              </button>
            </div>
          )}
          {msg.ok && <p className={e.ok}>{msg.ok}</p>}
          {msg.error && <p className={e.error}>{msg.error}</p>}
        </div>

        <div className={e.panel}>
          <div className={e.panelHead}>
            <h2 className={e.h2}>Preview</h2>
            <span className={e.mono}>as Alex Example gets it</span>
          </div>
          <Preview subject={f.subject} preheader={f.preheader} body={f.body} />
        </div>
      </div>
    </main>
  );
}
