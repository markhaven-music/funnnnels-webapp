import { botReason } from "@/lib/bots";
import { countBlogHit, isBlogSlug, sourceOf } from "@/lib/blogStats";

export const runtime = "nodejs";

// The blog's reader count (app/blog/BlogBeacon.tsx) for dashboard → Blog: one
// "view" per post per browser per day, one "click" when the reader follows a
// link to the pack. Public; under /api/checkout/ because m.thegrind.studio
// already forwards that path here. Always answers 204.

// Local, preview and origin hosts, as in /api/checkout/view: not real readers.
const OFF = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/;

const done = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  // sendBeacon posts text/plain; parse it ourselves.
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return done();
  }
  if (typeof body !== "object" || body === null) return done();
  if (process.env.NODE_ENV === "production" && OFF.test(String(body.h ?? ""))) return done();
  if (!isBlogSlug(body.s) || (body.k !== "view" && body.k !== "click")) return done();
  // Search engines' crawlers and other bots aren't readers.
  if (botReason(req, { webdriver: body.w === 1 })) return done();
  try {
    await countBlogHit({ slug: body.s, kind: body.k, source: sourceOf(body.r) });
  } catch (err) {
    console.error("blog reader not counted", err);
  }
  return done();
}
