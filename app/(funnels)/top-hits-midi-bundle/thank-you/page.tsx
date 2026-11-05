import { resolveFunnel } from "@/lib/funnels";
import type { Metadata } from "next";
import { ACCOUNT_URL } from "@/lib/account";
import { after } from "next/server";
import { reportSaleToNeo } from "@/lib/neo";
import { noteSale } from "@/lib/sales";
import { getOrder, type Order } from "@/lib/orders";
import { fill, wordsFor } from "@/lib/words";
import { THANKS } from "../words";
import { Slots } from "../Lines";
import { funnel } from "../funnel";
import { fontVars } from "../fonts";
import { PurchasePixel } from "../Tracking";
import { Beacon } from "../../Beacon";
import { Clarity } from "../../Clarity";
import s from "../order.module.css";
import t from "./thanks.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thank you · TOP HITS MIDI Bundle",
  robots: { index: false, follow: false },
};

const LABELS: Record<string, string> = {
  pack: funnel.product,
  ...Object.fromEntries(funnel.bumps.map((b) => [b.id, b.name])),
  ...Object.fromEntries(funnel.offers.map((o) => [o.id, o.name])),
};

// Stripe sends the buyer here with ?payment_intent=pi_…, PayPal's return with
// ?paypal_order=…; the upsell page adds u=<upsell orders>. We ask the
// provider about every one; the URL proves nothing.
export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string; u?: string; preview?: string }>;
}) {
  const { payment_intent, paypal_order, u, preview } = await searchParams;
  // Its words, with the dashboard's edits (funnel map → Edit).
  const w = await wordsFor(funnel.slug, "thank-you", THANKS);
  // The names dashboard → Products gives the add-ons and upsells (an added add-on too).
  const f = await resolveFunnel(funnel.slug);
  const labels: Record<string, string> = {
    ...LABELS,
    ...Object.fromEntries([...(f?.bumps ?? []), ...(f?.offers ?? [])].map((x) => [x.id, x.name])),
    ...(f && f.product !== funnel.product ? { pack: f.product } : {}),
  };
  const order = await getOrder(payment_intent ?? paypal_order, funnel.slug);

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
  after(async () => {
    for (const o of [order, ...upsells]) await noteSale(o, funnel.slug, "en");
  });
  // The dashboard's preview (?preview=1, not counted: lib/beacon.ts) with no order:
  // the page as someone who bought everything sees it, its buttons inert.
  const sample = !order && preview === "1";
  const paid = sample || order?.status === "succeeded";
  const pending = order?.status === "processing";
  const downloads = sample
    ? ["pack", ...funnel.bumps.map((b) => b.id), ...funnel.offers.map((o) => o.id)].map((key) => ({ order: "preview", key }))
    : paid && order
      ? [order, ...upsells].flatMap((o) => o.items.map((key) => ({ order: o.id, key })))
      : [];
  const state = paid ? w.paid : pending ? w.pending : w.failed;

  return (
    <main className={`${s.page} ${fontVars}`}>
      <Beacon funnel={funnel.slug} page="thank-you" />
      <Clarity purchase={paid && !!order} />
      {paid && order && <PurchasePixel orderId={order.id} value={order.amount} currency={order.currency} />}
      {upsells.map((up) => (
        <PurchasePixel key={up.id} orderId={up.id} value={up.amount} currency={up.currency} />
      ))}
      <header className={s.header} style={{ display: "block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.logo} src="/funnels/top-hits-midi-bundle/logo.png" alt="GRIND STUDIO" width={900} height={103} />
      </header>
      <section className={t.wrap}>
        <h1 className={t.title}>{state.title}</h1>
        <p className={t.lead}>{state.lead}</p>
        {downloads.length > 0 && (
          <div className={t.list}>
            {downloads.map(({ order: id, key }) => (
              <a key={`${id}-${key}`} className={key === "pack" ? `${s.orange} ${t.btn}` : t.ghost} href={`/${funnel.slug}/download?order=${id}&file=${key}`}>
                {fill(w.download, { name: labels[key] ?? key })}
              </a>
            ))}
          </div>
        )}
        {paid && (
          <p className={t.note} data-clarity-mask="True">
            <Slots
              text={fill(w.receipt, { provider: order?.provider === "paypal" ? "PayPal" : "Stripe", to: order?.email ? fill(w.receiptTo, { email: order.email }) : "" })}
              slots={{ support: <a href={`mailto:${funnel.support}`}>{funnel.support}</a> }}
            />
          </p>
        )}
        {paid && (
          <p className={t.account}>
            <Slots text={w.account} slots={{ account: <a href={ACCOUNT_URL}>{ACCOUNT_URL.replace("https://", "")}</a> }} />
          </p>
        )}
        {!paid && !pending && (
          <a className={`${s.orange} ${t.btn}`} href={funnel.checkout.orderPage}>
            {w.back}
          </a>
        )}
      </section>
    </main>
  );
}
