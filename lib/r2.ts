import { createHash, createHmac } from "node:crypto";

// Cloudflare R2 for downloads too big to ship inside the deployment (the
// Jazz bonuses: the Chord Progressions Bible alone is ~1 GB). Objects stay
// private; a paid buyer gets a presigned link that works for a few minutes.
// Signed with AWS SigV4 (R2 speaks the S3 API) using node:crypto, no SDK.
//
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.

export function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET,
  );
}

// RFC 3986, as SigV4 wants it (encodeURIComponent leaves !'()* alone).
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (key: Buffer | string, s: string) => createHmac("sha256", key).update(s).digest();

/** A GET link to `key` in the bucket, valid for `seconds`, that downloads as `filename`. */
export function presignedDownload(key: string, filename: string, seconds = 600): string {
  const account = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET!;
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secret = process.env.R2_SECRET_ACCESS_KEY!;

  const host = `${account}.r2.cloudflarestorage.com`;
  const path = `/${enc(bucket)}/${key.split("/").map(enc).join("/")}`;
  const amzDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // 20261016T120000Z
  const day = amzDate.slice(0, 8);
  const scope = `${day}/auto/s3/aws4_request`;

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKey}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(seconds),
    "X-Amz-SignedHeaders": "host",
    "response-content-disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
  };
  const query = Object.keys(params)
    .sort()
    .map((k) => `${enc(k)}=${enc(params[k])}`)
    .join("&");

  const request = ["GET", path, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(request)].join("\n");
  const signingKey = ["auto", "s3", "aws4_request"].reduce<Buffer>((k, part) => hmac(k, part), hmac(`AWS4${secret}`, day));
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");

  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`;
}
