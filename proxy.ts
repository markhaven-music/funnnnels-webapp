import { NextResponse, type NextRequest } from "next/server";
import { COUNTRY_COOKIE, currencyFor, visitorCountry } from "@/lib/geo";
import { KIT_HOME } from "@/lib/liveUrl";
import { LANGS as DRUM_KIT_LANGS } from "@/app/(funnels)/midi-drum-kit/i18n";

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
  "top-hits-midi-bundle": "https://m.thegrind.studio",
  "midi-drum-kit": "https://m.thegrind.studio",
};
const DASHBOARD_HOSTS = new Set(["funnnnels.com", "www.funnnnels.com"]);

// Funnel pages cached on the CDN once per currency (app/(funnels)/<slug>/[currency]).
// The visitor keeps the plain URL; the country comes from ?country= (the
// brand domain's rewrite sets it, and it lets you preview either price) or
// from Vercel's geo header, and also goes into a cookie for the checkout.
const CURRENCY_PAGES = new Set(["/jazz-midi-pack", "/jazz-midi-pack/order", "/top-hits-midi-bundle", "/top-hits-midi-bundle/order"]);

// Launch-kit products (dashboard → Launches) live at /<slug> and are served by
// app/(funnels)/[slug]: the page per currency, /<slug>/thank-you and
// /<slug>/download. Their slugs are in the database, so any first path segment
// that isn't one of the app's own routes counts as a product path: public,
// currency-rewritten, and a 404 if no such product exists. Keep this list in
// sync with RESERVED_SLUGS in lib/products.ts.
// Funnels sold in several languages: English at /<slug>, the others at
// /<lang>/<slug>. Their landing, order and thank-you pages are cached per
// language (and per currency) at /<slug>/<lang>/…, see localized().
const LOCALIZED: Record<string, readonly string[]> = { "midi-drum-kit": DRUM_KIT_LANGS };
const LANG_PREFIXES = new Set(["fr", "it", "de", "nl", "es"]);

const APP_SEGMENTS = new Set(["", "api", "funnels", "p", "jazz-midi-pack", "top-hits-midi-bundle", "midi-drum-kit", ...LANG_PREFIXES]);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** /fr/midi-drum-kit/order → { slug, lang: "fr", page: "order" }; null for anything else. */
// The pages a localized funnel has after its /<lang>/<slug>.
const LOCAL_PAGES = ["", "order", "offer", "last-offer", "thank-you"] as const;

function localized(pathname: string): { slug: string; lang: string; page: (typeof LOCAL_PAGES)[number] } | null {
  const parts = pathname.replace(/\/$/, "").split("/");
  const lang = LANG_PREFIXES.has(parts[1]) ? parts[1] : "en";
  const at = lang === "en" ? 1 : 2;
  const slug = parts[at];
  const page = LOCAL_PAGES.find((p) => p === parts.slice(at + 1).join("/"));
  if (!LOCALIZED[slug]?.includes(lang) || page === undefined) return null;
  return { slug, lang, page };
}

function kitSlug(pathname: string): string | null {
  const seg = pathname.split("/")[1] ?? "";
  return !APP_SEGMENTS.has(seg) && SLUG.test(seg) ? seg : null;
}

const PUBLIC = [
  /^\/p\//, // pages published from the builder
  /^\/jazz-midi-pack(\/|$)/,
  /^\/top-hits-midi-bundle(\/|$)/,
  /^\/midi-drum-kit(\/|$)/,
  /^\/funnels\/[^/]+\/.+\.[a-z0-9]+$/, // funnel assets in /public (audio, zips)
  /^\/api\/optin$/,
  /^\/api\/checkout\/(lead|intent|paypal|paypal\/return|view|upsell)$/,
  /^\/favicon\.ico$/,
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  const slug = kitSlug(pathname);
  const loc = localized(pathname);
  const home = FUNNEL_HOME[loc?.slug ?? pathname.split("/")[1]] ?? (slug ? KIT_HOME : undefined);
  if (home && DASHBOARD_HOSTS.has(host)) {
    return NextResponse.redirect(`${home}${pathname}${request.nextUrl.search}`, 308);
  }

  if (loc) {
    const url = request.nextUrl.clone();
    if (loc.page === "thank-you") {
      url.pathname = `/${loc.slug}/${loc.lang}/thank-you`;
      return NextResponse.rewrite(url);
    }
    const country = visitorCountry(request.headers, request.nextUrl.searchParams.get("country"));
    url.pathname = `/${loc.slug}/${loc.lang}${loc.page ? `/${loc.page}` : ""}/${currencyFor(country)}`;
    const res = NextResponse.rewrite(url);
    res.cookies.set(COUNTRY_COOKIE, country, { path: "/", sameSite: "lax" });
    return res;
  }

  const page = pathname.replace(/\/$/, "");
  if (CURRENCY_PAGES.has(page) || (slug && page === `/${slug}`)) {
    const country = visitorCountry(request.headers, request.nextUrl.searchParams.get("country"));
    const url = request.nextUrl.clone();
    url.pathname = `${page}/${currencyFor(country)}`;
    const res = NextResponse.rewrite(url);
    res.cookies.set(COUNTRY_COOKIE, country, { path: "/", sameSite: "lax" });
    return res;
  }

  if (slug || PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();

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
