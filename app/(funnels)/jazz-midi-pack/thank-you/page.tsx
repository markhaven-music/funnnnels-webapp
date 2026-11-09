import type { Metadata } from "next";
import { ACCOUNT_URL } from "@/lib/account";
import { after } from "next/server";
import { reportSaleToNeo } from "@/lib/neo";
import { noteSale } from "@/lib/sales";
import { getOrder, type Order } from "@/lib/orders";
import { resolveFunnel } from "@/lib/funnels";
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
  ...Object.fromEntries(funnel.offers.map((x) => [x.id, x.name])),
};
const BONUS = new Set<string>(funnel.bonuses.map((x) => x.id));

// Stripe sends the buyer here with ?payment_intent=pi_… after paying, the
// PayPal button with ?paypal_order=…, through the Famous Beats upsell (./offer)
// with &u=<the upsell's payment>. We ask the provider directly whether each
// succeeded; the URL alone proves nothing.
export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string; u?: string; preview?: string }>;
}) {
  const { payment_intent, paypal_order, u, preview } = await searchParams;
  // Its words, with the dashboard's edits (funnel map → Edit).
  const w = await wordsFor(funnel.slug, "thank-you", THANKS);
  const order = await getOrder(payment_intent ?? paypal_order, funnel.slug);
  // The upsell's name as dashboard → Products has it.
  const f = await resolveFunnel(funnel.slug);
  // The add-ons too: the Record Samples (the 5-minute bonus) are only in Products, not in funnel.ts.
  const labels: Record<string, string> = {
    ...Object.fromEntries((f?.bumps ?? []).map((x) => [x.id, x.name])),
    ...LABELS,
    ...Object.fromEntries((f?.offers ?? []).map((x) => [x.id, x.name])),
  };
  // The upsells bought after this order, each checked with its provider.
  const upsells: Order[] = [];
  if (order && !order.offer) {
    const ids = [...new Set((u ?? "").split(",").filter(Boolean))].slice(0, funnel.offers.length);
    for (const up of await Promise.all(ids.map((id) => getOrder(id, funnel.slug)))) {
      if (up?.offer && up.parent === order.id && up.status === "succeeded") upsells.push(up);
    }
  }
  // The sale also goes to neo, labelled funnnnels (lib/neo.ts).
  if (order) reportSaleToNeo(order, funnel.product);
  for (const up of upsells) reportSaleToNeo(up, labels[up.offer!] ?? up.offer!);
  if (order) after(async () => {
    for (const o of [order, ...upsells]) await noteSale(o, funnel.slug, "en");
  });
  // The dashboard's preview (?preview=1, not counted: lib/beacon.ts) with no order:
  // the page as a buyer sees it, its buttons inert.
  const sample = !order && preview === "1";
  const paid = sample || order?.status === "succeeded";
  const pending = order?.status === "processing";
  // Each download with the order that paid for it (the upsell is an order of its own).
  const downloads = sample
    ? unlocked(["pack"]).map((key) => ({ order: "preview", key }))
    : paid && order
      ? [order, ...upsells].flatMap((o) => unlocked(o.items).map((key) => ({ order: o.id, key })))
      : [];
  const state = paid ? w.paid : pending ? w.pending : w.failed;
  // _words_ in the heading are its italics.
  const title = state.title.split(/_(.+?)_/).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));

  return (
    <main className={`${s.page} ${s.jazz} ${display.variable}`}>
      <Beacon funnel={funnel.slug} page="thank-you" abCookie={AB.cookie} />
      <Clarity purchase={paid && !!order} />
      {paid && order && <PurchasePixel orderId={order.id} value={order.amount} currency={order.currency} />}
      {upsells.map((up) => (
        <PurchasePixel key={up.id} orderId={up.id} value={up.amount} currency={up.currency} product={labels[up.offer!] ?? up.offer!} />
      ))}
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
          {downloads.length > 0 && (
            <div className={s.thanksActions}>
              {downloads.map(({ order: orderId, key }) => (
                <a
                  key={`${orderId}-${key}`}
                  href={`/${funnel.slug}/download?order=${orderId}&file=${key}`}
                  className={key === "pack" ? b.btn : s.ghostBtn}
                >
                  {key === "pack" && <span className={b.shine} aria-hidden />}
                  <span className={key === "pack" ? b.label : undefined}>
                    {fill(BONUS.has(key) && key !== "pack" ? w.downloadBonus : w.download, { name: labels[key] ?? key })}
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
