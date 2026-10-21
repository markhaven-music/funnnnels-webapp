"use client";

import { useEffect, useState } from "react";
import type { EmailInsights, EmailRow } from "@/lib/emailInsights";
import e from "./email.module.css";

// What the Broadcasts and Automations editors share: the tag list, the live
// preview, the format help, and datetime-local ↔ ISO.

export type TagCount = { tag: string; contacts: number };

/** Every tag with its count, and how many subscribed contacts tag/exclude would reach. */
export function useAudience(tag: string | null, exclude: string | null) {
  const [tags, setTags] = useState<TagCount[]>([]);
  const [size, setSize] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    const q = new URLSearchParams();
    if (tag) q.set("tag", tag);
    if (exclude) q.set("exclude", exclude);
    fetch(`/api/audience?${q}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        setTags(d.tags);
        setSize(d.size);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tag, exclude]);
  return { tags, size };
}

export function TagSelect({ value, onChange, tags, none, disabled }: { value: string | null; onChange: (v: string | null) => void; tags: TagCount[]; none: string; disabled?: boolean }) {
  const known = !value || tags.some((t) => t.tag === value);
  return (
    <select className={e.select} value={value ?? ""} disabled={disabled} onChange={(ev) => onChange(ev.target.value || null)}>
      <option value="">{none}</option>
      {!known && <option value={value!}>{value}</option>}
      {tags.map((t) => (
        <option key={t.tag} value={t.tag}>
          {t.tag} ({t.contacts.toLocaleString("en-US")})
        </option>
      ))}
    </select>
  );
}

/** The email as it will look, rendered by the server (/api/email/preview), refreshed as you type. */
export function Preview({ subject, preheader, body, vars }: { subject: string; preheader?: string; body: string; vars?: Record<string, string> }) {
  const [html, setHtml] = useState("");
  const [shownSubject, setShownSubject] = useState("");
  const varsKey = JSON.stringify(vars ?? {});
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/email/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject, preheader, body, vars: JSON.parse(varsKey) }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setHtml(d.html);
          setShownSubject(d.subject);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [subject, preheader, body, varsKey]);
  return (
    <div>
      <div className={e.mono} style={{ marginBottom: 8 }}>
        Subject: <span style={{ color: "var(--fg-0)" }}>{shownSubject || "—"}</span>
      </div>
      <iframe className={e.preview} title="Preview" sandbox="" srcDoc={html} />
    </div>
  );
}

export function FormatHelp({ extra }: { extra?: string }) {
  return (
    <p className={e.hint}>
      A blank line starts a new paragraph. <code># Title</code> for a heading, <code>- item</code> for a list, <code>**bold**</code>,{" "}
      <code>[text](https://…)</code> for a link, <code>[button: Get it](https://…)</code> alone on a line for a button,{" "}
      <code>{"{first_name}"}</code> for their first name (&ldquo;there&rdquo; when unknown, or <code>{"{first_name|friend}"}</code>).
      {extra ? ` ${extra}` : ""} The unsubscribe link is added at the bottom for you.
    </p>
  );
}

/** Each email's clicks, orders and revenue, all time (dashboard → Email → Insights' numbers), by id. */
export function useEmailResults(): Map<string, EmailRow> {
  const [rows, setRows] = useState<Map<string, EmailRow>>(new Map());
  useEffect(() => {
    let live = true;
    fetch("/api/email/insights?range=all", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<EmailInsights>) : null))
      .then((d) => {
        if (live && d) setRows(new Map([...d.campaigns, ...d.automations].map((r) => [r.id, r])));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return rows;
}

export const euros = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

export const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
export const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

export const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const TEST_KEY = "funnnnels-test-email";
export function useTestAddress(): [string, (v: string) => void] {
  const [v, setV] = useState("");
  useEffect(() => {
    try {
      setV(localStorage.getItem(TEST_KEY) ?? "");
    } catch {}
  }, []);
  return [
    v,
    (next: string) => {
      setV(next);
      try {
        localStorage.setItem(TEST_KEY, next);
      } catch {}
    },
  ];
}
