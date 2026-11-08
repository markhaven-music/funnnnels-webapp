"use client";

import { useEffect, useState } from "react";
import b from "../jazz-midi-pack/btn.module.css";
import { Arrow } from "../jazz-midi-pack/Cta";
import s from "./landing.module.css";

// The one-click upsell's buttons, as the MIDI Drum Kit's upsell pages work
// (midi-drum-kit/upsell.ts script()): Yes → /api/checkout/upsell charges the
// card the order was paid with (or sends a PayPal buyer to PayPal to confirm),
// then the next step; No → the next step. The order travels in the address:
// ?payment_intent=pi_… or ?paypal_order=…, plus u=<the upsells bought so far>.

type Ui = { busy: string; failed: string; noOrder: string };
const UI: Ui = {
  busy: "Adding it to your order…",
  failed: "The payment didn't go through. Try again, or skip this offer: your order is safe.",
  noOrder: "We couldn't find your order on this page. Your purchase is safe: continue to get your downloads.",
};

const cookie = (n: string) => {
  const m = document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
};

export function UpsellButtons({ funnel, offer, next, yes, yesSub, no }: { funnel: string; offer: string; next: string; yes: string; yesSub: string; no: string }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const state = () => {
    const q = new URLSearchParams(location.search);
    const main: [string, string] | null = q.get("payment_intent") ? ["payment_intent", q.get("payment_intent")!] : q.get("paypal_order") ? ["paypal_order", q.get("paypal_order")!] : null;
    const bought = (q.get("u") ?? "").split(",").filter(Boolean);
    return { main, bought };
  };
  const go = (extra: string | null) => {
    const { main, bought } = state();
    const p = new URLSearchParams();
    if (main) p.set(main[0], main[1]);
    const u = bought.concat(extra ? [extra] : []);
    if (u.length) p.set("u", u.join(","));
    location.href = next + (p.toString() ? "?" + p.toString() : "");
  };

  // Already ticked as an add-on on the order form (fv_owned): this offer is skipped.
  useEffect(() => {
    if (cookie("fv_owned").split(",").includes(offer)) go(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stripeAction = (r: { publishableKey: string; clientSecret: string; paymentMethod: string }) => {
    const el = document.createElement("script");
    el.src = "https://js.stripe.com/v3";
    el.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripe = (window as any).Stripe(r.publishableKey);
      stripe.confirmCardPayment(r.clientSecret, { payment_method: r.paymentMethod }).then((x: { paymentIntent?: { id: string; status: string } }) => {
        if (x.paymentIntent?.status === "succeeded") go(x.paymentIntent.id);
        else {
          setBusy(false);
          setNote(UI.failed);
        }
      });
    };
    document.head.appendChild(el);
  };

  const buy = async () => {
    if (busy) return;
    const { main, bought } = state();
    if (!main) return setNote(UI.noOrder);
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/checkout/upsell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ funnel, offer, order: main[1], lang: "en", bought, variant: "", ft_vid: cookie("ft_vid") }),
      });
      const r = await res.json().catch(() => ({}));
      if (r.status === "paid") return go(r.id);
      if (r.status === "action") return stripeAction(r);
      if (r.status === "paypal") return void (location.href = r.url);
      setBusy(false);
      setNote(r.error ?? (res.status === 400 ? UI.noOrder : UI.failed));
    } catch {
      setBusy(false);
      setNote(UI.failed);
    }
  };

  return (
    <div className={s.cta}>
      <button type="button" className={b.btn} onClick={buy} disabled={busy} data-cta>
        <span className={b.shine} aria-hidden />
        <span className={b.label}>
          <span>{busy ? UI.busy : yes}</span>
          {!busy && <Arrow className={b.arrow} />}
        </span>
        <span className={b.inner}>{yesSub}</span>
      </button>
      {note && <p className={s.upNote}>{note}</p>}
      <button type="button" className={s.noThanks} onClick={() => go(null)}>
        {no}
      </button>
    </div>
  );
}
