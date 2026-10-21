"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { I } from "@/components/icons";
import type { Contact } from "@/lib/contacts";
import e from "./email.module.css";

// Dashboard → Contacts: everyone on the list, their tags and whether the
// newsletter reaches them; add one by hand or import a CSV (a ClickFunnels
// contacts export works as is).

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── CSV ───────────────────────────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

type Parsed = { rows: { email: string; name?: string; tags: string[]; status?: "unsubscribed" }[]; columns: string; skipped: number };

/** Find the email, name, tags and unsubscribed columns by their headers. */
function readContacts(text: string): Parsed | string {
  const [head, ...body] = parseCsv(text.replace(/^﻿/, ""));
  if (!head) return "The file is empty.";
  const h = head.map((x) => x.trim().toLowerCase());
  const find = (...names: RegExp[]) => h.findIndex((c) => names.some((n) => n.test(c)));
  const email = find(/^e-?mail( address)?$/, /email/);
  if (email < 0) return "No email column found (a column called “Email”).";
  const name = find(/^(full )?name$/);
  const first = find(/^first[ _]?name$/);
  const last = find(/^last[ _]?name$/);
  const tags = find(/^tags?$/, /tag/);
  const unsub = find(/unsubscri/, /^subscribed$/, /status/);
  let skipped = 0;
  const rows: Parsed["rows"] = [];
  for (const r of body) {
    const addr = (r[email] ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
      skipped++;
      continue;
    }
    const full = name >= 0 ? r[name] : [first >= 0 ? r[first] : "", last >= 0 ? r[last] : ""].join(" ");
    const flag = unsub >= 0 ? (r[unsub] ?? "").trim().toLowerCase() : "";
    const isUnsub = h[unsub] === "subscribed" ? ["false", "no", "0"].includes(flag) : ["true", "yes", "1", "unsubscribed", "x"].includes(flag);
    rows.push({
      email: addr,
      name: full?.trim() || undefined,
      tags: tags >= 0 ? (r[tags] ?? "").split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [],
      ...(isUnsub ? { status: "unsubscribed" as const } : {}),
    });
  }
  const used = [email, name, first, last, tags, unsub].filter((i) => i >= 0).map((i) => head[i]);
  return { rows, columns: used.join(", "), skipped };
}

// ─── panel ─────────────────────────────────────────────────────────

const COLS = { gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1.6fr) 110px 100px 32px" };

export function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"add" | "import" | null>(null);
  const [form, setForm] = useState({ email: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts", { cache: "no-store" });
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => [...new Set(contacts.flatMap((c) => c.tags ?? []))].sort(), [contacts]);
  const subscribed = useMemo(() => contacts.filter((c) => c.status === "subscribed").length, [contacts]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return contacts.filter(
      (c) => (!needle || c.email.includes(needle) || c.name?.toLowerCase().includes(needle)) && (!tag || c.tags?.includes(tag)) && (!status || c.status === status),
    );
  }, [contacts, q, tag, status]);

  const handleAdd = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.contact) setContacts((prev) => [data.contact, ...prev]);
      setForm({ email: "", name: "" });
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Contact) => {
    if (!window.confirm(`Delete ${c.email}? To stop emails only, unsubscribe them instead.`)) return;
    setContacts((prev) => prev.filter((x) => x.id !== c.id));
    await fetch("/api/contacts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) });
  };

  const toggle = async (c: Contact) => {
    const next = c.status === "subscribed" ? "unsubscribed" : "subscribed";
    if (next === "subscribed" && !window.confirm(`Subscribe ${c.email} again? Only do this if they asked.`)) return;
    setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    await fetch("/api/contacts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: c.email, status: next }) });
  };

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-sub">
            {loading ? "Loading…" : `${contacts.length.toLocaleString("en-US")} contacts · ${subscribed.toLocaleString("en-US")} subscribed to the newsletter`}
          </p>
        </div>
        <div className="cta-group">
          <button type="button" className="btn" onClick={() => setMode((m) => (m === "import" ? null : "import"))}>
            <I.paperclip size={14} /> Import CSV
          </button>
          <button type="button" className="btn primary" onClick={() => setMode((m) => (m === "add" ? null : "add"))}>
            <I.contacts size={14} /> Add contact
          </button>
        </div>
      </div>

      {mode === "add" && (
        <form onSubmit={handleAdd} className={e.panel} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className={e.input} style={{ flex: 1 }} type="email" placeholder="Email address" required value={form.email} onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))} />
          <input className={e.input} style={{ width: 200 }} placeholder="Name (optional)" value={form.name} onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))} />
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn ghost" onClick={() => setMode(null)}>
            Cancel
          </button>
        </form>
      )}

      {mode === "import" && (
        <Import
          onDone={() => {
            setMode(null);
            load();
          }}
        />
      )}

      <div className={e.toolbar}>
        <input className={e.input} style={{ width: 260 }} placeholder="Search email or name…" value={q} onChange={(ev) => setQ(ev.target.value)} />
        <select className={e.select} value={tag} onChange={(ev) => setTag(ev.target.value)}>
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select className={e.select} value={status} onChange={(ev) => setStatus(ev.target.value)}>
          <option value="">Any status</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="bounced">Bounced</option>
          <option value="complained">Complained</option>
        </select>
        <span className={e.mono}>{shown.length.toLocaleString("en-US")} shown</span>
      </div>

      {!loading && contacts.length === 0 ? (
        <div className={e.empty}>
          <I.contacts size={28} style={{ opacity: 0.4 }} />
          <div>No contacts yet. They arrive from checkouts and forms, or import your list from ClickFunnels.</div>
        </div>
      ) : (
        <div className={e.table}>
          <div className={e.head} style={COLS}>
            <span>EMAIL</span>
            <span>NAME</span>
            <span>TAGS</span>
            <span>NEWSLETTER</span>
            <span>ADDED</span>
            <span />
          </div>
          {shown.slice(0, 500).map((c) => (
            <div key={c.id} className={e.row} style={COLS}>
              <span className={`${e.cell} ${e.strong}`} title={c.source ? `from ${c.source}` : undefined}>
                {c.email}
              </span>
              <span className={`${e.cell} ${e.dim}`}>{c.name ?? "—"}</span>
              <span className={e.tags}>
                {(c.tags ?? []).map((t) => (
                  <span key={t} className={e.tag}>
                    {t}
                  </span>
                ))}
              </span>
              <button type="button" className={`${e.chip} ${e[`chip_${c.status}`] ?? ""}`} style={{ background: "none", cursor: "pointer" }} title="Switch" onClick={() => toggle(c)}>
                {c.status}
              </button>
              <span className={e.mono}>{fmt(c.createdAt)}</span>
              <button type="button" className="icon-btn" title="Delete" onClick={() => handleDelete(c)} style={{ color: "var(--fg-3)" }}>
                <I.trash size={13} />
              </button>
            </div>
          ))}
          {shown.length > 500 && <div className={`${e.row} ${e.dim}`}>…and {(shown.length - 500).toLocaleString("en-US")} more. Search or filter to find someone.</div>}
        </div>
      )}
    </main>
  );
}

function Import({ onDone }: { onDone: () => void }) {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState("");
  const [tag, setTag] = useState("clickfunnels");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function pick(file: File | undefined) {
    setError("");
    setResult("");
    setParsed(null);
    if (!file) return;
    const p = readContacts(await file.text());
    if (typeof p === "string") setError(p);
    else if (!p.rows.length) setError("No valid emails in the file.");
    else setParsed(p);
  }

  async function run() {
    if (!parsed) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: parsed.rows, source: tag || "import", tag }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setResult(`${d.added.toLocaleString("en-US")} new contacts, ${d.updated.toLocaleString("en-US")} already there (tags merged).`);
      setParsed(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const unsub = parsed?.rows.filter((r) => r.status).length ?? 0;
  return (
    <div className={e.panel}>
      <div className={e.panelHead}>
        <h2 className={e.h2}>Import contacts from a CSV</h2>
        <button type="button" className="btn ghost" onClick={onDone}>
          {result ? "Done" : "Cancel"}
        </button>
      </div>
      <p className={e.hint} style={{ marginTop: 0 }}>
        ClickFunnels: Contacts → select all → Export, then pick the file here. It needs an Email column; Name (or First/Last name), Tags and an Unsubscribed
        column are used when present. Nobody who unsubscribed gets subscribed again, and imported contacts don&rsquo;t start any sequence.
      </p>
      <div className={e.actions}>
        <input type="file" accept=".csv,text/csv" onChange={(ev) => pick(ev.target.files?.[0])} />
        <label className={e.label} style={{ gridAutoFlow: "column", alignItems: "center" }}>
          Tag them all
          <input className={e.input} value={tag} onChange={(ev) => setTag(ev.target.value)} placeholder="optional" />
        </label>
      </div>
      {parsed && (
        <>
          <p className={e.mono} style={{ marginTop: 12 }}>
            {parsed.rows.length.toLocaleString("en-US")} contacts found ({unsub.toLocaleString("en-US")} unsubscribed) · {parsed.skipped} rows without a valid email skipped · columns used: {parsed.columns}
          </p>
          <button type="button" className="btn primary" disabled={busy} onClick={run}>
            {busy ? "Importing…" : `Import ${parsed.rows.length.toLocaleString("en-US")} contacts`}
          </button>
        </>
      )}
      {result && <p className={e.ok}>{result}</p>}
      {error && <p className={e.error}>{error}</p>}
    </div>
  );
}
