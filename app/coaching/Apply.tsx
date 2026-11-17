"use client";

import { useState } from "react";
import c from "./coaching.module.css";

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

export default function Apply() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const q = new URLSearchParams(location.search);
    const src = Object.fromEntries(UTM.map((k) => [k, q.get(k) ?? ""]));
    try {
      const res = await fetch("/api/coaching/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, src, page: location.href }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Couldn't send it. Try again.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className={c.done} role="status">
        <b>Got it.</b> I read every application myself. If we&apos;re a fit, you&apos;ll get an email from me within 48 hours
        to book your call.
      </div>
    );
  }

  return (
    <form className={c.form} onSubmit={submit}>
      <label>
        Your name
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Instagram (optional)
        <input name="instagram" placeholder="@" />
      </label>
      <label>
        Your DAW
        <input name="daw" placeholder="FL Studio, Ableton, Logic…" />
      </label>
      <label>
        How long have you been making beats?
        <input name="years" />
      </label>
      <label>
        Where do you get stuck?
        <textarea name="where_stuck" required rows={4} />
      </label>
      <label>
        Where do you want to be in 3 months?
        <textarea name="goal" required rows={4} />
      </label>
      <label>
        A link to 1 or 2 of your beats (optional)
        <input name="links" placeholder="SoundCloud, YouTube, Drive…" />
      </label>
      <fieldset className={c.ready}>
        <legend>Coaching is €2,000 a month. Are you ready to invest that in your music?</legend>
        <label>
          <input type="radio" name="ready" value="yes" required /> Yes, I&apos;m ready
        </label>
        <label>
          <input type="radio" name="ready" value="soon" /> In the next few months
        </label>
        <label>
          <input type="radio" name="ready" value="no" /> Not right now
        </label>
      </fieldset>
      <input className={c.hp} name="company" tabIndex={-1} autoComplete="off" aria-hidden />
      {error && <p className={c.error}>{error}</p>}
      <button className={c.btn} disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Apply now"}
      </button>
    </form>
  );
}
