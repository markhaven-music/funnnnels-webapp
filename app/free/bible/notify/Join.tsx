"use client";
import { useState } from "react";
import s from "../[n]/bible.module.css";

// Dial codes for the phone field, US first and preselected (most buyers).
const DIAL: [string, string, string][] = [
  ["US", "🇺🇸", "+1"], ["CA", "🇨🇦", "+1"], ["GB", "🇬🇧", "+44"], ["AU", "🇦🇺", "+61"], ["NZ", "🇳🇿", "+64"],
  ["IE", "🇮🇪", "+353"], ["DE", "🇩🇪", "+49"], ["FR", "🇫🇷", "+33"], ["IT", "🇮🇹", "+39"], ["ES", "🇪🇸", "+34"],
  ["NL", "🇳🇱", "+31"], ["BE", "🇧🇪", "+32"], ["CH", "🇨🇭", "+41"], ["AT", "🇦🇹", "+43"], ["SE", "🇸🇪", "+46"],
  ["NO", "🇳🇴", "+47"], ["DK", "🇩🇰", "+45"], ["FI", "🇫🇮", "+358"], ["PL", "🇵🇱", "+48"], ["PT", "🇵🇹", "+351"],
  ["BR", "🇧🇷", "+55"], ["MX", "🇲🇽", "+52"], ["ZA", "🇿🇦", "+27"], ["NG", "🇳🇬", "+234"], ["JP", "🇯🇵", "+81"],
  ["IN", "🇮🇳", "+91"], ["AE", "🇦🇪", "+971"],
];

// "+39 333…" typed in full wins; else the picked code + the digits, a leading
// trunk 0 dropped (UK 07… → +44 7…) except Italy, where the 0 is part of landlines.
function fullPhone(code: string, typed: string) {
  const t = typed.trim();
  if (!t) return "";
  if (t.startsWith("+")) return t;
  let d = t.replace(/\D/g, "");
  if (code !== "+39") d = d.replace(/^0/, "");
  if (code === "+1") d = d.replace(/^1(?=\d{10}$)/, "");
  return code + d;
}

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
      body: JSON.stringify({ name: f.get("name"), email: f.get("email"), phone: fullPhone(String(f.get("cc") || "US|+1").split("|")[1], String(f.get("phone") || "")), sms: f.get("sms") === "on",
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
      <div className={s.phone}>
        <select name="cc" defaultValue="US|+1" aria-label="Country code">
          {DIAL.map(([c, flag, code]) => <option key={c} value={`${c}|${code}`}>{flag} {code}</option>)}
        </select>
        <input name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel-national" />
      </div>
      <label className={s.consent}>
        <input type="checkbox" name="sms" />
        <span>
          {consent}{" "}
          <a href="/terms-and-conditions" target="_blank" rel="noopener">Terms</a> ·{" "}
          <a href="/privacy-policy" target="_blank" rel="noopener">Privacy</a>
        </span>
      </label>
      <input name="company" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden />
      <button disabled={state === "busy"}>{state === "busy" ? "Saving…" : <>Get early access<span className={s.arrow}>→</span></>}</button>
      {err && <p className={s.err}>{err}</p>}
      <small>Your phone is optional. We text you only for this launch, 3 messages at most.</small>
    </form>
  );
}
