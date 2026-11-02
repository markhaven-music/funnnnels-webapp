import { resolveFunnel } from "@/lib/funnels";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { ACCOUNT_URL } from "@/lib/account";
import { after } from "next/server";
import { reportSaleToNeo } from "@/lib/neo";
import { noteSale } from "@/lib/sales";
import { getOrder, type Order } from "@/lib/orders";
import { copyFor } from "../../copy";
import { funnel, unlocked } from "../../funnel";
import { isLang, paths } from "../../i18n";
import { PurchasePixel } from "../../Tracking";
import { AB } from "../../abtest";
import { Beacon } from "../../../Beacon";
import { Clarity } from "../../../Clarity";
import t from "../../thanks.module.css";

// The thank-you page, in the look of ClickFunnels' (thank-you-midi-drum-kit-ad):
// "Thank you! You're in.", the products, and a download button for each
// thing bought: the kit, its add-ons and the one-click upsells. proxy.ts
// rewrites /midi-drum-kit/thank-you and /<lang>/midi-drum-kit/thank-you here.
export const dynamic = "force-dynamic";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-poppins" });

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: copyFor(lang).meta.thanksTitle, robots: { index: false, follow: false } };
}

const LABELS: Record<string, string> = {
  pack: `${funnel.product} Bundle`,
  ...Object.fromEntries(funnel.bumps.map((b) => [b.id, b.name])),
  ...Object.fromEntries(funnel.offers.map((o) => [o.id, o.name])),
  ...funnel.fileNames,
};

// Stripe sends the buyer here with ?payment_intent=pi_…, PayPal's return with
// ?paypal_order=…; the upsell pages add u=<upsell orders>. We ask the
// provider about every one; the URL proves nothing.
export default async function ThankYou({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ payment_intent?: string; paypal_order?: string; u?: string; preview?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const c = copyFor(lang).thanks;
  const { payment_intent, paypal_order, u, preview } = await searchParams;
  // The names dashboard → Products gives the add-ons and upsells (an added add-on too).
  const f = await resolveFunnel(funnel.slug);
  const labels: Record<string, string> = {
    ...LABELS,
    ...Object.fromEntries([...(f?.bumps ?? []), ...(f?.offers ?? [])].map((x) => [x.id, x.name])),
    ...(f && f.product !== funnel.product ? { pack: f.product } : {}),
  };
  const order = await getOrder(payment_intent ?? paypal_order, funnel.slug);
  // The dashboard's preview (?preview=1, not counted: lib/beacon.ts) with no order:
  // the page as someone who bought everything sees it, its buttons inert.
  const sample = !order && preview === "1";
  const paid = sample || order?.status === "succeeded";
  const pending = order?.status === "processing";

  // The upsells bought after this order, each checked with its provider.
  const upsells: Order[] = [];
  if (order && !order.offer) {
    const ids = [...new Set((u ?? "").split(",").filter(Boolean))].slice(0, funnel.offers.length);
    for (const up of await Promise.all(ids.map((id) => getOrder(id, funnel.slug)))) {
      if (up?.offer && up.parent === order.id && up.status === "succeeded") upsells.push(up);
    }
  }
  // Every sale also goes to neo, labelled funnnnels (lib/neo.ts).
  if (order) reportSaleToNeo(order, funnel.product);
  for (const up of upsells) reportSaleToNeo(up, labels[up.offer!] ?? up.offer!);
  // …and into our orders (the receipt email, the dashboard), after the page is sent.
  after(async () => {
    for (const o of [order, ...upsells]) await noteSale(o, funnel.slug, lang);
  });

  const downloads = sample
    ? unlocked(["pack", ...funnel.bumps.map((b) => b.id), ...funnel.offers.map((o) => o.id)]).map((key) => ({ order: "preview", key }))
    : paid && order
      ? [order, ...upsells].flatMap((o) => unlocked(o.items).map((key) => ({ order: o.id, key })))
      : [];

  return (
    <main className={`${t.page} ${poppins.variable}`} lang={lang}>
      <Beacon funnel={funnel.slug} page="thank-you" lang={lang} abCookie={AB.cookie} />
      <Clarity purchase={paid && !!order} />
      {paid && order && <PurchasePixel orderId={order.id} value={order.amount} currency={order.currency} />}
      {upsells.map((up) => (
        <PurchasePixel key={up.id} orderId={up.id} value={up.amount} currency={up.currency} />
      ))}
      <header className={t.top}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/funnels/midi-drum-kit/logo.webp" alt="GRIND STUDIO" width={900} height={103} />
      </header>

      <section className={t.card}>
        <h1 className={t.title}>{paid ? c.title : pending ? c.pending : c.failed}</h1>
        <p className={t.sub}>{paid ? c.sub : pending ? c.pendingLead : c.failedLead}</p>
        {paid && <p className={t.lead}>{c.paidLead}</p>}
        {paid && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={t.boxes} src="/funnels/midi-drum-kit/thanks-boxes.webp" alt="" width={900} height={600} />
        )}
        {downloads.length > 0 && (
          <div className={t.list}>
            {downloads.map((d) => (
              <a key={`${d.order}-${d.key}`} className={d.key === "pack" ? t.main : t.btn} href={sample ? undefined : `/${funnel.slug}/download?order=${d.order}&file=${d.key}`}>
                <svg viewBox="0 0 512 512" aria-hidden width="16" height="16">
                  <path
                    fill="currentColor"
                    d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32v242.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64v-32c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64z"
                  />
                </svg>
                {c.download} {labels[d.key] ?? d.key}
              </a>
            ))}
          </div>
        )}
        {sample && <p className={t.note}>{c.receipt("Stripe", null)}</p>}
        {paid && order && (
          <p className={t.note} data-clarity-mask="True">{c.receipt(order.provider === "paypal" ? "PayPal" : "Stripe", order.email)}</p>
        )}
        {paid && (
          <p className={t.account}>
            {c.account} <a href={ACCOUNT_URL}>{ACCOUNT_URL.replace("https://", "")}</a>
          </p>
        )}
        {!paid && !pending && (
          <a className={t.main} href={paths(lang).order}>
            {c.back}
          </a>
        )}
        <p className={t.support}>
          {c.support} <a href={`mailto:${funnel.support}`}>{funnel.support}</a>
        </p>
      </section>

      <footer className={t.footer}>
        © 2026 {funnel.brand} - <a href={funnel.legal.terms}>{copyFor(lang).footer.terms}</a> - <a href={funnel.legal.privacy}>{copyFor(lang).footer.privacy}</a> -{" "}
        <a href={funnel.legal.refund}>{copyFor(lang).footer.refund}</a> - <b>{copyFor(lang).footer.contact}</b> {funnel.support}
      </footer>
    </main>
  );
}
