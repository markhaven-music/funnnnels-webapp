"use client";
import { useEffect, useRef, useState } from "react";
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
export default function Comments({ video, ask, quick, initial }: { video: number; ask: string; quick: string[]; initial: Comment[] }) {
  const [list, setList] = useState(initial);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  // Remember who they are, so the next comment is one tap and one click.
  useEffect(() => {
    try {
      const n = localStorage.getItem("bible_name"), e = localStorage.getItem("bible_email");
      if (n && nameRef.current) nameRef.current.value = n;
      if (e && emailRef.current) emailRef.current.value = e;
    } catch {}
  }, []);
  function pick(q: string) {
    setText((t) => (t.trim() ? t : q + ". "));
    if (nameRef.current && !nameRef.current.value) nameRef.current.focus();
  }
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
    if (r?.ok && d.comment) {
      setList([d.comment, ...list]); setText(""); setDone(true);
      try { localStorage.setItem("bible_name", String(f.get("name") ?? "")); localStorage.setItem("bible_email", String(f.get("email") ?? "")); } catch {}
    }
    else if (!r?.ok) setErr(d.error || "Something went wrong. Try again.");
  }
  return (
    <section className={s.comments}>
      <h2 className={s.cask}>{ask}</h2>
      <p className={s.csub}>Tap your answer and tell me below. I read every comment.</p>
      {quick.length > 0 && (
        <div className={s.chips}>
          {quick.map((q) => (
            <button type="button" key={q} className={text.startsWith(q) ? s.chipOn : s.chip} onClick={() => pick(q)}>{q}</button>
          ))}
        </div>
      )}
      <form className={`${s.form} ${s.cform}`} onSubmit={submit}>
        <textarea name="body" required rows={3} maxLength={800} value={text} onChange={(e) => setText(e.target.value)} placeholder="Or write it in your own words" />
        <div className={s.crow}>
          <input ref={nameRef} name="name" required placeholder="First name" autoComplete="given-name" />
          <input ref={emailRef} name="email" type="email" placeholder="Email (optional, not shown)" autoComplete="email" />
        </div>
        <input name="company" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden />
        <button disabled={busy}>{busy ? "Posting…" : "Post comment"}</button>
        {err && <p className={s.err}>{err}</p>}
        {done && !err && <p className={s.cdone}>Posted. Thank you, I read it.</p>}
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
