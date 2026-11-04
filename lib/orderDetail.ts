import type Stripe from "stripe";
import { resolveFunnel } from "@/lib/funnels";
import { paypal, paypalConfigured } from "@/lib/paypal";
import { ordersByEmail, toOrderRow as toRow, type OrderRow } from "@/lib/sales";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// Dashboard → Orders → one order: everything known about it, from
//   · the `orders` row (lib/sales.ts) and the orders around it (its upsells,
//     the order it followed, the buyer's other orders);
//   · the payment itself, asked live from Stripe or PayPal (method, fee, net,
//     refunds, disputes, risk);
//   · neo's tables (same Supabase project since 11-03): which click sold it,
//     the ad's names, the visitor's device and their visits before buying;
//   · the email side: receipt, backup and every email sent to the buyer, each
//     with when it was opened (email_opens) and clicked (email_clicks), and
//     the one Email → Insights credits (5 days, a click before a receipt);
//   · the contact, the checkout start, the support conversation, the
//     customer-library logins and any ClickFunnels purchase before.
// Each part is read on its own: one that fails is left out, with why, and the
// rest still shows.

const DAY = 86_400_000;
const CREDIT_DAYS = 5; // as Email → Insights (db/email-insights.sql)

export type Line = { key: string; name: string };

export type Payment = {
  status: string;
  method: string; // "Visa •••• 4242 · Apple Pay", "PayPal (verified)"
  payer: { name: string | null; email: string | null; country: string | null; address: string | null };
  feeCents: number | null;
  netCents: number | null;
  settledCurrency: string | null; // the account's currency the fee and net are in
  refundedCents: number;
  disputed: boolean;
  risk: string | null; // Stripe Radar: "normal (12)"
  checks: string | null; // card CVC / postcode checks
  network: string | null; // Stripe outcome's seller message
  receiptUrl: string | null;
  dashboardUrl: string;
  captureId: string | null;
  metadata: Record<string, string>;
};

export type Click = {
  at: string;
  page: string;
  referrer: string;
  source: string; // utm_source / channel
  campaign: string;
  content: string;
  device: string;
};

export type Attribution = {
  channel: string | null;
  method: string | null; // neo's attribution: cookie, email, …
  organic: string | null;
  campaign: string | null;
  adset: string | null;
  ad: string | null;
  adId: string | null;
  utm: Record<string, string>;
  landing: string | null;
  referrer: string | null;
  device: string | null;
  country: string | null;
  firstClickAt: string | null;
  firstMetaAd: string | null; // when the first Meta click was another ad
  visits: Click[]; // every click from this visitor up to the order, oldest first
};

/** One email to the buyer, with what they did with it. */
export type EmailEvent = {
  at: string;
  kind: string;
  ref: string;
  what: string;
  status: "sent" | "failed" | "not sent"; // "not sent": an open or click of an email older than the list
  detail?: string;
  // Opens of it: the first one, and the first by a person (not Apple's proxy or a scanner).
  opened?: { at: string; count: number; byPerson: string | null; machine: "apple" | "scanner" | null };
  clicked?: { at: string; count: number; links: string[] };
};

export type OrderDetail = {
  order: OrderRow & { status: string; waiver: boolean; updatedAt: string | null; backupSentAt: string | null; emailAttempts: number };
  product: string;
  lines: Line[];
  parent: OrderRow | null;
  upsells: OrderRow[];
  otherOrders: OrderRow[];
  legacy: { product: string; source: string; at: string | null }[];
  payment: Payment | null;
  attribution: Attribution | null;
  contact: { status: string; source: string | null; tags: string[]; since: string; lang: string | null } | null;
  checkoutStart: { at: string; reminderSentAt: string | null } | null;
  emails: EmailEvent[];
  credited: { what: string; how: "click" | "received"; at: string } | null;
  support: { messages: number; last: string | null; done: boolean } | null;
  libraryLogin: string | null;
  missing: string[]; // the parts that couldn't be read, and why
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const db = supabase();
  const { data: r, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!r) return null;

  const missing: string[] = [];
  const part = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      console.error(`order ${id}: ${label}`, err);
      missing.push(`${label}: ${err instanceof Error ? err.message.slice(0, 160) : String(err)}`);
      return fallback;
    }
  };

  const row = toRow(r);
  const email: string | null = row.email;

  const [funnel, payment, attribution, related, emails, extra] = await Promise.all([
    part("product", () => resolveFunnel(row.funnel), undefined),
    part(row.provider === "paypal" ? "PayPal" : "Stripe", () => (row.provider === "paypal" ? paypalPayment(id) : stripePayment(id)), null),
    part("source (neo)", () => neoAttribution(id, row.createdAt), null),
    part("related orders", () => relatedOrders(row), { parent: null, upsells: [], others: [] as OrderRow[] }),
    part("emails", () => (email ? emailHistory(email) : Promise.resolve(NO_HISTORY)), NO_HISTORY),
    part("buyer", () => buyerExtras(email, row.funnel), { contact: null, checkoutStart: null, support: null, libraryLogin: null, legacy: [] }),
  ]);

  const lines: Line[] = row.items.map((key) => {
    if (row.offer) return { key, name: funnel?.offers?.find((o) => o.id === key)?.name ?? key };
    if (key === "pack") return { key, name: funnel?.product ?? row.funnel };
    const bump = (funnel?.bumps ?? (funnel?.bump ? [funnel.bump] : [])).find((b) => b.id === key);
    return { key, name: bump?.name ?? key };
  });

  // Email → Insights' rule: the last email clicked in the 5 days before the
  // order (or before the order it followed), else the last one received.
  const at = Date.parse(related.parent?.createdAt ?? row.createdAt);
  const inWindow = (iso: string) => Date.parse(iso) <= at && Date.parse(iso) > at - CREDIT_DAYS * DAY;
  const click = emails.clicks.find((k) => SELLING.has(k.kind) && inWindow(k.created_at));
  const received = emails.sends.find((e) => e.status === "sent" && SELLING.has(e.kind) && inWindow(e.at));
  const credited = click
    ? { what: emails.what(click.kind, click.ref), how: "click" as const, at: click.created_at }
    : received
      ? { what: received.what, how: "received" as const, at: received.at }
      : null;

  // The receipt and the backup, from the order row itself (they aren't in
  // email_sends). Their ref is the id of the order they were sent for: this
  // one, or for an upsell sent along with its order, that order.
  const own: EmailEvent[] = [];
  const mailRef = row.parent && related.parent?.emailSentAt === row.emailSentAt ? row.parent : row.id;
  if (row.emailSentAt) own.push({ at: row.emailSentAt, kind: "receipt", ref: mailRef, what: "Order receipt", status: "sent" });
  else if (row.emailError) own.push({ at: r.updated_at ?? row.createdAt, kind: "receipt", ref: mailRef, what: "Order receipt", status: "failed", detail: `${row.emailError} (${r.email_attempts ?? 0} attempts)` });
  if (r.backup_sent_at) own.push({ at: r.backup_sent_at, kind: "backup", ref: mailRef, what: "Backup download email", status: "sent" });

  return {
    order: { ...row, status: r.status, waiver: Boolean(r.withdrawal_waiver), updatedAt: r.updated_at ?? null, backupSentAt: r.backup_sent_at ?? null, emailAttempts: r.email_attempts ?? 0 },
    product: funnel?.product ?? row.funnel,
    lines,
    parent: related.parent,
    upsells: related.upsells,
    otherOrders: related.others,
    legacy: extra.legacy,
    payment,
    attribution,
    contact: extra.contact,
    checkoutStart: extra.checkoutStart,
    emails: withActivity([...own, ...emails.sends], emails),
    credited,
    support: extra.support,
    libraryLogin: extra.libraryLogin,
    missing,
  };
}

// ─── payment ───────────────────────────────────────────────────────

async function stripePayment(id: string): Promise<Payment | null> {
  if (!stripeConfigured()) throw new Error("Stripe keys are not set");
  const intent = await stripe().paymentIntents.retrieve(id, { expand: ["latest_charge.balance_transaction"] });
  const charge = (typeof intent.latest_charge === "object" ? intent.latest_charge : null) as Stripe.Charge | null;
  const bt = (charge && typeof charge.balance_transaction === "object" ? charge.balance_transaction : null) as Stripe.BalanceTransaction | null;
  const pm = charge?.payment_method_details;
  const card = pm?.card;
  const wallet = card?.wallet?.type ? ` · ${WALLETS[card.wallet.type] ?? card.wallet.type}` : "";
  const method = card
    ? `${cap(card.brand ?? "card")} •••• ${card.last4}${card.funding && card.funding !== "credit" ? ` (${card.funding})` : ""}${wallet}`
    : pm?.type
      ? cap(pm.type.replace(/_/g, " "))
      : "—";
  const addr = charge?.billing_details?.address;
  const checks = card?.checks
    ? [card.checks.cvc_check && `CVC ${card.checks.cvc_check}`, card.checks.address_postal_code_check && `postcode ${card.checks.address_postal_code_check}`].filter(Boolean).join(", ") || null
    : null;
  return {
    status: intent.status,
    method,
    payer: {
      name: charge?.billing_details?.name ?? null,
      email: charge?.billing_details?.email ?? intent.receipt_email ?? null,
      country: card?.country ? `card from ${card.country}` : null,
      address: addr ? [addr.line1, addr.postal_code, addr.city, addr.state, addr.country].filter(Boolean).join(", ") || null : null,
    },
    feeCents: bt?.fee ?? null,
    netCents: bt?.net ?? null,
    settledCurrency: bt?.currency ?? null,
    refundedCents: charge?.amount_refunded ?? 0,
    disputed: Boolean(charge?.disputed),
    risk: charge?.outcome?.risk_level ? `${charge.outcome.risk_level}${charge.outcome.risk_score != null ? ` (${charge.outcome.risk_score}/100)` : ""}` : null,
    checks,
    network: charge?.outcome?.seller_message ?? null,
    receiptUrl: charge?.receipt_url ?? null,
    dashboardUrl: `https://dashboard.stripe.com/payments/${id}`,
    captureId: charge?.id ?? null,
    metadata: { ...intent.metadata },
  };
}

const WALLETS: Record<string, string> = { apple_pay: "Apple Pay", google_pay: "Google Pay", link: "Link", samsung_pay: "Samsung Pay" };

type PayPalFull = {
  status: string;
  payer?: { email_address?: string; payer_id?: string; name?: { given_name?: string; surname?: string }; address?: { country_code?: string } };
  payment_source?: { paypal?: { account_status?: string; email_address?: string; address?: { country_code?: string } } };
  purchase_units: {
    custom_id?: string;
    shipping?: { address?: { address_line_1?: string; admin_area_2?: string; postal_code?: string; country_code?: string } };
    payments?: {
      captures?: {
        id: string;
        status: string;
        seller_protection?: { status?: string };
        seller_receivable_breakdown?: { paypal_fee?: { value: string; currency_code: string }; net_amount?: { value: string; currency_code: string } };
      }[];
      refunds?: { amount?: { value: string } ; status: string }[];
    };
  }[];
};

async function paypalPayment(id: string): Promise<Payment | null> {
  if (!paypalConfigured()) throw new Error("PayPal keys are not set");
  const o = await paypal<PayPalFull>(`/v2/checkout/orders/${encodeURIComponent(id)}`);
  const unit = o.purchase_units[0];
  const cap0 = unit?.payments?.captures?.[0];
  const br = cap0?.seller_receivable_breakdown;
  const cents = (v?: string) => (v ? Math.round(Number(v) * 100) : null);
  const refunded = (unit?.payments?.refunds ?? []).filter((x) => x.status !== "CANCELLED").reduce((n, x) => n + (cents(x.amount?.value) ?? 0), 0);
  const status = o.payment_source?.paypal?.account_status;
  const ship = unit?.shipping?.address;
  return {
    status: cap0?.status?.toLowerCase() ?? o.status.toLowerCase(),
    method: `PayPal${status ? ` (${status.toLowerCase()})` : ""}`,
    payer: {
      name: [o.payer?.name?.given_name, o.payer?.name?.surname].filter(Boolean).join(" ") || null,
      email: o.payer?.email_address ?? o.payment_source?.paypal?.email_address ?? null,
      country: o.payer?.address?.country_code ?? o.payment_source?.paypal?.address?.country_code ?? null,
      address: ship ? [ship.address_line_1, ship.postal_code, ship.admin_area_2, ship.country_code].filter(Boolean).join(", ") || null : null,
    },
    feeCents: cents(br?.paypal_fee?.value),
    netCents: cents(br?.net_amount?.value),
    settledCurrency: br?.net_amount?.currency_code?.toLowerCase() ?? br?.paypal_fee?.currency_code?.toLowerCase() ?? null,
    refundedCents: refunded,
    disputed: false,
    risk: cap0?.seller_protection?.status ? `seller protection: ${cap0.seller_protection.status.toLowerCase().replace(/_/g, " ")}` : null,
    checks: null,
    network: null,
    receiptUrl: null,
    dashboardUrl: cap0 ? `https://www.paypal.com/activity/payment/${cap0.id}` : "https://www.paypal.com/myaccount/transactions",
    captureId: cap0?.id ?? null,
    metadata: { ...(unit?.custom_id ? { custom_id: unit.custom_id } : {}), ...(o.payer?.payer_id ? { payer_id: o.payer.payer_id } : {}) },
  };
}

// ─── source (neo) ──────────────────────────────────────────────────

async function neoAttribution(id: string, createdAt: string): Promise<Attribution | null> {
  const db = supabase();
  const { data: c, error } = await db.from("conversions").select("*").eq("order_id", id).limit(1).maybeSingle();
  if (error) throw error;
  if (!c) return null;

  const clickIds = [c.converting_click_id, c.first_meta_click_id].filter(Boolean);
  const [{ data: clicks }, { data: visits }] = await Promise.all([
    clickIds.length ? db.from("clicks").select("*").in("id", clickIds) : Promise.resolve({ data: [] as Row[] }),
    c.visitor_id
      ? db.from("clicks").select("created_at, page_url, referrer, utm_source, utm_campaign, utm_content, channel, device, os, is_bot").eq("visitor_id", c.visitor_id).lte("created_at", new Date(Date.parse(createdAt) + 60_000).toISOString()).order("created_at", { ascending: true }).limit(60)
      : Promise.resolve({ data: [] as Row[] }),
  ]);
  const conv: Row = (clicks ?? []).find((k: Row) => k.id === c.converting_click_id) ?? null;
  const first: Row = (clicks ?? []).find((k: Row) => k.id === c.first_meta_click_id) ?? null;

  const adIds = [conv?.ad_id, first?.ad_id].filter(Boolean);
  const { data: names } = adIds.length ? await db.from("meta_ad_names").select("*").in("ad_id", adIds) : { data: [] as Row[] };
  const nameOf = (adId: string | null) => (names ?? []).find((n: Row) => n.ad_id === adId) ?? null;
  const n = nameOf(conv?.ad_id ?? null);

  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) if (conv?.[k]) utm[k.slice(4)] = conv[k];
  const fn = first && first.ad_id && first.ad_id !== conv?.ad_id ? (nameOf(first.ad_id)?.ad_name ?? first.utm_content ?? first.ad_id) : null;

  const visitRows = (visits ?? []).filter((v: Row) => !v.is_bot);
  return {
    channel: c.converting_channel ?? conv?.channel ?? null,
    method: c.attribution ?? null,
    organic: c.organic_source ?? null,
    campaign: n?.campaign_name ?? conv?.utm_campaign ?? null,
    adset: n?.adset_name ?? conv?.utm_term ?? null,
    ad: n?.ad_name ?? conv?.utm_content ?? null,
    adId: conv?.ad_id ?? null,
    utm,
    landing: conv?.page_url ? stripQuery(conv.page_url) : null,
    referrer: conv?.referrer ? stripQuery(conv.referrer) : null,
    device: conv ? [conv.device, conv.os, conv.browser].filter(Boolean).join(" · ") || null : null,
    country: conv?.country ?? null,
    firstClickAt: visitRows[0]?.created_at ?? conv?.created_at ?? null,
    firstMetaAd: fn,
    visits: visitRows.map((v: Row) => ({
      at: v.created_at,
      page: stripQuery(v.page_url ?? ""),
      referrer: v.referrer ? stripQuery(v.referrer) : "",
      source: v.utm_source || v.channel || "",
      campaign: v.utm_campaign ?? "",
      content: v.utm_content ?? "",
      device: [v.device, v.os].filter(Boolean).join(" · "),
    })),
  };
}

/** A page address without its query (fbclid and the like): host + path. */
function stripQuery(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

// ─── orders around it ──────────────────────────────────────────────

async function relatedOrders(row: OrderRow): Promise<{ parent: OrderRow | null; upsells: OrderRow[]; others: OrderRow[] }> {
  const db = supabase();
  const [{ data: kids, error }, parentRows, mine] = await Promise.all([
    db.from("orders").select("*").eq("parent", row.id).order("created_at", { ascending: true }),
    row.parent ? db.from("orders").select("*").eq("id", row.parent).limit(1) : Promise.resolve({ data: [] as Row[] }),
    row.email ? ordersByEmail(row.email) : Promise.resolve([] as OrderRow[]),
  ]);
  if (error) throw error;
  const upsells = (kids ?? []).map(toRow);
  const parent = parentRows.data?.[0] ? toRow(parentRows.data[0]) : null;
  const near = new Set([row.id, parent?.id, ...upsells.map((u) => u.id)]);
  // The rest of this buyer's orders: not this one's own chain.
  return { parent, upsells, others: mine.filter((o) => !near.has(o.id) && !(o.parent && near.has(o.parent))) };
}

// ─── emails ────────────────────────────────────────────────────────

const SELLING = new Set(["broadcast", "launch", "sequence", "reminder"]);

type History = { sends: EmailEvent[]; clicks: Row[]; opens: Row[]; what: (kind: string, ref: string) => string };
const NO_HISTORY: History = { sends: [], clicks: [], opens: [], what: (k) => k };

async function emailHistory(email: string): Promise<History> {
  const db = supabase();
  const [sends, clicks, opens] = await Promise.all([
    db.from("email_sends").select("kind, ref, status, error, created_at").eq("email", email).order("created_at", { ascending: false }).limit(60),
    db.from("email_clicks").select("kind, ref, url, created_at").eq("email", email).order("created_at", { ascending: false }).limit(200),
    db.from("email_opens").select("kind, ref, machine, created_at").eq("email", email).order("created_at", { ascending: false }).limit(300),
  ]);
  if (sends.error) throw sends.error;
  if (clicks.error) throw clicks.error;
  if (opens.error) throw opens.error;
  const names = await emailNames([...(sends.data ?? []), ...(clicks.data ?? []), ...(opens.data ?? [])]);
  const what = (kind: string, ref: string) =>
    names.get(`${kind}:${ref}`) ?? reminderName(kind, ref) ?? (kind === "receipt" ? "Order receipt" : kind === "backup" ? "Backup download email" : `${kind} ${ref.slice(0, 8)}`);
  return {
    sends: (sends.data ?? []).map((x: Row) => ({ at: x.created_at, kind: x.kind, ref: x.ref, what: what(x.kind, x.ref), status: x.status === "failed" ? "failed" : "sent", detail: x.error ?? undefined })),
    clicks: clicks.data ?? [],
    opens: opens.data ?? [],
    what,
  };
}

/** Each email with its opens and clicks; one opened or clicked but older than the list gets a row of its own. Newest first. */
function withActivity(mails: EmailEvent[], h: History): EmailEvent[] {
  const key = (kind: string, ref: string) => `${kind}:${ref}`;
  const rows = new Map(mails.map((m) => [key(m.kind, m.ref), { ...m }]));
  const row = (kind: string, ref: string, at: string) => {
    const k = key(kind, ref);
    if (!rows.has(k)) rows.set(k, { at, kind, ref, what: h.what(kind, ref), status: "not sent" });
    return rows.get(k)!;
  };
  // Oldest first, so "at" is the first open or click. Loads of the image
  // under a minute apart (a mail app fetching it twice) are one open.
  const lastOpen = new Map<string, number>();
  for (const o of [...h.opens].reverse()) {
    const m = row(o.kind, o.ref, o.created_at);
    if (!m.opened) m.opened = { at: o.created_at, count: 0, byPerson: null, machine: o.machine ?? null };
    const k = key(o.kind, o.ref);
    const t = Date.parse(o.created_at);
    if (t - (lastOpen.get(k) ?? -Infinity) >= 60_000) m.opened.count++;
    lastOpen.set(k, t);
    if (!o.machine && !m.opened.byPerson) m.opened.byPerson = o.created_at;
    if (!o.machine) m.opened.machine = null;
  }
  for (const c of [...h.clicks].reverse()) {
    const m = row(c.kind, c.ref, c.created_at);
    if (!m.clicked) m.clicked = { at: c.created_at, count: 0, links: [] };
    m.clicked.count++;
    const link = stripQuery(c.url);
    if (!m.clicked.links.includes(link)) m.clicked.links.push(link);
  }
  return [...rows.values()].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

function reminderName(kind: string, ref: string): string | null {
  if (kind !== "reminder") return null;
  const [funnel, n] = ref.split("/");
  return `Abandoned checkout reminder ${n ?? 1} · ${funnel}`;
}

/** Subjects for the emails' refs: broadcast id, launch email id, sequence step id. */
async function emailNames(rows: Row[]): Promise<Map<string, string>> {
  const db = supabase();
  const ids = (kind: string) => [...new Set(rows.filter((r) => r.kind === kind).map((r) => r.ref))].filter((x) => /^[0-9a-f-]{36}$/.test(x));
  const [b, l, s] = await Promise.all([
    ids("broadcast").length ? db.from("broadcasts").select("id, subject").in("id", ids("broadcast")) : Promise.resolve({ data: [] as Row[] }),
    ids("launch").length ? db.from("launch_emails").select("id, subject").in("id", ids("launch")) : Promise.resolve({ data: [] as Row[] }),
    ids("sequence").length ? db.from("sequence_steps").select("id, subject, position, sequences(name)").in("id", ids("sequence")) : Promise.resolve({ data: [] as Row[] }),
  ]);
  const map = new Map<string, string>();
  for (const x of b.data ?? []) map.set(`broadcast:${x.id}`, x.subject || "Broadcast");
  for (const x of l.data ?? []) map.set(`launch:${x.id}`, x.subject || "Launch email");
  for (const x of s.data ?? []) map.set(`sequence:${x.id}`, `${x.subject || "Sequence email"}${x.sequences?.name ? ` · ${x.sequences.name} #${x.position + 1}` : ""}`);
  return map;
}

// ─── the buyer ─────────────────────────────────────────────────────

async function buyerExtras(email: string | null, funnel: string) {
  const empty = { contact: null, checkoutStart: null, support: null, libraryLogin: null, legacy: [] as OrderDetail["legacy"] };
  if (!email) return empty;
  const db = supabase();
  const [contact, start, msgs, thread, login, legacy] = await Promise.all([
    db.from("contacts").select("status, source, tags, created_at, lang").eq("email", email).maybeSingle(),
    db.from("checkout_starts").select("started_at, reminder_sent_at").eq("funnel", funnel).eq("email", email).maybeSingle(),
    db.from("support_messages").select("sent_at", { count: "exact" }).eq("customer", email).order("sent_at", { ascending: false }).limit(1),
    db.from("support_threads").select("done_at").eq("customer", email).maybeSingle(),
    db.from("account_logins").select("sent_at").eq("email", email).maybeSingle(),
    db.from("legacy_purchases").select("product, source, bought_at").eq("email", email).order("bought_at", { ascending: false }).limit(50),
  ]);
  return {
    contact: contact.data ? { status: contact.data.status, source: contact.data.source, tags: contact.data.tags ?? [], since: contact.data.created_at, lang: contact.data.lang } : null,
    checkoutStart: start.data ? { at: start.data.started_at, reminderSentAt: start.data.reminder_sent_at } : null,
    support: msgs.count ? { messages: msgs.count, last: msgs.data?.[0]?.sent_at ?? null, done: Boolean(thread.data?.done_at) } : null,
    libraryLogin: login.data?.sent_at ?? null,
    legacy: (legacy.data ?? []).map((x: Row) => ({ product: x.product, source: x.source, at: x.bought_at })),
  };
}

// ─── shared ────────────────────────────────────────────────────────

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
