import { createHash, createHmac } from "node:crypto";

// Email through Amazon SES (the user's pick: pay per email, ≈$0.10 per 1,000),
// with the v2 API's SendEmail, signed with AWS SigV4 like lib/r2.ts: no SDK.
//
// Env: SES_REGION (e.g. eu-west-1), SES_ACCESS_KEY_ID, SES_SECRET_ACCESS_KEY
// (an IAM user allowed ses:SendEmail only), EMAIL_FROM (an address on the
// domain verified in SES, e.g. "Grind Studio <hello@thegrind.studio>").
// Vercel keeps the AWS_* names for itself, hence SES_*.
//
// Off production (next dev, previews) no email reaches a buyer: it goes to
// EMAIL_TEST_TO, or nowhere if that isn't set.

const PRODUCTION = process.env.VERCEL_ENV === "production";
export const SUPPORT = "support@thegrind.studio";

export function sesConfigured(): boolean {
  return Boolean(process.env.SES_REGION && process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY && process.env.EMAIL_FROM);
}

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  // Extra headers, e.g. List-Unsubscribe on the newsletter (lib/mail.ts).
  headers?: Record<string, string>;
};
export type Sent = { id: string; to: string } | { skipped: string };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (key: Buffer | string, s: string) => createHmac("sha256", key).update(s).digest();

export async function sendEmail(email: Email): Promise<Sent> {
  if (!sesConfigured()) return { skipped: "SES is not set up (SES_* and EMAIL_FROM)" };
  let { to, subject } = email;
  if (!PRODUCTION) {
    const test = process.env.EMAIL_TEST_TO;
    if (!test) return { skipped: `not production and EMAIL_TEST_TO unset (would go to ${to})` };
    subject = `[test → ${to}] ${subject}`;
    to = test;
  }

  const region = process.env.SES_REGION!;
  const host = `email.${region}.amazonaws.com`;
  const path = "/v2/email/outbound-emails";
  const body = JSON.stringify({
    FromEmailAddress: process.env.EMAIL_FROM,
    Destination: { ToAddresses: [to] },
    ReplyToAddresses: [SUPPORT],
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: email.html, Charset: "UTF-8" }, Text: { Data: email.text, Charset: "UTF-8" } },
        ...(email.headers ? { Headers: Object.entries(email.headers).map(([Name, Value]) => ({ Name, Value })) } : {}),
      },
    },
  });

  const amzDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // 20261021T120000Z
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${region}/ses/aws4_request`;
  const headers = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signed = "content-type;host;x-amz-date";
  const request = ["POST", path, "", headers, signed, sha256(body)].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(request)].join("\n");
  const key = [region, "ses", "aws4_request"].reduce<Buffer>((k, part) => hmac(k, part), hmac(`AWS4${process.env.SES_SECRET_ACCESS_KEY}`, day));
  const signature = createHmac("sha256", key).update(toSign).digest("hex");

  const res = await fetch(`https://${host}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=${process.env.SES_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,
    },
    body,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new SesError(res.status, String(json.__type ?? json.code ?? ""), `SES ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return { id: json.MessageId, to };
}

export class SesError extends Error {
  constructor(
    readonly status: number,
    readonly type: string,
    message: string,
  ) {
    super(message);
  }
  /** Sending faster than the account's rate, or over its daily quota: stop for now, try later. */
  get throttled() {
    return this.status === 429 || /TooManyRequests|LimitExceeded|Throttl/i.test(this.type + this.message);
  }
  /** SES is still in its sandbox: only verified addresses can receive. */
  get sandbox() {
    return /not verified/i.test(this.message);
  }
}
