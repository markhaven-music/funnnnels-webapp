"use client";

import { useCallback, useEffect, useState } from "react";
import { I } from "@/components/icons";
import type { Contact } from "@/lib/contacts";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: "", name: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setContacts((prev) => [data.contact, ...prev]);
      setForm({ email: "", name: "" });
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-sub">
            {loading
              ? "Loading…"
              : contacts.length === 0
                ? "Leads collected from your funnel forms will appear here."
                : `${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="cta-group">
          <button
            type="button"
            className="btn primary"
            onClick={() => setAdding((v) => !v)}
          >
            <I.contacts size={14} /> Add contact
          </button>
        </div>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            background: "var(--bg-1)",
            border: "1px solid var(--line-soft)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
          }}
        >
          <input
            type="email"
            placeholder="Email address"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            style={{
              flex: 1,
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "6px 10px",
              color: "var(--fg-0)",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
            }}
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{
              width: 180,
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "6px 10px",
              color: "var(--fg-0)",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
            }}
          />
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setAdding(false)}
          >
            Cancel
          </button>
        </form>
      )}

      {!loading && contacts.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "var(--fg-3)",
            paddingTop: "10vh",
          }}
        >
          <I.contacts size={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-2)" }}>
            No contacts yet
          </div>
          <div style={{ fontSize: 13 }}>
            Contacts are added automatically when someone submits a form in your funnel.
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line-soft)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto",
              padding: "8px 16px",
              borderBottom: "1px solid var(--line-soft)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-3)",
              letterSpacing: "0.04em",
            }}
          >
            <span>EMAIL</span>
            <span>NAME</span>
            <span>ADDED</span>
            <span />
          </div>
          {contacts.map((c) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                padding: "11px 16px",
                borderBottom: "1px solid var(--line-soft)",
                fontSize: 13,
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--fg-0)" }}>{c.email}</span>
              <span style={{ color: "var(--fg-2)" }}>{c.name ?? "—"}</span>
              <span
                style={{
                  color: "var(--fg-3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                {fmt(c.createdAt)}
              </span>
              <button
                type="button"
                className="icon-btn"
                title="Delete"
                onClick={() => handleDelete(c.id)}
                style={{ color: "var(--fg-3)" }}
              >
                <I.trash size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
