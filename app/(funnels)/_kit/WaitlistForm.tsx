"use client";

import { useState } from "react";
import b from "../jazz-midi-pack/btn.module.css";
import { Arrow } from "../jazz-midi-pack/Cta";
import k from "./kit.module.css";

// Waitlist sign-up: the shared opt-in (/api/optin), which tags the contact
// with this launch's waitlist tag on the server. Launch emails go to that tag.
export function WaitlistForm({ funnel, button, done, note }: { funnel: string; button: string; done: string; note: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/optin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, funnel }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "That didn't work. Try again in a minute.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className={k.done} role="status">
        {done}
      </p>
    );
  }
  return (
    <>
      <form className={k.form} onSubmit={submit}>
        <input name="email" type="email" required placeholder="Your email" autoComplete="email" inputMode="email" className={k.input} />
        {/* Honeypot: people never see it, bots fill it in. */}
        <input name="company" tabIndex={-1} autoComplete="off" className={k.honey} aria-hidden />
        <button className={b.btn} disabled={state === "busy"} data-cta>
          <span className={b.shine} aria-hidden />
          <span className={b.label}>
            <span>{state === "busy" ? "Saving…" : button}</span>
            <Arrow className={b.arrow} />
          </span>
        </button>
      </form>
      {error && (
        <p className={k.error} role="alert">
          {error}
        </p>
      )}
      <p className={k.formNote}>{note}</p>
    </>
  );
}
