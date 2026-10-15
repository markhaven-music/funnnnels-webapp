// Server-side PayPal (Orders v2 REST API), next to Stripe rather than through
// it: Stripe only offers PayPal to European accounts, and ours is a US LLC.
// Sandbox unless PAYPAL_ENV=live, so test keys can never move real money and
// live keys without the flag fail loudly instead of half-working.

const BASE =
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export function paypalConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/** PayPal order ids look like "5O190127TN364715T". */
export function isPayPalOrderId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Z0-9]{10,24}$/.test(id);
}

/** Cents → PayPal's "36.00". */
export function paypalValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

export type PayPalOrder = {
  id: string;
  status: string; // "CREATED" | "APPROVED" | "COMPLETED" | …
  payer?: { email_address?: string };
  purchase_units: {
    custom_id?: string;
    amount: { currency_code: string; value: string };
    payments?: {
      captures?: { id: string; status: string; amount: { currency_code: string; value: string } }[];
    };
  }[];
};

export class PayPalError extends Error {
  constructor(
    readonly status: number,
    readonly issue: string | undefined,
    body: unknown,
  ) {
    super(`PayPal ${status}${issue ? ` ${issue}` : ""}: ${JSON.stringify(body).slice(0, 500)}`);
  }
}

let token: { value: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now()) return token.value;
  const id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal keys are not set");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PayPalError(res.status, json.error, json);
  // Renew a minute early so a token never expires mid-request.
  token = { value: json.access_token, expires: Date.now() + (json.expires_in - 60) * 1000 };
  return token.value;
}

export async function paypal<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${await accessToken()}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new PayPalError(res.status, json.details?.[0]?.issue ?? json.name, json);
  return json as T;
}
