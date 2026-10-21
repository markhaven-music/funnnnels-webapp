// Who is not a buyer: the visitor count (/api/checkout/view) and the checkout
// lead (/api/checkout/lead) skip these requests, so Meta's ad review and
// link-preview crawlers don't inflate dashboard → Analytics.
//
// Signals, each one a real browser never shows:
//   ua        a crawler's user agent (Meta's, Google's, headless Chrome, scripts)
//   meta-ip   an address of Meta's own network (AS32934): its ad reviewers run
//             a full browser there, sometimes with an ordinary Chrome user agent.
//             Buyers tapping an ad come from their carrier or Wi-Fi, never these.
//   no-lang   no Accept-Language header, which every real browser sends
//   webdriver navigator.webdriver, set by the beacon (automated browsers)

const UA = new RegExp(
  [
    "bot\\b", "bot/", "crawl", "spider", "slurp", "preview", "scanner", "monitor",
    "facebookexternalhit", "facebookcatalog", "meta-externalagent", "meta-externalfetcher",
    "headless", "phantomjs", "puppeteer", "playwright", "selenium", "lighthouse", "chrome-lighthouse",
    "pagespeed", "gtmetrix", "pingdom", "uptime", "curl/", "wget/", "python-", "python/",
    "go-http-client", "node-fetch", "axios/", "okhttp", "java/", "libwww", "httpclient",
  ].join("|"),
  "i",
);

// Meta's IPv4 blocks (AS32934), as announced.
const META_V4 = [
  "31.13.24.0/21", "31.13.64.0/18", "45.64.40.0/22", "57.141.0.0/16", "57.144.0.0/14",
  "66.220.144.0/20", "69.63.176.0/20", "69.171.224.0/19", "74.119.76.0/22", "102.132.96.0/20",
  "103.4.96.0/22", "129.134.0.0/16", "147.75.208.0/20", "157.240.0.0/16", "163.70.128.0/17",
  "173.252.64.0/18", "179.60.192.0/22", "185.60.216.0/22", "185.89.216.0/22", "204.15.20.0/22",
].map((cidr) => {
  const [ip, bits] = cidr.split("/");
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return [(v4(ip)! & mask) >>> 0, mask] as const;
});
// … and IPv6, as hex prefixes of the full address.
const META_V6 = ["2a032880", "262000001c", "2401db00"];

function v4(ip: string): number | undefined {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return undefined;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** The full IPv6 address as 32 hex digits, or undefined. */
function v6(ip: string): string | undefined {
  if (!ip.includes(":") || ip.includes(".")) return undefined;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const a = head ? head.split(":") : [];
  const b = ip.includes("::") ? (tail ? tail.split(":") : []) : [];
  const fill = ip.includes("::") ? 8 - a.length - b.length : 0;
  const groups = [...a, ...Array(Math.max(fill, 0)).fill("0"), ...b];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return undefined;
  return groups.map((g) => g.padStart(4, "0")).join("");
}

export function isMetaIp(ip: string): boolean {
  const n = v4(ip);
  if (n !== undefined) return META_V4.some(([net, mask]) => ((n & mask) >>> 0) === net);
  const hex = v6(ip);
  return !!hex && META_V6.some((p) => hex.startsWith(p));
}

/** The client's address on Vercel: the first hop of x-forwarded-for. */
const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "").split(",")[0].trim();

export type BotReason = "ua" | "meta-ip" | "no-lang" | "webdriver";

/** Why this request is a bot, or undefined for a (probable) person. */
export function botReason(req: Request, opts: { webdriver?: boolean } = {}): BotReason | undefined {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || UA.test(ua)) return "ua";
  if (isMetaIp(clientIp(req))) return "meta-ip";
  if (!req.headers.get("accept-language")) return "no-lang";
  if (opts.webdriver) return "webdriver";
  return undefined;
}
