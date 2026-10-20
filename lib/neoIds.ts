// The ids funnnnels shares with neo (lib/neo.ts), safe in the browser too.

/** The Pixel Purchase eventID: the same id neo's server-side Purchase uses, so Meta counts the sale once. */
export const purchaseEventId = (orderId: string) => `purchase_${orderId}`;

/** neo's visitor id (the ft_vid cookie its snippet sets on .thegrind.studio), if it looks like one. */
export const cleanVisitorId = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(v) ? v : "");
