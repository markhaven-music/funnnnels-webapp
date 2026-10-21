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

// A tall card on black, like the funnels: brand, title, one line, the button,
// then the fine print under a rule. Tables and inline styles for mail apps.
function emailHtml(link: string, c: ReturnType<typeof copyFor>["email"], lang: string): string {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0b0b0b" style="background:#0b0b0b"><tr><td align="center" style="padding:64px 16px 72px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#161616;border:1px solid #2a2a2a;border-radius:20px">
<tr><td style="padding:48px 36px 0;text-align:center;color:#fff;font-size:15px;font-weight:700;letter-spacing:.2em">GRIND ◆ STUDIO</td></tr>
<tr><td style="padding:44px 36px 0;text-align:center;color:#fff;font-size:28px;line-height:1.25;font-weight:800">${esc(c.title)}</td></tr>
<tr><td style="padding:16px 36px 0;text-align:center;color:#d6d6d6;font-size:17px;line-height:1.6">${esc(c.hi)}</td></tr>
<tr><td style="padding:40px 36px 0;text-align:center"><a href="${esc(link)}" style="display:inline-block;background:#22c55e;color:#04140a;font-weight:700;font-size:17px;text-decoration:none;padding:18px 34px;border-radius:12px">${esc(c.button)}</a></td></tr>
<tr><td style="padding:40px 36px 0;text-align:center;color:#9a9a9a;font-size:14px;line-height:1.6">${esc(c.note)}</td></tr>
<tr><td style="padding:36px 36px 44px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #2a2a2a;padding-top:28px;text-align:center;color:#7a7a7a;font-size:13px;line-height:1.6">${esc(c.help)}<br><a href="mailto:${SUPPORT}" style="color:#d6d6d6;text-decoration:none;font-weight:700">${SUPPORT}</a></td></tr></table></td></tr>
</table>
<p style="margin:28px 0 0;color:#555;font-size:12px">© ${new Date().getFullYear()} GRIND STUDIO</p>
</td></tr></table></body></html>`;
}
