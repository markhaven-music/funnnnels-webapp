"use client";
import { useState } from "react";
import s from "./bible.module.css";

export type Comment = { id: string; name: string; body: string; created_at: string };

const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};

// The comments under a launch video: the form on top, newest first.
export default function Comments({ video, ask, initial }: { video: number; ask: string; initial: Comment[] }) {
  const [list, setList] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true); setErr("");
    const r = await fetch("/api/checkout/bible/comment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video, name: f.get("name"), email: f.get("email"), body: f.get("body"), company: f.get("company") }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (r?.ok && d.comment) { setList([d.comment, ...list]); (form.elements.namedItem("body") as HTMLTextAreaElement).value = ""; }
    else if (!r?.ok) setErr(d.error || "Something went wrong. Try again.");
  }
  return (
    <section className={s.comments}>
      <h2 className={s.h2}>{ask}</h2>
      <form className={`${s.form} ${s.cform}`} onSubmit={submit}>
        <textarea name="body" required rows={3} maxLength={800} placeholder="Write your comment" />
        <div className={s.crow}>
          <input name="name" required placeholder="First name" autoComplete="given-name" />
          <input name="email" type="email" required placeholder="Email (not shown)" autoComplete="email" />
        </div>
        <input name="company" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden />
        <button disabled={busy}>{busy ? "Posting…" : "Post comment"}</button>
        {err && <p className={s.err}>{err}</p>}
      </form>
      <p className={s.ccount}>{list.length} {list.length === 1 ? "comment" : "comments"}</p>
      <ul className={s.clist}>
        {list.map((c) => (
          <li key={c.id}>
            <span className={s.cavatar}>{c.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <b>{c.name}</b> <small>{ago(c.created_at)}</small>
              <p>{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
