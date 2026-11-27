"use client";
import { useState } from "react";
import s from "../[n]/bible.module.css";

export default function Join({ consent }: { consent: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("busy"); setErr("");
    const src = Object.fromEntries(new URLSearchParams(location.search));
    const r = await fetch("/api/checkout/bible", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.get("name"), email: f.get("email"), phone: f.get("phone"), sms: f.get("sms") === "on",
        company: f.get("company"), page: location.href, src }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok) setState("done");
    else { setState("idle"); setErr(d.error || "Something went wrong. Try again."); }
  }
  if (state === "done")
    return (
      <div className={s.joined}>
        <b>You&apos;re on the list.</b>
        <span>On December 21 at 11 AM New York time we send you the link, one hour before everyone.</span>
      </div>
    );
  return (
    <form className={s.form} onSubmit={submit}>
      <input name="name" placeholder="First name" autoComplete="given-name" />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" />
      <input name="phone" type="tel" placeholder="Phone with country code, like +1 555 123 4567" autoComplete="tel" />
      <label className={s.consent}>
        <input type="checkbox" name="sms" />
        <span>{consent}</span>
      </label>
      <input name="company" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden />
      <button disabled={state === "busy"}>{state === "busy" ? "Saving…" : <>Get early access<span className={s.arrow}>→</span></>}</button>
      {err && <p className={s.err}>{err}</p>}
      <small>Your phone is optional. We text you only for this launch, 3 messages at most.</small>
    </form>
  );
}
