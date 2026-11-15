import { supabase } from "@/lib/supabase";

// Dashboard → ClickFunnels: the orders ClickFunnels took before funnnnels,
// 2025-11-26 to 2026-11-02 (cf_orders, db/cf-orders-archive.sql: the export
// of 2026-11-04, one row per order with every column of the file in `raw`).
// ClickFunnels ended on 2026-11-15, so the table never changes: it is read
// once per server and kept. Holds names and emails: only for the dashboard
// (app/api/cf-orders, behind its password).

export type CfItem = { name: string; cents: number };
export type CfOrder = {
  id: string; // ClickFunnels' order id
  number: number;
  at: string; // ISO, UTC
  /** paid, abandoned, past-due, refunded, pending, disputed, partially-refunded */
  status: string;
  service: string;
  /** The order's total and what was collected of it, in euro cents (every order is in EUR). */
  amount: number;
  collected: number;
  funnel: string;
  name: string;
  email: string;
  country: string;
  items: CfItem[];
  /** Stripe's / PayPal's ids as ClickFunnels wrote them, for a dispute or a refund. */
  payments: string;
};

type Row = {
  id: string;
  order_number: number;
  created_at: string;
  email: string | null;
  billing_status: string | null;
  total_collected: number | string | null;
  funnel_name: string | null;
  total_amount: string | null;
  service_status: string | null;
  contact_name: string | null;
  country: string | null;
  variant_names: string | null;
  prices: string | null;
  payment_ids: string | null;
  transaction_ids: string | null;
};

const SELECT =
  "id, order_number, created_at, email, billing_status, total_collected, funnel_name, " +
  "total_amount:raw->>total_amount, service_status:raw->>service_status, contact_name:raw->>contact_name, " +
  "country:raw->>billing_address_country, variant_names:raw->>variant_names, prices:raw->>line_item_variant_prices, " +
  "payment_ids:raw->>payment_external_ids, transaction_ids:raw->>transaction_external_ids";

const cents = (v: unknown) => Math.round((Number(v) || 0) * 100);

/** The file writes its lists as JSON text: ["a", "b"]. */
function list(text: string | null): unknown[] {
  if (!text) return [];
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function order(r: Row): CfOrder {
  const prices = list(r.prices);
  const ids = [...list(r.payment_ids), ...list(r.transaction_ids)].map(String).filter(Boolean);
  return {
    id: r.id,
    number: r.order_number,
    at: new Date(r.created_at).toISOString(),
    status: r.billing_status ?? "",
    service: r.service_status ?? "",
    amount: cents(r.total_amount),
    collected: cents(r.total_collected),
    funnel: r.funnel_name ?? "",
    name: r.contact_name ?? "",
    email: r.email ?? "",
    country: r.country ?? "",
    items: list(r.variant_names).map((name, i) => ({ name: String(name), cents: cents(prices[i]) })),
    payments: [...new Set(ids)].join(", "),
  };
}

let kept: Promise<CfOrder[]> | null = null;

/** Every ClickFunnels order, oldest first. */
export function cfOrders(): Promise<CfOrder[]> {
  kept ??= load().catch((err) => {
    kept = null; // try again on the next request
    throw err;
  });
  return kept;
}

async function load(): Promise<CfOrder[]> {
  const PAGE = 1000; // the API's row limit per request
  const out: CfOrder[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase()
      .from("cf_orders")
      .select(SELECT)
      .order("order_number")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as Row[];
    out.push(...rows.map(order));
    if (rows.length < PAGE) return out;
  }
}
