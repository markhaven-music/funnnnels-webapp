// The buyer's IP and browser at checkout, kept with the order (Stripe
// metadata, paypal_orders) and sent to neo with the sale (lib/neo.ts). When
// the buyer's browser drops neo's ft_vid cookie (a fresh id on every page),
// neo still finds their clicks by this pair: same IP, same user agent.
// Recorded when the order is created, the only moment the buyer's own request
// is at hand: the Stripe webhook and the sales sweep report sales without it.

export type BuyerDevice = { ip: string; ua: string };

export function buyerDevice(h: Headers): BuyerDevice {
  // Vercel's own header first: through the m.thegrind.studio rewrite it still
  // names the visitor, as x-forwarded-for's first hop does on a direct request.
  const ip = (h.get("x-vercel-forwarded-for") ?? h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "")
    .split(",")[0]
    .trim()
    .slice(0, 64);
  // Stripe metadata values stop at 500 characters.
  const ua = (h.get("user-agent") ?? "").slice(0, 490);
  return { ip, ua };
}
