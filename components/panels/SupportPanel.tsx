"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Conversation, SupportMessage, Thread } from "@/lib/support";
import { SupportOverview } from "./SupportOverview";
import e from "./email.module.css";
import s from "./support.module.css";

// Dashboard → Support: support@thegrind.studio (lib/support.ts). The email
// job copies the mailbox every minute; replies go out from the mailbox itself.

type Tab = "open" | "done" | "all";
const TABS: Tab[] = ["open", "done", "all"];

function ago(iso: string): string {
  const d = Date.now() - Date.parse(iso);
  if (d < 60_000) return "now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const money = (cents: number, currency: string) => `${currency === "eur" ? "€" : "$"}${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

// The new part of an email, and the quoted history under it.
function split(text: string): [string, string] {
  const m = text.match(/^(On .{4,200}wrote:\s*$|-{2,} ?Original Message ?-{2,}|>.*$)/m);
  if (!m || m.index === undefined || m.index < 1) return [text.trim(), ""];
  return [text.slice(0, m.index).trim(), text.slice(m.index).trim()];
}

function Message({ m }: { m: SupportMessage }) {
  const [fresh, quoted] = useMemo(() => split(m.text), [m.text]);
  const [showQuoted, setShowQuoted] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  return (
    <div className={`${s.msg} ${m.direction === "out" ? s.msgOut : ""}`}>
      <div className={s.msgHead}>
        <span>
          <span className={s.msgFrom}>{m.direction === "out" ? "You" : m.fromName || m.fromEmail}</span>
          {m.direction === "in" && m.fromName ? <span> · {m.fromEmail}</span> : null}
          {m.direction === "out" ? <span> → {m.toEmail}</span> : null}
        </span>
        <span className={s.time}>{when(m.sentAt)}</span>
      </div>
      {showHtml && m.html ? (
        <iframe
          className={s.frame}
          title={m.subject ?? "email"}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          srcDoc={`<base target="_blank">${m.html}`}
          onLoad={(ev) => {
            const doc = ev.currentTarget.contentDocument;
            if (doc) ev.currentTarget.style.height = `${Math.min(doc.documentElement.scrollHeight + 4, 2400)}px`;
          }}
        />
      ) : (
        <>
          <div className={s.body}>{fresh || <span className={e.dim}>(no text)</span>}</div>
          {quoted ? (
            showQuoted ? (
              <div className={s.body} style={{ color: "var(--fg-2)", marginTop: 8 }}>
                {quoted}
              </div>
            ) : (
              <button type="button" className={s.linkButton} onClick={() => setShowQuoted(true)}>
                ··· show quoted text
              </button>
            )
          ) : null}
        </>
      )}
      {m.html ? (
        <div>
          <button type="button" className={s.linkButton} onClick={() => setShowHtml((v) => !v)}>
            {showHtml ? "show as text" : "show original"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SupportPanel({ onUnread }: { onUnread?: (n: number) => void }) {
  const [list, setList] = useState<Conversation[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("open");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/support", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { configured: boolean; conversations: Conversation[] };
      setList(j.conversations);
      setConfigured(j.configured);
      setError("");
    } catch (err) {
      setError(`Couldn't load the inbox (${String(err)}).`);
    } finally {
      setLoading(false);
    }
  }, []);

  // The sidebar's count follows the list.
  useEffect(() => {
    if (!loading) onUnread?.(list.filter((c) => c.unread > 0).length);
  }, [list, loading, onUnread]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const open = useCallback(
    async (customer: string) => {
      setActive(customer);
      setThread(null);
      setDraft("");
      setSendError("");
      const r = await fetch(`/api/support/thread?c=${encodeURIComponent(customer)}`, { cache: "no-store" });
      if (r.ok) setThread((await r.json()) as Thread);
      setList((l) => l.map((c) => (c.customer === customer ? { ...c, unread: 0 } : c)));
    },
    [],
  );

  const send = async () => {
    if (!active || !draft.trim()) return;
    setSending(true);
    setSendError("");
    try {
      const r = await fetch("/api/support/thread", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ c: active, text: draft }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      setThread((t) => (t ? { ...t, messages: [...t.messages, j.message as SupportMessage] } : t));
      setDraft("");
      load();
    } catch (err) {
      setSendError(`Not sent: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSending(false);
    }
  };

  const markDone = async (done: boolean) => {
    if (!active) return;
    await fetch("/api/support/thread", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ c: active, done }) });
    setThread((t) => (t ? { ...t, done } : t));
    setList((l) => l.map((c) => (c.customer === active ? { ...c, done } : c)));
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const r = await fetch("/api/support/sync", { method: "POST" });
      const j = await r.json();
      if (!r.ok || j.error) setError(`Check failed: ${j.error ?? r.status}`);
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((c) => (tab === "all" ? true : tab === "done" ? c.done : !c.done)).filter((c) => !needle || [c.customer, c.name, c.subject, c.snippet].some((v) => v?.toLowerCase().includes(needle)));
  }, [list, tab, q]);
  const openCount = list.filter((c) => !c.done).length;
  const unread = list.filter((c) => c.unread > 0).length;
  const subject = thread?.messages.findLast((m) => m.direction === "in")?.subject ?? thread?.messages.at(-1)?.subject;

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-sub">
            {loading ? (
              "Loading…"
            ) : error ? (
              error
            ) : (
              <>
                <span className="mono">support@thegrind.studio</span>
                {" · "}
                <span className="mono">{openCount} open</span>
                {unread > 0 && (
                  <>
                    {" · "}
                    <span className="mono" style={{ color: "var(--accent-2)" }}>
                      {unread} unread
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <div className="cta-group">
          <button type="button" className="btn" onClick={syncNow} disabled={syncing || !configured}>
            {syncing ? "Checking…" : "Check now"}
          </button>
        </div>
      </div>

      {!configured && (
        <div className={e.notice}>
          The mailbox isn&apos;t connected yet: set SUPPORT_EMAIL_USER and SUPPORT_EMAIL_PASSWORD (the Private Email password of support@thegrind.studio) in Vercel, then redeploy.
        </div>
      )}

      {list.length > 0 && <SupportOverview list={list} onOpen={open} />}

      <div className={e.toolbar}>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} type="button" className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <input className={e.input} style={{ width: 260 }} placeholder="Search email, name, subject…" value={q} onChange={(ev) => setQ(ev.target.value)} />
      </div>

      <div className={s.layout}>
        <div className={s.list}>
          {shown.length === 0 ? (
            <div className={s.placeholder} style={{ background: "none" }}>
              {loading ? "Loading…" : list.length === 0 ? "No emails copied yet." : "Nothing here."}
            </div>
          ) : (
            shown.map((c) => (
              <button key={c.customer} type="button" className={`${s.item} ${c.unread ? s.unread : ""} ${active === c.customer ? s.itemActive : ""}`} onClick={() => open(c.customer)}>
                <span className={s.itemTop}>
                  {c.unread ? <span className={s.dot} /> : null}
                  <span className={s.who}>{c.name || c.customer}</span>
                  {c.messages > 1 ? <span className={s.time}>{c.messages}</span> : null}
                  <span className={s.time}>{ago(c.lastAt)}</span>
                </span>
                <span className={s.subject}>{c.subject || "(no subject)"}</span>
                <span className={s.snippet}>
                  {c.lastDirection === "out" ? "You: " : ""}
                  {c.snippet}
                </span>
              </button>
            ))
          )}
        </div>

        {!active ? (
          <div className={s.placeholder}>Pick a conversation.</div>
        ) : !thread ? (
          <div className={s.placeholder}>Loading…</div>
        ) : (
          <div className={s.thread}>
            <div className={s.threadHead}>
              <div className={s.threadTitle}>{subject || "(no subject)"}</div>
              <button type="button" className="btn" onClick={() => markDone(!thread.done)}>
                {thread.done ? "Reopen" : "Mark done"}
              </button>
            </div>

            <div className={s.side}>
              <span className={s.sideLabel}>{thread.customer.toUpperCase()}</span>
              {thread.orders.length === 0 ? (
                <span>No orders with this email.</span>
              ) : (
                thread.orders.map((o) => (
                  <div key={o.id} className={s.order} title={o.id}>
                    <span>
                      {o.offer ? `↳ upsell ${o.offer}` : o.funnel}
                      {!o.offer && o.items.length > 1 ? ` + ${o.items.length - 1} add-on${o.items.length > 2 ? "s" : ""}` : ""}
                    </span>
                    <span className="mono">
                      {money(o.amountCents, o.currency)} · {o.provider === "paypal" ? "PayPal" : "Card"} · {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      {o.emailSentAt ? " · receipt sent" : ""}
                    </span>
                  </div>
                ))
              )}
            </div>

            {thread.messages.map((m) => (
              <Message key={m.id} m={m} />
            ))}

            <div className={s.composer}>
              <textarea
                className={s.replyBox}
                placeholder={`Reply to ${thread.customer}…`}
                value={draft}
                onChange={(ev) => setDraft(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) send();
                }}
                disabled={sending || !configured}
              />
              <div className={s.composerFoot}>
                <span className={e.mono}>From support@thegrind.studio · ⌘↵ to send</span>
                <button type="button" className="btn primary" onClick={send} disabled={sending || !draft.trim() || !configured}>
                  {sending ? "Sending…" : "Send reply"}
                </button>
              </div>
              {sendError ? <p className={e.error}>{sendError}</p> : null}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
