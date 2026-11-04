import { after, NextResponse } from "next/server";
import { firstEmail } from "@/app/free/firstEmail";
import { OPTINS } from "@/app/free/packs";
import { isEmail, upsertContact } from "@/lib/contacts";
import { resolveFunnel } from "@/lib/funnels";
import { cleanVisitorId } from "@/lib/neoIds";
import { sendEmail } from "@/lib/ses";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// Public endpoint behind every funnel's opt-in form. The funnel slug picks
// the source + tags server-side, so a visitor can't tag themselves "buyer".
// The free lead magnets (app/free/packs.ts) are opt-ins of their own: they
// also send the download email at once and say where the visitor goes next.

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const free = typeof body.funnel === "string" && Object.hasOwn(OPTINS, body.funnel) ? OPTINS[body.funnel] : null;
  const optin = free ?? (await resolveFunnel(body.funnel))?.optin;
  if (!optin) return NextResponse.json({ error: "Unknown funnel" }, { status: 404 });
  const ok = { ok: true, download: "download" in optin ? optin.download : undefined, next: free?.next };

  // Honeypot: a field humans never see. Bots fill it; pretend success.
  if (body.company) return NextResponse.json(ok);

  const email = String(body.email ?? "").trim();
  const name = String(body.name ?? "").trim().slice(0, 80) || undefined;
  if (!isEmail(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  let contact;
  try {
    contact = await upsertContact({ email, name, source: optin.source, tags: [...optin.tags] });
  } catch (err) {
    console.error("optin: contact save failed", err);
    return NextResponse.json(
      { error: "We couldn't save your email just now. Please try again in a minute." },
      { status: 503 },
    );
  }
  // Which ad and visit it came from (db/optins.sql), for dashboard → Free packs.
  // Never blocks the opt-in.
  after(() => recordOptin(contact.email, String(body.funnel), body, req.headers.get("cookie")));

  // The download link, every time they ask (they asked: also when unsubscribed
  // from the newsletter), unless their address bounces or complained.
  const which = free?.firstEmail;
  if (which && (contact.status === "subscribed" || contact.status === "unsubscribed")) {
    const to = { email: contact.email, name: contact.name ?? name };
    after(() =>
      sendEmail(firstEmail(which, to)).catch((err) => console.error(`optin: the ${which} email to ${to.email} failed`, err)),
    );
  }
  return NextResponse.json(ok);
}

// The page sends its URL's utm_* / ad_id (set by the ad's URL parameters) and
// neo's visitor id; the ft_vid cookie (.thegrind.studio) is the fallback.
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ad_id"] as const;
const short = (v: unknown, n = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

async function recordOptin(email: string, optin: string, body: Record<string, unknown>, cookie: string | null) {
  const src = body.src && typeof body.src === "object" ? (body.src as Record<string, unknown>) : {};
  const fromCookie = cookie?.match(/(?:^|; )ft_vid=([^;]+)/)?.[1];
  const row: Record<string, string | null> = {
    email,
    optin: optin.slice(0, 80),
    visitor_id: cleanVisitorId(body.vid) || cleanVisitorId(fromCookie) || null,
    page: short(body.page, 300),
  };
  for (const k of UTM) row[k] = short(src[k]);
  const { error } = await supabase().from("optins").insert(row);
  if (error) console.error("optin: the opt-in row wasn't saved", error);
}
