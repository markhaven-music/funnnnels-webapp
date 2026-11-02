import { ASTRO_FUNNEL, STEPS, type Step } from "@/lib/beacon";
import { botReason } from "@/lib/bots";
import { resolveFunnel } from "@/lib/funnels";
import { COUNTRY_COOKIE } from "@/lib/geo";
import { deviceOf, livePing, OFF_HOST, sourceOf } from "@/lib/live";

export const runtime = "nodejs";

// The pages' live ping (lib/beacon.ts LIVE_JS, and its copy in the Astro
// landings' Tracking.astro) for dashboard → Live: "view"
// when a page opens, "beat" every 20 s while the tab is in front, "leave"
// when it goes to the background. Public, like the checkout; under
// /api/checkout/ because m.thegrind.studio forwards that path here. Always
// answers 204: the page never waits on it or learns anything from it.

const done = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

const header = (req: Request, name: string) => {
  try {
    return decodeURIComponent(req.headers.get(name) ?? "").slice(0, 80);
  } catch {
    return "";
  }
};
const coord = (v: string, max: number) => {
  const n = Number(v);
  return v && Number.isFinite(n) && Math.abs(n) <= max ? Math.round(n * 100) / 100 : null;
};

export async function POST(req: Request) {
  // sendBeacon posts text/plain; parse it ourselves.
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return done();
  }
  if (typeof body !== "object" || body === null) return done();
  const sid = String(body.i ?? "");
  if (!/^[a-z0-9]{8,24}$/.test(sid)) return done();

  try {
    // Beats and leaves only touch a visitor a view already let in.
    if (body.k === "beat" || body.k === "leave") {
      await livePing({ kind: body.k, sid });
      return done();
    }
    if (body.k !== "view") return done();

    const host = String(body.h ?? "").slice(0, 100);
    if (process.env.NODE_ENV === "production" && OFF_HOST.test(host)) return done();
    const page = body.p as Step;
    if (!STEPS.includes(page)) return done();
    // The Astro landings aren't funnels here: one "astro" funnel, a page per path.
    const astro = body.f === ASTRO_FUNNEL;
    const f = astro ? null : await resolveFunnel(body.f).catch(() => undefined);
    if (!astro && !f) return done();
    const lang = typeof body.l === "string" && (body.l === "en" || f?.langs?.includes(body.l)) ? body.l : "en";
    // Meta's ad reviewers and other bots never show up as visitors.
    if (botReason(req, { webdriver: body.w === 1 })) return done();

    // Vercel's geo headers. The page's own country (proxy.ts left it in a
    // cookie) wins if they disagree, and the city then isn't trusted either.
    const cookie = req.headers.get("cookie")?.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([A-Z]{2})(?:;|$)`))?.[1] ?? "";
    const geo = header(req, "x-vercel-ip-country").toUpperCase();
    const same = /^[A-Z]{2}$/.test(geo) && (!cookie || cookie === geo);
    const path = String(body.u ?? "").slice(0, 200);

    await livePing({
      kind: "view",
      sid,
      host,
      funnel: f?.slug ?? ASTRO_FUNNEL,
      page,
      lang,
      path: path.startsWith("/") ? path : "",
      country: same ? geo : cookie,
      region: same ? header(req, "x-vercel-ip-country-region") : "",
      city: same ? header(req, "x-vercel-ip-city") : "",
      lat: same ? coord(header(req, "x-vercel-ip-latitude"), 90) : null,
      lon: same ? coord(header(req, "x-vercel-ip-longitude"), 180) : null,
      device: deviceOf(req.headers.get("user-agent") ?? ""),
      ...sourceOf(body),
    });
  } catch (err) {
    console.error("live ping not saved", err);
  }
  return done();
}
