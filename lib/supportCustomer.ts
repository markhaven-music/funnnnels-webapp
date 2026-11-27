import { eurPer, usdToEur } from "@/lib/analytics";
import { funnelItems, type FunnelItem } from "@/lib/catalog";
import { resolveFunnel } from "@/lib/funnels";
import { supabase } from "@/lib/supabase";
import type { OrderRow } from "@/lib/sales";
import type { LegacyOrder } from "@/lib/support";

// Dashboard → Support, the card on top of a conversation: who is writing, in
// numbers you read at once (2026-11-27, "fai capire subito quanto ha speso
// metti numeri grandi"). What they spent in all (in euros, the ECB rate for
// dollars, pounds and francs), how many orders, since when, every purchase by
// its product name, and what needs a look (paid twice, refunded, not paid).

export type Purchase = {
  name: string;
  cents: number | null;
  currency: string | null;
  at: string | null;
  via: string; // Card, PayPal, ClickFunnels
  status: "paid" | "refunded" | "disputed" | "unpaid";
  ref: string | null;
};

export type CustomerCard = {
  spentEurCents: number; // paid orders only, in euros
  orders: number; // paid orders
  firstAt: string | null;
  lastAt: string | null;
  purchases: Purchase[]; // newest first
  flags: { tone: "bad" | "warn"; text: string }[];
};

export async function customerCard(email: string, orders: OrderRow[], legacy: LegacyOrder[]): Promise<CustomerCard> {
  const db = supabase();
  const [usd, per, { data: statusRows }, { data: cfRows }] = await Promise.all([
    usdToEur().catch(() => 0.92),
    eurPer().catch(() => ({ gbp: 1.17, chf: 1.06 })),
    orders.length ? db.from("orders").select("id, status").in("id", orders.map((o) => o.id)) : Promise.resolve({ data: [] as { id: string; status: string }[] }),
    // ClickFunnels orders with no product rows in legacy_purchases (a second buy of the same pack has none).
    db.from("cf_orders").select("order_number, total_collected, currency, billing_status, created_at, raw").ilike("email", email.replace(/[%_\\]/g, "\\$&")),
  ]);
  const status = new Map((statusRows ?? []).map((r) => [r.id as string, r.status as string]));
  const toEur = (cents: number, cur: string | null) =>
    cur === "usd" ? cents * usd : cur === "gbp" ? cents * per.gbp : cur === "chf" ? cents * per.chf : cents;

  // Product names, as the funnel sells them.
  const funnels = [...new Set(orders.map((o) => o.funnel))];
  const info = new Map(
    await Promise.all(
      funnels.map(async (f) => {
        const [product, items] = await Promise.all([resolveFunnel(f).catch(() => undefined), funnelItems(f).catch(() => [] as FunnelItem[])]);
        return [f, { product, items }] as const;
      }),
    ),
  );
  const nameOf = (o: OrderRow, key: string) => {
    const { product, items } = info.get(o.funnel) ?? { product: undefined, items: [] };
    if (o.offer) return product?.offers?.find((x) => x.id === key)?.name ?? items.find((i) => i.key === key)?.name ?? key;
    if (key === "pack") return product?.product ?? items.find((i) => i.key === "pack")?.name ?? o.funnel;
    const bumps = product?.bumps ?? (product?.bump ? [product.bump] : []);
    return bumps.find((b) => b.id === key)?.name ?? items.find((i) => i.key === key)?.name ?? key;
  };

  const purchases: Purchase[] = [];
  const flags: CustomerCard["flags"] = [];
  let spent = 0;
  let count = 0;
  const dates: number[] = [];

  for (const o of orders) {
    const st = status.get(o.id) ?? "succeeded";
    const paid = st === "succeeded";
    const names = o.items.map((k) => nameOf(o, k));
    purchases.push({
      name: names.join(" + ") || o.funnel,
      cents: o.amountCents,
      currency: o.currency,
      at: o.createdAt,
      via: o.provider === "paypal" ? "PayPal" : "Card",
      status: paid ? "paid" : st === "refunded" ? "refunded" : st === "disputed" ? "disputed" : "unpaid",
      ref: o.id,
    });
    if (!paid) continue;
    spent += toEur(o.amountCents, o.currency);
    count += 1;
    dates.push(Date.parse(o.createdAt));
  }
  for (const l of legacy) {
    const st = l.status ?? "paid";
    const paid = st === "paid";
    purchases.push({
      name: l.products.join(" + "),
      cents: l.amountCents,
      currency: l.currency,
      at: l.at,
      via: l.source === "clickfunnels" ? "ClickFunnels" : l.source,
      status: paid ? "paid" : st === "refunded" ? "refunded" : st === "disputed" ? "disputed" : "unpaid",
      ref: l.ref,
    });
    if (!paid) continue;
    if (l.amountCents != null) spent += toEur(l.amountCents, l.currency);
    count += 1;
    if (l.at) dates.push(Date.parse(l.at));
  }
  const legacyRefs = new Set(legacy.map((l) => l.ref).filter(Boolean));
  for (const o of cfRows ?? []) {
    const ref = String(o.order_number);
    if (legacyRefs.has(ref) || o.billing_status === "abandoned") continue;
    const paid = o.billing_status === "paid";
    const cents = Math.round(Number(o.total_collected ?? 0) * 100);
    if (!paid && cents === 0 && o.billing_status !== "refunded") continue;
    let names: string[] = [];
    try {
      const raw = typeof o.raw === "string" ? JSON.parse(o.raw) : o.raw;
      const v = typeof raw?.variant_names === "string" ? JSON.parse(raw.variant_names) : raw?.variant_names;
      if (Array.isArray(v)) names = v.map((n: string) => String(n).replace(/\s*\(\d+(?:\.\d+)?\)\s*$/, ""));
    } catch {}
    purchases.push({
      name: names.join(" + ") || `ClickFunnels order #${ref}`,
      cents,
      currency: o.currency ?? "eur",
      at: o.created_at,
      via: "ClickFunnels",
      status: paid ? "paid" : o.billing_status === "refunded" ? "refunded" : o.billing_status === "disputed" ? "disputed" : "unpaid",
      ref,
    });
    if (!paid) continue;
    spent += toEur(cents, o.currency ?? "eur");
    count += 1;
    dates.push(Date.parse(o.created_at));
  }

  purchases.sort((a, b) => (b.at ? Date.parse(b.at) : 0) - (a.at ? Date.parse(a.at) : 0));

  // The same main product paid for twice (a lost receipt, a second buy on ClickFunnels…).
  const firsts = new Map<string, number>();
  for (const p of purchases) {
    if (p.status !== "paid") continue;
    const main = p.name.split(" + ")[0].replace(/\s*\(.*\)$/, "").trim();
    firsts.set(main, (firsts.get(main) ?? 0) + 1);
  }
  for (const [main, n] of firsts) if (n > 1) flags.push({ tone: "bad", text: `Paid ${n === 2 ? "twice" : `${n} times`} for ${main}` });
  for (const p of purchases) {
    if (p.status === "refunded") flags.push({ tone: "warn", text: `Refunded: ${p.name}` });
    if (p.status === "disputed") flags.push({ tone: "bad", text: `Disputed: ${p.name}` });
  }

  return {
    spentEurCents: Math.round(spent),
    orders: count,
    firstAt: dates.length ? new Date(Math.min(...dates)).toISOString() : null,
    lastAt: dates.length ? new Date(Math.max(...dates)).toISOString() : null,
    purchases,
    flags,
  };
}
