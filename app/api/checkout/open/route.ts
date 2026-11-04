import { after } from "next/server";
import { readOpenToken } from "@/lib/mail";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// The invisible image at the end of a tracked email (lib/mail.ts openUrl):
// its loading notes the open (email_opens, db/email-opens.sql) for dashboard →
// Orders. Public, at m.thegrind.studio/api/checkout/open: the brand domain
// forwards /api/checkout/* here. Always answers with the image, so an email
// never shows a broken one, and never cached, so every open asks again.
//
// machine: Apple Mail Privacy Protection fetches every image on delivery
// through Apple's proxy, read or not, with the bare user agent "Mozilla/5.0";
// scanners and bots say so in theirs. Gmail's and Yahoo's proxies fetch it
// when the email is opened, so they count as people.

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const SCANNER = /bot\b|bot\/|crawl|spider|scanner|preview|headless|curl\/|wget\/|python|go-http-client|node-fetch|java\/|barracuda|mimecast|proofpoint|symantec/i;

const image = () =>
  new Response(GIF, {
    headers: {
      "content-type": "image/gif",
      "content-length": String(GIF.length),
      "cache-control": "no-store, no-cache, must-revalidate, private, max-age=0",
      expires: "0",
    },
  });

export async function GET(req: Request) {
  const o = readOpenToken(new URL(req.url).searchParams.get("t"));
  if (o) {
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 300);
    const machine = ua.trim() === "Mozilla/5.0" ? "apple" : !ua || SCANNER.test(ua) ? "scanner" : null;
    after(async () => {
      const db = supabase();
      // The same reader again within a minute (a mail app reloading the image): one open.
      const { count } = await db
        .from("email_opens")
        .select("id", { count: "exact", head: true })
        .eq("kind", o.kind)
        .eq("ref", o.ref)
        .eq("email", o.email)
        .gte("created_at", new Date(Date.now() - 60_000).toISOString());
      if (count) return;
      const { error } = await db.from("email_opens").insert({ kind: o.kind, ref: o.ref, email: o.email, machine, user_agent: ua || null });
      if (error) console.error("email open not saved", error);
    });
  }
  return image();
}

export async function HEAD() {
  return image();
}
