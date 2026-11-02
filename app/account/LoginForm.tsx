"use client";

import { useState } from "react";
import type { Lang } from "@/lib/account";
import a from "./account.module.css";

type Words = {
  label: string;
  placeholder: string;
  button: string;
  busy: string;
  invalid: string;
  failed: string;
  wait: string;
  off: string;
  sentTitle: string;
  sentLead: string; // with {email}
  sentHelp: string;
  again: string;
  dev: string;
};

// The sign-in form: the email → POST /api/checkout/account/login → "check
// your inbox" (the same answer whether or not the email has purchases).
export function LoginForm({ lang, words: w }: { lang: Lang; words: Words }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");
  const [dev, setDev] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(w.invalid);
    setState("busy");
    try {
      const res = await fetch("/api/checkout/account/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      const r = await res.json().catch(() => ({}));
      if (res.ok) {
        setDev(typeof r.dev === "string" ? r.dev : "");
        return setState("sent");
      }
      setState("idle");
      setError({ invalid: w.invalid, wait: w.wait, off: w.off }[r.error as string] ?? w.failed);
    } catch {
      setState("idle");
      setError(w.failed);
    }
  }

  if (state === "sent") {
    const [before, after] = w.sentLead.split("{email}");
    return (
      <div className={a.sent} role="status">
        <svg className={a.mail} viewBox="0 0 24 24" aria-hidden width="44" height="44">
          <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M3 6.5h18v11H3z" />
          <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="m3.5 7 8.5 6.5L20.5 7" />
        </svg>
        <h2 className={a.sentTitle}>{w.sentTitle}</h2>
        <p className={a.text} data-clarity-mask="True">
          {before}
          <b>{email.trim().toLowerCase()}</b>
          {after}
        </p>
        <p className={a.help}>{w.sentHelp}</p>
        {dev && (
          <p className={a.dev}>
            <a href={dev}>{w.dev}</a>
          </p>
        )}
        <button type="button" className={a.link} onClick={() => setState("idle")}>
          {w.again}
        </button>
      </div>
    );
  }

  return (
    <form className={a.form} onSubmit={submit} noValidate data-clarity-mask="True">
      <label className={a.label} htmlFor="email">
        {w.label}
      </label>
      <input
        id="email"
        className={a.input}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={w.placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "email-error" : undefined}
        required
      />
      {error && (
        <p id="email-error" className={a.error}>
          {error}
        </p>
      )}
      <button className={a.button} type="submit" disabled={state === "busy"}>
        {state === "busy" ? w.busy : w.button}
      </button>
    </form>
  );
}
