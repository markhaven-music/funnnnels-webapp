import { NextResponse, type NextRequest } from "next/server";

// The dashboard, editor and every admin API sit behind one password; the
// funnels visitors see stay open. Think of it as a staff door: shoppers walk
// through the shop front, everything else asks for the key.
//
// Without ADMIN_PASSWORD the door is open in `next dev` and locked in
// production, so a deploy that forgot the variable fails closed.

const PUBLIC = [
  /^\/p\//, // pages published from the builder
  /^\/jazz-midi-pack(\/|$)/,
  /^\/funnels\/[^/]+\/.+\.[a-z0-9]+$/, // funnel assets in /public (audio, zips)
  /^\/api\/optin$/,
  /^\/favicon\.ico$/,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
