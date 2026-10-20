import { cleanVariant } from "@/app/(funnels)/midi-drum-kit/abtest";
import { countPageView } from "@/lib/analytics";
import { STEPS, type Step } from "@/lib/beacon";
import { resolveFunnel } from "@/lib/funnels";

export const runtime = "nodejs";

// The visitor beacon (lib/beacon.ts): one POST per page per visitor per day,
// counted in page_views for dashboard → Analytics. Public, like the checkout.
// Always answers 204: the page never waits on it or learns anything from it.

// Local, preview and origin hosts, as in the funnels' Tracking.tsx: not real visitors.
const OFF = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.local$|\.vercel\.app$/;
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|preview/i;

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

  const host = String(body.h ?? "");
  if (process.env.NODE_ENV === "production" && OFF.test(host)) return done();
  if (BOT.test(req.headers.get("user-agent") ?? "")) return done();

  const page = body.p as Step;
  if (!STEPS.includes(page)) return done();
  const f = await resolveFunnel(body.f).catch(() => undefined);
  if (!f) return done();
  const lang = typeof body.l === "string" && (body.l === "en" || f.langs?.includes(body.l)) ? body.l : "en";
  const country = typeof body.c === "string" && /^[A-Z]{2}$/.test(body.c) ? body.c : "";

  try {
    await countPageView({ funnel: f.slug, page, lang, variant: cleanVariant(body.v), country });
  } catch (err) {
    console.error("page view not counted", err);
  }
  return done();
}
