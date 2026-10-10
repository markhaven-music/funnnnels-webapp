"use client";

import { useState } from "react";
import s from "./jazz.module.css";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; download: string }
  | { kind: "error"; message: string };

export function OptinForm({ funnel }: { funnel: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/optin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, funnel }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Try again.");
      setState({ kind: "done", download: json.download });
      window.location.assign(json.download);
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }

  if (state.kind === "done") {
    return (
      <div className={s.optinDone}>
        <p className={s.body}>You&rsquo;re in. The download should have started.</p>
        <a href={state.download} className={s.primary} download>
          Download the free sample
        </a>
      </div>
    );
  }

  return (
    <form className={s.optin} onSubmit={submit}>
      <label className={s.field}>
        <span>First name</span>
        <input name="name" autoComplete="given-name" maxLength={80} />
      </label>
      <label className={s.field}>
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" />
      </label>
      {/* honeypot: hidden from people, irresistible to bots */}
      <input name="company" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden />
      <button className={s.primary} disabled={state.kind === "sending"}>
        {state.kind === "sending" ? "Sending…" : "Send me the free files"}
      </button>
      {state.kind === "error" && (
        <p className={s.error} role="alert">
          {state.message}
        </p>
      )}
      <p className={s.fine}>One email with the files, then the occasional note. Unsubscribe any time.</p>
    </form>
  );
}
