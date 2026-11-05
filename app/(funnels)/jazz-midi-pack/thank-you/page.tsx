import type { Metadata } from "next";
import { ACCOUNT_URL } from "@/lib/account";
import { after } from "next/server";
import { reportSaleToNeo } from "@/lib/neo";
import { noteSale } from "@/lib/sales";
import { getOrder } from "@/lib/orders";
import { fill, wordsFor } from "@/lib/words";
import { Slots } from "../../top-hits-midi-bundle/Lines";
import { THANKS } from "../thanksWords";
import { funnel, unlocked } from "../funnel";
import { PurchasePixel } from "../PurchasePixel";
import { Beacon } from "../../Beacon";
import { AB } from "../abtest";
import { Clarity } from "../../Clarity";
import { display } from "../fonts";
import s from "../jazz.module.css";
import b from "../btn.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you · Jazz MIDI Pack",
  robots: { index: false, follow: false },
};

// Bonus names win over the old add-on's: the Chord Pack is bonus 1 now.
const LABELS: Record<string, string> = {
  pack: funnel.product,
  [funnel.bump.id]: funnel.bump.name,
  ...Object.fromEntries(funnel.bumps.map((x) => [x.id, x.name])),
  ...Object.fromEntries(funnel.bonuses.map((x) => [x.id, x.name])),
};
const BONUS = new Set<string>(funnel.bonuses.map((x) => x.id));

// Stripe sends the buyer here with ?payment_intent=pi_… after paying, the
// PayPal button with ?paypal_order=…. We ask the provider directly whether it
// succeeded; the URL alone proves nothing.
export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string; preview?: string }>;
}) {
  const { payment_intent, paypal_order, preview } = await searchParams;
  // Its words, with the dashboard's edits (funnel map → Edit).
  const w = await wordsFor(funnel.slug, "thank-you", THANKS);
  const order = await getOrder(payment_intent ?? paypal_order, funnel.slug);
  // The sale also goes to neo, labelled funnnnels (lib/neo.ts).
  if (order) reportSaleToNeo(order, funnel.product);
  if (order) after(() => noteSale(order, funnel.slug, "en"));
  // The dashboard's preview (?preview=1, not counted: lib/beacon.ts) with no order:
  // the page as a buyer sees it, its buttons inert.
  const sample = !order && preview === "1";
  const paid = sample || order?.status === "succeeded";
  const pending = order?.status === "processing";
  const keys = sample ? unlocked(["pack"]) : paid && order ? unlocked(order.items) : [];
  const orderId = order?.id ?? "preview";
  const state = paid ? w.paid : pending ? w.pending : w.failed;
  // _words_ in the heading are its italics.
  const title = state.title.split(/_(.+?)_/).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));

  return (
    <main className={`${s.page} ${s.jazz} ${display.variable}`}>
      <Beacon funnel={funnel.slug} page="thank-you" abCookie={AB.cookie} />
      <Clarity purchase={paid && !!order} />
      {paid && order && <PurchasePixel orderId={order.id} value={order.amount} currency={order.currency} />}
      <section className={s.hero}>
        <div className={s.heroBg} aria-hidden />
        <header className={`${s.wrap} ${s.topbar}`}>
          <span className={s.logo}>
            <img src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={360} height={42} />
          </span>
        </header>
        <div className={`${s.wrap} ${s.col} ${s.thanks}`} style={{ position: "relative" }}>
          <p className={s.eyebrow}>{funnel.product}</p>
          <h1 className={s.display}>{title}</h1>
          <p className={s.lead}>{state.lead}</p>
          {keys.length > 0 && (
            <div className={s.thanksActions}>
              {keys.map((key) => (
                <a
                  key={key}
                  href={`/${funnel.slug}/download?order=${orderId}&file=${key}`}
                  className={key === "pack" ? b.btn : s.ghostBtn}
                >
                  {key === "pack" && <span className={b.shine} aria-hidden />}
                  <span className={key === "pack" ? b.label : undefined}>
                    {fill(BONUS.has(key) && key !== "pack" ? w.downloadBonus : w.download, { name: LABELS[key] ?? key })}
                  </span>
                  {key === "pack" && <span className={b.inner}>{fill(w.zip, { files: funnel.counts.files.toLocaleString("en-US") })}</span>}
                </a>
              ))}
            </div>
          )}
          {paid && (
            <p className={s.sub} data-clarity-mask="True">
              <Slots
                text={fill(w.receipt, { provider: order?.provider === "paypal" ? "PayPal" : "Stripe", to: order?.email ? fill(w.receiptTo, { email: order.email }) : "" })}
                slots={{ support: <a href={`mailto:${funnel.support}`}>{funnel.support}</a> }}
              />
            </p>
          )}
          {paid && (
            <p className={s.account}>
              <Slots text={w.account} slots={{ account: <a href={ACCOUNT_URL}>{ACCOUNT_URL.replace("https://", "")}</a> }} />
            </p>
          )}
          {!paid && !pending && (
            <div className={s.thanksActions}>
              <a href={funnel.checkout.orderPage} className={b.btn}>
                <span className={b.shine} aria-hidden />
                <span className={b.label}>{w.back}</span>
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
