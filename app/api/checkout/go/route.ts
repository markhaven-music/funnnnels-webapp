import { after } from "next/server";
import { botReason } from "@/lib/bots";
import { readClickToken } from "@/lib/mail";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

// A click on a link in an email (lib/mail.ts clickUrl): notes who clicked
// which email (email_clicks, for dashboard → Email → Insights) after sending
// them on. Public, at m.thegrind.studio/api/checkout/go: the brand domain
// forwards /api/checkout/* here.
//
// Mail scanners that open every link (Outlook's Safe Links, Mimecast…) and
// other bots (lib/bots.ts) go on without being counted, and so does a HEAD.
// A link signed with another key (a dev server's) still opens our own pages,
// uncounted; anywhere else, it stops here.

const OWN = /(^|\.)(thegrind\.studio|funnnnels\.com)$/;
const invalid = () => new Response("This link isn't valid.", { status: 400 });
const go = (url: string) => new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });

function target(req: Request) {
  const c = readClickToken(new URL(req.url).searchParams.get("t"));
  if (!c) return null;
  if (c.ok) return c;
  try {
    return OWN.test(new URL(c.url).hostname) ? { ...c, ok: false } : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const c = target(req);
  if (!c) return invalid();
  if (c.ok && !botReason(req)) {
    after(async () => {
      const { error } = await supabase().from("email_clicks").insert({ kind: c.kind, ref: c.ref, email: c.email, url: c.url.slice(0, 2000) });
      if (error) console.error("email click not saved", error);
    });
  }
  return go(c.url);
}

export async function HEAD(req: Request) {
  const c = target(req);
  return c ? go(c.url) : invalid();
}
