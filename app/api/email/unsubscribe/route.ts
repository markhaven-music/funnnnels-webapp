import { setContactStatus } from "@/lib/contacts";
import { readUnsubscribeToken } from "@/lib/mail";

export const runtime = "nodejs";

// Unsubscribe, two ways (links from lib/mail.ts letter()):
//   - the mail app's one-click button: POST ?t=<token>, body List-Unsubscribe=One-Click (RFC 8058);
//   - the button on /unsubscribe: a form POST with t, then back to the page.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => null);
  const token = url.searchParams.get("t") ?? form?.get("t");
  const email = readUnsubscribeToken(token);
  if (!email) return new Response("This unsubscribe link isn't valid.", { status: 400 });
  await setContactStatus(email, "unsubscribed");
  if (form?.get("from") === "page") {
    return new Response(null, { status: 303, headers: { location: `/unsubscribe?t=${encodeURIComponent(String(token))}&done=1` } });
  }
  return new Response("Unsubscribed.", { status: 200 });
}
