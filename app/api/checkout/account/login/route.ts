import { NextResponse } from "next/server";
import { copyFor } from "@/app/account/copy";
import { cleanEmail, isEmail, isLang, linkToken, mayEmail, purchasesOf } from "@/lib/account";
import { returnOrigin } from "@/lib/paypal";
import { SUPPORT, sendEmail, sesConfigured } from "@/lib/ses";

export const runtime = "nodejs";

// "Email me my link" on /account: { email, lang } → a sign-in link by email,
// only to an email that bought something (and at most once a minute). The
// answer is the same either way, so the form never tells who is a customer.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  const lang = isLang(body.lang) ? body.lang : "en";
  if (!isEmail(email)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const dev = process.env.NODE_ENV !== "production";
  if (!sesConfigured() && !dev) return NextResponse.json({ error: "off" }, { status: 503 });
  if (!(await mayEmail(email))) return NextResponse.json({ error: "wait" }, { status: 429 });

  const purchases = await purchasesOf(email);
  if (!purchases.length) return NextResponse.json({ ok: true });

  const origin = returnOrigin(req.headers.get("origin") ?? req.headers.get("referer"));
  const link = `${origin}/api/checkout/account/verify?t=${linkToken(email, lang)}`;
  const c = copyFor(lang).email;
  try {
    const sent = await sendEmail({
      to: email,
      subject: c.subject,
      text: `${c.hi}\n\n${link}\n\n${c.note}\n\n${SUPPORT}`,
      html: emailHtml(link, c, lang),
    });
    // next dev without SES: the link comes back to the page, so a test can sign in.
    if ("skipped" in sent && dev) return NextResponse.json({ ok: true, dev: link });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("account login email failed", err);
    // While SES is in its sandbox it only mails verified addresses: say what
    // "off" says (write to us), not "try again in a minute".
    if (String(err).includes("not verified")) return NextResponse.json({ error: "off" }, { status: 503 });
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function emailHtml(link: string, c: ReturnType<typeof copyFor>["email"], lang: string): string {
  return `<!doctype html><html lang="${lang}"><body style="margin:0;background:#0b0b0b;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#161616;border:1px solid #2a2a2a;border-radius:16px">
<tr><td style="padding:28px 28px 8px;text-align:center;color:#fff;font-size:15px;font-weight:700;letter-spacing:.18em">GRIND ◆ STUDIO</td></tr>
<tr><td style="padding:12px 28px 4px;text-align:center;color:#e8e8e8;font-size:16px;line-height:1.5">${esc(c.hi)}</td></tr>
<tr><td style="padding:20px 28px;text-align:center"><a href="${esc(link)}" style="display:inline-block;background:#22c55e;color:#04140a;font-weight:700;font-size:16px;text-decoration:none;padding:14px 26px;border-radius:10px">${esc(c.button)}</a></td></tr>
<tr><td style="padding:0 28px 26px;text-align:center;color:#9a9a9a;font-size:13px;line-height:1.5">${esc(c.note)}<br><br><a href="mailto:${SUPPORT}" style="color:#9a9a9a">${SUPPORT}</a></td></tr>
</table></td></tr></table></body></html>`;
}
