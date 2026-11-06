import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SUPPORT, type Email } from "@/lib/ses";

// What every email we write is made of (the sending is lib/ses.ts, the
// schedule lib/outbox.ts):
//   - card()     the receipts and reminders: a tall card on black like the
//                funnels and the sign-in email;
//   - letter()   the newsletter, launch emails and sequences: plain like a
//                letter (lands in Primary more often than a designed one),
//                with the unsubscribe link and one-click headers;
//   - render()   the text the dashboard's editors take, turned into that letter.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ─── unsubscribe ───────────────────────────────────────────────────
// A link per address, signed so nobody can unsubscribe someone else. Served
// by funnnnels.com (a public path in proxy.ts): /unsubscribe shows the page,
// /api/email/unsubscribe takes the mail app's one-click POST (RFC 8058).
export const UNSUBSCRIBE_ORIGIN = "https://funnnnels.com";

function key(): Buffer {
  const secret = process.env.ACCOUNT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("ACCOUNT_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set");
  return createHmac("sha256", secret).update("grind-unsubscribe-v1").digest();
}

export function unsubscribeToken(email: string): string {
  const e = Buffer.from(email.toLowerCase()).toString("base64url");
  return `${e}.${createHmac("sha256", key()).update(e).digest("base64url").slice(0, 32)}`;
}

/** The email a token is for, or null if it was tampered with. */
export function readUnsubscribeToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length > 500) return null;
  const [e, sig] = token.split(".");
  if (!e || !sig) return null;
  const want = Buffer.from(createHmac("sha256", key()).update(e).digest("base64url").slice(0, 32));
  const got = Buffer.from(sig);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  return Buffer.from(e, "base64url").toString();
}

export const unsubscribeUrl = (email: string) => `${UNSUBSCRIBE_ORIGIN}/unsubscribe?t=${unsubscribeToken(email)}`;

// ─── clicks ────────────────────────────────────────────────────────
// Each link of a broadcast, sequence step, launch email or reminder goes
// through /api/checkout/go, which notes who clicked which email (email_clicks,
// db/email-insights.sql) and sends them on: what dashboard → Email → Insights
// credits orders with. Signed, so it can't send anyone anywhere else. On
// m.thegrind.studio, which forwards /api/checkout/* here: the same domain as
// the sender and the pages the links open.
export const CLICK_ORIGIN = "https://m.thegrind.studio";

/** The emails that sell: what Email → Insights counts and credits orders to. */
export type EmailKind = "broadcast" | "launch" | "sequence" | "reminder";
/** … plus the order's own emails (ref = the main order's id), tracked for dashboard → Orders only. */
export type MailKind = EmailKind | "receipt" | "backup";
export type Track = { kind: MailKind; ref: string };

const KIND_CODE: Record<MailKind, string> = { broadcast: "b", launch: "l", sequence: "s", reminder: "r", receipt: "c", backup: "k" };
const CODE_KIND = Object.fromEntries(Object.entries(KIND_CODE).map(([k, c]) => [c, k])) as Record<string, MailKind>;

const clickKey = () => createHmac("sha256", key()).update("grind-click-v1").digest();

export function clickUrl(t: Track, email: string, url: string): string {
  const p = Buffer.from(JSON.stringify([KIND_CODE[t.kind], t.ref, email.toLowerCase(), url])).toString("base64url");
  return `${CLICK_ORIGIN}/api/checkout/go?t=${p}.${createHmac("sha256", clickKey()).update(p).digest("base64url").slice(0, 32)}`;
}

/** What a click link carries, with ok=false when the signature doesn't match. */
export function readClickToken(token: unknown): { ok: boolean; kind: MailKind; ref: string; email: string; url: string } | null {
  if (typeof token !== "string" || token.length > 6000) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  let v: unknown;
  try {
    v = JSON.parse(Buffer.from(p, "base64url").toString());
  } catch {
    return null;
  }
  if (!Array.isArray(v) || v.length !== 4 || !v.every((x) => typeof x === "string")) return null;
  const [code, ref, email, url] = v as string[];
  const kind = CODE_KIND[code];
  if (!kind || !/^https?:\/\//.test(url)) return null;
  const want = Buffer.from(createHmac("sha256", clickKey()).update(p).digest("base64url").slice(0, 32));
  const got = Buffer.from(sig);
  return { ok: got.length === want.length && timingSafeEqual(got, want), kind, ref, email, url };
}

// ─── the saved cart ────────────────────────────────────────────────
// The abandoned-checkout emails promise "I've saved your cart": their link
// carries ?c=<token>, and the order page asks /api/checkout/resume for the
// name and email inside it, then opens on step 2 (payment) with them filled.
// Encrypted, not just signed: the address never sits readable in a URL that
// the page's pixels and analytics see. Good for 30 days.

const RESUME_DAYS = 30;
const resumeKey = () => createHmac("sha256", key()).update("grind-resume-v1").digest();

export function resumeToken(o: { funnel: string; email: string; name: string | null }): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", resumeKey(), iv);
  const body = Buffer.concat([c.update(JSON.stringify([o.funnel, o.email.toLowerCase(), o.name ?? "", Math.floor(Date.now() / 1000)])), c.final()]);
  return Buffer.concat([iv, body, c.getAuthTag()]).toString("base64url");
}

/** The cart a token saved, or null when it was tampered with, is for another funnel or is too old. */
export function readResumeToken(token: unknown, funnel: string): { email: string; firstName: string; lastName: string } | null {
  if (typeof token !== "string" || token.length < 40 || token.length > 600) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    const d = createDecipheriv("aes-256-gcm", resumeKey(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(raw.length - 16));
    const v = JSON.parse(Buffer.concat([d.update(raw.subarray(12, raw.length - 16)), d.final()]).toString());
    if (!Array.isArray(v) || v.length !== 4) return null;
    const [f, email, name, at] = v as [string, string, string, number];
    if (f !== funnel || typeof email !== "string" || Date.now() / 1000 - at > RESUME_DAYS * 86_400) return null;
    // The name as step 1 saved it, "first last" (app/api/checkout/lead): split back at the first space.
    const [first, ...rest] = String(name).trim().split(/\s+/);
    return { email, firstName: first ?? "", lastName: rest.join(" ") };
  } catch {
    return null;
  }
}

// ─── opens ─────────────────────────────────────────────────────────
// Every tracked email ends with an invisible 1×1 image from
// /api/checkout/open, signed like the click links: the mail app loading it
// notes the open (email_opens, db/email-opens.sql) for dashboard → Orders.
// The way every mail tool counts opens, with the same limits: Apple Mail
// loads it on delivery whether the email is read or not (marked there),
// and a reader who blocks images never shows as opened.

const openKey = () => createHmac("sha256", key()).update("grind-open-v1").digest();

export function openUrl(t: Track, email: string): string {
  const p = Buffer.from(JSON.stringify([KIND_CODE[t.kind], t.ref, email.toLowerCase()])).toString("base64url");
  return `${CLICK_ORIGIN}/api/checkout/open?t=${p}.${createHmac("sha256", openKey()).update(p).digest("base64url").slice(0, 32)}`;
}

/** What an open pixel carries, or null when it isn't ours. */
export function readOpenToken(token: unknown): { kind: MailKind; ref: string; email: string } | null {
  if (typeof token !== "string" || token.length > 2000) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const want = Buffer.from(createHmac("sha256", openKey()).update(p).digest("base64url").slice(0, 32));
  const got = Buffer.from(sig);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const v = JSON.parse(Buffer.from(p, "base64url").toString());
    if (!Array.isArray(v) || v.length !== 3 || !v.every((x) => typeof x === "string")) return null;
    const kind = CODE_KIND[v[0]];
    return kind ? { kind, ref: v[1], email: v[2] } : null;
  } catch {
    return null;
  }
}

const pixel = (t: Track, email: string) =>
  `<img src="${esc(openUrl(t, email))}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;margin:0;padding:0;opacity:0">`;

// ─── the newsletter text format ────────────────────────────────────
// What the Broadcasts, Automations and Launches editors take:
//   a blank line            new paragraph
//   # Title                 a heading
//   - item                  a bullet
//   [button: Get it](url)   a button on its own line
//   [text](url), https://…  links
//   **bold**
//   {first_name}            the first name, or "there" ({first_name|hey} picks the fallback)
// plus whatever `vars` fills ({link}, {earlyprice}… on launch emails).

export type Recipient = { email: string; name?: string | null };

export function fill(text: string, r: Recipient, vars: Record<string, string> = {}): string {
  const first = (r.name ?? "").trim().split(/\s+/)[0] ?? "";
  return text
    .replace(/\{first_name(?:\|([^}]*))?\}/g, (_, fb) => first || (fb ?? "there"))
    .replace(/\{([a-z_]+)\}/g, (m, k) => vars[k] ?? m);
}

const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

/** A link's address in the HTML: through the click counter when the email is tracked. */
type Href = (url: string) => string;
const plainHref: Href = (u) => esc(u);

// Links in the letter's text: FL Studio / Matrix green ("verde matrix in tema
// con FL STUDIO… bit darker", 2026-11-02), a shade under the neon so it still
// reads on white; bold to carry the colour. The footer's links stay grey.
const LINK = "color:#00b034;font-weight:700;text-decoration:underline";

function inline(s: string, href: Href): string {
  // Escape first, then add the few marks we allow.
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${href(unesc(u))}" style="${LINK}">${t}</a>`)
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, pre, u) => `${pre}<a href="${href(unesc(u))}" style="${LINK}">${u}</a>`);
}

const BUTTON = /^\[button:\s*(.+?)\]\((https?:\/\/\S+)\)$/i;

/** The editor's text as the letter's HTML body and its plain-text twin (which keeps the plain addresses). */
export function render(text: string, href: Href = plainHref): { html: string; text: string } {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  const html: string[] = [];
  const plain: string[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    const button = lines.length === 1 && lines[0].trim().match(BUTTON);
    if (button) {
      html.push(
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:10px;background:#111"><a href="${href(button[2])}" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:700;color:#fff;text-decoration:none;border-radius:10px">${esc(button[1])}</a></td></tr></table>`,
      );
      plain.push(`${button[1]}: ${button[2]}`);
    } else if (lines[0].startsWith("# ")) {
      html.push(`<h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;font-weight:800">${inline(lines.join(" ").slice(2), href)}</h1>`);
      plain.push(lines.join(" ").slice(2).toUpperCase());
    } else if (lines.every((l) => /^[-•] /.test(l))) {
      html.push(`<ul style="margin:0 0 18px;padding-left:22px">${lines.map((l) => `<li style="margin:0 0 6px">${inline(l.slice(2), href)}</li>`).join("")}</ul>`);
      plain.push(lines.join("\n"));
    } else {
      html.push(`<p style="margin:0 0 18px">${lines.map((l) => inline(l, href)).join("<br>")}</p>`);
      plain.push(lines.join("\n"));
    }
  }
  return { html: html.join("\n"), text: plain.join("\n\n").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1 ($2)") };
}

const UNSUB_WORDS: Record<string, [string, string]> = {
  en: ["Don't want these emails?", "Unsubscribe"],
  fr: ["Tu ne veux plus ces emails ?", "Se désabonner"],
  es: ["¿No quieres estos emails?", "Darse de baja"],
  de: ["Keine E-Mails mehr?", "Abmelden"],
};

// The sender's postal address, as on the ClickFunnels emails: US law
// (CAN-SPAM) wants one in every marketing email.
const POSTAL = "FFUNK Media LLC · 30 N Gould St Suite R, Sheridan, WY 82801, United States";

/** A newsletter-type email, ready for sendEmail: the letter, the unsubscribe link and headers. */
export function letter(o: { to: Recipient; subject: string; preheader?: string; body: string; vars?: Record<string, string>; lang?: string | null; track?: Track }): Email {
  const r = o.to;
  const t = o.track;
  const { html, text } = render(fill(o.body, r, o.vars), t ? (u) => esc(clickUrl(t, r.email, u)) : plainHref);
  const unsub = unsubscribeUrl(r.email);
  const [ask, word] = UNSUB_WORDS[o.lang ?? "en"] ?? UNSUB_WORDS.en;
  const pre = o.preheader ? fill(o.preheader, r, o.vars) : "";
  return {
    to: r.email,
    subject: fill(o.subject, r, o.vars),
    html: `<!doctype html><html lang="${esc(o.lang ?? "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:#ffffff">
${pre ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(pre)}${"&#8199;&#65279;&#847; ".repeat(40)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff"><tr><td align="center" style="padding:28px 18px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111">
${html}
<p style="margin:32px 0 0;padding-top:18px;border-top:1px solid #e6e6e6;font-size:12px;line-height:1.6;color:#8a8a8a">GRIND STUDIO · <a href="mailto:${SUPPORT}" style="color:#8a8a8a">${SUPPORT}</a><br>${POSTAL}<br>${esc(ask)} <a href="${esc(unsub)}" style="color:#8a8a8a">${esc(word)}</a></p>
${t ? pixel(t, r.email) : ""}
</td></tr></table>
</td></tr></table></body></html>`,
    text: `${text}\n\n--\nGRIND STUDIO · ${SUPPORT}\n${POSTAL}\n${ask} ${word}: ${unsub}`,
    headers: {
      "List-Unsubscribe": `<${UNSUBSCRIBE_ORIGIN}/api/email/unsubscribe?t=${unsubscribeToken(r.email)}>, <mailto:${SUPPORT}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

// ─── the card (receipts, reminders) ────────────────────────────────

export type CardButton = { label: string; url: string; primary?: boolean };

/**
 * A tall card on black, like the sign-in email: title, lead, buttons, small print, support.
 * With `track`, its buttons go through the click link and it carries the open pixel.
 */
export function card(o: { lang: string; title: string; lead: string; buttons: CardButton[]; notes: string[]; help: string; track?: { t: Track; email: string } }): string {
  const tr = o.track;
  const buttons = o.buttons
    .map((b) => (tr ? { ...b, url: clickUrl(tr.t, tr.email, b.url) } : b))
    .map((b, i) => {
      const style = b.primary ?? i === 0 ? "background:#22c55e;color:#04140a" : "background:#262626;color:#ffffff;border:1px solid #3a3a3a";
      return `<tr><td style="padding:${i === 0 ? 36 : 12}px 36px 0;text-align:center"><a href="${esc(b.url)}" style="display:inline-block;${style};font-weight:700;font-size:16px;text-decoration:none;padding:16px 28px;border-radius:12px">${esc(b.label)}</a></td></tr>`;
    })
    .join("\n");
  const notes = o.notes.map((n) => `<tr><td style="padding:14px 36px 0;text-align:center;color:#9a9a9a;font-size:13px;line-height:1.6">${esc(n)}</td></tr>`).join("\n");
  return `<!doctype html><html lang="${esc(o.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0b0b0b" style="background:#0b0b0b"><tr><td align="center" style="padding:64px 16px 72px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#161616;border:1px solid #2a2a2a;border-radius:20px">
<tr><td style="padding:48px 36px 0;text-align:center;color:#fff;font-size:15px;font-weight:700;letter-spacing:.2em">GRIND ◆ STUDIO</td></tr>
<tr><td style="padding:44px 36px 0;text-align:center;color:#fff;font-size:28px;line-height:1.25;font-weight:800">${esc(o.title)}</td></tr>
<tr><td style="padding:16px 36px 0;text-align:center;color:#d6d6d6;font-size:17px;line-height:1.6">${esc(o.lead)}</td></tr>
${buttons}
<tr><td style="padding:28px 0 0"></td></tr>
${notes}
<tr><td style="padding:36px 36px 44px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #2a2a2a;padding-top:28px;text-align:center;color:#7a7a7a;font-size:13px;line-height:1.6">${esc(o.help)}<br><a href="mailto:${SUPPORT}" style="color:#d6d6d6;text-decoration:none;font-weight:700">${SUPPORT}</a></td></tr></table></td></tr>
</table>
<p style="margin:28px 0 0;color:#555;font-size:12px">© ${new Date().getFullYear()} GRIND STUDIO</p>
${tr ? pixel(tr.t, tr.email) : ""}
</td></tr></table></body></html>`;
}
