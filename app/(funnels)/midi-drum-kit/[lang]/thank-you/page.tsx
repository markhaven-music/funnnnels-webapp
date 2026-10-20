import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { reportSaleToNeo } from "@/lib/neo";
import { getOrder } from "@/lib/orders";
import { fontVars } from "../../../top-hits-midi-bundle/fonts";
import s from "../../../top-hits-midi-bundle/order.module.css";
import t from "../../../top-hits-midi-bundle/thank-you/thanks.module.css";
import { copyFor } from "../../copy";
import { funnel, unlocked } from "../../funnel";
import { isLang, paths } from "../../i18n";
import { PurchasePixel } from "../../Tracking";
import { AB } from "../../abtest";
import { Beacon } from "../../../Beacon";

// proxy.ts rewrites /midi-drum-kit/thank-you and /<lang>/midi-drum-kit/thank-you here.
export const dynamic = "force-dynamic";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: copyFor(lang).meta.thanksTitle, robots: { index: false, follow: false } };
}

const LABELS: Record<string, string> = {
  pack: funnel.product,
  ...Object.fromEntries(funnel.bumps.map((b) => [b.id, b.name])),
  ...funnel.fileNames,
};

// Stripe sends the buyer here with ?payment_intent=pi_…, PayPal's return with
// ?paypal_order=…. We ask the provider whether it paid; the URL proves nothing.
export default async function ThankYou({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const c = copyFor(lang).thanks;
  const { payment_intent, paypal_order } = await searchParams;
  const order = await getOrder(payment_intent ?? paypal_order, funnel.slug);
  // The sale also goes to neo, labelled funnnnels (lib/neo.ts).
  if (order) reportSaleToNeo(order, funnel.product);
  const paid = order?.status === "succeeded";
  const pending = order?.status === "processing";

  return (
    <main className={`${s.page} ${fontVars}`} lang={lang}>
      <Beacon funnel={funnel.slug} page="thank-you" lang={lang} abCookie={AB.cookie} />
      {paid && order && <PurchasePixel orderId={order.id} value={order.amount} currency={order.currency} />}
      <header className={s.header} style={{ display: "block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.logo} src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={900} height={103} />
      </header>
      <section className={t.wrap}>
        <h1 className={t.title}>{paid ? c.paid : pending ? c.pending : c.failed}</h1>
        <p className={t.lead}>{paid ? c.paidLead : pending ? c.pendingLead : c.failedLead}</p>
        {paid && order && (
          <div className={t.list}>
            {unlocked(order.items).map((key) => (
              <a key={key} className={key === "pack" ? `${s.orange} ${t.btn}` : t.ghost} href={`/${funnel.slug}/download?order=${order.id}&file=${key}`}>
                {c.download} {LABELS[key] ?? key}
              </a>
            ))}
          </div>
        )}
        {paid && (
          <p className={t.note}>
            {c.receipt(order?.provider === "paypal" ? "PayPal" : "Stripe", order?.email ?? null)}{" "}
            <a href={`mailto:${funnel.support}`}>{funnel.support}</a> {c.fix}
          </p>
        )}
        {!paid && !pending && (
          <a className={`${s.orange} ${t.btn}`} href={paths(lang).order}>
            {c.back}
          </a>
        )}
      </section>
    </main>
  );
}
