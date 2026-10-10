import { NextResponse, type NextRequest } from "next/server";

// One app, several front doors:
// - funnel domains (jazz.thegrind.studio) show ONE funnel at their root and
//   nothing else — no dashboard, no admin API, whatever the path;
// - every other host (funnnnels.com, *.vercel.app) is the dashboard, behind
//   ADMIN_PASSWORD, and still serves the public funnel paths.
//
// Without ADMIN_PASSWORD the dashboard is open in `next dev` and locked in
// production, so a deploy that forgot the variable fails closed.

// Host → funnel slug. A new funnel domain = one line here + one DNS record.
const FUNNEL_HOSTS: Record<string, string> = {
  "jazz.thegrind.studio": "jazz-midi-pack",
};

const PUBLIC = [
  /^\/p\//, // pages published from the builder
  /^\/jazz-midi-pack(\/|$)/,
  /^\/funnels\/[^/]+\/.+\.[a-z0-9]+$/, // funnel assets in /public (audio, zips)
  /^\/api\/optin$/,
  /^\/api\/checkout\/(lead|intent)$/,
  /^\/favicon\.ico$/,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  const slug = FUNNEL_HOSTS[host];
  if (slug) {
    // Pretty paths on the funnel's own domain: / → the page, /thank-you, /download.
    if (pathname === "/" || pathname === "/thank-you" || pathname === "/download") {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? `/${slug}` : `/${slug}${pathname}`;
      return NextResponse.rewrite(url);
    }
    if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();
    return new NextResponse("Not found", { status: 404 });
  }

  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return process.env.NODE_ENV === "production"
      ? new NextResponse("ADMIN_PASSWORD is not set", { status: 503 })
      : NextResponse.next();
  }

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const pass = decoded.slice(decoded.indexOf(":") + 1);
      if (pass === password) return NextResponse.next();
    } catch {
      // malformed header: fall through to the 401
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="funnnnels", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
