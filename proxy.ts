import { NextResponse, type NextRequest } from "next/server";

// funnnnels.com is the dashboard, behind ADMIN_PASSWORD. Funnels are public
// but live on their brand's domain: m.thegrind.studio forwards /jazz-midi-pack
// here (rewrites in grind-studio-landing-pages/vercel.json, which also pass the
// visitor's country), so on funnnnels.com those paths redirect to the brand.
//
// Without ADMIN_PASSWORD the dashboard is open in `next dev` and locked in
// production, so a deploy that forgot the variable fails closed.

// Funnel slug → its public home. Only the dashboard hosts redirect; the
// *.vercel.app origin must keep serving the pages the brand domain forwards.
const FUNNEL_HOME: Record<string, string> = {
  "jazz-midi-pack": "https://m.thegrind.studio",
};
const DASHBOARD_HOSTS = new Set(["funnnnels.com", "www.funnnnels.com"]);

const PUBLIC = [
  /^\/p\//, // pages published from the builder
  /^\/jazz-midi-pack(\/|$)/,
  /^\/funnels\/[^/]+\/.+\.[a-z0-9]+$/, // funnel assets in /public (audio, zips)
  /^\/api\/optin$/,
  /^\/api\/checkout\/(lead|intent|paypal|paypal\/return)$/,
  /^\/favicon\.ico$/,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  const home = FUNNEL_HOME[pathname.split("/")[1]];
  if (home && DASHBOARD_HOSTS.has(host)) {
    return NextResponse.redirect(`${home}${pathname}${request.nextUrl.search}`, 308);
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
